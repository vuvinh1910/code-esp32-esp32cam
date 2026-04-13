#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "esp_camera.h"
#include "esp_heap_caps.h"
#include "soc/soc.h"           // Tắt cảnh báo sụt áp
#include "soc/rtc_cntl_reg.h"  // Tắt cảnh báo sụt áp
#include "plan_watering_inferencing.h" // Thư viện AI của bạn
#include "edge-impulse-sdk/dsp/image/image.hpp" // Thư viện xử lý ảnh đi kèm của Edge Impulse

// ===== PHẦN 1: CẤU HÌNH WIFI & SERVER =====
const char* ssid     = "Phan Thuỷ";
const char* password = "12345678";

// Khởi tạo WebServer ở port 80
WebServer server(80); 

// ===== PHẦN 2: CẤU HÌNH CHÂN CAMERA (AI-THINKER) =====
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define FLASH_GPIO_NUM     4 

// Biến toàn cục để lưu ảnh RGB cho AI
uint8_t *snapshot_buf = nullptr;
uint8_t *raw_rgb_buf = nullptr;
size_t raw_rgb_buf_size = 0;

static bool ensure_inference_buffers(size_t required_raw_size) {
    const size_t model_input_size = EI_CLASSIFIER_NN_INPUT_FRAME_SIZE;

    if (!snapshot_buf) {
        snapshot_buf = static_cast<uint8_t *>(heap_caps_malloc(model_input_size, MALLOC_CAP_8BIT | MALLOC_CAP_SPIRAM));
        if (!snapshot_buf) {
            snapshot_buf = static_cast<uint8_t *>(malloc(model_input_size));
        }
    }

    if (!raw_rgb_buf || raw_rgb_buf_size < required_raw_size) {
        if (raw_rgb_buf) {
            free(raw_rgb_buf);
            raw_rgb_buf = nullptr;
            raw_rgb_buf_size = 0;
        }

        raw_rgb_buf = static_cast<uint8_t *>(heap_caps_malloc(required_raw_size, MALLOC_CAP_8BIT | MALLOC_CAP_SPIRAM));
        if (!raw_rgb_buf) {
            raw_rgb_buf = static_cast<uint8_t *>(malloc(required_raw_size));
        }
        if (raw_rgb_buf) {
            raw_rgb_buf_size = required_raw_size;
        }
    }

    if (!snapshot_buf || !raw_rgb_buf) {
        if (snapshot_buf) {
            free(snapshot_buf);
            snapshot_buf = nullptr;
        }
        if (raw_rgb_buf) {
            free(raw_rgb_buf);
            raw_rgb_buf = nullptr;
            raw_rgb_buf_size = 0;
        }
        return false;
    }

    return true;
}

// ===== PHẦN 3: HÀM CALLBACK CHO EDGE IMPULSE =====
// Hàm này giúp Model AI trích xuất từng pixel từ bộ nhớ đệm
int ei_camera_get_data(size_t offset, size_t length, float *out_ptr) {
    const size_t max_pixels = EI_CLASSIFIER_INPUT_WIDTH * EI_CLASSIFIER_INPUT_HEIGHT;
    if (!snapshot_buf || (offset + length) > max_pixels) {
        return -1;
    }

    size_t pixel_ix = offset * 3;
    size_t pixels_left = length;
    size_t out_ptr_ix = 0;

    while (pixels_left != 0) {
        // Chuyển đổi RGB888 sang định dạng float mà Edge Impulse cần
        out_ptr[out_ptr_ix] = (snapshot_buf[pixel_ix + 2] << 16) + (snapshot_buf[pixel_ix + 1] << 8) + snapshot_buf[pixel_ix];

        out_ptr_ix++;
        pixel_ix += 3;
        pixels_left--;
    }
    return 0;
}

// ===== PHẦN 4: HÀM XỬ LÝ NHẬN DIỆN CHÍNH =====
void handleInferenceRequest() {
    Serial.println("\n[Action] Backend yêu cầu nhận diện...");
    
    // 1. Chụp ảnh
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("Lỗi: Không thể chụp ảnh");
        server.send(500, "application/json", "{\"error\": \"Camera capture failed\"}");
        return;
    }
    
    Serial.printf("Đã chụp ảnh! Kích thước: %zu bytes. Bắt đầu xử lý AI...\n", fb->len);
    const uint32_t frame_width = fb->width;
    const uint32_t frame_height = fb->height;

    // 2. Cấp phát/tái sử dụng bộ nhớ cho ảnh RGB gốc và ảnh resize cho model
    uint32_t rgb888_size = frame_width * frame_height * 3;
    if (!ensure_inference_buffers(rgb888_size)) {
        Serial.println("Lỗi: Không đủ bộ nhớ RAM để xử lý ảnh");
        server.send(500, "application/json", "{\"error\": \"Out of memory\"}");
        esp_camera_fb_return(fb);
        return;
    }

    // 3. Chuyển đổi JPEG sang RGB888
    bool converted = fmt2rgb888(fb->buf, fb->len, PIXFORMAT_JPEG, raw_rgb_buf);
    esp_camera_fb_return(fb); // Giải phóng fb ngay lập tức sau khi convert xong
    
    if (!converted) {
        Serial.println("Lỗi: Không thể giải mã định dạng JPEG");
        server.send(500, "application/json", "{\"error\": \"JPEG decode failed\"}");
        return;
    }

    // 4. Thay đổi kích thước (Resize) ảnh khớp với Model AI
    ei::image::processing::crop_and_interpolate_rgb888(
        raw_rgb_buf,
        frame_width,
        frame_height,
        snapshot_buf,
        EI_CLASSIFIER_INPUT_WIDTH,
        EI_CLASSIFIER_INPUT_HEIGHT);

    // 5. Cấu hình tín hiệu cho Edge Impulse
    signal_t signal;
    signal.total_length = EI_CLASSIFIER_INPUT_WIDTH * EI_CLASSIFIER_INPUT_HEIGHT;
    signal.get_data = &ei_camera_get_data;

    // 6. Chạy Model Phân Loại (Inference)
    ei_impulse_result_t result = { 0 };
    EI_IMPULSE_ERROR err = run_classifier(&signal, &result, false);
    
    if (err != EI_IMPULSE_OK) {
        Serial.printf("Lỗi chạy AI model (%d)\n", err);
        server.send(500, "application/json", "{\"error\": \"Inference failed\"}");
        return;
    }

    // 7. Tìm kết quả (loại cây) có độ tin cậy cao nhất
    String best_plant = "";
    float best_score = 0.0;

    Serial.println("--- Kết quả AI ---");
    for (uint16_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) {
        Serial.printf("  %s: %.5f\n", result.classification[i].label, result.classification[i].value);
        if (result.classification[i].value > best_score) {
            best_score = result.classification[i].value;
            best_plant = String(result.classification[i].label);
        }
    }

    // 8. Trả kết quả về Backend dạng JSON
    bool below_threshold = best_score < EI_CLASSIFIER_THRESHOLD;
    if (below_threshold) {
        best_plant = "unknown";
    }
    String jsonResponse = "{\"plant\":\"" + best_plant + "\", \"confidence\":" + String(best_score, 5) + ", \"below_threshold\":" + String(below_threshold ? "true" : "false") + "}";
    server.send(200, "application/json", jsonResponse);
    
    Serial.println("Đã gửi kết quả cho Backend: " + jsonResponse);
}

// ĐÂY LÀ HÀM MỚI ĐƯỢC THÊM VÀO ĐỂ XEM ẢNH TĨNH
void handleCaptureRequest() {
    Serial.println("\n[Action] Trình duyệt yêu cầu xem ảnh tĩnh...");
    
    // Chụp ảnh
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("Lỗi: Không thể chụp ảnh");
        server.send(500, "text/plain", "Camera capture failed");
        return;
    }

    // Gửi ảnh dạng JPEG về cho client (trình duyệt web)
    server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
    
    // Giải phóng bộ nhớ camera
    esp_camera_fb_return(fb);
    Serial.println("Đã gửi ảnh thành công lên trình duyệt!");
}

// ===== PHẦN 5: SETUP VÀ LOOP =====
void setup() {
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
    
    Serial.begin(115200);
    Serial.println("\n\n=================================");
    Serial.println(" ESP32-CAM EDGE AI NODE SERVER");
    Serial.println("=================================");

    pinMode(FLASH_GPIO_NUM, OUTPUT);
    digitalWrite(FLASH_GPIO_NUM, LOW);

    // Kết nối Wi-Fi
    WiFi.mode(WIFI_STA);
    Serial.printf("Connecting to WiFi: %s", ssid);
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("\nWiFi FAILED! Restarting...");
        delay(1000);
        ESP.restart();
    }
    Serial.printf("\nWiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());

    // Khởi tạo Camera
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // TỐI ƯU HÓA: Cài đặt khung hình nhỏ để tiết kiệm RAM cho AI
    if(psramFound()){
        config.frame_size = FRAMESIZE_QVGA; 
        config.jpeg_quality = 10;          
        config.fb_count = 2;               
    } else {
        config.frame_size = FRAMESIZE_240X240; 
        config.jpeg_quality = 12;
        config.fb_count = 1;
    }

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed with error 0x%x\n", err);
        return;
    }
    Serial.println("Camera đã cấu hình xong!");

    // Định tuyến Web API
    server.on("/api/recognize", HTTP_GET, handleInferenceRequest);
    server.on("/api/image", HTTP_GET, handleCaptureRequest); // ĐƯỜNG DẪN MỚI CHO ẢNH

    server.begin();
    Serial.println("\n--- HƯỚNG DẪN SỬ DỤNG ---");
    Serial.println("1. Để chạy nhận diện (Backend gọi): GET http://" + WiFi.localIP().toString() + "/api/recognize");
    Serial.println("2. Để XEM ẢNH TRỰC TIẾP (Debug trên máy tính): Mở trình duyệt và truy cập http://" + WiFi.localIP().toString() + "/api/image");
}

void loop() {
    server.handleClient();
    delay(2);
}
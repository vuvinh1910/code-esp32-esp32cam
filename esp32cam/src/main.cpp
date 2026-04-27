#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// QUAN TRỌNG: include theo đúng thứ tự này
#include "model.h"                 // C array chứa weights TFLite
#include "tflite_run_inference.h"  // Inference engine (TFLite Micro)
#include "image_utils.h"           // JPEG capture + resize

// ===== CẤU HÌNH WIFI =====
const char* ssid     = "Phan Thuỷ";
const char* password = "12345678";

WebServer server(80);

static void addNoCacheHeaders() {
    server.sendHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    server.sendHeader("Pragma", "no-cache");
    server.sendHeader("Expires", "0");
}

// ===== CẤU HÌNH CHÂN CAMERA (AI-THINKER - giữ nguyên) =====
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

// ===== HTTP HANDLER: NHẬN DIỆN =====
void handleInferenceRequest() {
    Serial.println("\n[API] Yêu cầu nhận diện...");

    // 1. Chụp và resize ảnh
    uint8_t* resized_rgb = nullptr;
    if (!camera_capture_and_resize(&resized_rgb)) {
        addNoCacheHeaders();
        server.send(500, "application/json", "{\"error\":\"Camera/image processing failed\"}");
        return;
    }

    // 2. Chạy inference
    InferenceResult result;
    if (!tflite_run(resized_rgb, &result)) {
        addNoCacheHeaders();
        server.send(500, "application/json", "{\"error\":\"Inference failed\"}");
        return;
    }

    // 3. Build JSON response (giữ nguyên format cũ để backend không cần sửa)
    String json = "{";
    json += "\"plant\":\"" + String(result.label) + "\",";
    json += "\"confidence\":" + String(result.confidence, 5) + ",";
    json += "\"below_threshold\":" + String(result.below_threshold ? "true" : "false");
    json += "}";

    addNoCacheHeaders();
    server.send(200, "application/json", json);
    Serial.println("[API] Gửi kết quả: " + json);
}

// ===== HTTP HANDLER: XEM ẢNH DEBUG =====
void handleCaptureRequest() {
    Serial.println("\n[API] Yêu cầu xem ảnh...");

    camera_fb_t* fb = camera_grab_fresh_fb();
    if (!fb) {
        addNoCacheHeaders();
        server.send(500, "text/plain", "Camera capture failed");
        return;
    }
    addNoCacheHeaders();
    server.send_P(200, "image/jpeg", (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
    Serial.println("[API] Ảnh đã gửi");
}

// ===== HTTP HANDLER: THÔNG TIN HỆ THỐNG =====
void handleStatusRequest() {
    String json = "{";
    json += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
    json += "\"free_psram\":" + String(ESP.getFreePsram()) + ",";
    json += "\"model_size\":" + String(g_model_len) + ",";
    json += "\"classes\":[\"nha-dam\",\"tia_to\",\"xuong-rong\"]";
    json += "}";
    addNoCacheHeaders();
    server.send(200, "application/json", json);
}

// ===== KHỞI TẠO CAMERA =====
bool camera_init() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer   = LEDC_TIMER_0;
    config.pin_d0       = Y2_GPIO_NUM;
    config.pin_d1       = Y3_GPIO_NUM;
    config.pin_d2       = Y4_GPIO_NUM;
    config.pin_d3       = Y5_GPIO_NUM;
    config.pin_d4       = Y6_GPIO_NUM;
    config.pin_d5       = Y7_GPIO_NUM;
    config.pin_d6       = Y8_GPIO_NUM;
    config.pin_d7       = Y9_GPIO_NUM;
    config.pin_xclk     = XCLK_GPIO_NUM;
    config.pin_pclk     = PCLK_GPIO_NUM;
    config.pin_vsync    = VSYNC_GPIO_NUM;
    config.pin_href     = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn     = PWDN_GPIO_NUM;
    config.pin_reset    = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;
#ifdef CAMERA_GRAB_LATEST
    config.grab_mode    = CAMERA_GRAB_LATEST;
#endif

    if (psramFound()) {
        config.frame_size   = FRAMESIZE_QVGA;
        config.jpeg_quality = 10;
        config.fb_count     = 1;
    } else {
        config.frame_size   = FRAMESIZE_240X240;
        config.jpeg_quality = 12;
        config.fb_count     = 1;
    }

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("[CAM] LỖI init: 0x%x\n", err);
        return false;
    }
    Serial.println("[CAM] Camera OK");
    return true;
}

// ===== SETUP =====
void setup() {
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
    Serial.begin(115200);
    delay(100);

    Serial.println("\n================================");
    Serial.println("  ESP32-CAM TFLite Micro Node");
    Serial.println("================================");
    Serial.printf("Model size: %u bytes\n", g_model_len);

    pinMode(FLASH_GPIO_NUM, OUTPUT);
    digitalWrite(FLASH_GPIO_NUM, LOW);

    // WiFi
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.printf("Kết nối WiFi: %s", ssid);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("\nWiFi thất bại! Restarting...");
        delay(1000);
        ESP.restart();
    }
    Serial.printf("\nWiFi OK! IP: %s\n", WiFi.localIP().toString().c_str());

    // Camera
    if (!camera_init()) {
        Serial.println("Camera thất bại! Restarting...");
        delay(2000);
        ESP.restart();
    }

    // TFLite Micro (thay thế Edge Impulse)
    if (!tflite_init()) {
        Serial.println("TFLite init thất bại! Restarting...");
        delay(2000);
        ESP.restart();
    }

    // Routes (giữ nguyên URL để backend không cần sửa)
    server.on("/api/recognize", HTTP_GET, handleInferenceRequest);
    server.on("/api/image",     HTTP_GET, handleCaptureRequest);
    server.on("/api/status",    HTTP_GET, handleStatusRequest);   // mới thêm

    server.begin();

    String ip = WiFi.localIP().toString();
    Serial.println("\n--- ENDPOINTS ---");
    Serial.println("  GET http://" + ip + "/api/recognize  <- nhận diện cây");
    Serial.println("  GET http://" + ip + "/api/image      <- xem ảnh debug");
    Serial.println("  GET http://" + ip + "/api/status     <- RAM, model info");
    Serial.println("=================\n");
}

// ===== LOOP =====
void loop() {
    server.handleClient();
    delay(2);
}

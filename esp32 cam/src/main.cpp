#include <Arduino.h>
#include <WiFi.h>
#include "esp_camera.h"
#include "soc/soc.h"           // Thư viện tắt cảnh báo sụt áp (Brownout)
#include "soc/rtc_cntl_reg.h"  // Thư viện tắt cảnh báo sụt áp (Brownout)

// ===== PHẦN 1: CẤU HÌNH WIFI & SERVER =====
const char* ssid     = "vanhvanh";
const char* password = "vanh123123";

// Thông tin Backend
const char* serverName = "10.126.170.17";
const int   serverPort = 5000;
const String serverPath = "/api/vision/upload"; // API Endpoint nhận ảnh trên Backend

const int timerInterval = 30000;    // Thời gian giữa các lần chụp (30 giây / lần)
unsigned long previousMillis = 0;   // Biến lưu thời gian

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

#define FLASH_GPIO_NUM     4 // Chân đèn Flash LED

// ===== PHẦN 3: HÀM GỬI ẢNH LÊN SERVER =====

String sendPhoto() {
  String getAll;
  String getBody;

  // 1. Chụp ảnh lấy buffer
  camera_fb_t * fb = NULL;
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    delay(1000);
    ESP.restart(); // Khởi động lại nếu kẹt camera
    return "Camera capture failed";
  }
  
  Serial.printf("Picture taken! Size: %zu bytes\n", fb->len);

  // 2. Kết nối tới server
  WiFiClient client;
  Serial.printf("Connecting to server: %s\n", serverName);
  
  if (client.connect(serverName, serverPort)) {
    Serial.println("Connection successful!");
    
    // 3. Chuẩn bị định dạng Multipart Form-Data
    String head = "--MyBoundary\r\nContent-Disposition: form-data; name=\"imageFile\"; filename=\"esp32-cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n--MyBoundary--\r\n";

    uint32_t imageLen = fb->len;
    uint32_t extraLen = head.length() + tail.length();
    uint32_t totalLen = imageLen + extraLen;
  
    // 4. Gửi Header HTTP POST
    client.println("POST " + serverPath + " HTTP/1.1");
    client.println("Host: " + String(serverName));
    client.println("Content-Length: " + String(totalLen));
    client.println("Content-Type: multipart/form-data; boundary=MyBoundary");
    client.println();
    
    // 5. Gửi phần đầu Boundary
    client.print(head);
  
    // 6. Gửi dữ liệu ảnh (Đã Fix: Chia nhỏ an toàn, không rớt chunk cuối)
    uint8_t *fbBuf = fb->buf;
    size_t fbLen = fb->len;
    size_t n = 0;
    while (n < fbLen) {
        size_t toWrite = min((size_t)1024, fbLen - n);
        client.write(fbBuf + n, toWrite);
        n += toWrite;
    }
    
    // 7. Gửi phần đuôi Boundary
    client.print(tail);
    
    // 8. Đọc phản hồi từ Server
    int timoutTimer = 10000;
    long startTimer = millis();
    boolean state = false;
    
    while ((startTimer + timoutTimer) > millis()) {
      Serial.print(".");
      delay(100);      
      while (client.available()) {
        char c = client.read();
        if (c == '\n') {
          if (getAll.length()==0) { state=true; }
          getAll = "";
        }
        else if (c != '\r') { getAll += String(c); }
        if (state==true) { getBody += String(c); }
        startTimer = millis();
      }
      if (getBody.length()>0) { break; }
    }
    Serial.println();
    client.stop();
    Serial.println("Response from server: " + getBody);
  }
  else {
    getBody = "Connection to " + String(serverName) + " failed.";
    Serial.println(getBody);
  }
  
  // 9. CỰC KỲ QUAN TRỌNG: Giải phóng bộ nhớ đệm Camera
  esp_camera_fb_return(fb);
  
  return getBody;
}

// ===== PHẦN 4: SETUP VÀ LOOP =====

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
  
  Serial.begin(115200);
  Serial.println("\n\n=================================");
  Serial.println("  ESP32-CAM AI VISION NODE");
  Serial.println("=================================");

  pinMode(FLASH_GPIO_NUM, OUTPUT);
  digitalWrite(FLASH_GPIO_NUM, LOW);

  // Kết nối Wi-Fi (Đã Fix: Có Timeout và Tự động Restart)
  WiFi.mode(WIFI_STA);
  Serial.printf("Connecting to WiFi: %s", ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
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

  // Khởi tạo thông số cấu hình Camera
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

  if(psramFound()){
    config.frame_size = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 10;          
    config.fb_count = 2;               
  } else {
    config.frame_size = FRAMESIZE_CIF; // Đã Fix: 400x296 (Hợp lý hơn cho chip không có PSRAM)
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return;
  }
  Serial.println("Camera configured successfully!");
}

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - previousMillis >= timerInterval) {
    if(WiFi.status() == WL_CONNECTED){
      Serial.println("\n[Action] Capturing and sending photo...");
      sendPhoto();
    } else {
      Serial.println("WiFi not connected. Skipping capture.");
    }
    previousMillis = currentMillis;
  }
  
  delay(100);
}
// ===== PHẦN 1: CẤU HÌNH HỆ THỐNG =====
#define BACKEND_URL          "http://192.168.158.217:8080"
#define DEVICE_ID            "esp32-pot-01"
#define FIRMWARE_VERSION     2.0f
#define SEND_INTERVAL        2000UL    // Gửi dữ liệu cảm biến mỗi 2 giây
#define CHECK_PUMP_INTERVAL  1000UL     // Kiểm tra lệnh bơm mỗi 1 giây
#define CHECK_UPDATE_INTERVAL 3600000UL // Kiểm tra OTA mỗi 1 giờ

// ===== PHẦN 2: THƯ VIỆN =====
#include <WiFi.h>
#include <Arduino.h>
#include <HTTPClient.h>
#include <Update.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ===== PHẦN 3: ĐỊNH NGHĨA CHÂN VÀ CẢM BIẾN =====
#define SOIL_SENSOR_PIN  34   // Cảm biến độ ẩm đất (Analog)
#define DHT_PIN          4    // Cảm biến DHT11 (Digital)
#define PUMP_RELAY_PIN   26    // Relay điều khiển máy bơm
#define FLOAT_SWITCH_PIN 33   // Cảm biến phao mực nước (Digital, INPUT_PULLUP)
                              // LOW = bồn CẠN, HIGH = bồn ĐỦ NƯỚC

#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Ngưỡng độ ẩm đất mặc định (cần hiệu chỉnh thực tế)
const int SOIL_DRY_THRESHOLD = 30; // Dưới 30% → đất khô

// ===== PHẦN 4: CẤU HÌNH WIFI & OTA =====
const char* ssid             = "vingpro";
const char* password         = "00000000";
const char* version_json_url = "https://raw.githubusercontent.com/Vanh53/esp32-ota-firmware/main/version.json";

// ===== PHẦN 5: BIẾN TRẠNG THÁI =====
unsigned long lastSendTime        = 0;
unsigned long lastCheckPumpTime   = 0;
unsigned long lastUpdateCheckTime = 0;

bool pumpStatus       = false;
bool autoMode         = false;
bool waterAvailable   = true; // Trạng thái mực nước (đọc từ phao)
int  humidityThreshold    = 30;  // Ngưỡng BẬT bơm (min) nhận từ server
int  maxHumidityThreshold = 60;  // Ngưỡng TẮT bơm (max) nhận từ server

// ĐÃ THÊM: Khai báo trước hàm (Forward Declaration) để tránh lỗi scope
bool safeSetPump(bool turnOn);

// Parse status payload safely and only update values when server actually provides them.
void applyStatusPayload(const String& payload, bool verboseStatusLog, const char* sourceTag) {
  // ĐÃ SỬA: Dùng JsonDocument thay cho StaticJsonDocument
  JsonDocument doc; 
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.printf("[ERROR] Parse %s failed: %s (len=%u)\n",
                  sourceTag,
                  err.c_str(),
                  (unsigned)payload.length());
    return;
  }

  JsonVariantConst autoVar = doc["auto_mode"];
  if (autoVar.isNull()) autoVar = doc["autoMode"];
  if (!autoVar.isNull()) {
    autoMode = autoVar.as<bool>();
  }

  JsonVariantConst thresholdVar = doc["humidity_threshold"];
  if (thresholdVar.isNull()) thresholdVar = doc["humidityThreshold"];
  if (!thresholdVar.isNull() && (thresholdVar.is<float>() || thresholdVar.is<double>() || thresholdVar.is<int>())) {
    int nextThreshold = (int)thresholdVar.as<float>();
    if (nextThreshold < 0) nextThreshold = 0;
    if (nextThreshold > 100) nextThreshold = 100;
    humidityThreshold = nextThreshold;
  }

  JsonVariantConst maxThresholdVar = doc["max_humidity_threshold"];
  if (!maxThresholdVar.isNull() && (maxThresholdVar.is<float>() || maxThresholdVar.is<double>() || maxThresholdVar.is<int>())) {
    int nextMax = (int)maxThresholdVar.as<float>();
    if (nextMax < 0) nextMax = 0;
    if (nextMax > 100) nextMax = 100;
    maxHumidityThreshold = nextMax;
  }

  JsonVariantConst pumpVar = doc["pump_status"];
  if (pumpVar.isNull()) pumpVar = doc["pumpStatus"];

  if (!autoMode && !pumpVar.isNull()) {
    bool oldPump = pumpStatus;
    bool newPump = pumpVar.as<bool>();
    bool executed = safeSetPump(newPump);
    if (!verboseStatusLog && executed && newPump != oldPump) {
      Serial.printf("[PUMP] Status changed (MANUAL) → %s\n", newPump ? "ON" : "OFF");
    }
  }

  if (verboseStatusLog) {
    Serial.printf("[STATUS] pump=%s auto=%s minThreshold=%d maxThreshold=%d\n",
                  pumpStatus ? "ON" : "OFF",
                  autoMode ? "ON" : "OFF",
                  humidityThreshold,
                  maxHumidityThreshold);
  }
}

// ===== PHẦN 6: TIỆN ÍCH WIFI =====

// Trả về true nếu WiFi đang kết nối; in cảnh báo nếu không
bool wifiConnected() {
  if (WiFi.status() == WL_CONNECTED) return true;
  Serial.println("[WARN] WiFi not connected!");
  return false;
}

// ===== PHẦN 6b: ĐIỀU KHIỂN BƠM AN TOÀN =====

// Điểm DUY NHẤT ghi relay — luôn kiểm tra mực nước trước
// Trả về true nếu lệnh được thực thi, false nếu bị chặn
bool safeSetPump(bool turnOn) {
  if (turnOn && !waterAvailable) {
    // Bồn cạn → buộc tắt bơm dù lệnh là ON
    if (pumpStatus) {
      pumpStatus = false;
      digitalWrite(PUMP_RELAY_PIN, LOW);
      Serial.println("[PUMP] FORCED OFF – tank empty!");
    }
    return false;
  }
  if (turnOn != pumpStatus) {
    pumpStatus = turnOn;
    digitalWrite(PUMP_RELAY_PIN, pumpStatus ? HIGH : LOW);
  }
  return true;
}

// ===== PHẦN 7: GỬI DỮ LIỆU CẢM BIẾN =====

void sendSensorDataToServer(float humidity, float temperature, int soilPercentage) {
  if (!wifiConnected()) return;

  // ĐÃ SỬA: Dùng JsonDocument thay cho StaticJsonDocument
  JsonDocument doc; 
  doc["deviceId"]      = DEVICE_ID;
  doc["humidity"]      = humidity;
  doc["temperature"]   = temperature;
  doc["soil_moisture"] = soilPercentage;
  doc["water_level"]   = waterAvailable ? "OK" : "LOW"; // Gửi trạng thái bồn chứa

  String jsonBody;
  serializeJson(doc, jsonBody);

  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/sensors");
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(jsonBody);
  if (code > 0) {
    Serial.printf("[HTTP] POST /api/sensor → %d\n", code);
  } else {
    Serial.printf("[HTTP] POST error: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

// ===== PHẦN 8: LẤY TRẠNG THÁI HỆ THỐNG =====

void fetchSystemStatus() {
  if (!wifiConnected()) return;

  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/status?deviceId=" + String(DEVICE_ID));
  http.addHeader("Authorization", "Bearer esp32");

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    applyStatusPayload(payload, true, "/api/status");
  } else {
    Serial.printf("[HTTP] GET /api/status → %d\n", code);
  }
  http.end();
}

// ===== PHẦN 9: KIỂM TRA LỆNH BƠM NHANH =====

void checkPumpControl() {
  if (!wifiConnected()) return;

  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/pump-control?deviceId=" + String(DEVICE_ID));
  http.addHeader("Authorization", "Bearer esp32");

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    applyStatusPayload(payload, false, "/api/pump-control");
  }
  http.end();
}

// ===== PHẦN 10: OTA UPDATE =====

void performUpdate(const String& url) {
  Serial.println("[OTA] Starting firmware download...");

  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // NOTE: production nên dùng root CA cụ thể

  HTTPClient http;
  bool isHttps = url.startsWith("https://");
  if (isHttps) {
    http.begin((WiFiClient&)secureClient, url);
  } else {
    http.begin(url);
  }

  int code = http.GET();
  if (code != HTTP_CODE_OK) {
    Serial.printf("[OTA] Download failed: %d – %s\n", code, http.errorToString(code).c_str());
    http.end();
    return;
  }

  int contentLen = http.getSize();
  if (contentLen <= 0) {
    Serial.println("[OTA] Invalid Content-Length; aborting.");
    http.end();
    return;
  }

  if (!Update.begin(contentLen)) {
    Serial.println("[OTA] Not enough flash space.");
    http.end();
    return;
  }

  size_t written = Update.writeStream(*http.getStreamPtr());
  if (written != (size_t)contentLen) {
    Serial.printf("[OTA] Write incomplete: %u / %d bytes\n", (unsigned)written, contentLen);
    Update.abort();
    http.end();
    return;
  }

  if (Update.end()) {
    Serial.println("[OTA] Success! Rebooting...");
    http.end();
    ESP.restart();
  } else {
    Serial.printf("[OTA] Finalize error: %u\n", Update.getError());
    http.end();
  }
}

void checkForUpdates() {
  if (!wifiConnected()) return;

  Serial.println("[OTA] Checking for updates...");

  WiFiClientSecure secureClient;
  secureClient.setInsecure();

  HTTPClient http;
  bool isHttps = String(version_json_url).startsWith("https://");
  if (isHttps) {
    http.begin((WiFiClient&)secureClient, version_json_url);
  } else {
    http.begin(version_json_url);
  }

  int code = http.GET();
  if (code != HTTP_CODE_OK) {
    Serial.printf("[OTA] Version fetch failed: %s\n", http.errorToString(code).c_str());
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  // ĐÃ SỬA: Dùng JsonDocument thay cho StaticJsonDocument
  JsonDocument doc; 
  if (deserializeJson(doc, payload)) {
    Serial.println("[OTA] Failed to parse version JSON");
    return;
  }

  float  serverVersion = doc["latest_version"] | 0.0f;
  String firmwareUrl   = doc["firmware_url"]   | "";

  Serial.printf("[OTA] Current: %.1f  Server: %.1f\n", FIRMWARE_VERSION, serverVersion);

  if (serverVersion > FIRMWARE_VERSION) {
    Serial.println("[OTA] New firmware available. Updating...");
    performUpdate(firmwareUrl);
  } else {
    Serial.println("[OTA] Already up to date.");
  }
}

// ===== PHẦN 11: LOGIC HỆ THỐNG CHÍNH =====

void runSystemLogic() {
  // 1. Đọc tất cả cảm biến
  int   soilRaw      = analogRead(SOIL_SENSOR_PIN);
  float humidity     = dht.readHumidity();
  float temperature  = dht.readTemperature();
  int   soilPercent  = (int)map(soilRaw, 4095, 0, 0, 100);
  waterAvailable     = (digitalRead(FLOAT_SWITCH_PIN) == HIGH); // HIGH = đủ nước

  // 2. In dữ liệu cảm biến
  Serial.println("=== SENSOR DATA ===");
  if (!isnan(humidity) && !isnan(temperature)) {
    Serial.printf("  Air Humidity  : %.1f %%\n", humidity);
    Serial.printf("  Temperature   : %.1f °C\n", temperature);
  } else {
    Serial.println("  [WARN] DHT11 read failed!");
  }
  Serial.printf("  Soil Moisture : %d %%\n", soilPercent);
  Serial.printf("  Water Level   : %s\n", waterAvailable ? "OK" : "** LOW – CANH BAO **");

  // Cảnh báo bồn cạn ngay lập tức
  if (!waterAvailable) {
    Serial.println("  [WARN] Tank empty! Pump disabled.");
    safeSetPump(false); // Tắt bơm khẩn cấp nếu đang chạy
  }

  // 3. Gửi dữ liệu lên server (chỉ khi DHT đọc hợp lệ)
  if (!isnan(humidity) && !isnan(temperature)) {
    sendSensorDataToServer(humidity, temperature, soilPercent);
  }

  // 4. Lấy trạng thái hệ thống từ server
  fetchSystemStatus();

  // 5. Logic tự động nội bộ (chỉ khi có nước)
  if (autoMode) {
    bool shouldTurnOn  = soilPercent < humidityThreshold;    // Đất quá khô → BẬT bơm
    bool shouldTurnOff = soilPercent >= maxHumidityThreshold; // Đất đủ ẩm  → TẮT bơm

    if (shouldTurnOn) {
      bool ok = safeSetPump(true);
      if (ok) {
        Serial.printf("  [AUTO] Soil %d%% < min %d%% → Pump ON\n",
                      soilPercent, humidityThreshold);
      }
    } else if (shouldTurnOff) {
      bool ok = safeSetPump(false);
      if (ok) {
        Serial.printf("  [AUTO] Soil %d%% >= max %d%% → Pump OFF\n",
                      soilPercent, maxHumidityThreshold);
      }
    } else {
      // Nằm trong khoảng [min, max) → giữ nguyên trạng thái (hysteresis)
      Serial.printf("  [AUTO] Soil %d%% in [%d%%, %d%%) → Pump %s (hold)\n",
                    soilPercent, humidityThreshold, maxHumidityThreshold,
                    pumpStatus ? "ON" : "OFF");
    }
  } else {
    Serial.println("  [MANUAL] Pump controlled by server.");
  }

  lastSendTime = millis();
}

// ===== PHẦN 12: SETUP & LOOP =====

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n==========================================");
  Serial.println("  SMART IRRIGATION SYSTEM");
  Serial.printf( "  Firmware v%.1f\n", FIRMWARE_VERSION);
  Serial.println("==========================================");

  // Khởi tạo relay bơm (OFF mặc định)
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, LOW);

  // Khởi tạo cảm biến phao mực nước
  pinMode(FLOAT_SWITCH_PIN, INPUT_PULLUP);
  waterAvailable = (digitalRead(FLOAT_SWITCH_PIN) == HIGH);
  Serial.printf("[OK] Float switch initialized – Tank: %s\n", waterAvailable ? "OK" : "LOW");

  // Khởi tạo DHT11
  dht.begin();
  Serial.println("[OK] DHT11 initialized");

  // Kết nối WiFi
  Serial.printf("[WiFi] Connecting to %s", ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    checkForUpdates();
    lastUpdateCheckTime = millis();
  } else {
    Serial.println("\n[WiFi] Connection FAILED – running offline.");
  }

  Serial.println("[OK] System ready.\n");
}

void loop() {
  unsigned long now = millis();

  // Kiểm tra lệnh bơm nhanh (mỗi 1 giây)
  if (now - lastCheckPumpTime >= CHECK_PUMP_INTERVAL) {
    checkPumpControl();
    lastCheckPumpTime = now;
  }

  // Gửi dữ liệu cảm biến (mỗi 2 giây)
  if (now - lastSendTime >= SEND_INTERVAL) {
    runSystemLogic();
  }

  // Kiểm tra OTA (mỗi 1 giờ)
  if (now - lastUpdateCheckTime >= CHECK_UPDATE_INTERVAL) {
    checkForUpdates();
    lastUpdateCheckTime = millis();
  }

  delay(50); // yield CPU, tránh watchdog trigger
}
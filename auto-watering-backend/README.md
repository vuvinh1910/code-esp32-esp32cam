# 🌱 Smart Watering System - Backend

Backend cho hệ thống **Thiết bị tưới cây tự động (IoT)** sử dụng **Spring Boot + PostgreSQL**.

---

## 🚀 Công nghệ sử dụng

- Java 17
- Spring Boot
- Spring Security + JWT
- Spring Data JPA (Hibernate)
- PostgreSQL
- Maven

---

## 📦 Tính năng chính

### 🔐 Authentication
- Đăng ký, đăng nhập
- JWT authentication
- Phân quyền: ADMIN / USER

---

### 📱 Device Management
- CRUD thiết bị
- Gán thiết bị cho user
- Phân loại:
  - CONTROL_NODE (ESP32 điều khiển bơm)
  - VISION_NODE (ESP32-CAM)

---

### 🌱 Sensor Data
- Nhận dữ liệu từ ESP32:
  - Độ ẩm đất
  - Nhiệt độ
  - Độ ẩm không khí
  - Ánh sáng
- Lưu lịch sử vào database

---

### Pump Control
- Bật/tắt thủ công
- Ghi log hoạt động

---

### ⚙Auto Watering
- Cấu hình:
  - minSoilMoisture
  - maxSoilMoisture
- Logic:
  - < min → bật bơm
  - \> max → tắt bơm

---

### 🔄 OTA (Over-The-Air)
- Kiểm tra firmware mới
- Trả link tải firmware (.bin)
- Hỗ trợ nhiều loại thiết bị

---

## 🗄️ Database

### Các bảng chính:
- users
- devices
- sensor_data
- pump_action_logs
- watering_configs
- ota_firmwares

---

## ⚙️ Cài đặt

### 1. Clone project
```bash
git clone <repo-url>
cd auto-watering-backend
````

---

### 2. Cấu hình database

Tạo database:

```sql
CREATE DATABASE auto_watering;
```

---

### 3. Cấu hình `application.yml`

```yaml
spring:
  datasource:
    url: 
    username: 
    password: 

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

server:
  port: 8080

jwt:
  secret: your_secret_key
```

---

### 4. Chạy project

```bash
mvn spring-boot:run
```

Hoặc chạy trong IDE:

* Run `AutoWateringApplication`

---

## 📡 API Endpoints

### 🔐 Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

---

### Device

* `GET /api/devices`
* `POST /api/devices`
* `PUT /api/devices/{id}`
* `DELETE /api/devices/{id}`

---

### Sensor

* `POST /api/sensors`
* `GET /api/sensors`

---

### Pump

* `POST /api/pump`
* `GET /history/{deviceId}`

---

### Config

* `POST /api/configs`

---

### 🔄 OTA

* `GET /api/ota/check?version=&deviceType=`

---

## 🧪 Test

### Dùng Postman:

1. Register → Login → lấy token
2. Thêm token vào Authorization (Bearer)
3. Test các API theo flow:

```
Auth → Device → Sensor → Pump → Config → OTA
```

---

## 📡 ESP32 Integration

### Gửi sensor:

```json
{
  "deviceId": "xxx",
  "soilMoisture": 30,
  "airTemperature": 28,
  "airHumidity": 70,
  "lightLevel": 500
}
```

---

### OTA check:

```
GET /api/ota/check?version=v1.0.0&deviceType=CONTROL_NODE
```

---

## ⚠️ Lưu ý

* Cần Java 17+
* PostgreSQL phải đang chạy
* Port mặc định: 8080
* ESP32 nên dùng HTTP (không HTTPS)

---

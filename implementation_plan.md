# Phân Tích Đồng Bộ API Frontend ↔ Backend (Auto Watering System)

## Tổng Quan Hệ Thống

| Component | Tech Stack | Port | Database |
|-----------|-----------|------|----------|
| **Backend** | Spring Boot 3.5.13 + JPA + Security (JWT) | `8080` | PostgreSQL `localhost:5432/auto_watering` |
| **Frontend** | React 19 + Vite + TailwindCSS + Axios | `5173` (dev) | N/A (gọi API) |

> [!CAUTION]
> **Frontend đang trỏ đến port `5000`** (`VITE_API_URL=http://localhost:5000`), trong khi **Backend chạy ở port `8080`**. → Frontend sẽ KHÔNG BAO GIỜ kết nối được Backend!

---

## 1. 🔴 Lỗi Nghiêm Trọng: Port Mismatch

| | Frontend (.env) | Backend (application.yml) |
|---|---|---|
| **URL** | `http://localhost:5000` | `server.port: 8080` |

**Sửa**: Đổi `.env` thành `VITE_API_URL=http://localhost:8080`

---

## 2. 🔴 Không Có CORS Configuration

Backend **KHÔNG** có bất kỳ cấu hình CORS nào:
- Không có `@CrossOrigin` trên controller
- Không có `CorsConfiguration` bean
- Không có `WebMvcConfigurer.addCorsMappings()`

→ Frontend (chạy ở `localhost:5173`) sẽ bị **chặn bởi CORS policy** khi gọi API sang `localhost:8080`.

**Sửa**: Thêm CORS config trong `SecurityConfig.java` cho phép origin `http://localhost:5173`.

---

## 3. 🔴 API Endpoint Mismatch (FE gọi sai path so với BE)

### 3.1 Login API
| | Frontend (client.js) | Backend (AuthController) |
|---|---|---|
| **Path** | `POST /api/login` | `POST /api/auth/login` |
| **Status** | ❌ **SAI** | ✅ |

FE gọi `/api/login` nhưng BE expose `/api/auth/login` → **404 Not Found**.

### 3.2 Sensor API — Create
| | Frontend (client.js) | Backend (SensorController) |
|---|---|---|
| **Path** | `POST /api/sensor` (số ít) | `POST /api/sensors` (số nhiều) |
| **Status** | ❌ **SAI** | ✅ |

### 3.3 Sensor API — Get Readings
| | Frontend (client.js) | Backend (SensorController) |
|---|---|---|
| **Path** | `GET /api/readings` | `GET /api/sensors?deviceId=...` |
| **Status** | ❌ **SAI** — path khác, param khác | ✅ |

### 3.4 Sensor API — Get Status
| | Frontend (client.js) | Backend |
|---|---|---|
| **Path** | `GET /api/status` | **KHÔNG TỒN TẠI** |
| **Status** | ❌ **KHÔNG CÓ API** | ❌ |

Dashboard gọi `sensorAPI.getStatus()` → `GET /api/status` — endpoint này **không tồn tại** ở backend. Dashboard phụ thuộc vào response trả về `{pump_status, auto_mode, humidity_threshold, current_humidity}` — BE không có API nào trả dữ liệu dạng này.

### 3.5 Pump API — Control
| | Frontend (client.js) | Backend (PumpController) |
|---|---|---|
| **Path** | `POST /api/pump` | `POST /api/pump` |
| **Body FE gửi** | `{ status: true/false }` (boolean) | Expects `{ deviceId: UUID, action: "TURN_ON"/"TURN_OFF" }` |
| **Status** | Path ✅, **Body ❌ SAI HOÀN TOÀN** | ✅ |

FE gửi `{status: true}` nhưng BE cần `{deviceId: "uuid", action: "TURN_ON"}`.

### 3.6 Pump API — Get History
| | Frontend (client.js) | Backend (PumpController) |
|---|---|---|
| **Path** | `GET /api/pump-history` | `GET /api/pump/history/{deviceId}` |
| **Status** | ❌ **SAI** — thiếu deviceId trong path | ✅ |

### 3.7 Config API — Set Auto Mode
| | Frontend (client.js) | Backend (ConfigController) |
|---|---|---|
| **Path** | `POST /api/auto-mode` | `POST /api/configs` |
| **Body** | Unknown | `{ deviceId, minSoilMoisture, maxSoilMoisture, overrideByWeather }` |
| **Status** | ❌ **SAI** | ✅ |

### 3.8 Device API
| | Frontend (client.js) | Backend (DeviceController) |
|---|---|---|
| **GET all** | `GET /api/devices` | `GET /api/devices` ✅ |
| **GET one** | `GET /api/devices/:id` | `GET /api/devices/:id` ✅ |
| **POST** | `POST /api/devices` | `POST /api/devices` ✅ (nhưng body sai) |
| **PUT** | `PUT /api/devices/:id` | `PUT /api/devices/:id` ✅ (nhưng body sai) |
| **DELETE** | `DELETE /api/devices/:id` | `DELETE /api/devices/:id` ✅ |

Device path đúng, nhưng:
- FE gửi `{ name, device_id, location, status }` (snake_case + trường sai)
- BE cần `{ userId, macAddress, name, deviceType }` (camelCase + trường khác)

→ **Field mismatch hoàn toàn**

---

## 4. 🟡 Trang FE Không Gọi API (Hardcoded Data)

### 4.1 WateringConfig.jsx
- ❌ **KHÔNG gọi bất kỳ API nào** — chỉ sử dụng `useState` local
- `handleSave()` chỉ dùng `setTimeout` → fake toast, không gửi lên BE
- Không gọi `GET /api/configs/{deviceId}` để load cấu hình hiện tại
- Không import `configAPI` từ client.js

### 4.2 UserManagement.jsx
- ❌ **Dữ liệu hardcoded hoàn toàn** — mảng `users` cố định trong code
- Backend **KHÔNG CÓ User Management API** (không có endpoint list users, update user, delete user)
- AdminController chỉ có `GET /api/admin/devices`
- `AppUserRepository` chỉ có `findByUsername`, `existsByUsername`, `existsByEmail`

### 4.3 FirmwareUpdates.jsx
- ❌ **Dữ liệu hardcoded hoàn toàn** — mảng `firmwareVersions` cố định
- Không gọi `GET /api/firmware/latest` hoặc bất kỳ firmware API nào
- Nút "Check for Updates", "Rollback" không làm gì cả

### 4.4 Dashboard.jsx
- Chart data **hardcoded** — không lấy từ sensor readings API
- "Recent Activity" section **hardcoded** — không từ pump history API
- Water Tank, Health Score, Temperature, Humidity, Light Level **hardcoded**
- Chỉ có `sensorAPI.getStatus()` và `pumpAPI.control()` là gọi API (nhưng cả 2 đều sai endpoint/format)

---

## 5. 🟡 Backend API Chưa Có Nhưng FE Cần

| API Cần | Mô tả | Tình trạng BE |
|---------|-------|---------------|
| `GET /api/status` (hoặc dashboard summary) | Trả về trạng thái tổng: pump, auto_mode, humidity mới nhất | ❌ Chưa có |
| User Management CRUD | List/Create/Update/Delete users | ❌ Chỉ có register/login |
| `GET /api/firmware` (list all) | Danh sách tất cả firmware versions | ❌ Chỉ có latest + byVersion |
| Firmware Rollback API | Rollback thiết bị về firmware cũ | ❌ Chưa có |

---

## 6. Database Configuration

```yaml
spring.datasource:
  url: jdbc:postgresql://localhost:5432/auto_watering
  username: postgres
  password: 123456789
  jpa.hibernate.ddl-auto: update  # Auto tạo/update schema
```

### Database Tables (tự tạo bởi JPA `ddl-auto: update`)

| Table | Entity | Mô tả |
|-------|--------|--------|
| `users` | `AppUser` | Quản lý tài khoản (UUID id, username, passwordHash, email, role) |
| `devices` | `Device` | Thiết bị IoT (UUID id, macAddress, name, deviceType, status, firmware, lastSeenAt) |
| `sensor_data` | `SensorData` | Dữ liệu cảm biến (soilMoisture, airTemperature, airHumidity, lightLevel, recordedAt) |
| `pump_action_logs` | `PumpActionLog` | Lịch sử bơm |
| `watering_configs` | `WateringConfig` | Cấu hình tưới nước tự động |
| `device_commands` | `DeviceCommand` | Lệnh xuống thiết bị (IoT polling) |
| `ota_firmwares` | `OtaFirmware` | Quản lý firmware OTA |
| `plant_recognition_results` | `PlantRecognitionResult` | Kết quả nhận diện cây |

> [!IMPORTANT]
> Database sử dụng PostgreSQL local. Cần đảm bảo PostgreSQL đang chạy và database `auto_watering` đã được tạo trước khi start backend. Schema sẽ tự tạo nhờ `ddl-auto: update`.

---

## 7. Tổng Kết Vấn Đề

| # | Vấn đề | Mức độ | Ảnh hưởng |
|---|--------|--------|-----------|
| 1 | Port mismatch (5000 vs 8080) | 🔴 CRITICAL | FE không kết nối được BE |
| 2 | Không có CORS config | 🔴 CRITICAL | FE bị block bởi browser |
| 3 | Login API path sai | 🔴 CRITICAL | Không đăng nhập được |
| 4 | Sensor API paths sai | 🔴 HIGH | Dashboard trống |
| 5 | Pump control body sai | 🔴 HIGH | Bơm không điều khiển được |
| 6 | API `GET /api/status` không tồn tại | 🔴 HIGH | Dashboard crash |
| 7 | Device form fields sai | 🟡 MEDIUM | Thêm/sửa device lỗi |
| 8 | Config API path + body sai | 🟡 MEDIUM | Save config không hoạt động |
| 9 | Pump history path sai | 🟡 MEDIUM | Lịch sử bơm trống |
| 10 | WateringConfig không gọi API | 🟡 MEDIUM | Fake/static data |
| 11 | UserManagement hardcoded | 🟡 MEDIUM | Không quản lý user được |
| 12 | FirmwareUpdates hardcoded | 🟡 LOW | Không cập nhật firmware được |
| 13 | Dashboard chart/activity hardcoded | 🟡 LOW | Không real-time |
| 14 | Backend thiếu User CRUD API | 🟡 MEDIUM | FE cần nhưng BE chưa có |
| 15 | Backend thiếu Firmware list API | 🟡 LOW | FE cần nhưng BE chưa có |

---

## Proposed Changes (Kế Hoạch Sửa)

### Phase 1: Sửa Lỗi Kết Nối Ngay Lập Tức (Critical)

#### [MODIFY] [.env](file:///d:/code-esp32-esp32cam/frontend-new/.env)
- Đổi `VITE_API_URL=http://localhost:5000` → `VITE_API_URL=http://localhost:8080`

#### [NEW] CorsConfig.java hoặc [MODIFY] [SecurityConfig.java](file:///d:/code-esp32-esp32cam/auto-watering-backend/src/main/java/com/smartwatering/security/SecurityConfig.java)
- Thêm CORS config cho phép origin `http://localhost:5173` (Vite dev server)
- Allow methods: GET, POST, PUT, DELETE, OPTIONS
- Allow headers: Authorization, Content-Type

---

### Phase 2: Sửa Tất Cả API Endpoints trong Frontend

#### [MODIFY] [client.js](file:///d:/code-esp32-esp32cam/frontend-new/src/api/client.js)
Sửa toàn bộ API paths cho khớp với backend:

```diff
 // Auth API
-login: (u, p) => apiClient.post('/api/login', { username: u, password: p }),
+login: (u, p) => apiClient.post('/api/auth/login', { username: u, password: p }),

 // Sensor API
-create: (data) => apiClient.post('/api/sensor', data),
-getReadings: (params) => apiClient.get('/api/readings', { params }),
-getStatus: () => apiClient.get('/api/status'),
+create: (data) => apiClient.post('/api/sensors', data),
+getReadings: (deviceId, params) => apiClient.get('/api/sensors', { params: { deviceId, ...params } }),

 // Pump API
-control: (status) => apiClient.post('/api/pump', { status }),
-getHistory: (params) => apiClient.get('/api/pump-history', { params }),
+control: (deviceId, action) => apiClient.post('/api/pump', { deviceId, action }),
+getHistory: (deviceId) => apiClient.get(`/api/pump/history/${deviceId}`),

 // Config API
-setAutoMode: (data) => apiClient.post('/api/auto-mode', data),
+get: (deviceId) => apiClient.get(`/api/configs/${deviceId}`),
+upsert: (data) => apiClient.post('/api/configs', data),

+// Firmware API
+firmwareAPI: {
+  latest: (deviceType) => apiClient.get('/api/firmware/latest', { params: { deviceType } }),
+  byVersion: (version) => apiClient.get(`/api/firmware/${version}`),
+  create: (data) => apiClient.post('/api/firmware', data),
+}

+// User API (sau khi BE tạo)
+userAPI: {
+  getAll: () => apiClient.get('/api/admin/users'),
+  ...
+}
```

---

### Phase 3: Tạo API Thiếu ở Backend

#### [NEW] StatusController.java (hoặc thêm vào SensorController)
- `GET /api/dashboard/summary?deviceId=...`
- Trả về: `{ pumpStatus, autoMode, humidityThreshold, currentHumidity, airTemperature, airHumidity, lightLevel }`
- Aggregation từ SensorData (bản mới nhất) + WateringConfig + PumpActionLog

#### [NEW] UserController.java (Admin)
- `GET /api/admin/users` — list all users (pageable)
- `PUT /api/admin/users/{id}` — update role/status
- `DELETE /api/admin/users/{id}` — delete user
- `POST /api/admin/users/invite` — (optional)

#### [MODIFY] [FirmwareController.java](file:///d:/code-esp32-esp32cam/auto-watering-backend/src/main/java/com/smartwatering/controller/FirmwareController.java)
- `GET /api/firmware` — list tất cả firmware (pageable)
- `POST /api/firmware/{version}/rollback` — rollback tới phiên bản cũ

---

### Phase 4: Kết Nối Dữ Liệu Thật Cho Các Trang FE

#### [MODIFY] [Dashboard.jsx](file:///d:/code-esp32-esp32cam/frontend-new/src/pages/Dashboard.jsx)
- Gọi dashboard summary API thay vì `getStatus()`
- Gọi `sensorAPI.getReadings()` cho biểu đồ
- Gọi `pumpAPI.getHistory()` cho Recent Activity
- Sửa `handlePumpToggle()` truyền `deviceId` + `action`

#### [MODIFY] [WateringConfig.jsx](file:///d:/code-esp32-esp32cam/frontend-new/src/pages/WateringConfig.jsx)
- Load config từ `configAPI.get(deviceId)` khi mount
- `handleSave()` gọi `configAPI.upsert(data)` thật

#### [MODIFY] [Devices.jsx](file:///d:/code-esp32-esp32cam/frontend-new/src/pages/Devices.jsx)
- Sửa form fields: `device_id` → `macAddress`, thêm `deviceType`, bỏ `location`/`status`
- Map response fields đúng (`macAddress`, `deviceType`, `status`, `lastSeenAt`)

#### [MODIFY] [UserManagement.jsx](file:///d:/code-esp32-esp32cam/frontend-new/src/pages/UserManagement.jsx)
- Gọi User Management API từ backend (sau khi tạo)
- Thay data hardcoded bằng data từ API

#### [MODIFY] [FirmwareUpdates.jsx](file:///d:/code-esp32-esp32cam/frontend-new/src/pages/FirmwareUpdates.jsx)
- Gọi `firmwareAPI.getAll()` từ backend
- Nút Check for Updates gọi `firmwareAPI.latest()`
- Nút Rollback gọi `firmwareAPI.rollback()`

---

## Open Questions

> [!IMPORTANT]
> 1. **PostgreSQL đã cài và chạy chưa?** — Database `auto_watering` đã tạo chưa? Mật khẩu `123456789` có đúng không?
> 2. **Muốn ưu tiên phase nào trước?** — Phase 1+2 (fix kết nối + API paths) có thể hoàn thành nhanh. Phase 3+4 (tạo API mới + kết nối data thật) cần nhiều thời gian hơn.
> 3. **UserManagement**: Có cần full CRUD user management không, hay chỉ cần hiển thị danh sách?
> 4. **Chọn deviceId mặc định nào?** — Nhiều API cần `deviceId` (UUID) nhưng FE hiện tại không có cơ chế chọn device. Muốn dùng device đầu tiên làm mặc định hay cần UI chọn device?
> 5. **Firmware**: Firmware data lấy từ đâu thực tế? Upload file hay chỉ quản lý metadata?

## Verification Plan

### Automated Tests
1. Start backend: `mvn spring-boot:run` → kiểm tra port 8080
2. Start frontend: `npm run dev` → kiểm tra port 5173
3. Test Login flow: POST `/api/auth/login` → nhận token → redirect
4. Test Device CRUD: tạo device → hiển thị → sửa → xóa
5. Test browser console: không còn CORS error, không còn 404

### Manual Verification
- Mở browser DevTools > Network tab
- Kiểm tra mọi request đều trả 200/201 (không có 404, 403, CORS error)
- Kiểm tra dữ liệu hiển thị đúng trên mỗi trang

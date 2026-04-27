
#pragma once
#include <Arduino.h>
#include "model.h"   // File xuất từ train_model.py

// TFLite Micro headers
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_error_reporter.h"
#include "tensorflow/lite/schema/schema_generated.h"

// ===== CẤU HÌNH (phải khớp với train_model.py) =====
#define MODEL_INPUT_WIDTH   96
#define MODEL_INPUT_HEIGHT  96
#define MODEL_NUM_CLASSES    3

// Thứ tự PHẢI GIỐNG hệt CLASSES trong train_model.py
static const char* CLASS_LABELS[MODEL_NUM_CLASSES] = {
    "nha-dam",
    "tia_to",
    "xuong-rong"
};

// Ngưỡng tin cậy tối thiểu để chấp nhận kết quả (0.0 - 1.0)
static const float CONFIDENCE_THRESHOLD = 0.5f;
 
// Kích thước tensor arena (RAM dành cho TFLite) - điều chỉnh nếu cần
static const int TENSOR_ARENA_SIZE = 120 * 1024;  // 120KB

// ===== BIẾN TOÀN CỤC INTERNAL =====
static uint8_t* tensor_arena = nullptr;
static tflite::MicroInterpreter* interpreter = nullptr;
static TfLiteTensor* input_tensor  = nullptr;
static TfLiteTensor* output_tensor = nullptr;

// Thông số quantization (lấy từ model)
static float   input_scale      = 0.0f;
static int32_t input_zero_point = 0;
static float   output_scale     = 0.0f;
static int32_t output_zero_point = 0;

// ===== KẾT QUẢ INFERENCE =====
struct InferenceResult {
    char  label[32];      // Tên class tốt nhất
    float confidence;     // Độ tin cậy (0.0 - 1.0)
    bool  below_threshold; // true nếu không đủ tin cậy
    float scores[MODEL_NUM_CLASSES]; // Điểm tất cả các class
};

/**
 * Khởi tạo TFLite Micro interpreter
 * Gọi một lần trong setup()
 * Trả về: true nếu thành công
 */
bool tflite_init() {
    Serial.println("[TFLite] Khởi tạo model...");

    // Cấp phát tensor arena từ PSRAM nếu có
    if (psramFound()) {
        tensor_arena = (uint8_t*)ps_malloc(TENSOR_ARENA_SIZE);
        Serial.printf("[TFLite] Dùng PSRAM cho tensor arena (%d KB)\n", TENSOR_ARENA_SIZE / 1024);
    } else {
        tensor_arena = (uint8_t*)malloc(TENSOR_ARENA_SIZE);
        Serial.printf("[TFLite] Dùng RAM thường cho tensor arena (%d KB)\n", TENSOR_ARENA_SIZE / 1024);
    }

    if (!tensor_arena) {
        Serial.println("[TFLite] LỖI: Không đủ RAM cho tensor arena!");
        return false;
    }

    // Load model từ model.h
    const tflite::Model* model = tflite::GetModel(g_model);
    if (model->version() != TFLITE_SCHEMA_VERSION) {
        Serial.printf("[TFLite] LỖI: Schema version không khớp: %d vs %d\n",
                      model->version(), TFLITE_SCHEMA_VERSION);
        return false;
    }

    // Tạo resolver (đăng ký các op cần thiết cho MobileNet)
    static tflite::AllOpsResolver resolver;

    // Tạo error reporter
    static tflite::MicroErrorReporter micro_error_reporter;
    tflite::ErrorReporter* error_reporter = &micro_error_reporter;

    // Tạo interpreter
    static tflite::MicroInterpreter static_interpreter(
        model, resolver, tensor_arena, TENSOR_ARENA_SIZE, error_reporter
    );
    interpreter = &static_interpreter;

    // Cấp phát bộ nhớ cho tensors
    TfLiteStatus status = interpreter->AllocateTensors();
    if (status != kTfLiteOk) {
        Serial.println("[TFLite] LỖI: AllocateTensors thất bại!");
        return false;
    }

    // Lấy con trỏ tensor input/output
    input_tensor  = interpreter->input(0);
    output_tensor = interpreter->output(0);

    // Lưu thông số quantization
    input_scale       = input_tensor->params.scale;
    input_zero_point  = input_tensor->params.zero_point;
    output_scale      = output_tensor->params.scale;
    output_zero_point = output_tensor->params.zero_point;

    Serial.printf("[TFLite] Input:  %dx%dx%d, scale=%.6f, zp=%d\n",
                  input_tensor->dims->data[1],
                  input_tensor->dims->data[2],
                  input_tensor->dims->data[3],
                  input_scale, input_zero_point);
    Serial.printf("[TFLite] Output: %d classes, scale=%.6f, zp=%d\n",
                  output_tensor->dims->data[1],
                  output_scale, output_zero_point);

    size_t used = interpreter->arena_used_bytes();
    Serial.printf("[TFLite] Arena đã dùng: %zu / %d bytes\n", used, TENSOR_ARENA_SIZE);
    Serial.println("[TFLite] Khởi tạo thành công!");
    return true;
}

/**
 * Chạy inference trên ảnh RGB888 đã được resize về 96x96
 * 
 * @param rgb_buf   Mảng pixel RGB888, kích thước: 96*96*3 bytes
 *                  Thứ tự byte: R,G,B, R,G,B, ... (row-major)
 * @param result    Con trỏ đến struct kết quả
 * @return true nếu inference thành công
 */
bool tflite_run(const uint8_t* rgb_buf, InferenceResult* result) {
    if (!interpreter || !input_tensor || !output_tensor) {
        Serial.println("[TFLite] LỖI: Chưa gọi tflite_init()!");
        return false;
    }

    // --- BƯỚC 1: Copy ảnh vào input tensor (với quantization) ---
    int8_t* input_data = input_tensor->data.int8;
    const int total_pixels = MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT * 3;

    for (int i = 0; i < total_pixels; i++) {
        // Normalize [0,255] → float [0.0, 1.0] → quantize sang int8
        float pixel_float = rgb_buf[i] / 255.0f;
        int quantized = (int)(pixel_float / input_scale) + input_zero_point;

        // Clamp về [-128, 127]
        if (quantized < -128) quantized = -128;
        if (quantized >  127) quantized =  127;
        input_data[i] = (int8_t)quantized;
    }

    // --- BƯỚC 2: Chạy inference ---
    TfLiteStatus status = interpreter->Invoke();
    if (status != kTfLiteOk) {
        Serial.println("[TFLite] LỖI: Invoke() thất bại!");
        return false;
    }

    // --- BƯỚC 3: Đọc kết quả và dequantize ---
    int8_t* output_data = output_tensor->data.int8;

    float best_score = -1.0f;
    int   best_idx   = 0;

    Serial.println("[TFLite] --- Kết quả ---");
    for (int i = 0; i < MODEL_NUM_CLASSES; i++) {
        // Dequantize int8 → float probability
        float score = (output_data[i] - output_zero_point) * output_scale;
        result->scores[i] = score;
        Serial.printf("  %s: %.4f\n", CLASS_LABELS[i], score);

        if (score > best_score) {
            best_score = score;
            best_idx   = i;
        }
    }

    // --- BƯỚC 4: Điền kết quả ---
    strncpy(result->label, CLASS_LABELS[best_idx], sizeof(result->label) - 1);
    result->label[sizeof(result->label) - 1] = '\0';
    result->confidence     = best_score;
    result->below_threshold = (best_score < CONFIDENCE_THRESHOLD);

    if (result->below_threshold) {
        strncpy(result->label, "unknown", sizeof(result->label) - 1);
    }

    Serial.printf("[TFLite] Kết quả: %s (%.2f%%)\n",
                  result->label, result->confidence * 100.0f);
    return true;
}


#pragma once
#include <Arduino.h>
#include "esp_camera.h"
#include "esp_heap_caps.h"
#include "img_converters.h"  // fmt2rgb888 - có sẵn trong ESP-IDF

// ===== BUFFER MANAGEMENT =====
static uint8_t* s_raw_rgb_buf   = nullptr;
static size_t   s_raw_rgb_size  = 0;
static uint8_t* s_resized_buf   = nullptr;  // 96*96*3 = 27648 bytes


static bool image_buffers_ensure(size_t raw_size) {
    const size_t resized_size = MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT * 3;

    // Buffer ảnh gốc (full resolution JPEG decoded)
    if (!s_raw_rgb_buf || s_raw_rgb_size < raw_size) {
        if (s_raw_rgb_buf) { free(s_raw_rgb_buf); s_raw_rgb_buf = nullptr; }

        s_raw_rgb_buf = psramFound()
            ? (uint8_t*)ps_malloc(raw_size)
            : (uint8_t*)malloc(raw_size);

        if (!s_raw_rgb_buf) {
            Serial.printf("[IMG] LỖI: Không cấp phát được %zu bytes cho raw buffer\n", raw_size);
            return false;
        }
        s_raw_rgb_size = raw_size;
    }

    // Buffer ảnh đã resize (cố định 96*96*3)
    if (!s_resized_buf) {
        s_resized_buf = psramFound()
            ? (uint8_t*)ps_malloc(resized_size)
            : (uint8_t*)malloc(resized_size);

        if (!s_resized_buf) {
            Serial.printf("[IMG] LỖI: Không cấp phát được %zu bytes cho resized buffer\n", resized_size);
            free(s_raw_rgb_buf);
            s_raw_rgb_buf = nullptr;
            return false;
        }
    }
    return true;
}


static void resize_rgb888_bilinear(
    const uint8_t* src, int src_w, int src_h,
    uint8_t*       dst, int dst_w, int dst_h)
{
    float x_ratio = (float)(src_w - 1) / (dst_w - 1);
    float y_ratio = (float)(src_h - 1) / (dst_h - 1);

    for (int dy = 0; dy < dst_h; dy++) {
        float fy = dy * y_ratio;
        int   y0 = (int)fy;
        int   y1 = (y0 + 1 < src_h) ? y0 + 1 : y0;
        float yw = fy - y0;

        for (int dx = 0; dx < dst_w; dx++) {
            float fx = dx * x_ratio;
            int   x0 = (int)fx;
            int   x1 = (x0 + 1 < src_w) ? x0 + 1 : x0;
            float xw = fx - x0;

            // Bilinear 4-point interpolation cho mỗi channel
            for (int c = 0; c < 3; c++) {
                float p00 = src[(y0 * src_w + x0) * 3 + c];
                float p10 = src[(y0 * src_w + x1) * 3 + c];
                float p01 = src[(y1 * src_w + x0) * 3 + c];
                float p11 = src[(y1 * src_w + x1) * 3 + c];

                float val = p00 * (1 - xw) * (1 - yw)
                          + p10 *      xw  * (1 - yw)
                          + p01 * (1 - xw) *      yw
                          + p11 *      xw  *      yw;

                dst[(dy * dst_w + dx) * 3 + c] = (uint8_t)(val + 0.5f);
            }
        }
    }
}

// Một số cấu hình có queue frame khiến kết quả bị trễ 1 nhịp.
// Nhả vài frame đầu để lấy ảnh mới nhất cho inference.
static camera_fb_t* camera_grab_fresh_fb() {
    const int frames_to_drop = 2;
    for (int i = 0; i < frames_to_drop; i++) {
        camera_fb_t* stale = esp_camera_fb_get();
        if (!stale) {
            break;
        }
        esp_camera_fb_return(stale);
        delay(25);
    }
    return esp_camera_fb_get();
}


bool camera_capture_and_resize(uint8_t** out_buf) {
    // 1. Chụp ảnh JPEG
    camera_fb_t* fb = camera_grab_fresh_fb();
    if (!fb) {
        Serial.println("[IMG] LỖI: esp_camera_fb_get() thất bại");
        return false;
    }

    Serial.printf("[IMG] Chụp ảnh: %dx%d, %zu bytes JPEG\n",
                  fb->width, fb->height, fb->len);

    uint32_t frame_w = fb->width;
    uint32_t frame_h = fb->height;
    uint32_t rgb_size = frame_w * frame_h * 3;

    // 2. Cấp phát buffer
    if (!image_buffers_ensure(rgb_size)) {
        esp_camera_fb_return(fb);
        return false;
    }

    // 3. Decode JPEG → RGB888
    bool ok = fmt2rgb888(fb->buf, fb->len, PIXFORMAT_JPEG, s_raw_rgb_buf);
    esp_camera_fb_return(fb);  // Giải phóng ngay sau decode

    if (!ok) {
        Serial.println("[IMG] LỖI: JPEG decode thất bại");
        return false;
    }

    // 4. Resize về 96x96
    resize_rgb888_bilinear(
        s_raw_rgb_buf, frame_w, frame_h,
        s_resized_buf, MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT
    );

    *out_buf = s_resized_buf;
    Serial.printf("[IMG] Resize xong: %dx%d → %dx%d\n",
                  frame_w, frame_h, MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT);
    return true;
}

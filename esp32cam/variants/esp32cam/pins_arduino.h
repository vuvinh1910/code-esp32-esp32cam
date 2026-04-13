#ifndef Pins_Arduino_h
#define Pins_Arduino_h

#include <stdint.h>

// Basic UART defaults
static const uint8_t TX = 1;
static const uint8_t RX = 3;

// Common bus defaults for ESP32-CAM style boards
static const uint8_t SDA = 21;
static const uint8_t SCL = 22;
static const uint8_t SS = 5;
static const uint8_t MOSI = 23;
static const uint8_t MISO = 19;
static const uint8_t SCK = 18;

// ESP32-CAM onboard flash LED is usually on GPIO4
static const uint8_t LED_BUILTIN = 4;
#define BUILTIN_LED LED_BUILTIN

// DAC channels
static const uint8_t DAC1 = 25;
static const uint8_t DAC2 = 26;

// ADC channels commonly available on ESP32
static const uint8_t A0 = 36;
static const uint8_t A3 = 39;
static const uint8_t A4 = 32;
static const uint8_t A5 = 33;
static const uint8_t A6 = 34;
static const uint8_t A7 = 35;

// Touch pins
static const uint8_t T0 = 4;
static const uint8_t T1 = 0;
static const uint8_t T2 = 2;
static const uint8_t T3 = 15;
static const uint8_t T4 = 13;
static const uint8_t T5 = 12;
static const uint8_t T6 = 14;
static const uint8_t T7 = 27;
static const uint8_t T8 = 33;
static const uint8_t T9 = 32;

#endif

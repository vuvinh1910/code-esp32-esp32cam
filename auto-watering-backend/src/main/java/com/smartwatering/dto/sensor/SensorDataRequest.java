package com.smartwatering.dto.sensor;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;

public class SensorDataRequest {

    // ESP32 sends deviceId as a string name like "esp32-pot-01", not a UUID
    @NotBlank
    private String deviceId;

    @JsonProperty("soil_moisture")
    private Double soilMoisture;

    @JsonProperty("temperature")
    private Double airTemperature;

    @JsonProperty("humidity")
    private Double airHumidity;

    @JsonProperty("water_level")
    private String waterLevel;

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public Double getSoilMoisture() { return soilMoisture; }
    public void setSoilMoisture(Double soilMoisture) { this.soilMoisture = soilMoisture; }
    public Double getAirTemperature() { return airTemperature; }
    public void setAirTemperature(Double airTemperature) { this.airTemperature = airTemperature; }
    public Double getAirHumidity() { return airHumidity; }
    public void setAirHumidity(Double airHumidity) { this.airHumidity = airHumidity; }
    public String getWaterLevel() { return waterLevel; }
    public void setWaterLevel(String waterLevel) { this.waterLevel = waterLevel; }
}

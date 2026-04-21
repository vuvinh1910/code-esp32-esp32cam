package com.smartwatering.dto.sensor;

import java.time.Instant;
import java.util.UUID;

public class SensorDataResponse {
    private Long id;
    private UUID deviceId;
    private Double soilMoisture;
    private Double airTemperature;
    private Double airHumidity;
    private Double lightLevel;
    private String waterLevel;
    private Instant recordedAt;

    public SensorDataResponse(Long id, UUID deviceId, Double soilMoisture, Double airTemperature, Double airHumidity, Double lightLevel, String waterLevel, Instant recordedAt) {
        this.id = id;
        this.deviceId = deviceId;
        this.soilMoisture = soilMoisture;
        this.airTemperature = airTemperature;
        this.airHumidity = airHumidity;
        this.lightLevel = lightLevel;
        this.waterLevel = waterLevel;
        this.recordedAt = recordedAt;
    }
    public Long getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public Double getSoilMoisture() { return soilMoisture; }
    public Double getAirTemperature() { return airTemperature; }
    public Double getAirHumidity() { return airHumidity; }
    public Double getLightLevel() { return lightLevel; }
    public String getWaterLevel() { return waterLevel; }
    public Instant getRecordedAt() { return recordedAt; }
}

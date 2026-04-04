package com.smartwatering.dto.config;

import java.util.UUID;

public class WateringConfigResponse {
    private UUID id;
    private UUID deviceId;
    private Double minSoilMoisture;
    private Double maxSoilMoisture;
    private Boolean overrideByWeather;

    public WateringConfigResponse(UUID id, UUID deviceId, Double minSoilMoisture, Double maxSoilMoisture, Boolean overrideByWeather) {
        this.id = id; this.deviceId = deviceId; this.minSoilMoisture = minSoilMoisture; this.maxSoilMoisture = maxSoilMoisture; this.overrideByWeather = overrideByWeather;
    }
    public UUID getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public Double getMinSoilMoisture() { return minSoilMoisture; }
    public Double getMaxSoilMoisture() { return maxSoilMoisture; }
    public Boolean getOverrideByWeather() { return overrideByWeather; }
}

package com.smartwatering.dto.config;

import java.util.UUID;

public class WateringConfigResponse {
    private UUID id;
    private UUID deviceId;
    private Double minSoilMoisture;
    private Double maxSoilMoisture;
    private Boolean overrideByWeather;
    private Boolean autoMode;

    public WateringConfigResponse(UUID id, UUID deviceId, Double minSoilMoisture, Double maxSoilMoisture, Boolean overrideByWeather, Boolean autoMode) {
        this.id = id;
        this.deviceId = deviceId;
        this.minSoilMoisture = minSoilMoisture;
        this.maxSoilMoisture = maxSoilMoisture;
        this.overrideByWeather = overrideByWeather;
        this.autoMode = autoMode;
    }
    public UUID getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public Double getMinSoilMoisture() { return minSoilMoisture; }
    public Double getMaxSoilMoisture() { return maxSoilMoisture; }
    public Boolean getOverrideByWeather() { return overrideByWeather; }
    public Boolean getAutoMode() { return autoMode; }
}

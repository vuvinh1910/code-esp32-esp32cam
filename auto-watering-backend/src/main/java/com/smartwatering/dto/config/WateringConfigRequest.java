package com.smartwatering.dto.config;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class WateringConfigRequest {
    @NotNull private UUID deviceId;
    @NotNull private Double minSoilMoisture;
    @NotNull private Double maxSoilMoisture;
    @NotNull private Boolean overrideByWeather;

    public UUID getDeviceId() { return deviceId; }
    public void setDeviceId(UUID deviceId) { this.deviceId = deviceId; }
    public Double getMinSoilMoisture() { return minSoilMoisture; }
    public void setMinSoilMoisture(Double minSoilMoisture) { this.minSoilMoisture = minSoilMoisture; }
    public Double getMaxSoilMoisture() { return maxSoilMoisture; }
    public void setMaxSoilMoisture(Double maxSoilMoisture) { this.maxSoilMoisture = maxSoilMoisture; }
    public Boolean getOverrideByWeather() { return overrideByWeather; }
    public void setOverrideByWeather(Boolean overrideByWeather) { this.overrideByWeather = overrideByWeather; }
}

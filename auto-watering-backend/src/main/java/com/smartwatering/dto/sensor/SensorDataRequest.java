package com.smartwatering.dto.sensor;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SensorDataRequest {
    @NotNull private UUID deviceId;
    private Double soilMoisture;
    private Double airTemperature;
    private Double airHumidity;
    private Double lightLevel;

    public UUID getDeviceId() { return deviceId; }
    public void setDeviceId(UUID deviceId) { this.deviceId = deviceId; }
    public Double getSoilMoisture() { return soilMoisture; }
    public void setSoilMoisture(Double soilMoisture) { this.soilMoisture = soilMoisture; }
    public Double getAirTemperature() { return airTemperature; }
    public void setAirTemperature(Double airTemperature) { this.airTemperature = airTemperature; }
    public Double getAirHumidity() { return airHumidity; }
    public void setAirHumidity(Double airHumidity) { this.airHumidity = airHumidity; }
    public Double getLightLevel() { return lightLevel; }
    public void setLightLevel(Double lightLevel) { this.lightLevel = lightLevel; }
}

package com.smartwatering.dto.status;

import com.fasterxml.jackson.annotation.JsonProperty;

public class StatusResponse {

    @JsonProperty("pump_status")
    private boolean pumpStatus;

    @JsonProperty("auto_mode")
    private boolean autoMode;

    @JsonProperty("humidity_threshold")
    private Double humidityThreshold;

    @JsonProperty("current_humidity")
    private Double currentHumidity;

    @JsonProperty("air_temperature")
    private Double airTemperature;

    @JsonProperty("air_humidity")
    private Double airHumidity;

    @JsonProperty("light_level")
    private Double lightLevel;

    public StatusResponse(boolean pumpStatus, boolean autoMode, Double humidityThreshold,
                          Double currentHumidity, Double airTemperature, Double airHumidity, Double lightLevel) {
        this.pumpStatus = pumpStatus;
        this.autoMode = autoMode;
        this.humidityThreshold = humidityThreshold;
        this.currentHumidity = currentHumidity;
        this.airTemperature = airTemperature;
        this.airHumidity = airHumidity;
        this.lightLevel = lightLevel;
    }

    public boolean isPumpStatus() { return pumpStatus; }
    public void setPumpStatus(boolean pumpStatus) { this.pumpStatus = pumpStatus; }
    public boolean isAutoMode() { return autoMode; }
    public void setAutoMode(boolean autoMode) { this.autoMode = autoMode; }
    public Double getHumidityThreshold() { return humidityThreshold; }
    public void setHumidityThreshold(Double humidityThreshold) { this.humidityThreshold = humidityThreshold; }
    public Double getCurrentHumidity() { return currentHumidity; }
    public void setCurrentHumidity(Double currentHumidity) { this.currentHumidity = currentHumidity; }
    public Double getAirTemperature() { return airTemperature; }
    public void setAirTemperature(Double airTemperature) { this.airTemperature = airTemperature; }
    public Double getAirHumidity() { return airHumidity; }
    public void setAirHumidity(Double airHumidity) { this.airHumidity = airHumidity; }
    public Double getLightLevel() { return lightLevel; }
    public void setLightLevel(Double lightLevel) { this.lightLevel = lightLevel; }
}

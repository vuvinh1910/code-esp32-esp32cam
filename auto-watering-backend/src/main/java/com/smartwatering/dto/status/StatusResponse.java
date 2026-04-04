package com.smartwatering.dto.status;

public class StatusResponse {
    private boolean pumpStatus;
    private boolean autoMode;
    private Double humidityThreshold;
    private Double currentHumidity;
    private Double airTemperature;
    private Double airHumidity;
    private Double lightLevel;

    public StatusResponse(boolean pumpStatus, boolean autoMode, Double humidityThreshold, Double currentHumidity, Double airTemperature, Double airHumidity, Double lightLevel) {
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

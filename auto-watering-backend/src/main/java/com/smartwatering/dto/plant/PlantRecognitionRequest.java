package com.smartwatering.dto.plant;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class PlantRecognitionRequest {
    @NotNull private UUID deviceId;
    @NotNull private String plantName;
    private String confidence;
    private String recommendedWatering;

    public UUID getDeviceId() { return deviceId; }
    public void setDeviceId(UUID deviceId) { this.deviceId = deviceId; }
    public String getPlantName() { return plantName; }
    public void setPlantName(String plantName) { this.plantName = plantName; }
    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }
    public String getRecommendedWatering() { return recommendedWatering; }
    public void setRecommendedWatering(String recommendedWatering) { this.recommendedWatering = recommendedWatering; }
}

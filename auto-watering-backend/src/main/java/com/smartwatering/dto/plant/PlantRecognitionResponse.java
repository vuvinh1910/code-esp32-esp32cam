package com.smartwatering.dto.plant;

import java.time.Instant;
import java.util.UUID;

public class PlantRecognitionResponse {
    private UUID id;
    private UUID deviceId;
    private String plantName;
    private String confidence;
    private String recommendedWatering;
    private Instant capturedAt;

    public PlantRecognitionResponse(UUID id, UUID deviceId, String plantName, String confidence, String recommendedWatering, Instant capturedAt) {
        this.id = id; this.deviceId = deviceId; this.plantName = plantName; this.confidence = confidence; this.recommendedWatering = recommendedWatering; this.capturedAt = capturedAt;
    }
    public UUID getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public String getPlantName() { return plantName; }
    public String getConfidence() { return confidence; }
    public String getRecommendedWatering() { return recommendedWatering; }
    public Instant getCapturedAt() { return capturedAt; }
}

package com.smartwatering.dto.plant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class PlantRecognitionResponse {
    private UUID id;
    private UUID deviceId;
    private String plantName;
    private double confidence;
    private double recommendedWatering;
    private Instant capturedAt;
}

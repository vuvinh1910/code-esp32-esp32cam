package com.smartwatering.dto.plant;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class PlantRecognitionRequest {
    @NotNull private UUID deviceId;
    @NotNull private String plantName;
    private double confidence;
    private double recommendedWatering;

}

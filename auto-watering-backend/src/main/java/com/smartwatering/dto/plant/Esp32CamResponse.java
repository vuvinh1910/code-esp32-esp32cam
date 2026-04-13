package com.smartwatering.dto.plant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class Esp32CamResponse {
    private String plant;
    private float confidence;
    private boolean below_threshold;
}

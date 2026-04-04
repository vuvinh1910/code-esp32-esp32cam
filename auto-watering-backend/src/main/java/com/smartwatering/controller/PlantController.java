package com.smartwatering.controller;

import com.smartwatering.dto.plant.PlantRecognitionRequest;
import com.smartwatering.dto.plant.PlantRecognitionResponse;
import com.smartwatering.service.PlantRecognitionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plants")
public class PlantController {
    private final PlantRecognitionService plantRecognitionService;

    public PlantController(PlantRecognitionService plantRecognitionService) { this.plantRecognitionService = plantRecognitionService; }

    @PostMapping("/recognition")
    public ResponseEntity<PlantRecognitionResponse> save(@Valid @RequestBody PlantRecognitionRequest request) {
        return ResponseEntity.ok(plantRecognitionService.save(request));
    }
}

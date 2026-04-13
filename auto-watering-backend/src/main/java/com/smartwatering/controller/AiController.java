package com.smartwatering.controller;

import com.smartwatering.dto.plant.Esp32CamResponse;
import com.smartwatering.dto.plant.PlantRecognitionRequest;
import com.smartwatering.service.AiService;
import com.smartwatering.service.PlantRecognitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final PlantRecognitionService plantRecognitionService;

    // Constructor Injection: Spring Boot sẽ tự động truyền các Service vào đây
    public AiController(AiService aiService, PlantRecognitionService plantRecognitionService) {
        this.aiService = aiService;
        this.plantRecognitionService = plantRecognitionService;
    }

    @PostMapping("/trigger")
    public ResponseEntity<?> triggerAiRecognition(
            @RequestParam UUID deviceId,
            @RequestParam String espIpAddress) {

        // 1. Gọi AiService để backend ra lệnh cho ESP32
        Esp32CamResponse espResponse = aiService.triggerRecognitionOnDevice(espIpAddress);

        // 2. Lưu kết quả vào Database
        PlantRecognitionRequest saveRequest = new PlantRecognitionRequest();
        saveRequest.setDeviceId(deviceId);
        saveRequest.setPlantName(espResponse.getPlant());
        saveRequest.setConfidence((double) espResponse.getConfidence());

        saveRequest.setRecommendedWatering(espResponse.getPlant().equals("unknown") ? 0.0 : 200.0);

        plantRecognitionService.save(saveRequest);

        // 3. Trả kết quả về Postman/Frontend
        return ResponseEntity.ok(espResponse);
    }
}
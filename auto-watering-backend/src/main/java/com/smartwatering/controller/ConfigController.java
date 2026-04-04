package com.smartwatering.controller;

import com.smartwatering.dto.config.WateringConfigRequest;
import com.smartwatering.dto.config.WateringConfigResponse;
import com.smartwatering.service.ConfigService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/configs")
public class ConfigController {
    private final ConfigService configService;

    public ConfigController(ConfigService configService) { this.configService = configService; }

    @PostMapping
    public ResponseEntity<WateringConfigResponse> upsert(@Valid @RequestBody WateringConfigRequest request) {
        return ResponseEntity.ok(configService.upsert(request));
    }

    @GetMapping("/{deviceId}")
    public ResponseEntity<WateringConfigResponse> get(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(configService.getByDevice(deviceId));
    }
}

package com.smartwatering.controller;

import com.smartwatering.dto.sensor.SensorDataRequest;
import com.smartwatering.dto.sensor.SensorDataResponse;
import com.smartwatering.service.SensorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/sensors")
public class SensorController {
    private final SensorService sensorService;

    public SensorController(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @PostMapping
    public ResponseEntity<SensorDataResponse> ingest(@Valid @RequestBody SensorDataRequest request) {
        return ResponseEntity.ok(sensorService.save(request));
    }

    @GetMapping
    public ResponseEntity<Page<SensorDataResponse>> byDevice(
            @RequestParam UUID deviceId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(sensorService.getByDevice(deviceId, from, to, page, size));
    }
}

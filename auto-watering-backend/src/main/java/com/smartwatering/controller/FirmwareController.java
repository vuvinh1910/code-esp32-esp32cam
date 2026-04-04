package com.smartwatering.controller;

import com.smartwatering.dto.firmware.FirmwareRequest;
import com.smartwatering.dto.firmware.FirmwareResponse;
import com.smartwatering.domain.enums.DeviceType;
import com.smartwatering.service.FirmwareService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/firmware")
public class FirmwareController {
    private final FirmwareService firmwareService;

    public FirmwareController(FirmwareService firmwareService) { this.firmwareService = firmwareService; }

    @PostMapping
    public ResponseEntity<FirmwareResponse> create(@Valid @RequestBody FirmwareRequest request) {
        return ResponseEntity.ok(firmwareService.create(request));
    }

    @GetMapping("/latest")
    public ResponseEntity<FirmwareResponse> latest(@RequestParam DeviceType deviceType) {
        return ResponseEntity.ok(firmwareService.latest(deviceType));
    }

    @GetMapping("/{version}")
    public ResponseEntity<FirmwareResponse> byVersion(@PathVariable String version) {
        return ResponseEntity.ok(firmwareService.findByVersion(version));
    }
}

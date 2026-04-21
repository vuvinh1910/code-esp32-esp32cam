package com.smartwatering.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartwatering.dto.command.DeviceCommandResponse;
import com.smartwatering.dto.pump.PumpActionResponse;
import com.smartwatering.dto.pump.PumpLogResponse;
import com.smartwatering.dto.pump.PumpRequest;
import com.smartwatering.dto.status.StatusResponse;
import com.smartwatering.service.PumpService;
import com.smartwatering.service.StatusService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pump")
public class PumpController {

    private final PumpService pumpService;
    private final StatusService statusService;

    public PumpController(PumpService pumpService, StatusService statusService) {
        this.pumpService = pumpService;
        this.statusService = statusService;
    }

    @PostMapping
    public ResponseEntity<PumpActionResponse> manual(@Valid @RequestBody PumpRequest request) {
        return ResponseEntity.ok(pumpService.manual(request.getDeviceId(), request.getAction()));
    }

    @GetMapping("/history/{deviceId}")
    public ResponseEntity<List<PumpLogResponse>> history(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(pumpService.history(deviceId));
    }

    @GetMapping("/command/{deviceId}/pending")
    public ResponseEntity<DeviceCommandResponse> pending(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(pumpService.getLatestPendingCommand(deviceId));
    }

    @PostMapping("/command/{commandId}/ack")
    public ResponseEntity<Void> ack(@PathVariable Long commandId) {
        pumpService.acknowledgeCommand(commandId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/pump/control/{deviceId}
     * ESP32 polls every 1 second with X-API-KEY header.
     * Returns pump_status, auto_mode, humidity_threshold for the given device.
     */
    @GetMapping("/control/{deviceId}")
    public ResponseEntity<StatusResponse> control(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(statusService.getStatus(deviceId));
    }
}

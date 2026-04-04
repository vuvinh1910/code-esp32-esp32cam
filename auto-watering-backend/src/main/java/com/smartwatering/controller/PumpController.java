package com.smartwatering.controller;

import com.smartwatering.dto.command.DeviceCommandResponse;
import com.smartwatering.dto.pump.PumpActionResponse;
import com.smartwatering.dto.pump.PumpLogResponse;
import com.smartwatering.dto.pump.PumpRequest;
import com.smartwatering.service.PumpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pump")
public class PumpController {
    private final PumpService pumpService;

    public PumpController(PumpService pumpService) { this.pumpService = pumpService; }

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
}

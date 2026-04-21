package com.smartwatering.controller;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartwatering.dto.pump.PumpLogResponse;
import com.smartwatering.dto.sensor.SensorDataResponse;
import com.smartwatering.dto.status.StatusResponse;
import com.smartwatering.repository.DeviceRepository;
import com.smartwatering.service.PumpService;
import com.smartwatering.service.SensorService;
import com.smartwatering.service.StatusService;

@RestController
@RequestMapping("/api")
public class StatusController {
    private final StatusService statusService;
    private final SensorService sensorService;
    private final PumpService pumpService;
    private final DeviceRepository deviceRepository;

    public StatusController(StatusService statusService, SensorService sensorService,
                           PumpService pumpService, DeviceRepository deviceRepository) {
        this.statusService = statusService;
        this.sensorService = sensorService;
        this.pumpService = pumpService;
        this.deviceRepository = deviceRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<StatusResponse> getStatus(@RequestParam(required = false) UUID deviceId) {
        return ResponseEntity.ok(statusService.getStatus(deviceId));
    }

    /**
     * GET /api/pump-control
     * ESP32 polls every 1 second with optional deviceId string (e.g. "esp32-pot-01").
     * Authorization: Bearer esp32
     */
    @GetMapping("/pump-control")
    public ResponseEntity<StatusResponse> pumpControl(@RequestParam(required = false) String deviceId) {
        UUID resolvedId = null;
        if (deviceId != null) {
            resolvedId = deviceRepository.findByName(deviceId)
                    .or(() -> deviceRepository.findByMacAddress(deviceId))
                    .map(d -> d.getId())
                    .orElse(null);
        }
        return ResponseEntity.ok(statusService.getStatus(resolvedId));
    }

    @GetMapping("/readings")
    public ResponseEntity<Page<SensorDataResponse>> getReadings(
            @RequestParam(required = false) UUID deviceId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // If deviceId is not provided, use first device
        if (deviceId == null) {
            deviceId = deviceRepository.findAll().stream().findFirst()
                    .map(device -> device.getId())
                    .orElse(null);
        }
        if (deviceId == null) {
            return ResponseEntity.ok(Page.empty());
        }
        return ResponseEntity.ok(sensorService.getByDevice(deviceId, from, to, page, size));
    }

    @GetMapping("/pump-history")
    public ResponseEntity<List<PumpLogResponse>> getPumpHistory(
            @RequestParam(required = false) UUID deviceId) {
        // If deviceId is not provided, use first device
        if (deviceId == null) {
            deviceId = deviceRepository.findAll().stream().findFirst()
                    .map(device -> device.getId())
                    .orElse(null);
        }
        if (deviceId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(pumpService.history(deviceId));
    }
}

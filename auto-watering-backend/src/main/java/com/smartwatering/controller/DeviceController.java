package com.smartwatering.controller;

import com.smartwatering.dto.device.DeviceRequest;
import com.smartwatering.dto.device.DeviceResponse;
import com.smartwatering.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {
    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) { this.deviceService = deviceService; }

    @GetMapping
    public ResponseEntity<List<DeviceResponse>> all() { return ResponseEntity.ok(deviceService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<DeviceResponse> get(@PathVariable UUID id) { return ResponseEntity.ok(deviceService.get(id)); }

    @PostMapping
    public ResponseEntity<DeviceResponse> create(@Valid @RequestBody DeviceRequest request) { return ResponseEntity.ok(deviceService.create(request)); }

    @PutMapping("/{id}")
    public ResponseEntity<DeviceResponse> update(@PathVariable UUID id, @Valid @RequestBody DeviceRequest request) { return ResponseEntity.ok(deviceService.update(id, request)); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) { deviceService.delete(id); return ResponseEntity.noContent().build(); }
}

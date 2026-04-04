package com.smartwatering.controller;

import com.smartwatering.dto.device.DeviceResponse;
import com.smartwatering.service.DeviceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final DeviceService deviceService;

    public AdminController(DeviceService deviceService) { this.deviceService = deviceService; }

    @GetMapping("/devices")
    public ResponseEntity<List<DeviceResponse>> devices() {
        return ResponseEntity.ok(deviceService.findAll());
    }
}

package com.smartwatering.controller;

import com.smartwatering.dto.device.DeviceResponse;
import com.smartwatering.service.DeviceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartwatering.dto.user.UserResponse;
import com.smartwatering.repository.AppUserRepository;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final DeviceService deviceService;
    private final AppUserRepository userRepository;

    public AdminController(DeviceService deviceService, AppUserRepository userRepository) { 
        this.deviceService = deviceService; 
        this.userRepository = userRepository;
    }

    @GetMapping("/devices")
    public ResponseEntity<List<DeviceResponse>> devices() {
        return ResponseEntity.ok(deviceService.findAll());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> users() {
        List<UserResponse> list = userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole(), "Active", "Just now"))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable java.util.UUID id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

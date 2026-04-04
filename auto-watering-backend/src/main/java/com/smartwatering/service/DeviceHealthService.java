package com.smartwatering.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class DeviceHealthService {
    private final DeviceService deviceService;

    public DeviceHealthService(DeviceService deviceService) { this.deviceService = deviceService; }

    @Scheduled(fixedRate = 60000)
    public void markOfflineDevices() {
        deviceService.markOfflineIfStale(Instant.now().minusSeconds(300));
    }
}

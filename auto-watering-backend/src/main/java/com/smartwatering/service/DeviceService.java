package com.smartwatering.service;

import com.smartwatering.domain.entity.AppUser;
import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.entity.WateringConfig;
import com.smartwatering.domain.enums.DeviceStatus;
import com.smartwatering.domain.enums.DeviceType;
import com.smartwatering.dto.device.DeviceRequest;
import com.smartwatering.dto.device.DeviceResponse;
import com.smartwatering.exception.NotFoundException;
import com.smartwatering.repository.AppUserRepository;
import com.smartwatering.repository.DeviceRepository;
import com.smartwatering.repository.WateringConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class DeviceService {
    private final DeviceRepository deviceRepository;
    private final AppUserRepository userRepository;
    private final WateringConfigRepository configRepository;

    public DeviceService(DeviceRepository deviceRepository, AppUserRepository userRepository, WateringConfigRepository configRepository) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.configRepository = configRepository;
    }

    @Transactional
    public DeviceResponse create(DeviceRequest request) {
        Device device = new Device();
        applyRequest(device, request);
        device = deviceRepository.save(device);
        createDefaultConfigIfMissing(device);
        return toResponse(device);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<DeviceResponse> findAll() {
        return deviceRepository.findAll().stream().map(this::toResponse).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<DeviceResponse> findByUser(UUID userId) {
        return deviceRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DeviceResponse get(UUID id) {
        return toResponse(deviceRepository.findById(id).orElseThrow(() -> new NotFoundException("Device not found")));
    }

    @Transactional
    public DeviceResponse update(UUID id, DeviceRequest request) {
        Device device = deviceRepository.findById(id).orElseThrow(() -> new NotFoundException("Device not found"));
        applyRequest(device, request);
        return toResponse(deviceRepository.save(device));
    }

    @Transactional
    public void delete(UUID id) {
        if (!deviceRepository.existsById(id)) throw new NotFoundException("Device not found");
        deviceRepository.deleteById(id);
    }

    public void markOnline(UUID id) {
        Device device = deviceRepository.findById(id).orElseThrow(() -> new NotFoundException("Device not found"));
        device.setStatus(DeviceStatus.ONLINE);
        device.setLastSeenAt(Instant.now());
        deviceRepository.save(device);
    }

    public void markOfflineIfStale(Instant threshold) {
        deviceRepository.findAll().forEach(device -> {
            if (device.getLastSeenAt() == null || device.getLastSeenAt().isBefore(threshold)) {
                device.setStatus(DeviceStatus.OFFLINE);
                deviceRepository.save(device);
            }
        });
    }

    private void applyRequest(Device device, DeviceRequest request) {
        device.setMacAddress(request.getMacAddress());
        device.setEspIpAddress(request.getEspIpAddress());
        device.setName(request.getName());
        device.setDeviceType(request.getDeviceType());
        if (request.getUserId() != null) {
            AppUser user = userRepository.findById(request.getUserId()).orElseThrow(() -> new NotFoundException("User not found"));
            device.setUser(user);
        }
    }

    private void createDefaultConfigIfMissing(Device device) {
        configRepository.findByDeviceId(device.getId()).orElseGet(() -> {
            WateringConfig config = new WateringConfig();
            config.setDevice(device);
            return configRepository.save(config);
        });
    }

    private DeviceResponse toResponse(Device device) {
        DeviceResponse response = new DeviceResponse(
                device.getId(),
                device.getUser() != null ? device.getUser().getId() : null,
                device.getMacAddress(),
                device.getName(),
                device.getDeviceType(),
                device.getStatus(),
                device.getCurrentFirmwareVersion(),
                device.getLastSeenAt()
        );

        // Set frontend-compatible fields
        response.setDeviceId(device.getMacAddress());
        response.setEspIpAddress(device.getEspIpAddress());
        response.setLocation(device.getLocation());
        response.setStatusString(device.getStatus() == DeviceStatus.ONLINE ? "active" : "inactive");
        response.setCreatedAt(device.getCreatedAt() != null ? device.getCreatedAt().toString() : null);

        return response;
    }
}

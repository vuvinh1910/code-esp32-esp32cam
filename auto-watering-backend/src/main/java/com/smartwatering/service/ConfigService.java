package com.smartwatering.service;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.entity.WateringConfig;
import com.smartwatering.dto.config.WateringConfigRequest;
import com.smartwatering.dto.config.WateringConfigResponse;
import com.smartwatering.exception.NotFoundException;
import com.smartwatering.repository.DeviceRepository;
import com.smartwatering.repository.WateringConfigRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ConfigService {
    private final WateringConfigRepository configRepository;
    private final DeviceRepository deviceRepository;

    public ConfigService(WateringConfigRepository configRepository, DeviceRepository deviceRepository) {
        this.configRepository = configRepository;
        this.deviceRepository = deviceRepository;
    }

    public WateringConfigResponse upsert(WateringConfigRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId()).orElseThrow(() -> new NotFoundException("Device not found"));
        WateringConfig config = configRepository.findByDeviceId(request.getDeviceId()).orElseGet(WateringConfig::new);
        config.setDevice(device);
        config.setMinSoilMoisture(request.getMinSoilMoisture());
        config.setMaxSoilMoisture(request.getMaxSoilMoisture());
        config.setOverrideByWeather(request.getOverrideByWeather());
        config.setAutoMode(request.getAutoMode());
        config = configRepository.save(config);
        return toResponse(config);
    }

    public WateringConfigResponse getByDevice(UUID deviceId) {
        return toResponse(configRepository.findByDeviceId(deviceId).orElseThrow(() -> new NotFoundException("Config not found")));
    }

    private WateringConfigResponse toResponse(WateringConfig config) {
        return new WateringConfigResponse(
                config.getId(),
                config.getDevice().getId(),
                config.getMinSoilMoisture(),
                config.getMaxSoilMoisture(),
                config.getOverrideByWeather(),
                config.getAutoMode()
        );
    }
}

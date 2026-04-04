package com.smartwatering.service;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.entity.SensorData;
import com.smartwatering.dto.sensor.SensorDataRequest;
import com.smartwatering.dto.sensor.SensorDataResponse;
import com.smartwatering.exception.NotFoundException;
import com.smartwatering.repository.DeviceRepository;
import com.smartwatering.repository.SensorDataRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class SensorService {
    private final SensorDataRepository sensorRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceService deviceService;
    private final PumpService pumpService;

    public SensorService(SensorDataRepository sensorRepository, DeviceRepository deviceRepository, DeviceService deviceService, PumpService pumpService) {
        this.sensorRepository = sensorRepository;
        this.deviceRepository = deviceRepository;
        this.deviceService = deviceService;
        this.pumpService = pumpService;
    }

    @Transactional
    public SensorDataResponse save(SensorDataRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId()).orElseThrow(() -> new NotFoundException("Device not found"));
        device.setLastSeenAt(Instant.now());
        deviceService.markOnline(device.getId());

        SensorData data = new SensorData();
        data.setDevice(device);
        data.setSoilMoisture(request.getSoilMoisture());
        data.setAirTemperature(request.getAirTemperature());
        data.setAirHumidity(request.getAirHumidity());
        data.setLightLevel(request.getLightLevel());
        data = sensorRepository.save(data);

        pumpService.autoEvaluate(device.getId(), request.getSoilMoisture());
        return toResponse(data);
    }

    public Page<SensorDataResponse> getByDevice(UUID deviceId, Instant from, Instant to, int page, int size) {
        Page<SensorData> result = (from != null && to != null)
                ? sensorRepository.findByDeviceIdAndRecordedAtBetween(deviceId, from, to, PageRequest.of(page, size))
                : sensorRepository.findByDeviceId(deviceId, PageRequest.of(page, size));
        return result.map(this::toResponse);
    }

    private SensorDataResponse toResponse(SensorData data) {
        return new SensorDataResponse(data.getId(), data.getDevice().getId(), data.getSoilMoisture(), data.getAirTemperature(), data.getAirHumidity(), data.getLightLevel(), data.getRecordedAt());
    }
}

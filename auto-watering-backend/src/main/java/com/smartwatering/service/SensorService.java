package com.smartwatering.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.entity.SensorData;
import com.smartwatering.domain.entity.WateringConfig;
import com.smartwatering.domain.enums.DeviceStatus;
import com.smartwatering.domain.enums.DeviceType;
import com.smartwatering.dto.sensor.SensorDataRequest;
import com.smartwatering.dto.sensor.SensorDataResponse;
import com.smartwatering.repository.DeviceRepository;
import com.smartwatering.repository.SensorDataRepository;
import com.smartwatering.repository.WateringConfigRepository;

@Service
public class SensorService {
    private final SensorDataRepository sensorRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceService deviceService;
    private final PumpService pumpService;
    private final WateringConfigRepository configRepository;

    public SensorService(SensorDataRepository sensorRepository, DeviceRepository deviceRepository, DeviceService deviceService, PumpService pumpService, WateringConfigRepository configRepository) {
        this.sensorRepository = sensorRepository;
        this.deviceRepository = deviceRepository;
        this.deviceService = deviceService;
        this.pumpService = pumpService;
        this.configRepository = configRepository;
    }

    @Transactional
    public SensorDataResponse save(SensorDataRequest request) {
        // deviceId from ESP is a string name (e.g. "esp32-pot-01"), look up by name first,
        // then fall back to macAddress, then fall back to first device in DB
        Device device = deviceRepository.findByName(request.getDeviceId())
                .or(() -> deviceRepository.findByMacAddress(request.getDeviceId()))
                .orElseGet(() -> autoRegisterDevice(request.getDeviceId()));

        device.setLastSeenAt(Instant.now());
        deviceService.markOnline(device.getId());

        SensorData data = new SensorData();
        data.setDevice(device);
        data.setSoilMoisture(request.getSoilMoisture());
        data.setAirTemperature(request.getAirTemperature());
        data.setAirHumidity(request.getAirHumidity());
        data.setLightLevel(null); // ESP32 does not send light level
        data.setWaterLevel(request.getWaterLevel());
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
        return new SensorDataResponse(
                data.getId(),
                data.getDevice().getId(),
                data.getSoilMoisture(),
                data.getAirTemperature(),
                data.getAirHumidity(),
                data.getLightLevel(),
                data.getWaterLevel(),
                data.getRecordedAt()
        );
    }

    private Device autoRegisterDevice(String deviceName) {
        Device device = new Device();
        device.setName(deviceName);
        device.setMacAddress(deviceName); // dùng tạm name làm macAddress
        device.setDeviceType(DeviceType.CONTROL_NODE);
        device.setStatus(DeviceStatus.ONLINE);
        device.setLastSeenAt(Instant.now());
        device = deviceRepository.save(device);

        // tạo default watering config
        WateringConfig config = new WateringConfig();
        config.setDevice(device);
        configRepository.save(config);

        return device;
    }
}

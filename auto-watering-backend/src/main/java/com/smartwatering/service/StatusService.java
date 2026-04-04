package com.smartwatering.service;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.entity.DeviceCommand;
import com.smartwatering.domain.entity.SensorData;
import com.smartwatering.domain.entity.WateringConfig;
import com.smartwatering.domain.enums.CommandType;
import com.smartwatering.domain.enums.PumpAction;
import com.smartwatering.dto.status.StatusResponse;
import com.smartwatering.repository.DeviceCommandRepository;
import com.smartwatering.repository.DeviceRepository;
import com.smartwatering.repository.SensorDataRepository;
import com.smartwatering.repository.WateringConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class StatusService {
    private final DeviceRepository deviceRepository;
    private final DeviceCommandRepository commandRepository;
    private final SensorDataRepository sensorDataRepository;
    private final WateringConfigRepository configRepository;

    public StatusService(DeviceRepository deviceRepository, DeviceCommandRepository commandRepository,
                        SensorDataRepository sensorDataRepository, WateringConfigRepository configRepository) {
        this.deviceRepository = deviceRepository;
        this.commandRepository = commandRepository;
        this.sensorDataRepository = sensorDataRepository;
        this.configRepository = configRepository;
    }

    @Transactional(readOnly = true)
    public StatusResponse getStatus(UUID deviceId) {
        Optional<Device> deviceOpt = deviceId != null
                ? deviceRepository.findById(deviceId)
                : deviceRepository.findAll().stream().findFirst();

        if (deviceOpt.isEmpty()) {
            return new StatusResponse(false, false, null, null, null, null, null);
        }

        Device device = deviceOpt.get();

        // Get pump status from latest command
        boolean pumpStatus = false;
        Optional<DeviceCommand> latestCommand = commandRepository.findTopByDeviceIdAndCommandTypeOrderByCreatedAtDesc(
                device.getId(), CommandType.PUMP);
        if (latestCommand.isPresent()) {
            pumpStatus = latestCommand.get().getAction() == PumpAction.TURN_ON;
        }

        // Get watering config
        Optional<WateringConfig> configOpt = configRepository.findByDeviceId(device.getId());
        boolean autoMode = configOpt.isPresent();
        Double humidityThreshold = configOpt.map(WateringConfig::getMinSoilMoisture).orElse(null);

        // Get current humidity from latest sensor data
        Double currentHumidity = null;
        Double airTemperature = null;
        Double airHumidity = null;
        Double lightLevel = null;
        Optional<SensorData> latestSensor = sensorDataRepository.findTopByDeviceIdOrderByRecordedAtDesc(device.getId());
        if (latestSensor.isPresent()) {
            SensorData data = latestSensor.get();
            currentHumidity = data.getSoilMoisture();
            airTemperature = data.getAirTemperature();
            airHumidity = data.getAirHumidity();
            lightLevel = data.getLightLevel();
        }

        return new StatusResponse(pumpStatus, autoMode, humidityThreshold, currentHumidity, airTemperature, airHumidity, lightLevel);
    }
}

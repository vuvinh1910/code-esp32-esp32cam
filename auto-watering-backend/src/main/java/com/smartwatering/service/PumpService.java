package com.smartwatering.service;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.entity.DeviceCommand;
import com.smartwatering.domain.entity.PumpActionLog;
import com.smartwatering.domain.entity.WateringConfig;
import com.smartwatering.domain.enums.CommandStatus;
import com.smartwatering.domain.enums.CommandType;
import com.smartwatering.domain.enums.PumpAction;
import com.smartwatering.domain.enums.TriggerSource;
import com.smartwatering.dto.command.DeviceCommandResponse;
import com.smartwatering.dto.pump.PumpActionResponse;
import com.smartwatering.dto.pump.PumpLogResponse;
import com.smartwatering.exception.NotFoundException;
import com.smartwatering.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PumpService {
    private final DeviceRepository deviceRepository;
    private final WateringConfigRepository configRepository;
    private final PumpActionLogRepository logRepository;
    private final DeviceCommandRepository commandRepository;

    public PumpService(DeviceRepository deviceRepository, WateringConfigRepository configRepository, PumpActionLogRepository logRepository, DeviceCommandRepository commandRepository) {
        this.deviceRepository = deviceRepository;
        this.configRepository = configRepository;
        this.logRepository = logRepository;
        this.commandRepository = commandRepository;
    }

    @Transactional
    public PumpActionResponse manual(UUID deviceId, PumpAction action) {
        return createAction(deviceId, action, TriggerSource.MANUAL_APP);
    }

    @Transactional
    public PumpActionResponse autoEvaluate(UUID deviceId, Double soilMoisture) {
        WateringConfig config = configRepository.findByDeviceId(deviceId).orElseThrow(() -> new NotFoundException("Config not found"));
        if (soilMoisture == null) return null;
        if (soilMoisture < config.getMinSoilMoisture()) {
            return createAction(deviceId, PumpAction.TURN_ON, TriggerSource.AUTO_SOIL);
        }
        if (soilMoisture > config.getMaxSoilMoisture()) {
            return createAction(deviceId, PumpAction.TURN_OFF, TriggerSource.AUTO_SOIL);
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<PumpLogResponse> history(UUID deviceId) {
        return logRepository.findTop20ByDeviceIdOrderByTimestampDesc(deviceId)
                .stream()
                .map(l -> new PumpLogResponse(l.getId(), l.getDevice().getId(), l.getAction(), l.getTriggeredBy(), l.getTimestamp()))
                .toList();
    }

    private PumpActionResponse createAction(UUID deviceId, PumpAction action, TriggerSource source) {
        Device device = deviceRepository.findById(deviceId).orElseThrow(() -> new NotFoundException("Device not found"));
        PumpActionLog log = new PumpActionLog();
        log.setDevice(device);
        log.setAction(action);
        log.setTriggeredBy(source);
        log = logRepository.save(log);

        DeviceCommand command = new DeviceCommand();
        command.setDevice(device);
        command.setCommandType(CommandType.PUMP);
        command.setAction(action);
        command.setStatus(CommandStatus.PENDING);
        command = commandRepository.save(command);

        return new PumpActionResponse(log.getId(), log.getAction(), log.getTriggeredBy(), log.getTimestamp(), command.getId());
    }

    @Transactional(readOnly = true)
    public DeviceCommandResponse getLatestPendingCommand(UUID deviceId) {
        return commandRepository.findTop10ByStatusOrderByCreatedAtDesc(CommandStatus.PENDING)
                .stream()
                .filter(c -> c.getDevice().getId().equals(deviceId))
                .findFirst()
                .map(c -> new DeviceCommandResponse(c.getId(), c.getDevice().getId(), c.getCommandType(), c.getAction(), c.getStatus(), c.getCreatedAt(), c.getExecutedAt()))
                .orElse(null);
    }

    @Transactional
    public void acknowledgeCommand(Long commandId) {
        DeviceCommand command = commandRepository.findById(commandId).orElseThrow(() -> new NotFoundException("Command not found"));
        command.setStatus(CommandStatus.ACKNOWLEDGED);
        command.setExecutedAt(Instant.now());
        commandRepository.save(command);
    }
}

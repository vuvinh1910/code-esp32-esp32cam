package com.smartwatering.dto.command;

import com.smartwatering.domain.enums.CommandStatus;
import com.smartwatering.domain.enums.CommandType;
import com.smartwatering.domain.enums.PumpAction;
import java.time.Instant;
import java.util.UUID;

public class DeviceCommandResponse {
    private Long id;
    private UUID deviceId;
    private CommandType commandType;
    private PumpAction action;
    private CommandStatus status;
    private Instant createdAt;
    private Instant executedAt;

    public DeviceCommandResponse(Long id, UUID deviceId, CommandType commandType, PumpAction action, CommandStatus status, Instant createdAt, Instant executedAt) {
        this.id = id; this.deviceId = deviceId; this.commandType = commandType; this.action = action; this.status = status; this.createdAt = createdAt; this.executedAt = executedAt;
    }
    public Long getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public CommandType getCommandType() { return commandType; }
    public PumpAction getAction() { return action; }
    public CommandStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExecutedAt() { return executedAt; }
}

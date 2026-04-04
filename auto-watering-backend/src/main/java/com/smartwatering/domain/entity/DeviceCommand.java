package com.smartwatering.domain.entity;

import com.smartwatering.domain.enums.CommandStatus;
import com.smartwatering.domain.enums.CommandType;
import com.smartwatering.domain.enums.PumpAction;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "device_commands")
public class DeviceCommand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommandType commandType = CommandType.PUMP;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PumpAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommandStatus status = CommandStatus.PENDING;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant executedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }
    public CommandType getCommandType() { return commandType; }
    public void setCommandType(CommandType commandType) { this.commandType = commandType; }
    public PumpAction getAction() { return action; }
    public void setAction(PumpAction action) { this.action = action; }
    public CommandStatus getStatus() { return status; }
    public void setStatus(CommandStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getExecutedAt() { return executedAt; }
    public void setExecutedAt(Instant executedAt) { this.executedAt = executedAt; }
}

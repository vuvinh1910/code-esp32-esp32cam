package com.smartwatering.domain.entity;

import com.smartwatering.domain.enums.PumpAction;
import com.smartwatering.domain.enums.TriggerSource;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "pump_action_logs")
public class PumpActionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PumpAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TriggerSource triggeredBy;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }
    public PumpAction getAction() { return action; }
    public void setAction(PumpAction action) { this.action = action; }
    public TriggerSource getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(TriggerSource triggeredBy) { this.triggeredBy = triggeredBy; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}

package com.smartwatering.dto.pump;

import com.smartwatering.domain.enums.PumpAction;
import com.smartwatering.domain.enums.TriggerSource;
import java.time.Instant;
import java.util.UUID;

public class PumpLogResponse {
    private Long id;
    private UUID deviceId;
    private PumpAction action;
    private TriggerSource triggeredBy;
    private Instant timestamp;

    public PumpLogResponse(Long id, UUID deviceId, PumpAction action, TriggerSource triggeredBy, Instant timestamp) {
        this.id = id; this.deviceId = deviceId; this.action = action; this.triggeredBy = triggeredBy; this.timestamp = timestamp;
    }
    public Long getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public PumpAction getAction() { return action; }
    public TriggerSource getTriggeredBy() { return triggeredBy; }
    public Instant getTimestamp() { return timestamp; }
}

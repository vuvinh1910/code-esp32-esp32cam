package com.smartwatering.dto.pump;

import com.smartwatering.domain.enums.PumpAction;
import com.smartwatering.domain.enums.TriggerSource;
import java.time.Instant;

public class PumpActionResponse {
    private Long logId;
    private PumpAction action;
    private TriggerSource triggeredBy;
    private Instant timestamp;
    private Long commandId;

    public PumpActionResponse(Long logId, PumpAction action, TriggerSource triggeredBy, Instant timestamp, Long commandId) {
        this.logId = logId; this.action = action; this.triggeredBy = triggeredBy; this.timestamp = timestamp; this.commandId = commandId;
    }
    public Long getLogId() { return logId; }
    public PumpAction getAction() { return action; }
    public TriggerSource getTriggeredBy() { return triggeredBy; }
    public Instant getTimestamp() { return timestamp; }
    public Long getCommandId() { return commandId; }
}

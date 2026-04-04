package com.smartwatering.dto.pump;

import com.smartwatering.domain.enums.PumpAction;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class PumpRequest {
    @NotNull private UUID deviceId;
    @NotNull private PumpAction action;
    public UUID getDeviceId() { return deviceId; }
    public void setDeviceId(UUID deviceId) { this.deviceId = deviceId; }
    public PumpAction getAction() { return action; }
    public void setAction(PumpAction action) { this.action = action; }
}

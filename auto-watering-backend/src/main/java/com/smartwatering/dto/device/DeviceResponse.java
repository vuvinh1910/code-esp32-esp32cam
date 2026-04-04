package com.smartwatering.dto.device;

import com.smartwatering.domain.enums.DeviceStatus;
import com.smartwatering.domain.enums.DeviceType;
import java.time.Instant;
import java.util.UUID;

public class DeviceResponse {
    private UUID id;
    private UUID userId;
    private String macAddress;
    private String name;
    private DeviceType deviceType;
    private DeviceStatus status;
    private String currentFirmwareVersion;
    private Instant lastSeenAt;

    public DeviceResponse(UUID id, UUID userId, String macAddress, String name, DeviceType deviceType, DeviceStatus status, String currentFirmwareVersion, Instant lastSeenAt) {
        this.id = id; this.userId = userId; this.macAddress = macAddress; this.name = name; this.deviceType = deviceType; this.status = status; this.currentFirmwareVersion = currentFirmwareVersion; this.lastSeenAt = lastSeenAt;
    }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getMacAddress() { return macAddress; }
    public String getName() { return name; }
    public DeviceType getDeviceType() { return deviceType; }
    public DeviceStatus getStatus() { return status; }
    public String getCurrentFirmwareVersion() { return currentFirmwareVersion; }
    public Instant getLastSeenAt() { return lastSeenAt; }
}

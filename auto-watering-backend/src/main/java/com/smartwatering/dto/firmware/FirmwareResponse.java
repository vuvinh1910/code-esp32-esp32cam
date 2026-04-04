package com.smartwatering.dto.firmware;

import com.smartwatering.domain.enums.DeviceType;
import java.time.Instant;
import java.util.UUID;

public class FirmwareResponse {
    private UUID id;
    private String version;
    private String awsS3Url;
    private String releaseNotes;
    private DeviceType targetDeviceType;
    private Instant releasedAt;

    public FirmwareResponse(UUID id, String version, String awsS3Url, String releaseNotes, DeviceType targetDeviceType, Instant releasedAt) {
        this.id = id; this.version = version; this.awsS3Url = awsS3Url; this.releaseNotes = releaseNotes; this.targetDeviceType = targetDeviceType; this.releasedAt = releasedAt;
    }
    public UUID getId() { return id; }
    public String getVersion() { return version; }
    public String getAwsS3Url() { return awsS3Url; }
    public String getReleaseNotes() { return releaseNotes; }
    public DeviceType getTargetDeviceType() { return targetDeviceType; }
    public Instant getReleasedAt() { return releasedAt; }
}

package com.smartwatering.dto.firmware;

import com.smartwatering.domain.enums.DeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FirmwareRequest {
    @NotBlank private String version;
    @NotBlank private String awsS3Url;
    private String releaseNotes;
    @NotNull private DeviceType targetDeviceType;

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getAwsS3Url() { return awsS3Url; }
    public void setAwsS3Url(String awsS3Url) { this.awsS3Url = awsS3Url; }
    public String getReleaseNotes() { return releaseNotes; }
    public void setReleaseNotes(String releaseNotes) { this.releaseNotes = releaseNotes; }
    public DeviceType getTargetDeviceType() { return targetDeviceType; }
    public void setTargetDeviceType(DeviceType targetDeviceType) { this.targetDeviceType = targetDeviceType; }
}

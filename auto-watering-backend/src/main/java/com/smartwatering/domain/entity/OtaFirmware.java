package com.smartwatering.domain.entity;

import com.smartwatering.domain.enums.DeviceType;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ota_firmwares")
public class OtaFirmware extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String version;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String awsS3Url;

    @Column(columnDefinition = "TEXT")
    private String releaseNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceType targetDeviceType;

    @Column(nullable = false)
    private Instant releasedAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getAwsS3Url() { return awsS3Url; }
    public void setAwsS3Url(String awsS3Url) { this.awsS3Url = awsS3Url; }
    public String getReleaseNotes() { return releaseNotes; }
    public void setReleaseNotes(String releaseNotes) { this.releaseNotes = releaseNotes; }
    public DeviceType getTargetDeviceType() { return targetDeviceType; }
    public void setTargetDeviceType(DeviceType targetDeviceType) { this.targetDeviceType = targetDeviceType; }
    public Instant getReleasedAt() { return releasedAt; }
    public void setReleasedAt(Instant releasedAt) { this.releasedAt = releasedAt; }
}

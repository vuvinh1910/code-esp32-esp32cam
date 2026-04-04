package com.smartwatering.repository;

import com.smartwatering.domain.entity.OtaFirmware;
import com.smartwatering.domain.enums.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OtaFirmwareRepository extends JpaRepository<OtaFirmware, UUID> {
    Optional<OtaFirmware> findTopByTargetDeviceTypeOrderByReleasedAtDesc(DeviceType targetDeviceType);
    Optional<OtaFirmware> findByVersion(String version);
}

package com.smartwatering.repository;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.enums.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
    Optional<Device> findByMacAddress(String macAddress);
    List<Device> findByUserId(UUID userId);
    List<Device> findByDeviceType(DeviceType deviceType);
}

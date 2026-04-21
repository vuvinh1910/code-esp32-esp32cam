package com.smartwatering.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.enums.DeviceType;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
    Optional<Device> findByMacAddress(String macAddress);
    Optional<Device> findByName(String name);
    List<Device> findByUserId(UUID userId);
    List<Device> findByDeviceType(DeviceType deviceType);
}

package com.smartwatering.repository;

import com.smartwatering.domain.entity.WateringConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WateringConfigRepository extends JpaRepository<WateringConfig, UUID> {
    Optional<WateringConfig> findByDeviceId(UUID deviceId);
}

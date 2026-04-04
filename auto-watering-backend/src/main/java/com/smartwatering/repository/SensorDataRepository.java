package com.smartwatering.repository;

import com.smartwatering.domain.entity.SensorData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
    Page<SensorData> findByDeviceIdAndRecordedAtBetween(UUID deviceId, Instant from, Instant to, Pageable pageable);
    Page<SensorData> findByDeviceId(UUID deviceId, Pageable pageable);
    Optional<SensorData> findTopByDeviceIdOrderByRecordedAtDesc(UUID deviceId);
}

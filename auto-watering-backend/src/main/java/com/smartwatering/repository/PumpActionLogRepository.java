package com.smartwatering.repository;

import com.smartwatering.domain.entity.PumpActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PumpActionLogRepository extends JpaRepository<PumpActionLog, Long> {
    List<PumpActionLog> findTop20ByDeviceIdOrderByTimestampDesc(UUID deviceId);
}

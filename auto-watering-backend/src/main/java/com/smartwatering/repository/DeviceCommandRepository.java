package com.smartwatering.repository;

import com.smartwatering.domain.entity.DeviceCommand;
import com.smartwatering.domain.enums.CommandStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeviceCommandRepository extends JpaRepository<DeviceCommand, Long> {
    List<DeviceCommand> findTop10ByStatusOrderByCreatedAtDesc(CommandStatus status);
}

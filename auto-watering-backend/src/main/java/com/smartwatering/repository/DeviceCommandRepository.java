package com.smartwatering.repository;

import com.smartwatering.domain.entity.DeviceCommand;
import com.smartwatering.domain.enums.CommandStatus;
import com.smartwatering.domain.enums.CommandType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceCommandRepository extends JpaRepository<DeviceCommand, Long> {
    List<DeviceCommand> findTop10ByStatusOrderByCreatedAtDesc(CommandStatus status);
    Optional<DeviceCommand> findTopByDeviceIdAndCommandTypeOrderByCreatedAtDesc(UUID deviceId, CommandType commandType);
}

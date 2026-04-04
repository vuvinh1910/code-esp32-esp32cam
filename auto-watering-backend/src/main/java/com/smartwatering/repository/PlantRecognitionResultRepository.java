package com.smartwatering.repository;

import com.smartwatering.domain.entity.PlantRecognitionResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PlantRecognitionResultRepository extends JpaRepository<PlantRecognitionResult, UUID> {
}

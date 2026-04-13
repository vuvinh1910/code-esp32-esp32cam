package com.smartwatering.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plant_recognition_results")
@RequiredArgsConstructor
@Data
@AllArgsConstructor
public class PlantRecognitionResult extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(nullable = false)
    private String plantName;

    private double confidence;

    @Column(columnDefinition = "TEXT")
    private double recommendedWatering;

    private Instant capturedAt = Instant.now();

}

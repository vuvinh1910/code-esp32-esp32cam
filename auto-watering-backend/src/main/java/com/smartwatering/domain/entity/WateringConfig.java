package com.smartwatering.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "watering_configs")
public class WateringConfig extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false, unique = true)
    private Device device;

    @Column(nullable = false)
    private Double minSoilMoisture = 35.0;

    @Column(nullable = false)
    private Double maxSoilMoisture = 55.0;

    @Column(nullable = false)
    private Boolean overrideByWeather = Boolean.FALSE;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }
    public Double getMinSoilMoisture() { return minSoilMoisture; }
    public void setMinSoilMoisture(Double minSoilMoisture) { this.minSoilMoisture = minSoilMoisture; }
    public Double getMaxSoilMoisture() { return maxSoilMoisture; }
    public void setMaxSoilMoisture(Double maxSoilMoisture) { this.maxSoilMoisture = maxSoilMoisture; }
    public Boolean getOverrideByWeather() { return overrideByWeather; }
    public void setOverrideByWeather(Boolean overrideByWeather) { this.overrideByWeather = overrideByWeather; }
}

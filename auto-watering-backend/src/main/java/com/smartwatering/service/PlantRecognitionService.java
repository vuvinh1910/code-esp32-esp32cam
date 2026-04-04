package com.smartwatering.service;

import com.smartwatering.domain.entity.Device;
import com.smartwatering.domain.entity.PlantRecognitionResult;
import com.smartwatering.dto.plant.PlantRecognitionRequest;
import com.smartwatering.dto.plant.PlantRecognitionResponse;
import com.smartwatering.exception.NotFoundException;
import com.smartwatering.repository.DeviceRepository;
import com.smartwatering.repository.PlantRecognitionResultRepository;
import org.springframework.stereotype.Service;

@Service
public class PlantRecognitionService {
    private final PlantRecognitionResultRepository repository;
    private final DeviceRepository deviceRepository;

    public PlantRecognitionService(PlantRecognitionResultRepository repository, DeviceRepository deviceRepository) {
        this.repository = repository;
        this.deviceRepository = deviceRepository;
    }

    public PlantRecognitionResponse save(PlantRecognitionRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId()).orElseThrow(() -> new NotFoundException("Device not found"));
        PlantRecognitionResult result = new PlantRecognitionResult();
        result.setDevice(device);
        result.setPlantName(request.getPlantName());
        result.setConfidence(request.getConfidence());
        result.setRecommendedWatering(request.getRecommendedWatering());
        result = repository.save(result);
        return new PlantRecognitionResponse(result.getId(), device.getId(), result.getPlantName(), result.getConfidence(), result.getRecommendedWatering(), result.getCapturedAt());
    }
}

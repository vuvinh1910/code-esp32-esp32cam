package com.smartwatering.service;

import com.smartwatering.domain.entity.OtaFirmware;
import com.smartwatering.domain.enums.DeviceType;
import com.smartwatering.dto.firmware.FirmwareRequest;
import com.smartwatering.dto.firmware.FirmwareResponse;
import com.smartwatering.exception.NotFoundException;
import com.smartwatering.repository.OtaFirmwareRepository;
import org.springframework.stereotype.Service;

@Service
public class FirmwareService {
    private final OtaFirmwareRepository firmwareRepository;

    public FirmwareService(OtaFirmwareRepository firmwareRepository) {
        this.firmwareRepository = firmwareRepository;
    }

    public FirmwareResponse create(FirmwareRequest request) {
        OtaFirmware firmware = new OtaFirmware();
        firmware.setVersion(request.getVersion());
        firmware.setAwsS3Url(request.getAwsS3Url());
        firmware.setReleaseNotes(request.getReleaseNotes());
        firmware.setTargetDeviceType(request.getTargetDeviceType());
        firmware = firmwareRepository.save(firmware);
        return toResponse(firmware);
    }

    public FirmwareResponse latest(DeviceType deviceType) {
        return toResponse(firmwareRepository.findTopByTargetDeviceTypeOrderByReleasedAtDesc(deviceType)
                .orElseThrow(() -> new NotFoundException("Firmware not found")));
    }

    public FirmwareResponse findByVersion(String version) {
        return toResponse(firmwareRepository.findByVersion(version).orElseThrow(() -> new NotFoundException("Firmware not found")));
    }

    private FirmwareResponse toResponse(OtaFirmware f) {
        return new FirmwareResponse(f.getId(), f.getVersion(), f.getAwsS3Url(), f.getReleaseNotes(), f.getTargetDeviceType(), f.getReleasedAt());
    }
}

package com.smartwatering.controller;

import com.smartwatering.service.OtaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import com.smartwatering.domain.enums.DeviceType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ota")
public class OtaController {

    @Autowired
    private OtaService otaService;

    @GetMapping("/check")
    public Map<String, Object> check(
            @RequestParam String version,
            @RequestParam DeviceType deviceType
    ) {
        return otaService.check(version, deviceType);
    }
}
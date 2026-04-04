package com.smartwatering.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import com.smartwatering.domain.entity.OtaFirmware;
import com.smartwatering.domain.enums.DeviceType;
import com.smartwatering.repository.OtaFirmwareRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class OtaService {

    @Autowired
    private OtaFirmwareRepository repository;
    private boolean isNewer(String latest, String current) {
        String[] l = latest.replace("v", "").split("\\.");
        String[] c = current.replace("v", "").split("\\.");

        for (int i = 0; i < Math.max(l.length, c.length); i++) {
            int li = i < l.length ? Integer.parseInt(l[i]) : 0;
            int ci = i < c.length ? Integer.parseInt(c[i]) : 0;

            if (li > ci) return true;
            if (li < ci) return false;
        }
        return false;
    }
    public Map<String, Object> check(String currentVersion, DeviceType deviceType) {

        Map<String, Object> res = new HashMap<>();

        OtaFirmware latest = repository
                .findTopByTargetDeviceTypeOrderByReleasedAtDesc(deviceType)
                .orElse(null);

        if (latest == null) {
            res.put("update", false);
            return res;
        }

        if (isNewer(latest.getVersion(), currentVersion))  {
            res.put("update", true);
            res.put("version", latest.getVersion());
            res.put("url", latest.getAwsS3Url());
            res.put("notes", latest.getReleaseNotes());
        } else {
            res.put("update", false);
        }

        return res;
    }
}
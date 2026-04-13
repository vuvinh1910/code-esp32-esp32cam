package com.smartwatering.service;

import com.smartwatering.dto.plant.Esp32CamResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

//    public Map<String, String> analyze() {
//        Map<String, String> result = new HashMap<>();
//        result.put("plant", "rose");
//        result.put("water", "200ml/day");
//        return result;
//    }
    private final RestTemplate restTemplate;

    // Hàm này sẽ gọi đến ESP32-CAM
    public Esp32CamResponse triggerRecognitionOnDevice(String espIpAddress) {
        // Tạo URL từ IP của ESP32-CAM
        String url = "http://" + espIpAddress + "/api/recognize";

        try {
            // Gửi GET request đến ESP32-CAM
            ResponseEntity<Esp32CamResponse> response = restTemplate.getForEntity(
                    url,
                    Esp32CamResponse.class
            );

            return response.getBody();

        } catch (Exception e) {
            throw new RuntimeException("Không thể kết nối đến ESP32-CAM tại IP: " + espIpAddress, e);
        }
    }
}
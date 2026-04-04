package com.smartwatering.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AiService {

    public Map<String, String> analyze() {
        Map<String, String> result = new HashMap<>();
        result.put("plant", "rose");
        result.put("water", "200ml/day");
        return result;
    }
}
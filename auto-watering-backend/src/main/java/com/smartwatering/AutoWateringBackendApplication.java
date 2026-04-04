package com.smartwatering;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AutoWateringBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(AutoWateringBackendApplication.class, args);
    }
}

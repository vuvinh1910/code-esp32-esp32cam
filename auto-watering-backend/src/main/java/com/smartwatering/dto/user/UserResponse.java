package com.smartwatering.dto.user;

import com.smartwatering.domain.enums.Role;
import java.util.UUID;

public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private Role role;
    private String status;
    private String lastActive;
    private String initial;

    public UserResponse(UUID id, String name, String email, Role role, String status, String lastActive) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.lastActive = lastActive;
        // Generate initial from name
        this.initial = name != null && name.length() > 0 ? name.substring(0, 1).toUpperCase() : "U";
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public String getStatus() { return status; }
    public String getLastActive() { return lastActive; }
    public String getInitial() { return initial; }
}

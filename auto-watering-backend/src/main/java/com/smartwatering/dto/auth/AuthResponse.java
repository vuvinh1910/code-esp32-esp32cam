package com.smartwatering.dto.auth;

import com.smartwatering.domain.enums.Role;
import java.util.UUID;

public class AuthResponse {
    private String token;
    private UUID userId;
    private String username;
    private Role role;

    public AuthResponse(String token, UUID userId, String username, Role role) {
        this.token = token; this.userId = userId; this.username = username; this.role = role;
    }
    public String getToken() { return token; }
    public UUID getUserId() { return userId; }
    public String getUsername() { return username; }
    public Role getRole() { return role; }
}

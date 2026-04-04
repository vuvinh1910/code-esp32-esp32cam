package com.smartwatering.service;

import com.smartwatering.domain.entity.AppUser;
import com.smartwatering.domain.enums.Role;
import com.smartwatering.dto.auth.AuthResponse;
import com.smartwatering.dto.auth.LoginRequest;
import com.smartwatering.dto.auth.RegisterRequest;
import com.smartwatering.exception.BadRequestException;
import com.smartwatering.repository.AppUserRepository;
import com.smartwatering.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(AppUserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) throw new BadRequestException("Username already exists");
        if (userRepository.existsByEmail(request.getEmail())) throw new BadRequestException("Email already exists");
        AppUser user = new AppUser();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user = userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user), user.getId(), user.getUsername(), user.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        AppUser user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new BadRequestException("Invalid credentials"));
        return new AuthResponse(jwtService.generateToken(user), user.getId(), user.getUsername(), user.getRole());
    }
}

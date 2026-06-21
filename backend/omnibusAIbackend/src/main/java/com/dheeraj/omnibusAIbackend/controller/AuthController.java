package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.dto.AuthDTO.AuthenticationRequest;
import com.dheeraj.omnibusAIbackend.dto.AuthDTO.AuthenticationResponse;
import com.dheeraj.omnibusAIbackend.dto.AuthDTO.RegisterRequest;
import com.dheeraj.omnibusAIbackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }
}
package com.dheeraj.omnibusAIbackend.dto;

public class AuthDTO {
    public record RegisterRequest(String name, String email, String password) {}
    public record AuthenticationRequest(String email, String password) {}
    public record AuthenticationResponse(String token, String email, String name) {}
}
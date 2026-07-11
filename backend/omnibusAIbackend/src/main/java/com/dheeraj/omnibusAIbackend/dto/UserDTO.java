package com.dheeraj.omnibusAIbackend.dto;

import java.time.LocalDateTime;

public class UserDTO {

    public record UpdateProfileRequest(String name, String profilePicture) {}
    public record ChangePasswordRequest(String currentPassword, String newPassword) {}
    public record Verify2FARequest(String email, Integer code) {}
    public record UserProfileResponse(Long id, String name, String email, String profilePicture, boolean isTwoFactorEnabled, LocalDateTime createdAt) {}
}
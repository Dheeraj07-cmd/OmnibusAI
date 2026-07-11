package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.dto.UserDTO;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.*;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import com.dheeraj.omnibusAIbackend.service.CloudinaryService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AnalyticsService analyticsService;
    private final ConversationRepository conversationRepository;
    private final BookmarkRepository bookmarkRepository;
    private final DocumentRepository documentRepository;
    private final FileRecordRepository fileRecordRepository;
    private final PromptRepository promptRepository;
    private final AnalyticsRepository analyticsRepository;
    private final CloudinaryService cloudinaryService;

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    @GetMapping("/me")
    public ResponseEntity<UserDTO.UserProfileResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(new UserDTO.UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfilePicture(),
                user.isTwoFactorEnabled(),
                user.getCreatedAt()
        ));
    }

    // Update Profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User user, @RequestBody UserDTO.UpdateProfileRequest request) {
        String name = request.name();

        if (name != null && !name.isBlank()) {
            user.setName(request.name());
            userRepository.save(user);
            analyticsService.logActivity(user, "Updated Profile Name", "Settings", "Success", 0);
        }
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {

        try {
            String avatarUrl = cloudinaryService.uploadImage(file, String.valueOf(user.getId()));
            user.setProfilePicture(avatarUrl);
            userRepository.save(user);
            analyticsService.logActivity(user, "Updated Avatar", "Settings", "Success", 0);

            // Return new URL to React
            return ResponseEntity.ok(Map.of(
                    "profilePicture", avatarUrl,
                    "message", "Avatar updated successfully"
            ));

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Image upload failed: " + e.getMessage());
        }
    }

    // Change Password
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal User user, @RequestBody UserDTO.ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        analyticsService.logActivity(user, "Changed Password", "Security", "Success", 0);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // Generate 2FA Secret & QR Code URL
    @PostMapping("/2fa/generate")
    public ResponseEntity<?> generate2FA(@AuthenticationPrincipal User user) {
        final GoogleAuthenticatorKey key = gAuth.createCredentials();
        user.setTwoFactorSecret(key.getKey());
        userRepository.save(user);

        // Standard format for Authenticator apps
        String otpAuthURL = String.format("otpauth://totp/OmnibusAI:%s?secret=%s&issuer=OmnibusAI", user.getEmail(), key.getKey());

        try {
            // Generate QR Code using ZXing
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(otpAuthURL, BarcodeFormat.QR_CODE, 250, 250);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);

            byte[] pngData = pngOutputStream.toByteArray();
            String base64Image = "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);

            return ResponseEntity.ok(Map.of("secret", key.getKey(), "qrCodeUrl", base64Image));

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate QR Code");
        }
    }

    // Verify & Enable 2FA
    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verify2FA(@AuthenticationPrincipal User user, @RequestBody UserDTO.Verify2FARequest request) {
        boolean isCodeValid = gAuth.authorize(user.getTwoFactorSecret(), request.code());

        if (!isCodeValid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP Code");
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        analyticsService.logActivity(user, "Enabled 2FA", "Security", "Success", 0);

        return ResponseEntity.ok(Map.of("message", "2FA successfully enabled"));
    }

    // Disable 2FA
    @PostMapping("/2fa/disable")
    public ResponseEntity<?> disable2FA(@AuthenticationPrincipal User user) {
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
        analyticsService.logActivity(user, "Disabled 2FA", "Security", "Success", 0);
        return ResponseEntity.ok(Map.of("message", "2FA successfully disabled"));
    }

    // Cascading Delete Account
    @DeleteMapping("/account")
    @Transactional
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal User user) {
        Long userId = user.getId();
        analyticsService.logActivity(user, "Deleted Account", "Account", "Success", 0);

        conversationRepository.deleteByUserId(userId);
        bookmarkRepository.deleteByUserId(userId);
        documentRepository.deleteByUserId(userId);
        fileRecordRepository.deleteByUserId(userId);
        promptRepository.deleteByUserId(userId);
        analyticsRepository.deleteByUserId(userId);
        cloudinaryService.deleteUserData(String.valueOf(userId));

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Account and all associated files deleted successfully"));
    }
}
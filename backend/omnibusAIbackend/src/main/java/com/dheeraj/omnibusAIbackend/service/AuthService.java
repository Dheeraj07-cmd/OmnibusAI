package com.dheeraj.omnibusAIbackend.service;

import com.dheeraj.omnibusAIbackend.dto.AuthDTO.AuthenticationRequest;
import com.dheeraj.omnibusAIbackend.dto.AuthDTO.AuthenticationResponse;
import com.dheeraj.omnibusAIbackend.dto.AuthDTO.RegisterRequest;
import com.dheeraj.omnibusAIbackend.dto.UserDTO.Verify2FARequest;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.UserRepository;
import com.dheeraj.omnibusAIbackend.security.JwtService;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(User.Role.USER)
                .build();
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);

        return new AuthenticationResponse(jwtToken, user.getEmail(), user.getName(),user.getProfilePicture(), false);
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // Verify Email and Password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        var user = repository.findByEmail(request.email()).orElseThrow();

        // Check for 2FA
        if (user.isTwoFactorEnabled()) {
            return new AuthenticationResponse(null, user.getEmail(), user.getName(),user.getProfilePicture(), true);
        }

        // No 2FA required, give token
        var jwtToken = jwtService.generateToken(user);
        return new AuthenticationResponse(jwtToken, user.getEmail(), user.getName(),user.getProfilePicture(), false);
    }

    public AuthenticationResponse verify2FALogin(Verify2FARequest request) {
        var user = repository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!user.isTwoFactorEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "2FA is not enabled for this user");
        }

        boolean isCodeValid = gAuth.authorize(user.getTwoFactorSecret(), request.code());
        if (!isCodeValid) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP Code");
        }

        // OTP is valid, give token.
        var jwtToken = jwtService.generateToken(user);
        return new AuthenticationResponse(jwtToken, user.getEmail(), user.getName(),user.getProfilePicture(), false);
    }
}


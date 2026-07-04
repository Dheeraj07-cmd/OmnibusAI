package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.Prompt;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.PromptRepository;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/prompts")
@RequiredArgsConstructor
public class PromptController {

    private final PromptRepository promptRepository;
    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<List<Prompt>> getPrompts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(promptRepository.findByUserIdOrIsSystemTemplateTrueOrderByCreatedAtDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Prompt> createPrompt(@AuthenticationPrincipal User user, @RequestBody Prompt request) {
        Prompt prompt = Prompt.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .content(request.getContent())
                .category(request.getCategory())
                .tags(request.getTags())
                .isFavorite(false)
                .isSystemTemplate(false)
                .build();

        Prompt saved = promptRepository.save(prompt);
        analyticsService.logActivity(user, "Created custom prompt", "Prompt Library", "Success", 0);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrompt(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Prompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // User should not delete system templates or someone else's prompt
        if (prompt.isSystemTemplate() || !prompt.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        promptRepository.delete(prompt);
        analyticsService.logActivity(user, "Deleted prompt", "Prompt Library", "Success", 0);
        return ResponseEntity.ok().build();
    }
}
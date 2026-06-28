package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.BookmarkRepository;
import com.dheeraj.omnibusAIbackend.repository.DocumentRepository;
import com.dheeraj.omnibusAIbackend.repository.FileRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DocumentRepository documentRepository;
    private final FileRecordRepository fileRecordRepository;
    private final BookmarkRepository bookmarkRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@AuthenticationPrincipal User user) {

        long documentCount = documentRepository.countByUserId(user.getId());
        long fileCount = fileRecordRepository.countByUserId(user.getId());
        long bookmarkCount = bookmarkRepository.countByUserId(user.getId());

        return ResponseEntity.ok(Map.of(
                "documents", documentCount,
                "files", fileCount,
                "bookmarks", bookmarkCount,
                "activePlan", "Pro Tier (Free Trial)"
        ));
    }
}
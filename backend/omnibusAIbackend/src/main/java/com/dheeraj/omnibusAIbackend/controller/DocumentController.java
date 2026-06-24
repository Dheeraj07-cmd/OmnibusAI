package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.Document;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.DocumentRepository;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final AnalyticsService analyticsService; // Restored

    @GetMapping
    public ResponseEntity<List<Document>> getUserDocuments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Document> createOrUpdateDocument(
            @AuthenticationPrincipal User user,
            @RequestBody Document request) {

        Document document;
        if (request.getId() != null) {
            document = documentRepository.findById(request.getId()).orElseThrow();

            // Security Check to prevent users editing other user's documents
            if (!document.getUser().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to edit this document.");
            }

            document.setTitle(request.getTitle());
            document.setContent(request.getContent());
            analyticsService.logActivity(user, "Updated document", "Documents", "Success", 0);
        } else {
            document = Document.builder()
                    .user(user)
                    .title(request.getTitle())
                    .content(request.getContent())
                    .build();
            analyticsService.logActivity(user, "Created new document", "Documents", "Success", 0);
        }

        return ResponseEntity.ok(documentRepository.save(document));
    }
}
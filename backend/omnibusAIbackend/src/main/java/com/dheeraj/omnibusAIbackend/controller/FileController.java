package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.FileRecord;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.FileRecordRepository;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import com.dheeraj.omnibusAIbackend.service.CloudinaryService;
import com.dheeraj.omnibusAIbackend.service.FileIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final CloudinaryService cloudinaryService;
    private final FileRecordRepository fileRecordRepository;
    private final AnalyticsService analyticsService;
    private final FileIntelligenceService fileIntelligenceService;

    @GetMapping
    public ResponseEntity<List<FileRecord>> getUserFiles(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(fileRecordRepository.findByUserIdOrderByUploadedAtDesc(user.getId()));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        try {
            // Process and Vectorize file for AI Chat (RAG)
            fileIntelligenceService.processAndStoreFile(file);

            // Upload to Cloudinary for permanent storage
            String documentUrl = cloudinaryService.uploadFile(file, String.valueOf(user.getId()));

            FileRecord record = FileRecord.builder()
                    .user(user)
                    .fileName(file.getOriginalFilename())
                    .fileUrl(documentUrl)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();

            FileRecord savedRecord = fileRecordRepository.save(record);
            analyticsService.logActivity(user, "Uploaded & Vectorized: " + file.getOriginalFilename(), "Files", "Success", 500);

            return ResponseEntity.ok(savedRecord);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "AI Processing Failed: " + e.getMessage()));
        }
    }

    // Stream answers back to the React UI
    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamFileChat(@RequestParam String query, @AuthenticationPrincipal User user) {
        analyticsService.logActivity(user, "Queried Knowledge Base", "File Intelligence", "Success", 200);
        return fileIntelligenceService.askQuestionStream(query);
    }
}

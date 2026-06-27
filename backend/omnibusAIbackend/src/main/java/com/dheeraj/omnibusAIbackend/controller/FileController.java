package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.FileRecord;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.FileRecordRepository;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import com.dheeraj.omnibusAIbackend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final CloudinaryService cloudinaryService;
    private final FileRecordRepository fileRecordRepository;
    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<List<FileRecord>> getUserFiles(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(fileRecordRepository.findByUserIdOrderByUploadedAtDesc(user.getId()));
    }

    @PostMapping("/upload")
    public ResponseEntity<FileRecord> uploadFile(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) throws IOException {

        // Upload to Cloudinary
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinaryService.uploadFile(file);

        // Save metadata to MySQL
        FileRecord record = FileRecord.builder()
                .user(user)
                .fileName(file.getOriginalFilename())
                .fileUrl(uploadResult.get("secure_url").toString())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .build();

        FileRecord savedRecord = fileRecordRepository.save(record);

        // Log the activity
        analyticsService.logActivity(user, "Uploaded file: " + file.getOriginalFilename(), "Files", "Success", 0);

        return ResponseEntity.ok(savedRecord);
    }
}
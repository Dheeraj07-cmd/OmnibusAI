package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.FileRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileRecordRepository extends JpaRepository<FileRecord, Long> {
    List<FileRecord> findByUserIdOrderByUploadedAtDesc(Long userId);
    long countByUserId(Long userId);
}
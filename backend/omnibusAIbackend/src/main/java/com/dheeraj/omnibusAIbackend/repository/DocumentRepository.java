package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.Document;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

@Transactional
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserIdOrderByUpdatedAtDesc(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
}
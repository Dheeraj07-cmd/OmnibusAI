package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.Analytics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    // Fetches most recent logs for table
    List<Analytics> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    // Fetches logs within a time range for charts
    List<Analytics> findByUserIdAndCreatedAtAfter(Long userId, LocalDateTime date);
}
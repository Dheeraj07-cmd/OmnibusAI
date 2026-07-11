package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.Bookmark;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

@Transactional
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
}
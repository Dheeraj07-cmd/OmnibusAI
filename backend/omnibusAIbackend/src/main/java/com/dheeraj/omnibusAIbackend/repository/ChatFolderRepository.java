package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.ChatFolder;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

@Transactional
public interface ChatFolderRepository extends JpaRepository<ChatFolder, Long> {
    List<ChatFolder> findByUserIdOrderByNameAsc(Long userId);
}
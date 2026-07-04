package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.ChatFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatFolderRepository extends JpaRepository<ChatFolder, Long> {
    List<ChatFolder> findByUserIdOrderByNameAsc(Long userId);
}
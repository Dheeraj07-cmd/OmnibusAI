package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.Prompt;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

@Transactional
public interface PromptRepository extends JpaRepository<Prompt, Long> {
    List<Prompt> findByUserIdOrIsSystemTemplateTrueOrderByCreatedAtDesc(Long userId);
    boolean existsByIsSystemTemplateTrue();
    void deleteByUserId(Long userId);
}
package com.dheeraj.omnibusAIbackend.repository;

import com.dheeraj.omnibusAIbackend.entity.Prompt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromptRepository extends JpaRepository<Prompt, Long> {
    List<Prompt> findByUserIdOrIsSystemTemplateTrueOrderByCreatedAtDesc(Long userId);

    boolean existsByIsSystemTemplateTrue();
}
package com.dheeraj.omnibusAIbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prompts")
public class Prompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    private String category; //  Programming, Marketing, Resume
    private String tags; // Comma-separated= sql,db,backend
    private boolean isFavorite;
    private boolean isSystemTemplate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
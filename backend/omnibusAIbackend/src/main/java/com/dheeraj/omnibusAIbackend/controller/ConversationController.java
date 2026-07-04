package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.ChatMessage;
import com.dheeraj.omnibusAIbackend.entity.Conversation;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.ChatMessageRepository;
import com.dheeraj.omnibusAIbackend.repository.ConversationRepository;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AnalyticsService analyticsService;

    @Value("${spring.ai.openai.chat.options.model}")
    private String defaultModel;

    // Get all user conversations (For the Sidebar)
    @GetMapping
    public ResponseEntity<List<Conversation>> getUserConversations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(conversationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Conversation> createConversation(@AuthenticationPrincipal User user, @RequestBody Map<String, String> request) {
        Conversation conv = Conversation.builder()
                .user(user)
                .title(request.getOrDefault("title", "New Conversation"))
                .aiModel(request.getOrDefault("aiModel", defaultModel))
                .build();

        Conversation savedConv = conversationRepository.save(conv);

        // New Thread created to Analytics Dashboard
        analyticsService.logActivity(user, "New Thread: " + savedConv.getTitle(), "Workspace", "Success", 0);

        return ResponseEntity.ok(savedConv);
    }

    // Get all messages for conversation
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Conversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conv.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return ResponseEntity.ok(chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ChatMessage> saveMessage(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody ChatMessage request) {

        Conversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conv.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        // Update "updatedAt" timestamp so it become first on sidebar
        conv.setUpdatedAt(null);
        conversationRepository.save(conv);

        ChatMessage message = ChatMessage.builder()
                .conversation(conv)
                .role(request.getRole())
                .content(request.getContent())
                .tokensUsed(request.getTokensUsed())
                .build();

        return ResponseEntity.ok(chatMessageRepository.save(message));
    }
}
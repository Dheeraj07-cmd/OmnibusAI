package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/code")
public class CodeAssistantController {

    private final ChatClient chatClient;
    private final AnalyticsService analyticsService;
    private final String defaultModel;

    public CodeAssistantController(ChatClient.Builder chatClientBuilder, AnalyticsService analyticsService, @Value("${spring.ai.openai.chat.options.model}") String defaultModel) {

        this.chatClient = chatClientBuilder
                .defaultSystem("You are an elite, senior software engineer and AI coding assistant. Analyze the provided code, execute the user's instruction, and return highly optimized, production-ready code. RETURN ONLY RAW CODE. Do NOT wrap the code in markdown blocks (like ```python). Do NOT include any conversational greetings or explanations outside of actual code comments.")
                .build();
        this.analyticsService = analyticsService;
        this.defaultModel = defaultModel;
    }

    public record CodeRequest(String code, String language, String instruction) {}

    @PostMapping("/assist")
    public ResponseEntity<Map<String, String>> analyzeCode(@RequestBody CodeRequest request, @AuthenticationPrincipal User user) {

        String promptText = String.format(
                "Language: %s\n\nCurrent Code Context:\n\"\"\"\n%s\n\"\"\"\n\nUser Instruction: %s",
                request.language(),
                request.code(),
                request.instruction()
        );

        // Fetch chat response object so we count tokens
        ChatResponse response = chatClient.prompt()
                .user(promptText)
                .options(OpenAiChatOptions.builder().model(defaultModel).build())
                .call()
                .chatResponse();

        String responseText = response.getResult().getOutput().getText();

        // Log tokens to Analytics Dashboard
        int tokens = 0;
        if (response.getMetadata() != null && response.getMetadata().getUsage() != null) {
            tokens = response.getMetadata().getUsage().getTotalTokens().intValue();
        }

        analyticsService.logActivity(user, "Generated " + request.language() + " Code", "Code Copilot", "Success", tokens);

        return ResponseEntity.ok(Map.of("code", responseText));
    }
}
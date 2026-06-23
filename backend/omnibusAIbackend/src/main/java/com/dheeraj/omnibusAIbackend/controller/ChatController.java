package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatClient chatClient;
    private final AnalyticsService analyticsService;

    public ChatController(ChatClient.Builder chatClientBuilder, AnalyticsService analyticsService) {
        this.chatClient = chatClientBuilder
                .defaultSystem("You are OmnibusAI, a premium, highly intelligent enterprise AI assistant. Format all code with markdown and be concise but highly helpful.")
                .build();
        this.analyticsService = analyticsService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestParam String message, @AuthenticationPrincipal User user) {
        StringBuilder fullResponse = new StringBuilder();

        return chatClient.prompt()
                .user(message)
                .stream()
                .chatResponse() // Get objects to access metadata
                .doOnNext(response -> {
                    // Accumulate the text quietly in the background
                    if (response.getResult() != null && response.getResult().getOutput() != null && response.getResult().getOutput().getText() != null) {
                        fullResponse.append(response.getResult().getOutput().getText());
                    }
                })
                .doOnComplete(() -> {
                    // This run when Stream finishes
                    // Calculate tokens (Prompt + Response) * 1.5 tokens per word
                    int promptTokens = (int) (message.split("\\s+").length * 1.5);
                    int responseTokens = (int) (fullResponse.toString().split("\\s+").length * 1.5);
                    int totalTokens = promptTokens + responseTokens;

                    analyticsService.logActivity(user, "Sent a message", "Chat", "Success", totalTokens);
                })
                .map(response -> {
                    // Extract the text to send to the React frontend
                    if (response.getResult() != null && response.getResult().getOutput() != null && response.getResult().getOutput().getText() != null) {
                        return response.getResult().getOutput().getText();
                    }
                    return "";
                });
    }
}
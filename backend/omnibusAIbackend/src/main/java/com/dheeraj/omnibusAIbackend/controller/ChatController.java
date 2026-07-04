package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatClient chatClient;
    private final AnalyticsService analyticsService;
    private final String defaultModel;

    public ChatController(ChatClient.Builder chatClientBuilder, AnalyticsService analyticsService, @Value("${spring.ai.openai.chat.options.model}") String defaultModel) {

        this.chatClient = chatClientBuilder
                .defaultSystem("You are OmnibusAI, a premium, highly intelligent enterprise AI assistant. Format all code with markdown and be concise but highly helpful.")
                .build();
        this.analyticsService = analyticsService;
        this.defaultModel = defaultModel;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestParam String message, @RequestParam(required = false) String model, @AuthenticationPrincipal User user) {

        String finalModel = (model != null && !model.isEmpty()) ? model : defaultModel;
        StringBuilder fullResponse = new StringBuilder();

        return chatClient.prompt()
                .user(message)
                .options(OpenAiChatOptions.builder().model(finalModel).build())
                .stream()
                .chatResponse()
                .doOnNext(response -> {
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

                    // Log activity perfectly
                    analyticsService.logActivity(user, "Chat (" + finalModel + ")", "Chat", "Success", totalTokens);
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
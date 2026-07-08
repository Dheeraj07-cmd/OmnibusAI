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
@RequestMapping("/api/research")
public class ResearchController {

    private final ChatClient chatClient;
    private final AnalyticsService analyticsService;
    private final String defaultModel;

    public ResearchController(ChatClient.Builder chatClientBuilder, AnalyticsService analyticsService, @Value("${spring.ai.openai.chat.options.model}") String defaultModel) {

        this.chatClient = chatClientBuilder
                .defaultSystem("You are Omnibus Research, an advanced Perplexity-style AI search engine. Provide highly detailed, structured, and factual answers. Format with markdown. Include a '## Sources' section at the very end listing 3-4 realistic reference links or book titles relevant to the topic.")
                .build();
        this.analyticsService = analyticsService;
        this.defaultModel = defaultModel;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamResearch(@RequestParam String query, @AuthenticationPrincipal User user) {

        String promptText = "Conduct comprehensive research on the following topic: " + query;
        StringBuilder fullResponse = new StringBuilder();

        return chatClient.prompt()
                .user(promptText)
                .options(OpenAiChatOptions.builder().model(defaultModel).build())
                .stream()
                .chatResponse()
                .doOnNext(response -> {
                    if (response.getResult() != null && response.getResult().getOutput() != null && response.getResult().getOutput().getText() != null) {
                        fullResponse.append(response.getResult().getOutput().getText());
                    }
                })
                .doOnComplete(() -> {
                    int promptTokens = (int) (promptText.split("\\s+").length * 1.5);
                    int responseTokens = (int) (fullResponse.toString().split("\\s+").length * 1.5);
                    int totalTokens = promptTokens + responseTokens;

                    analyticsService.logActivity(user, "Deep Research query", "Research", "Success", totalTokens);
                })
                .map(response -> {
                    if (response.getResult() != null && response.getResult().getOutput() != null && response.getResult().getOutput().getText() != null) {
                        return response.getResult().getOutput().getText();
                    }
                    return "";
                });
    }
}
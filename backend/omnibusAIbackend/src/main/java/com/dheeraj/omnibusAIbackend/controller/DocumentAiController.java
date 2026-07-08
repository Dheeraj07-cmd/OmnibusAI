package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/documents/ai")
public class DocumentAiController {

    private final ChatClient chatClient;
    private final AnalyticsService analyticsService;

    public DocumentAiController(ChatClient.Builder chatClientBuilder, AnalyticsService analyticsService) {
        // Tell AI to use Markdown only
        this.chatClient = chatClientBuilder
                .defaultSystem("You are an expert co-writer integrated inside a Markdown text editor. Your job is to modify, expand, or write new text based strictly on the user's instructions. Return your response in clean Markdown format. Do not use conversational filler like 'Here is your text'.")
                .build();
        this.analyticsService = analyticsService;
    }

    public record AiAssistRequest(String content, String instruction) {}

    @PostMapping(value = "/assist", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamAssistText(@RequestBody AiAssistRequest request, @AuthenticationPrincipal User user) {
        String promptText = String.format(
                "Context Text:\n\"\"\"\n%s\n\"\"\"\n\nInstruction: %s",
                request.content(),
                request.instruction()
        );

        StringBuilder fullResponse = new StringBuilder();

        return chatClient.prompt()
                .user(promptText)
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
                    analyticsService.logActivity(user, "AI Document Assist", "Documents", "Success", totalTokens);
                })
                .map(response -> {
                    if (response.getResult() != null && response.getResult().getOutput() != null && response.getResult().getOutput().getText() != null) {
                        return response.getResult().getOutput().getText();
                    }
                    return "";
                });
    }
}
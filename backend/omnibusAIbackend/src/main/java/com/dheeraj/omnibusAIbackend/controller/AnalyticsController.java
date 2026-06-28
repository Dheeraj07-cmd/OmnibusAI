package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.Analytics;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsRepository analyticsRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getLiveAnalytics(@AuthenticationPrincipal User user) {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        List<Analytics> recentLogs = analyticsRepository.findByUserIdAndCreatedAtAfter(user.getId(), sevenDaysAgo);
        List<Analytics> top10Logs = analyticsRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.getId());

        // Calculate Total Tokens & API Calls
        int totalTokens = recentLogs.stream().mapToInt(Analytics::getTokensUsed).sum();
        int totalCalls = recentLogs.size();

        // Group tokens by day
        Map<String, Integer> tokensByDay = recentLogs.stream()
                .collect(Collectors.groupingBy(
                        log -> log.getCreatedAt().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                        Collectors.summingInt(Analytics::getTokensUsed)
                ));

        // 7-Day tokens
        List<Map<String, Object>> tokenData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            String dayName = LocalDate.now().minusDays(i).getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            tokenData.add(Map.of("day", dayName, "tokens", tokensByDay.getOrDefault(dayName, 0)));
        }

        // Build API Chart Data
        Map<String, Long> callsByModule = recentLogs.stream()
                .collect(Collectors.groupingBy(Analytics::getModule, Collectors.counting()));

        List<Map<String, Object>> apiData = callsByModule.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("module", entry.getKey());
                    map.put("calls", entry.getValue());
                    return map;
                })
                .toList();

        // Recent Activity Table
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, hh:mm a");
        List<Map<String, String>> formattedRecentActivity = top10Logs.stream()
                .map(log -> Map.of(
                        "action", log.getAction(),
                        "module", log.getModule(),
                        "time", log.getCreatedAt().format(formatter),
                        "status", log.getStatus()
                )).toList();

        return ResponseEntity.ok(Map.of(
                "totalTokens", totalTokens,
                "totalCalls", totalCalls,
                "tokenData", tokenData,
                "apiData", apiData,
                "recentActivity", formattedRecentActivity
        ));
    }
}
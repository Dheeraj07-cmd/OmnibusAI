package com.dheeraj.omnibusAIbackend.service;

import com.dheeraj.omnibusAIbackend.entity.Analytics;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    @Transactional
    public void logActivity(User user, String action, String module, String status, int estimatedTokens) {
        try{
            Analytics log = Analytics.builder()
                .user(user)
                .action(action)
                .module(module)
                .status(status)
                .tokensUsed(estimatedTokens)
                .build();

            analyticsRepository.save(log);
            System.out.println("ACTIVITY SAVED -> Module: " + module + " | Action: " + action + " | Real Tokens: " + estimatedTokens);
        } catch (Exception e) {
            System.out.println("FAILED TO SAVE ACTIVITY: " + e.getMessage());
        }
    }
}
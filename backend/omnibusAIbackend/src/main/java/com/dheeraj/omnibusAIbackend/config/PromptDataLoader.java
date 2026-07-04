package com.dheeraj.omnibusAIbackend.config;

import com.dheeraj.omnibusAIbackend.entity.Prompt;
import com.dheeraj.omnibusAIbackend.repository.PromptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PromptDataLoader implements CommandLineRunner {

    private final PromptRepository promptRepository;

    @Override
    public void run(String... args) {
        if (!promptRepository.existsByIsSystemTemplateTrue()) {
            List<Prompt> templates = List.of(
                    Prompt.builder()
                            .title("Senior SQL Generator")
                            .category("Programming")
                            .description("Converts plain English into optimized complex SQL queries.")
                            .content("Act as a Principal Database Architect. Write a highly optimized SQL query for the following request. Provide brief indexing advice:\n\n[INSERT REQUEST HERE]")
                            .tags("sql,database,code")
                            .isSystemTemplate(true)
                            .build(),
                    Prompt.builder()
                            .title("XYZ Resume Bullet Rewriter")
                            .category("Resume")
                            .description("Transforms weak job descriptions into Google-standard action bullets.")
                            .content("Act as an executive Tech Recruiter. Rewrite the following rough job notes into 3 strong bullet points using the 'Accomplished [X], as measured by [Y], by doing [Z]' framework:\n\n[INSERT ROUGH NOTES]")
                            .tags("career,cv,job")
                            .isSystemTemplate(true)
                            .build(),
                    Prompt.builder()
                            .title("SaaS B2B Cold Outreach")
                            .category("Marketing")
                            .description("Writes a high-converting, non-spammy peer-to-peer pitch.")
                            .content("Write a concise, 4-sentence B2B cold outreach email to a CTO offering our software. Keep the tone conversational, peer-to-peer, and focus entirely on saving engineering hours. Product context:\n\n[INSERT PRODUCT]")
                            .tags("sales,email,growth")
                            .isSystemTemplate(true)
                            .build(),
                    Prompt.builder()
                            .title("Feynman Concept Explainer")
                            .category("Education")
                            .description("Breaks down complex technical topics for a 12-year-old.")
                            .content("Explain the following concept using the Richard Feynman technique. Use concrete real-world analogies, avoid heavy jargon, and test my understanding at the end with a quick riddle:\n\n[INSERT TOPIC]")
                            .tags("study,learning,physics")
                            .isSystemTemplate(true)
                            .build()
            );
            promptRepository.saveAll(templates);
        }
    }
}
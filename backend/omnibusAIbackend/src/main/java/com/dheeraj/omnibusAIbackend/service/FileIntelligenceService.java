package com.dheeraj.omnibusAIbackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FileIntelligenceService {

    private final ChatClient chatClient;
    private final String apiKey;
    private final String baseUrl;
    private final String embeddingModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    // In memory Vector Database for RAG
    private final List<DocumentChunk> documentStore = new ArrayList<>();

    public record DocumentChunk(String text, float[] embedding) {}

    public FileIntelligenceService(ChatClient.Builder chatClientBuilder, @Value("${gemini.native.api-key}") String apiKey,
            @Value("${gemini.native.base-url}") String baseUrl, @Value("${gemini.native.embedding-model}") String embeddingModel) {

        this.chatClient = chatClientBuilder.build();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.embeddingModel = embeddingModel;
    }

    public void processAndStoreFile(MultipartFile file) throws Exception {
        Resource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() { return file.getOriginalFilename(); }
        };

        // Extract raw text using Apache Tika
        TikaDocumentReader documentReader = new TikaDocumentReader(resource);
        List<Document> documents = documentReader.get();

        // Split text into chunks
        TokenTextSplitter splitter = new TokenTextSplitter();
        List<Document> splitDocs = splitter.apply(documents);

        // Generate Gemini Embeddings using REST API
        for (Document doc : splitDocs) {
            String text = doc.getText();
            if (text != null && !text.trim().isEmpty()) {
                float[] vector = generateGeminiEmbedding(text);
                if (vector != null) {
                    documentStore.add(new DocumentChunk(text, vector));
                }
            }
        }
    }

    private float[] generateGeminiEmbedding(String text) throws Exception {
        // Prepare URL
        String url = baseUrl + "/" + embeddingModel + ":embedContent";

        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", List.of(Map.of("text", text)));

        Map<String, Object> requestBody = new HashMap<>();
        // Model Injection
        requestBody.put("model", embeddingModel);
        requestBody.put("content", contentMap);

        //  Auth Header
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode valuesNode = rootNode.path("embedding").path("values");

            float[] vector = new float[valuesNode.size()];
            for (int i = 0; i < valuesNode.size(); i++) {
                vector[i] = (float) valuesNode.get(i).asDouble();
            }
            return vector;
        } else {
            throw new RuntimeException("Gemini Embedding Error (" + response.statusCode() + "): " + response.body());
        }
    }

    // Check Question's number closely match Document's number ( both are divided in terms of numbers using {embeddingModel})
    private double cosineSimilarity(float[] vectorA, float[] vectorB) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        if (vectorA.length != vectorB.length) return 0.0;

        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        return (normA == 0 || normB == 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public String searchContext(String query) {
        try {
            float[] queryVector = generateGeminiEmbedding(query);

            return documentStore.stream()
                    .sorted((a, b) -> Double.compare(cosineSimilarity(queryVector, b.embedding()), cosineSimilarity(queryVector, a.embedding())))
                    .limit(3)
                    .map(DocumentChunk::text)
                    .collect(Collectors.joining("\n\n---\n\n"));
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    public Flux<String> askQuestionStream(String question) {
        String context = searchContext(question);

        String systemPrompt = "You are an intelligent document analyst. Answer the user's question using ONLY the provided CONTEXT. If the answer is not in the context, say 'I cannot find the answer in the uploaded documents.'\n\nCONTEXT:\n" + context;

        return chatClient.prompt()
                .system(systemPrompt)
                .user(question)
                .stream()
                .chatResponse()
                .map(response -> {
                    if (response.getResult() != null && response.getResult().getOutput() != null && response.getResult().getOutput().getText() != null) {
                        return response.getResult().getOutput().getText();
                    }
                    return "";
                });
    }
}
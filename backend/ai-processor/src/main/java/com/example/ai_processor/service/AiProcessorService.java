package com.example.ai_processor.service;

import com.example.ai_processor.model.Task;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.*;

@Service
public class AiProcessorService {
    private final SimpMessagingTemplate messagingTemplate;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public AiProcessorService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

@KafkaListener(topics = "task-events", groupId = "ai-processor")
public void listen(Task task) {
    System.out.println(" Received task from Kafka: " + task.getTitle());

    try {
        String prompt = """
        You are an AI task planner.
        Break down this main task into 4–6 subtasks.
        Each subtask should be short, action-oriented, and start with a verb.
        Return the subtasks as a numbered list.

        Main Task: %s
        """.formatted(task.getTitle());

        String suggestion = callOllama(prompt);
        System.out.println(" AI response:\n" + suggestion);

        task.setAiSuggestion(suggestion);
        messagingTemplate.convertAndSend("/topic/task-updates", task);
        System.out.println(" Sent update to WebSocket for task " + task.getId());
    } catch (Exception e) {
        e.printStackTrace();
    }
}

private String callOllama(String prompt) throws Exception {
    // Escape newlines for valid JSON
    String escapedPrompt = prompt.replace("\n", "\\n").replace("\"", "\\\"");

    String json = """
        {"model": "llama3.2:1b", "prompt": "%s"}
        """.formatted(escapedPrompt);

    HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:11434/api/generate"))
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .header("Content-Type", "application/json")
            .build();

    HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

    StringBuilder fullResponse = new StringBuilder();
    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"response\"\\s*:\\s*\"(.*?)\"");

    try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body()))) {
        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println("🔹 Ollama Stream: " + line);
            java.util.regex.Matcher matcher = pattern.matcher(line);
            while (matcher.find()) {
                String text = matcher.group(1)
                        .replace("\\n", "\n")
                        .replace("\\\"", "\"");
                fullResponse.append(text);
            }
        }
    }

    String result = fullResponse.toString().trim();

    if (result.isEmpty()) {
        System.out.println(" Empty response received from Ollama.");
        result = " No AI response generated. Try again or check Ollama logs.";
    }

    return result;
}




}
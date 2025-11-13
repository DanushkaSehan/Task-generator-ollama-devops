// package com.example.ai_processor.service;

// import com.example.ai_processor.model.Task;
// import org.springframework.kafka.annotation.KafkaListener;
// import org.springframework.messaging.simp.SimpMessagingTemplate;
// import org.springframework.stereotype.Service;

// import java.io.BufferedReader;
// import java.io.InputStream;
// import java.io.InputStreamReader;
// import java.net.URI;
// import java.net.http.*;

// @Service
// public class AiProcessorService {
//     private final SimpMessagingTemplate messagingTemplate;
//     private final HttpClient httpClient = HttpClient.newHttpClient();

//     public AiProcessorService(SimpMessagingTemplate messagingTemplate) {
//         this.messagingTemplate = messagingTemplate;
//     }

// @KafkaListener(topics = "task-events", groupId = "ai-processor")
// public void listen(Task task) {
//     System.out.println(" Received task from Kafka: " + task.getTitle());

//     try {
//         String prompt = """
//         You are an AI task planner.
//         Break down this main task into 4–6 subtasks.
//         Each subtask should be short, action-oriented, and start with a verb.
//         Return the subtasks as a numbered list.

//         Main Task: %s
//         """.formatted(task.getTitle());

//         String suggestion = callOllama(prompt);
//         System.out.println(" AI response:\n" + suggestion);

//         task.setAiSuggestion(suggestion);
//         messagingTemplate.convertAndSend("/topic/task-updates", task);
//         System.out.println(" Sent update to WebSocket for task " + task.getId());
//     } catch (Exception e) {
//         e.printStackTrace();
//     }
// }

// private String callOllama(String prompt) throws Exception {
//     // Escape newlines for valid JSON
//     String escapedPrompt = prompt.replace("\n", "\\n").replace("\"", "\\\"");

//     String json = """
//         {"model": "llama3.2:1b", "prompt": "%s"}
//         """.formatted(escapedPrompt);

//     HttpRequest request = HttpRequest.newBuilder()
//             // .uri(URI.create("http://localhost:11434/api/generate"))
//             .uri(URI.create("http://ollama:11434/api/generate"))
//             .POST(HttpRequest.BodyPublishers.ofString(json))
//             .header("Content-Type", "application/json")
//             .build();

//     HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

//     StringBuilder fullResponse = new StringBuilder();
//     java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"response\"\\s*:\\s*\"(.*?)\"");

//     try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body()))) {
//         String line;
//         while ((line = reader.readLine()) != null) {
//             System.out.println("🔹 Ollama Stream: " + line);
//             java.util.regex.Matcher matcher = pattern.matcher(line);
//             while (matcher.find()) {
//                 String text = matcher.group(1)
//                         .replace("\\n", "\n")
//                         .replace("\\\"", "\"");
//                 fullResponse.append(text);
//             }
//         }
//     }

//     String result = fullResponse.toString().trim();

//     if (result.isEmpty()) {
//         System.out.println(" Empty response received from Ollama.");
//         result = " No AI response generated. Try again or check Ollama logs.";
//     }

//     return result;
// }
// }

package com.example.ai_processor.service;

import com.example.ai_processor.model.Task;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.*;

@Service
public class AiProcessorService {
    private final SimpMessagingTemplate messagingTemplate;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String GROQ_API_KEY = "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";
    private static final String GROQ_MODEL = "llama-3.1-8b-instant";
    private static final URI GROQ_URI = URI.create("https://api.groq.com/openai/v1/chat/completions");

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiProcessorService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

// @KafkaListener(topics = "task-events-vm", groupId = "ai-processor-vm")
@KafkaListener(topics = "task-events", groupId = "ai-processor")
public void listen(Task task) {
    System.out.println("🟢 Received task from Kafka: " + task.getTitle());

    try {
        String prompt = """
        You are an AI task planner.
        Break down this main task into 4–6 subtasks.
        Each subtask should be short, action-oriented, and start with a verb.
        Return the subtasks as a numbered list.

        Main Task: %s
        """.formatted(task.getTitle());

        // 🧠 Generate AI suggestion using Groq or your LLM method
        String suggestion = callGroq(prompt);
        System.out.println("🤖 AI response:\n" + suggestion);

        // Attach the AI suggestion to the same task object
        task.setAiSuggestion(suggestion);

        // ✅ Broadcast the result to all WebSocket subscribers
        String topic = "/topic/task-updates";
        messagingTemplate.convertAndSend(topic, task);
        System.out.println("📤 Sent update to topic: " + topic);

    } catch (Exception e) {
        System.err.println("❌ Error processing task: " + e.getMessage());
        e.printStackTrace();
    }
}



private String callGroq(String prompt) throws Exception {
    
    // 1. Define the Groq payload structure using a Map
    java.util.Map<String, Object> payload = java.util.Map.of(
        "model", GROQ_MODEL,
        "messages", java.util.List.of(
            java.util.Map.of("role", "user", "content", prompt)
        ),
        "temperature", 0.5,
        "max_tokens", 512
    );

    // 2. Use ObjectMapper to convert the structured map into a correctly escaped JSON string
    String json = objectMapper.writeValueAsString(payload);
    
    // 3. Build the HTTP Request
    HttpRequest request = HttpRequest.newBuilder()
            .uri(GROQ_URI)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + GROQ_API_KEY) 
            .build();

    // 4. Send the request and read the full response body
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
        System.err.println("Groq API Error: " + response.body());
        return "Error: Failed to get response from Groq API (HTTP " + response.statusCode() + ")";
    }

    // 5. Parse the JSON response for the final text content
    JsonNode rootNode = objectMapper.readTree(response.body());
    JsonNode contentNode = rootNode
        .path("choices")
        .path(0)
        .path("message")
        .path("content");

    String result = contentNode.asText();

    if (result.isEmpty()) {
        System.out.println(" Empty response received from Groq.");
        result = " No AI response generated. Try again or check Groq/Processor logs.";
    }

    return result.trim();
}


}
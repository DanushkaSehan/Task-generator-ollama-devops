package com.example.task_service.service;

import com.example.task_service.model.Task;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TaskService {
    private final KafkaTemplate<String, Task> kafkaTemplate;
    private final List<Task> tasks = new ArrayList<>();
    private final AtomicLong counter = new AtomicLong(1);

    public TaskService(KafkaTemplate<String, Task> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public List<Task> getAll() {
        return tasks;
    }

    public Task create(String title) {
        Task task = new Task(counter.getAndIncrement(), title, "Waiting for AI...");
        tasks.add(task);
        kafkaTemplate.send("task-events", task);
        return task;
    }

    public void updateSuggestion(long id, String suggestion) {
        tasks.stream().filter(t -> t.getId() == id).findFirst().ifPresent(t -> t.setAiSuggestion(suggestion));
    }
}
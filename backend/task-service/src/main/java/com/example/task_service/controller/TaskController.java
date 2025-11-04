package com.example.task_service.controller;

import com.example.task_service.model.Task;
import com.example.task_service.service.TaskService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class TaskController {
    private final TaskService service;
    public TaskController(TaskService service) { this.service = service; }

    @GetMapping("/tasks")
    public List<Task> getTasks() { return service.getAll(); }

    @PostMapping("/tasks")
    public Task createTask(@RequestBody Map<String, String> req) {
        return service.create(req.get("title"));
    }
}
package com.kaiburr.assignment.controller;

import com.kaiburr.assignment.models.Task;
import com.kaiburr.assignment.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"})
public class TaskController {

    @Autowired
    private TaskService taskService;

    // GET all tasks or a single task by optional query param 'id'
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(@RequestParam(required = false) String id) {
        if (id != null) {
            Optional<Task> task = taskService.getTaskById(id);
            return task.map(value -> ResponseEntity.ok(List.of(value)))
                       .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
        }
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    // GET a single task by path variable
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable String id) {
        Optional<Task> task = taskService.getTaskById(id);
        return task.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    // PUT (create) a new task
    @PutMapping
    public ResponseEntity<?> createTask(@RequestBody Task task) {
        try {
            Task createdTask = taskService.createTask(task);
            return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // DELETE a task by ID
    @DeleteMapping
    public ResponseEntity<Void> deleteTask(@RequestParam String id) {
        if (taskService.getTaskById(id).isPresent()) {
            taskService.deleteTask(id);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // GET tasks by name
    @GetMapping("/findByName")
    public ResponseEntity<List<Task>> getTasksByName(@RequestParam String name) {
        List<Task> tasks = taskService.getTasksByName(name);
        if (tasks.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        return ResponseEntity.ok(tasks);
    }

    // PUT to execute a task
    @PutMapping("/execute")
    public ResponseEntity<Task> executeTask(@RequestParam String taskId) {
        Optional<Task> updatedTask = taskService.executeTask(taskId);
        return updatedTask.map(ResponseEntity::ok)
                          .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}

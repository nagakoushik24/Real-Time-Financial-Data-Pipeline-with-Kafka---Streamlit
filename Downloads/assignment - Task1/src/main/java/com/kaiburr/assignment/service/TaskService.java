package com.kaiburr.assignment.service;

import com.kaiburr.assignment.models.Task;
import com.kaiburr.assignment.models.TaskExecution;
import com.kaiburr.assignment.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(String id) {
        return taskRepository.findById(id);
    }

    public List<Task> getTasksByName(String namePart) {
        return taskRepository.findByNameContainingIgnoreCase(namePart);
    }

    public Task createTask(Task task) {
        validateTaskForCreate(task);
        if (task.getTaskExecutions() == null) {
            task.setTaskExecutions(new ArrayList<>());
        }
        return taskRepository.save(task);
    }

    public void deleteTask(String id) {
        taskRepository.deleteById(id);
    }

    public Optional<Task> executeTask(String taskId) {
        Optional<Task> optionalTask = taskRepository.findById(taskId);
        if (optionalTask.isEmpty()) {
            return Optional.empty();
        }
        Task task = optionalTask.get();
        String command = task.getCommand();
        validateCommand(command);

        TaskExecution execution = new TaskExecution();
        execution.setStartTime(new Date());

        String output = runShellCommand(command);

        execution.setEndTime(new Date());
        execution.setOutput(output);

        List<TaskExecution> executions = task.getTaskExecutions();
        if (executions == null) {
            executions = new ArrayList<>();
            task.setTaskExecutions(executions);
        }
        executions.add(execution);

        taskRepository.save(task);
        return Optional.of(task);
    }

    private void validateTaskForCreate(Task task) {
        if (task == null) throw new IllegalArgumentException("Task body is required");
        if (isBlank(task.getId())) throw new IllegalArgumentException("Task id is required");
        if (isBlank(task.getName())) throw new IllegalArgumentException("Task name is required");
        if (isBlank(task.getOwner())) throw new IllegalArgumentException("Task owner is required");
        if (isBlank(task.getCommand())) throw new IllegalArgumentException("Task command is required");
        validateCommand(task.getCommand());
    }

    private void validateCommand(String command) {
        if (isBlank(command)) throw new IllegalArgumentException("Command is required");
        String lower = command.toLowerCase(Locale.ROOT);
        List<String> banned = Arrays.asList("rm -rf", ":(){:|:&};:", "shutdown", "reboot", "mkfs", ">: ", ">/dev/sda", "dd if=", "wget http://", "curl http://", "nc -e", "| bash", "; rm ");
        for (String bad : banned) {
            if (lower.contains(bad)) {
                throw new IllegalArgumentException("Unsafe command detected");
            }
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String runShellCommand(String command) {
        // Cross-platform shell execution: use cmd on Windows, sh on Unix
        List<String> cmd;
        if (System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("win")) {
            cmd = Arrays.asList("cmd.exe", "/c", command);
        } else {
            cmd = Arrays.asList("/bin/sh", "-c", command);
        }

        ProcessBuilder builder = new ProcessBuilder(cmd);
        builder.redirectErrorStream(true);
        StringBuilder output = new StringBuilder();
        try {
            Process process = builder.start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append(System.lineSeparator());
                }
            }
            int exit = process.waitFor();
            output.append("ExitCode: ").append(exit);
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            output.append("Error: ").append(e.getMessage());
        }
        return output.toString().trim();
    }
}

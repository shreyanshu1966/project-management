package com.management.project.controllers;

import com.management.project.models.Project;
import com.management.project.models.Task;
import com.management.project.models.TaskStatus;
import com.management.project.models.User;
import com.management.project.payload.response.MessageResponse;
import com.management.project.repositories.ProjectRepository;
import com.management.project.repositories.TaskRepository;
import com.management.project.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get all tasks for the current user (assigned to them)
    @GetMapping("/my-tasks")
    public ResponseEntity<?> getMyTasks() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        List<Task> tasks = taskRepository.findByAssignedTo(user);
        
        return ResponseEntity.ok(tasks);
    }
    
    // Get all tasks for a specific project
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getTasksByProject(@PathVariable String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Error: Project not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        // Check if user is a member or leader of the project
        if (!project.getMembers().contains(user) && !project.getLeader().getId().equals(user.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not a member of this project."));
        }
        
        List<Task> tasks = taskRepository.findByProject(project);
        
        return ResponseEntity.ok(tasks);
    }
    
    // Create a new task (only for leaders)
    @PostMapping
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> createTask(@RequestBody Task taskRequest) {
        Project project = projectRepository.findById(taskRequest.getProject().getId())
                .orElseThrow(() -> new RuntimeException("Error: Project not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User leader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        // Check if the current user is the leader of this project
        if (!project.getLeader().getId().equals(leader.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not the leader of this project."));
        }
        
        // Validate assignee
        User assignee = null;
        if (taskRequest.getAssignedTo() != null && taskRequest.getAssignedTo().getId() != null) {
            assignee = userRepository.findById(taskRequest.getAssignedTo().getId())
                    .orElseThrow(() -> new RuntimeException("Error: Assigned user not found."));
            
            // Check if assignee is a member of the project
            if (!project.getMembers().contains(assignee)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Assigned user is not a member of this project."));
            }
        }
        
        Task task = new Task();
        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setStatus(TaskStatus.PENDING);
        task.setStartDate(taskRequest.getStartDate());
        task.setDueDate(taskRequest.getDueDate());
        task.setProject(project);
        task.setAssignedTo(assignee);
        task.setProgressPercentage(0);
        
        Task savedTask = taskRepository.save(task);
        
        return ResponseEntity.ok(savedTask);
    }
    
    // Update a task status and progress (for members - their assigned tasks)
    @PutMapping("/{id}/update-progress")
    public ResponseEntity<?> updateTaskProgress(@PathVariable String id, @RequestBody Task taskRequest) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Task not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        // Check if the current user is assigned to this task or is the project leader
        if ((task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(user.getId())) 
                && !task.getProject().getLeader().getId().equals(user.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not assigned to this task."));
        }
        
        // Update progress percentage (0-100)
        int progressPercentage = taskRequest.getProgressPercentage();
        if (progressPercentage < 0 || progressPercentage > 100) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Progress percentage must be between 0 and 100."));
        }
        
        task.setProgressPercentage(progressPercentage);
        
        // Update status based on progress
        if (progressPercentage == 0) {
            task.setStatus(TaskStatus.PENDING);
        } else if (progressPercentage < 100) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        } else if (progressPercentage == 100) {
            // If 100%, move to UNDER_REVIEW for leader approval
            task.setStatus(TaskStatus.UNDER_REVIEW);
        }
        
        task.setUpdatedAt(LocalDateTime.now());
        
        Task updatedTask = taskRepository.save(task);
        
        return ResponseEntity.ok(updatedTask);
    }
    
    // Submit a task for review (for members)
    @PutMapping("/{id}/submit")
    public ResponseEntity<?> submitTask(@PathVariable String id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Task not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        // Check if the current user is assigned to this task
        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(user.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not assigned to this task."));
        }
        
        // Set progress to 100% and change status to UNDER_REVIEW
        task.setProgressPercentage(100);
        task.setStatus(TaskStatus.UNDER_REVIEW);
        task.setUpdatedAt(LocalDateTime.now());
        
        Task updatedTask = taskRepository.save(task);
        
        return ResponseEntity.ok(new MessageResponse("Task submitted for review successfully!"));
    }
    
    // Approve or reject a task (only for leaders)
    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> reviewTask(@PathVariable String id, @RequestParam boolean approved) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Task not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User leader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        // Check if the current user is the leader of this project
        if (!task.getProject().getLeader().getId().equals(leader.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not the leader of this project."));
        }
        
        // Update task status based on approval
        if (approved) {
            task.setStatus(TaskStatus.COMPLETED);
            task.setCompletedDate(LocalDateTime.now());
        } else {
            task.setStatus(TaskStatus.REJECTED);
            // Reset progress to 75% if rejected
            task.setProgressPercentage(75);
        }
        
        task.setUpdatedAt(LocalDateTime.now());
        
        Task updatedTask = taskRepository.save(task);
        
        String message = approved ? "Task approved successfully!" : "Task rejected. Sent back for improvements.";
        
        return ResponseEntity.ok(new MessageResponse(message));
    }
    
    // Reassign a task to another member (only for leaders)
    @PutMapping("/{id}/reassign/{userId}")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> reassignTask(@PathVariable String id, @PathVariable String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Task not found."));
        
        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User leader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        // Check if the current user is the leader of this project
        if (!task.getProject().getLeader().getId().equals(leader.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not the leader of this project."));
        }
        
        // Check if new assignee is a member of the project
        if (!task.getProject().getMembers().contains(assignee)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Assigned user is not a member of this project."));
        }
        
        task.setAssignedTo(assignee);
        task.setUpdatedAt(LocalDateTime.now());
        
        // If task was rejected, change status back to IN_PROGRESS
        if (task.getStatus() == TaskStatus.REJECTED) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }
        
        Task updatedTask = taskRepository.save(task);
        
        return ResponseEntity.ok(new MessageResponse("Task reassigned successfully!"));
    }
}
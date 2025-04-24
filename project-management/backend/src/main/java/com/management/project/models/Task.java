package com.management.project.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Document(collection = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    private String id;
    private String title;
    private String description;
    private TaskStatus status = TaskStatus.PENDING;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
    private LocalDateTime completedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @DBRef
    private Project project;
    @DBRef
    private User assignedTo;
    private int progressPercentage = 0;
}
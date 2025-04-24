package com.management.project.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {
    @Id
    private String id;
    private String name;
    private String description;
    private String problemStatement;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isProblemStatementApproved = false;
    @DBRef
    private User leader;
    @DBRef
    private Set<User> members = new HashSet<>();
}
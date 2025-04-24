package com.management.project.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    private String id;
    private ERole name;
    public Role(ERole name) {
        this.name = name;
    }
}
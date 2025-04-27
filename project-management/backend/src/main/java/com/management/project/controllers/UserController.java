package com.management.project.controllers;

import com.management.project.models.User;
import com.management.project.models.Project;
import com.management.project.payload.response.MessageResponse;
import com.management.project.payload.response.UserInfoResponse;
import com.management.project.repositories.UserRepository;
import com.management.project.repositories.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    // Get all users (for member selection in projects and task assignment)
    @GetMapping
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<UserInfoResponse> users = userRepository.findAll().stream()
                    .map(user -> new UserInfoResponse(
                            user.getId(),
                            user.getUsername(),
                            user.getEmail(),
                            user.getFullName()
                    ))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Error retrieving users: " + e.getMessage()));
        }
    }
    
    // Get user profile info
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Error: User not found."));
            
            UserInfoResponse userInfo = new UserInfoResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getFullName()
            );
            
            return ResponseEntity.ok(userInfo);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Error retrieving user profile: " + e.getMessage()));
        }
    }
    
    // Get users for a specific project (for task assignment)
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> getUsersForProject(@PathVariable String projectId) {
        try {
            // Find the project first
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Error: Project not found."));
            
            // Get the member list from the project
            List<UserInfoResponse> users = project.getMembers().stream()
                    .map(user -> new UserInfoResponse(
                            user.getId(),
                            user.getUsername(),
                            user.getEmail(),
                            user.getFullName()
                    ))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Error retrieving project users: " + e.getMessage()));
        }
    }
}
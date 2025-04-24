package com.management.project.controllers;

import com.management.project.models.Project;
import com.management.project.models.User;
import com.management.project.payload.response.MessageResponse;
import com.management.project.repositories.ProjectRepository;
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
@RequestMapping("/api/projects")
public class ProjectController {
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get all projects for the current user (leader or member)
    @GetMapping
    public ResponseEntity<?> getAllProjects() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        List<Project> leaderProjects = projectRepository.findByLeader(user);
        List<Project> memberProjects = projectRepository.findByMembersContaining(user);
        
        // Combine both lists without duplicates
        leaderProjects.forEach(project -> {
            if (!memberProjects.contains(project)) {
                memberProjects.add(project);
            }
        });
        
        return ResponseEntity.ok(memberProjects);
    }
    
    // Get a project by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Project not found."));
        
        return ResponseEntity.ok(project);
    }
    
    // Create a new project (only for leaders)
    @PostMapping
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> createProject(@RequestBody Project projectRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User leader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        Project project = new Project();
        project.setName(projectRequest.getName());
        project.setDescription(projectRequest.getDescription());
        project.setProblemStatement(projectRequest.getProblemStatement());
        project.setLeader(leader);
        
        // Default values
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        project.setProblemStatementApproved(false);
        
        // Add the leader as a member as well
        project.getMembers().add(leader);
        
        Project savedProject = projectRepository.save(project);
        
        return ResponseEntity.ok(savedProject);
    }
    
    // Update a project (only for leaders)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> updateProject(@PathVariable String id, @RequestBody Project projectRequest) {
        Project project = projectRepository.findById(id)
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
        
        project.setName(projectRequest.getName());
        project.setDescription(projectRequest.getDescription());
        project.setProblemStatement(projectRequest.getProblemStatement());
        project.setUpdatedAt(LocalDateTime.now());
        
        Project updatedProject = projectRepository.save(project);
        
        return ResponseEntity.ok(updatedProject);
    }
    
    // Approve problem statement (only for leaders)
    @PutMapping("/{id}/approve-problem-statement")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> approveProblemStatement(@PathVariable String id) {
        Project project = projectRepository.findById(id)
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
        
        project.setProblemStatementApproved(true);
        project.setUpdatedAt(LocalDateTime.now());
        
        Project updatedProject = projectRepository.save(project);
        
        return ResponseEntity.ok(new MessageResponse("Problem statement approved successfully!"));
    }
    
    // Add a member to a project (only for leaders)
    @PostMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> addMemberToProject(@PathVariable String id, @PathVariable String userId) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Project not found."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User leader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: Leader not found."));
        
        // Check if the current user is the leader of this project
        if (!project.getLeader().getId().equals(leader.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not the leader of this project."));
        }
        
        if (project.getMembers().contains(user)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: User is already a member of this project."));
        }
        
        project.getMembers().add(user);
        project.setUpdatedAt(LocalDateTime.now());
        
        projectRepository.save(project);
        
        return ResponseEntity.ok(new MessageResponse("User added to project successfully!"));
    }
    
    // Remove a member from a project (only for leaders)
    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> removeMemberFromProject(@PathVariable String id, @PathVariable String userId) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Project not found."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User leader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: Leader not found."));
        
        // Check if the current user is the leader of this project
        if (!project.getLeader().getId().equals(leader.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are not the leader of this project."));
        }
        
        // Check if the user is the leader (leader cannot be removed)
        if (user.getId().equals(leader.getId())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Leader cannot be removed from project."));
        }
        
        if (!project.getMembers().contains(user)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: User is not a member of this project."));
        }
        
        project.getMembers().remove(user);
        project.setUpdatedAt(LocalDateTime.now());
        
        projectRepository.save(project);
        
        return ResponseEntity.ok(new MessageResponse("User removed from project successfully!"));
    }
    
    // Delete a project (only for leaders)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_LEADER')")
    public ResponseEntity<?> deleteProject(@PathVariable String id) {
        Project project = projectRepository.findById(id)
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
        
        // Delete the project
        projectRepository.delete(project);
        
        return ResponseEntity.ok(new MessageResponse("Project deleted successfully!"));
    }
}
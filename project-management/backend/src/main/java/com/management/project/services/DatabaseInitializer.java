package com.management.project.services;

import com.management.project.models.ERole;
import com.management.project.models.Role;
import com.management.project.models.User;
import com.management.project.repositories.RoleRepository;
import com.management.project.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initRoles();
        initUsers();
    }

    private void initRoles() {
        // Check if roles exist
        if (roleRepository.count() == 0) {
            // Create roles
            Role memberRole = new Role(ERole.ROLE_MEMBER);
            Role leaderRole = new Role(ERole.ROLE_LEADER);

            // Save roles
            roleRepository.save(memberRole);
            roleRepository.save(leaderRole);

            System.out.println("Roles initialized successfully!");
        }
    }

    private void initUsers() {
        // Check if users exist
        if (userRepository.count() == 0) {
            // Create a leader user
            User leader = new User();
            leader.setUsername("leader");
            leader.setEmail("leader@example.com");
            leader.setPassword(passwordEncoder.encode("password"));
            leader.setFullName("Project Leader");

            // Assign leader role
            Set<Role> leaderRoles = new HashSet<>();
            roleRepository.findByName(ERole.ROLE_LEADER).ifPresent(leaderRoles::add);
            leader.setRoles(leaderRoles);

            // Save leader
            userRepository.save(leader);

            // Create a member user
            User member = new User();
            member.setUsername("member");
            member.setEmail("member@example.com");
            member.setPassword(passwordEncoder.encode("password"));
            member.setFullName("Project Member");

            // Assign member role
            Set<Role> memberRoles = new HashSet<>();
            roleRepository.findByName(ERole.ROLE_MEMBER).ifPresent(memberRoles::add);
            member.setRoles(memberRoles);

            // Save member
            userRepository.save(member);

            System.out.println("Test users initialized successfully!");
        }
    }
}
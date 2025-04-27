package com.management.project.controllers;

import com.management.project.models.ERole;
import com.management.project.models.Role;
import com.management.project.models.User;
import com.management.project.payload.request.LoginRequest;
import com.management.project.payload.request.SignupRequest;
import com.management.project.payload.response.JwtResponse;
import com.management.project.payload.response.MessageResponse;
import com.management.project.repositories.RoleRepository;
import com.management.project.repositories.UserRepository;
import com.management.project.security.UserDetailsImpl;
import com.management.project.security.jwt.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFullName(signUpRequest.getFullName());

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        try {
            if (strRoles == null || strRoles.isEmpty()) {
                // Default to MEMBER role if none specified
                Role memberRole = roleRepository.findByName(ERole.ROLE_MEMBER)
                        .orElseThrow(() -> new RuntimeException("Error: Member role not found in database!"));
                roles.add(memberRole);
            } else {
                strRoles.forEach(role -> {
                    switch (role.toLowerCase()) {
                        case "leader":
                            Role leaderRole = roleRepository.findByName(ERole.ROLE_LEADER)
                                    .orElseThrow(() -> new RuntimeException("Error: Leader role not found in database!"));
                            roles.add(leaderRole);
                            break;
                        case "member":
                        default:
                            Role memberRole = roleRepository.findByName(ERole.ROLE_MEMBER)
                                    .orElseThrow(() -> new RuntimeException("Error: Member role not found in database!"));
                            roles.add(memberRole);
                    }
                });
            }

            user.setRoles(roles);
            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .internalServerError()
                    .body(new MessageResponse(e.getMessage()));
        }
    }
}
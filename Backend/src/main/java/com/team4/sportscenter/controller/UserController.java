package com.team4.sportscenter.controller;

import com.team4.sportscenter.dto.response.UserResponseDTO;
import com.team4.sportscenter.model.User;
import com.team4.sportscenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{username}")
    public ResponseEntity<UserResponseDTO> getUserByUsername(@PathVariable String username) {
        Optional<User> userOptional = userService.getUserByUsername(username);
        return userOptional.map(user -> ResponseEntity.ok(
                UserResponseDTO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .role(user.getRole())
                        .build()
        )).orElseGet(() -> ResponseEntity.notFound().build());
    }
}

package com.learnnow.profile.controller;

import com.learnnow.profile.dto.UserDto;
import com.learnnow.profile.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserDto> getProfile(@AuthenticationPrincipal Jwt jwt) {
        String id = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        return ResponseEntity.ok(userService.getOrCreateUser(id, email));
    }

    @PutMapping
    public ResponseEntity<UserDto> updateProfile(@AuthenticationPrincipal Jwt jwt, @RequestBody UserDto userDto) {
        String id = jwt.getSubject();
        return ResponseEntity.ok(userService.updateUser(id, userDto));
    }
}

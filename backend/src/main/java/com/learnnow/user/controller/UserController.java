package com.learnnow.user.controller;

import com.learnnow.user.dto.UserDto;
import com.learnnow.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
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

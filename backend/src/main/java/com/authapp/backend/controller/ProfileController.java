package com.authapp.backend.controller;

import com.authapp.backend.dto.MessageResponse;
import com.authapp.backend.dto.UpdateProfileRequest;
import com.authapp.backend.entity.User;
import com.authapp.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final int MAX_AVATAR_BASE64_LENGTH = 3_000_000;

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Não autenticado"));
        }

        return ResponseEntity.ok(toProfileResponse(user));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(Authentication authentication,
                                           @Valid @RequestBody UpdateProfileRequest request) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Não autenticado"));
        }

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        user.setPhone(normalizeNullable(request.phone()));
        user.setCity(normalizeNullable(request.city()));
        user.setBio(normalizeNullable(request.bio()));

        if (request.avatarBase64() != null) {
            String avatar = request.avatarBase64().trim();
            if (!avatar.isEmpty() && avatar.length() > MAX_AVATAR_BASE64_LENGTH) {
                return ResponseEntity.badRequest().body(new MessageResponse("Imagem muito grande"));
            }
            if (!avatar.isEmpty() && !avatar.startsWith("data:image/")) {
                return ResponseEntity.badRequest().body(new MessageResponse("Formato de imagem inválido"));
            }
            user.setAvatarBase64(avatar.isEmpty() ? null : avatar);
        }

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Perfil atualizado com sucesso",
                "profile", toProfileResponse(user)
        ));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Map<String, Object> toProfileResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone() == null ? "" : user.getPhone());
        response.put("city", user.getCity() == null ? "" : user.getCity());
        response.put("bio", user.getBio() == null ? "" : user.getBio());
        response.put("avatarBase64", user.getAvatarBase64() == null ? "" : user.getAvatarBase64());
        response.put("createdAt", user.getCreatedAt());
        response.put("updatedAt", user.getUpdatedAt());
        return response;
    }
}

package com.authapp.backend.dto;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        String name,
        String email
) {
}

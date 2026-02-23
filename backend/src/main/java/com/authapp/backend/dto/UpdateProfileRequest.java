package com.authapp.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 2, max = 120, message = "Nome deve ter entre 2 e 120 caracteres") String name,
        @Size(max = 30, message = "Telefone deve ter no máximo 30 caracteres") String phone,
        @Size(max = 120, message = "Cidade deve ter no máximo 120 caracteres") String city,
        @Size(max = 500, message = "Bio deve ter no máximo 500 caracteres") String bio,
        String avatarBase64
) {
}

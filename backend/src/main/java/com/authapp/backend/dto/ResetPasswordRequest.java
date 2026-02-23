package com.authapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres") String newPassword
) {
}

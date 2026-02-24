package com.authapp.backend.dto.finance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 120) String email,
        @Size(max = 30) String phone,
        @Size(max = 500) String notes
) {
}

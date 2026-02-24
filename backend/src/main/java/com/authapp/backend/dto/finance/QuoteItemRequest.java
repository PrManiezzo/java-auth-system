package com.authapp.backend.dto.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record QuoteItemRequest(
        Long catalogItemId,
        @NotBlank @Size(max = 160) String description,
        @Size(max = 20) String unit,
        @NotNull @DecimalMin(value = "0.01") BigDecimal quantity,
        @NotNull @DecimalMin(value = "0.01") BigDecimal unitPrice
) {
}

package com.authapp.backend.dto.finance;

import com.authapp.backend.entity.finance.StockMovementType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record StockAdjustmentRequest(
        @NotNull StockMovementType type,
        @NotNull @DecimalMin(value = "0.01") BigDecimal quantity,
        @Size(max = 200) String reason
) {
}

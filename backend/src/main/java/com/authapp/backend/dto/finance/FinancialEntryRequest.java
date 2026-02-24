package com.authapp.backend.dto.finance;

import com.authapp.backend.entity.finance.EntryStatus;
import com.authapp.backend.entity.finance.EntryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinancialEntryRequest(
        @NotNull EntryType type,
        @NotNull EntryStatus status,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 160) String description,
        LocalDate dueDate,
        LocalDate paidDate
) {
}

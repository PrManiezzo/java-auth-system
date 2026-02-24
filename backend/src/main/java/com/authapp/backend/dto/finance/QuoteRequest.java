package com.authapp.backend.dto.finance;

import com.authapp.backend.entity.finance.QuoteStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record QuoteRequest(
        Long customerId,
        @NotBlank @Size(max = 120) String customerName,
        @NotNull QuoteStatus status,
        @NotNull LocalDate issueDate,
        @NotNull LocalDate validUntil,
        @Size(max = 500) String notes,
        @NotEmpty List<@Valid QuoteItemRequest> items
) {
}

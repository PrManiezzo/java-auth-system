package com.authapp.backend.dto.finance;

import com.authapp.backend.entity.finance.ItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CatalogItemRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 40) String sku,
        @Size(max = 500) String qrCode,
        @NotNull ItemType type,
        @Size(max = 20) String unit,
        @NotNull @DecimalMin(value = "0.01") BigDecimal unitPrice,
        BigDecimal costPrice,
        @Size(max = 300) String description,
        String productImageBase64,
        @DecimalMin(value = "0.00") BigDecimal stockQuantity,
        @DecimalMin(value = "0.00") BigDecimal minStock
) {
}

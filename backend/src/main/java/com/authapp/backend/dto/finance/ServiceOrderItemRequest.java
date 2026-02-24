package com.authapp.backend.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOrderItemRequest {
    private Long catalogId;
    private String itemName;
    private String description;
    private Integer quantity;
    private BigDecimal unitPrice;
    private Boolean isService;
}

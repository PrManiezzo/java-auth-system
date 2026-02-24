package com.authapp.backend.dto.finance;

import com.authapp.backend.entity.finance.ServiceOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOrderRequest {
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private ServiceOrderStatus status;
    private LocalDate startDate;
    private LocalDate estimatedEndDate;
    private String description;
    private String technicianNotes;
    private String assignedTechnician;
    private List<ServiceOrderItemRequest> items;
}

package com.authapp.backend.entity.finance;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "finance_service_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ownerEmail;

    @Column
    private Long customerId;

    @Column(nullable = false)
    private String customerName;

    @Column
    private String customerPhone;

    @Column
    private String customerAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceOrderStatus status;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column
    private LocalDate estimatedEndDate;

    @Column
    private LocalDate completedDate;

    @Column(length = 1000)
    private String description;

    @Column(length = 1000)
    private String technicianNotes;

    @Column
    private String assignedTechnician;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal laborCost;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal partsCost;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @OneToMany(mappedBy = "serviceOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ServiceOrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;
}

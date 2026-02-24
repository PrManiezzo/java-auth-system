package com.authapp.backend.entity.finance;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ownerEmail;

    private String customerId;
    
    private String customerName;

    @Column(nullable = false)
    private LocalDateTime saleDate;

    @Enumerated(EnumType.STRING)
    private SaleStatus status;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

    @Column(precision = 15, scale = 2)
    private BigDecimal subtotal; // Sum of items before discount

    @Column(precision = 15, scale = 2)
    private BigDecimal discount; // Discount in R$

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercent; // Discount in %

    @Column(precision = 15, scale = 2)
    private BigDecimal shipping; // Shipping/Frete

    @Column(precision = 15, scale = 2)
    private BigDecimal tax; // Additional taxes

    @Column(precision = 15, scale = 2)
    private BigDecimal total; // Final total

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (saleDate == null) {
            saleDate = LocalDateTime.now();
        }
        if (status == null) {
            status = SaleStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void calculateTotal() {
        // Calculate subtotal (sum of all items)
        this.subtotal = items.stream()
                .map(SaleItem::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calculate discount
        BigDecimal discountValue = BigDecimal.ZERO;
        if (discount != null) {
            discountValue = discount;
        } else if (discountPercent != null) {
            discountValue = subtotal.multiply(discountPercent).divide(new BigDecimal("100"));
        }
        
        // Calculate total: subtotal - discount + shipping + tax
        this.total = subtotal
                .subtract(discountValue)
                .add(shipping != null ? shipping : BigDecimal.ZERO)
                .add(tax != null ? tax : BigDecimal.ZERO);
    }

    public void addItem(SaleItem item) {
        items.add(item);
        item.setSale(this);
        calculateTotal();
    }

    public void removeItem(SaleItem item) {
        items.remove(item);
        item.setSale(null);
        calculateTotal();
    }
}

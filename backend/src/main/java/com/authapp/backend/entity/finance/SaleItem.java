package com.authapp.backend.entity.finance;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sale_id")
    @JsonBackReference
    private Sale sale;

    private String description;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal quantity;
    
    private String unit;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal total;
    
    private Long productId; // Reference to catalog item if applicable
}

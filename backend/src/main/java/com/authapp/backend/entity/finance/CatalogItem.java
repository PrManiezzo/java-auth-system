package com.authapp.backend.entity.finance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "finance_catalog_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ownerEmail;

    @Column(nullable = false)
    private String name;

    @Column(length = 40)
    private String sku;

    @Column(length = 500)
    private String qrCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType type;

    @Column(length = 20)
    private String unit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal costPrice;

    @Column(length = 300)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String productImageBase64;

    @Column(length = 10)
    private String ncm; // Código NCM (Nomenclatura Comum do Mercosul)

    @Column(length = 10)
    private String cest; // Código CEST (Código Especificador da Substituição Tributária)

    @Column(length = 10)
    private String cfop; // Código CFOP (Código Fiscal de Operações e Prestações)

    @Column(precision = 5, scale = 2)
    private BigDecimal icmsRate; // Alíquota ICMS (%)

    @Column(precision = 5, scale = 2)
    private BigDecimal ipiRate; // Alíquota IPI (%)

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal stockQuantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal minStock;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}

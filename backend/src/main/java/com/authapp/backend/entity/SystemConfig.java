package com.authapp.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ownerEmail;

    // Company Info
    @Column(length = 200)
    private String companyName;

    @Column(length = 20)
    private String cnpj;

    @Column(length = 20)
    private String ie; // Inscrição Estadual

    @Column(length = 20)
    private String im; // Inscrição Municipal

    @Column(length = 200)
    private String address;

    @Column(length = 20)
    private String number;

    @Column(length = 100)
    private String complement;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String city;

    @Column(length = 2)
    private String state;

    @Column(length = 10)
    private String zipCode;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 100)
    private String website;

    @Column(columnDefinition = "TEXT")
    private String logoBase64;

    // Print Settings
    @Column(length = 50)
    private String printerName;

    @Column
    private Integer paperWidth; // mm

    @Column
    private Integer paperHeight; // mm

    @Column
    private Boolean autoPrint;

    @Column
    private Integer copies;

    // System Settings
    @Column(length = 100)
    private String systemName; // Nome que aparece no sistema

    @Column(length = 10)
    private String defaultCurrency; // BRL

    @Column(length = 10)
    private String dateFormat; // DD/MM/YYYY

    @Column(length = 10)
    private String timeFormat; // 24h

    // NFe Settings
    @Column
    private Boolean nfeEnabled;

    @Column(length = 200)
    private String nfeApiUrl;

    @Column(length = 200)
    private String nfeApiToken;

    @Column(length = 10)
    private String nfeSeries;

    @Column
    private Long nfeLastNumber;

    @Column(length = 20)
    private String nfeEnvironment; // PRODUCTION, HOMOLOGATION

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

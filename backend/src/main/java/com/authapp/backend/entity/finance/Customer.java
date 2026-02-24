package com.authapp.backend.entity.finance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "finance_customers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ownerEmail;

    @Column(nullable = false)
    private String name;

    @Column
    private String email;

    @Column
    private String phone;

    @Column(length = 20)
    private String cpfCnpj; // CPF ou CNPJ

    @Column(length = 20)
    private String ie; // Inscrição Estadual

    @Column(length = 20)
    private String im; // Inscrição Municipal

    @Column(length = 200)
    private String address; // Endereço

    @Column(length = 20)
    private String number; // Número

    @Column(length = 100)
    private String complement; // Complemento

    @Column(length = 100)
    private String district; // Bairro

    @Column(length = 100)
    private String city; // Cidade

    @Column(length = 2)
    private String state; // Estado (UF)

    @Column(length = 10)
    private String zipCode; // CEP

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}

package com.authapp.backend.repository.finance;

import com.authapp.backend.entity.finance.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByOwnerEmailOrderByNameAsc(String ownerEmail);
    Optional<Customer> findByIdAndOwnerEmail(Long id, String ownerEmail);
    long countByOwnerEmail(String ownerEmail);
}

package com.authapp.backend.repository.finance;

import com.authapp.backend.entity.finance.FinancialEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinancialEntryRepository extends JpaRepository<FinancialEntry, Long> {
    List<FinancialEntry> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
    Optional<FinancialEntry> findByIdAndOwnerEmail(Long id, String ownerEmail);
}

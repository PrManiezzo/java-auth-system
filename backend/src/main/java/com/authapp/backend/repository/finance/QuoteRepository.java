package com.authapp.backend.repository.finance;

import com.authapp.backend.entity.finance.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuoteRepository extends JpaRepository<Quote, Long> {
    List<Quote> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
    Optional<Quote> findByIdAndOwnerEmail(Long id, String ownerEmail);
}

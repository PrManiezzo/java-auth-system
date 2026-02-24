package com.authapp.backend.repository.finance;

import com.authapp.backend.entity.finance.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
}

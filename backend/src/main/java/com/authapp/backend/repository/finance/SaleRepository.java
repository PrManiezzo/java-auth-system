package com.authapp.backend.repository.finance;

import com.authapp.backend.entity.finance.Sale;
import com.authapp.backend.entity.finance.SaleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    
    List<Sale> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
    
    List<Sale> findByOwnerEmailAndStatusOrderByCreatedAtDesc(String ownerEmail, SaleStatus status);
    
    @Query("SELECT s FROM Sale s WHERE s.ownerEmail = :ownerEmail AND " +
           "(LOWER(s.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.notes) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY s.createdAt DESC")
    List<Sale> searchSales(String ownerEmail, String search);
    
    @Query("SELECT COUNT(s) FROM Sale s WHERE s.ownerEmail = :ownerEmail AND s.status = :status")
    long countByOwnerEmailAndStatus(String ownerEmail, SaleStatus status);
    
    @Query("SELECT s FROM Sale s WHERE s.ownerEmail = :ownerEmail AND " +
           "s.saleDate BETWEEN :startDate AND :endDate ORDER BY s.saleDate DESC")
    List<Sale> findByOwnerEmailAndDateRange(String ownerEmail, LocalDateTime startDate, LocalDateTime endDate);
}

package com.authapp.backend.repository.finance;

import com.authapp.backend.entity.finance.ServiceOrder;
import com.authapp.backend.entity.finance.ServiceOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {
    
    List<ServiceOrder> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
    
    List<ServiceOrder> findByOwnerEmailAndStatusOrderByCreatedAtDesc(String ownerEmail, ServiceOrderStatus status);
    
    @Query("SELECT COUNT(so) FROM ServiceOrder so WHERE so.ownerEmail = :ownerEmail AND so.status = :status")
    long countByOwnerEmailAndStatus(String ownerEmail, ServiceOrderStatus status);
}

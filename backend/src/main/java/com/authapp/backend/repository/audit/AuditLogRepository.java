package com.authapp.backend.repository.audit;

import com.authapp.backend.entity.audit.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);
    
    List<AuditLog> findByOwnerEmailOrderByTimestampDesc(String ownerEmail);
    
    List<AuditLog> findTop50ByOwnerEmailOrderByTimestampDesc(String ownerEmail);
}

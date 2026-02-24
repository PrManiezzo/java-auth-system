package com.authapp.backend.service;

import com.authapp.backend.entity.audit.AuditLog;
import com.authapp.backend.repository.audit.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logAction(String ownerEmail, String entityType, Long entityId, String action, String details) {
        logAction(ownerEmail, entityType, entityId, action, details, null, null);
    }

    public void logAction(String ownerEmail, String entityType, Long entityId, String action, 
                         String details, String oldValue, String newValue) {
        try {
            HttpServletRequest request = getCurrentRequest();
            
            AuditLog log = AuditLog.builder()
                    .ownerEmail(ownerEmail)
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .details(details)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .timestamp(LocalDateTime.now())
                    .ipAddress(request != null ? getClientIP(request) : null)
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .build();
            
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to create audit log: " + e.getMessage());
        }
    }

    public List<AuditLog> getEntityHistory(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    public List<AuditLog> getRecentActivity(String ownerEmail) {
        return auditLogRepository.findTop50ByOwnerEmailOrderByTimestampDesc(ownerEmail);
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }

    private String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}

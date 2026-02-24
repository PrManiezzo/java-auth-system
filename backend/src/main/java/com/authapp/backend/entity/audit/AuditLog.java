package com.authapp.backend.entity.audit;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ownerEmail;

    @Column(nullable = false)
    private String entityType; // SERVICE_ORDER, QUOTE, ENTRY, etc.

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private String action; // CREATED, UPDATED, STATUS_CHANGED, DELETED

    @Column(length = 1000)
    private String details;

    @Column
    private String oldValue;

    @Column
    private String newValue;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column
    private String ipAddress;

    @Column
    private String userAgent;
}

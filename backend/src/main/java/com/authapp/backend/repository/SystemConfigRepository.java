package com.authapp.backend.repository;

import com.authapp.backend.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    Optional<SystemConfig> findByOwnerEmail(String ownerEmail);
}

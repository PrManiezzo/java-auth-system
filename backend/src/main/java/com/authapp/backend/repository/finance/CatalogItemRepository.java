package com.authapp.backend.repository.finance;

import com.authapp.backend.entity.finance.CatalogItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogItemRepository extends JpaRepository<CatalogItem, Long> {
    List<CatalogItem> findByOwnerEmailOrderByNameAsc(String ownerEmail);
    Optional<CatalogItem> findByIdAndOwnerEmail(Long id, String ownerEmail);
    Optional<CatalogItem> findByQrCodeAndOwnerEmail(String qrCode, String ownerEmail);
}

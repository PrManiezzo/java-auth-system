package com.authapp.backend.controller.finance;

import com.authapp.backend.entity.finance.*;
import com.authapp.backend.repository.finance.CatalogItemRepository;
import com.authapp.backend.repository.finance.SaleRepository;
import com.authapp.backend.repository.finance.StockMovementRepository;
import com.authapp.backend.service.AuditService;
import com.authapp.backend.service.PdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/finance/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Sales management endpoints")
public class SaleController {

    private final SaleRepository saleRepository;
    private final CatalogItemRepository catalogItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuditService auditService;
    private final PdfService pdfService;

    @GetMapping
    @Operation(summary = "Get all sales")
    public ResponseEntity<List<Sale>> getAllSales(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        String userEmail = authentication.getName();
        
        List<Sale> sales;
        if (search != null && !search.trim().isEmpty()) {
            sales = saleRepository.searchSales(userEmail, search.trim());
        } else if (status != null && !status.trim().isEmpty()) {
            SaleStatus saleStatus = SaleStatus.valueOf(status.toUpperCase());
            sales = saleRepository.findByOwnerEmailAndStatusOrderByCreatedAtDesc(userEmail, saleStatus);
        } else {
            sales = saleRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail);
        }
        
        return ResponseEntity.ok(sales);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sale by ID")
    public ResponseEntity<Sale> getSaleById(
            Authentication authentication,
            @PathVariable Long id) {
        
        String userEmail = authentication.getName();
        
        return saleRepository.findById(id)
                .filter(sale -> sale.getOwnerEmail().equals(userEmail))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create a new sale")
    public ResponseEntity<?> createSale(
            Authentication authentication,
            @RequestBody Sale sale) {
        
        String userEmail = authentication.getName();
        sale.setOwnerEmail(userEmail);
        
        // Set sale reference for all items
        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                item.setSale(sale);
                // Calculate item total
                if (item.getQuantity() != null && item.getUnitPrice() != null) {
                    item.setTotal(item.getQuantity().multiply(item.getUnitPrice()));
                }
            }
        }
        
        // Calculate total
        sale.calculateTotal();
        
        // Validate and process stock for catalog items
        String stockValidation = validateStock(sale, userEmail);
        if (stockValidation != null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", stockValidation);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
        
        Sale savedSale = saleRepository.save(sale);
        
        // Process stock movement for catalog items
        processStockMovement(savedSale, userEmail);
        
        auditService.logAction(
            userEmail,
            "SALE",
            savedSale.getId(),
            "CREATE",
            "Venda criada: " + savedSale.getCustomerName() + " - R$ " + savedSale.getTotal(),
            null,
            savedSale.toString()
        );
        
        return ResponseEntity.ok(savedSale);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update sale")
    public ResponseEntity<Sale> updateSale(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Sale updatedSale) {
        
        String userEmail = authentication.getName();
        
        return saleRepository.findById(id)
                .filter(sale -> sale.getOwnerEmail().equals(userEmail))
                .map(existingSale -> {
                    String oldValue = existingSale.toString();
                    
                    existingSale.setCustomerId(updatedSale.getCustomerId());
                    existingSale.setCustomerName(updatedSale.getCustomerName());
                    existingSale.setSaleDate(updatedSale.getSaleDate());
                    existingSale.setStatus(updatedSale.getStatus());
                    existingSale.setNotes(updatedSale.getNotes());
                    
                    // Update items
                    existingSale.getItems().clear();
                    if (updatedSale.getItems() != null) {
                        for (SaleItem item : updatedSale.getItems()) {
                            item.setSale(existingSale);
                            if (item.getQuantity() != null && item.getUnitPrice() != null) {
                                item.setTotal(item.getQuantity().multiply(item.getUnitPrice()));
                            }
                            existingSale.getItems().add(item);
                        }
                    }
                    
                    existingSale.calculateTotal();
                    Sale saved = saleRepository.save(existingSale);
                    
                    auditService.logAction(
                        userEmail,
                        "SALE",
                        saved.getId(),
                        "UPDATE",
                        "Venda atualizada: " + saved.getCustomerName(),
                        oldValue,
                        saved.toString()
                    );
                    
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update sale status")
    public ResponseEntity<Sale> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam SaleStatus status) {
        
        String userEmail = authentication.getName();
        
        return saleRepository.findById(id)
                .filter(sale -> sale.getOwnerEmail().equals(userEmail))
                .map(sale -> {
                    SaleStatus oldStatus = sale.getStatus();
                    sale.setStatus(status);
                    Sale saved = saleRepository.save(sale);
                    
                    auditService.logAction(
                        userEmail,
                        "SALE",
                        saved.getId(),
                        "STATUS_CHANGE",
                        "Status alterado de " + oldStatus + " para " + status,
                        oldStatus.toString(),
                        status.toString()
                    );
                    
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete sale")
    public ResponseEntity<Void> deleteSale(
            Authentication authentication,
            @PathVariable Long id) {
        
        String userEmail = authentication.getName();
        
        return saleRepository.findById(id)
                .filter(sale -> sale.getOwnerEmail().equals(userEmail))
                .map(sale -> {
                    auditService.logAction(
                        userEmail,
                        "SALE",
                        id,
                        "DELETE",
                        "Venda deletada: " + sale.getCustomerName(),
                        sale.toString(),
                        null
                    );
                    
                    saleRepository.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Generate sale PDF")
    public ResponseEntity<byte[]> generatePdf(
            Authentication authentication,
            @PathVariable Long id) {
        
        String userEmail = authentication.getName();
        
        return saleRepository.findById(id)
                .filter(sale -> sale.getOwnerEmail().equals(userEmail))
                .map(sale -> {
                    try {
                        byte[] pdfBytes = pdfService.generateSalePdf(sale);
                        
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_PDF);
                        headers.setContentDispositionFormData("attachment", "venda-" + sale.getId() + ".pdf");
                        
                        auditService.logAction(
                            userEmail,
                            "SALE",
                            id,
                            "PDF_GENERATED",
                            "PDF da venda gerado"
                        );
                        
                        return ResponseEntity.ok()
                                .headers(headers)
                                .body(pdfBytes);
                    } catch (Exception e) {
                        return ResponseEntity.internalServerError().<byte[]>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get sale history")
    public ResponseEntity<?> getSaleHistory(
            Authentication authentication,
            @PathVariable Long id) {
        
        String userEmail = authentication.getName();
        
        return saleRepository.findById(id)
                .filter(sale -> sale.getOwnerEmail().equals(userEmail))
                .map(sale -> ResponseEntity.ok(auditService.getEntityHistory("SALE", id)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    @Operation(summary = "Get sales statistics")
    public ResponseEntity<Map<String, Object>> getStats(Authentication authentication) {
        String userEmail = authentication.getName();
        
        long totalSales = saleRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail).size();
        long pendingSales = saleRepository.countByOwnerEmailAndStatus(userEmail, SaleStatus.PENDING);
        long paidSales = saleRepository.countByOwnerEmailAndStatus(userEmail, SaleStatus.PAID);
        
        List<Sale> allSales = saleRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail);
        BigDecimal totalRevenue = allSales.stream()
                .filter(s -> s.getStatus() == SaleStatus.PAID)
                .map(Sale::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal pendingRevenue = allSales.stream()
                .filter(s -> s.getStatus() == SaleStatus.PENDING)
                .map(Sale::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSales", totalSales);
        stats.put("pendingSales", pendingSales);
        stats.put("paidSales", paidSales);
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingRevenue", pendingRevenue);
        
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Validates if there's enough stock for all catalog items in the sale
     */
    private String validateStock(Sale sale, String userEmail) {
        if (sale.getItems() == null) return null;
        
        for (SaleItem item : sale.getItems()) {
            // Only validate stock for catalog items (items with productId)
            if (item.getProductId() != null) {
                Optional<CatalogItem> catalogItem = catalogItemRepository.findByIdAndOwnerEmail(
                    item.getProductId(), userEmail
                );
                
                if (catalogItem.isPresent()) {
                    CatalogItem product = catalogItem.get();
                    
                    // Only validate stock for PRODUCT type (not SERVICE)
                    if (product.getType() == ItemType.PRODUCT) {
                        if (product.getStockQuantity().compareTo(item.getQuantity()) < 0) {
                            return "Estoque insuficiente para o produto '" + product.getName() + 
                                   "'. Disponível: " + product.getStockQuantity() + 
                                   ", Solicitado: " + item.getQuantity();
                        }
                    }
                }
            }
        }
        return null;
    }
    
    /**
     * Process stock movement (decrease stock) for catalog items in the sale
     */
    private void processStockMovement(Sale sale, String userEmail) {
        if (sale.getItems() == null) return;
        
        for (SaleItem item : sale.getItems()) {
            // Only process stock for catalog items (items with productId)
            if (item.getProductId() != null) {
                Optional<CatalogItem> catalogItem = catalogItemRepository.findByIdAndOwnerEmail(
                    item.getProductId(), userEmail
                );
                
                if (catalogItem.isPresent()) {
                    CatalogItem product = catalogItem.get();
                    
                    // Only decrease stock for PRODUCT type (not SERVICE)
                    if (product.getType() == ItemType.PRODUCT) {
                        // Decrease stock quantity
                        BigDecimal newStock = product.getStockQuantity().subtract(item.getQuantity());
                        product.setStockQuantity(newStock);
                        catalogItemRepository.save(product);
                        
                        // Create stock movement record
                        StockMovement movement = StockMovement.builder()
                            .ownerEmail(userEmail)
                            .catalogItemId(product.getId())
                            .itemName(product.getName())
                            .type(StockMovementType.OUT)
                            .quantity(item.getQuantity())
                            .reason("Venda #" + sale.getId() + " - " + sale.getCustomerName())
                            .createdAt(LocalDateTime.now())
                            .build();
                        
                        stockMovementRepository.save(movement);
                    }
                }
            }
        }
    }
}

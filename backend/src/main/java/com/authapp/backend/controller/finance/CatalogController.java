package com.authapp.backend.controller.finance;

import com.authapp.backend.dto.MessageResponse;
import com.authapp.backend.dto.finance.CatalogItemRequest;
import com.authapp.backend.dto.finance.StockAdjustmentRequest;
import com.authapp.backend.entity.finance.CatalogItem;
import com.authapp.backend.entity.finance.StockMovement;
import com.authapp.backend.entity.finance.StockMovementType;
import com.authapp.backend.repository.finance.CatalogItemRepository;
import com.authapp.backend.repository.finance.StockMovementRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance/catalog")
public class CatalogController extends FinanceBaseController {

    private static final int MAX_IMAGE_BASE64_LENGTH = 2_000_000;

    private final CatalogItemRepository catalogItemRepository;
    private final StockMovementRepository stockMovementRepository;

    public CatalogController(CatalogItemRepository catalogItemRepository,
                             StockMovementRepository stockMovementRepository) {
        this.catalogItemRepository = catalogItemRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    @GetMapping
    public ResponseEntity<?> listCatalog(Authentication authentication) {
        String ownerEmail = owner(authentication);
        List<Map<String, Object>> data = catalogItemRepository.findByOwnerEmailOrderByNameAsc(ownerEmail)
                .stream()
                .map(this::toCatalogResponse)
                .toList();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/qrcode/{qrCode}")
    public ResponseEntity<?> findByQrCode(Authentication authentication, @PathVariable String qrCode) {
        String ownerEmail = owner(authentication);
        CatalogItem item = catalogItemRepository.findByQrCodeAndOwnerEmail(qrCode, ownerEmail).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Produto não encontrado"));
        }
        return ResponseEntity.ok(toCatalogResponse(item));
    }

    @PostMapping
    public ResponseEntity<?> createCatalogItem(Authentication authentication, @Valid @RequestBody CatalogItemRequest request) {
        String ownerEmail = owner(authentication);
        String imageError = validateImage(request.productImageBase64());
        if (imageError != null) {
            return ResponseEntity.badRequest().body(new MessageResponse(imageError));
        }
        CatalogItem item = CatalogItem.builder()
                .ownerEmail(ownerEmail)
                .name(request.name().trim())
                .sku(normalize(request.sku()))
                .qrCode(normalize(request.qrCode()))
                .type(request.type())
                .unit(normalize(request.unit()))
                .unitPrice(scale(request.unitPrice()))
                .costPrice(request.costPrice() == null ? null : scale(request.costPrice()))
                .description(normalize(request.description()))
                .productImageBase64(normalize(request.productImageBase64()))
                .stockQuantity(request.stockQuantity() == null ? BigDecimal.ZERO : scale(request.stockQuantity()))
                .minStock(request.minStock() == null ? BigDecimal.ZERO : scale(request.minStock()))
                .createdAt(LocalDateTime.now())
                .build();
        catalogItemRepository.save(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(toCatalogResponse(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCatalogItem(Authentication authentication,
                                               @PathVariable Long id,
                                               @Valid @RequestBody CatalogItemRequest request) {
        String ownerEmail = owner(authentication);
        CatalogItem item = catalogItemRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Item não encontrado"));
        }
        String imageError = validateImage(request.productImageBase64());
        if (imageError != null) {
            return ResponseEntity.badRequest().body(new MessageResponse(imageError));
        }
        item.setName(request.name().trim());
        item.setSku(normalize(request.sku()));
        item.setQrCode(normalize(request.qrCode()));
        item.setType(request.type());
        item.setUnit(normalize(request.unit()));
        item.setUnitPrice(scale(request.unitPrice()));
        item.setCostPrice(request.costPrice() == null ? null : scale(request.costPrice()));
        item.setDescription(normalize(request.description()));
        item.setProductImageBase64(normalize(request.productImageBase64()));
        if (request.stockQuantity() != null) {
            item.setStockQuantity(scale(request.stockQuantity()));
        }
        if (request.minStock() != null) {
            item.setMinStock(scale(request.minStock()));
        }
        catalogItemRepository.save(item);
        return ResponseEntity.ok(toCatalogResponse(item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCatalogItem(Authentication authentication, @PathVariable Long id) {
        String ownerEmail = owner(authentication);
        CatalogItem item = catalogItemRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Item não encontrado"));
        }
        catalogItemRepository.delete(item);
        return ResponseEntity.ok(new MessageResponse("Item removido"));
    }

    @PostMapping("/{id}/stock-adjust")
    public ResponseEntity<?> adjustStock(Authentication authentication,
                                         @PathVariable Long id,
                                         @Valid @RequestBody StockAdjustmentRequest request) {
        String ownerEmail = owner(authentication);
        CatalogItem item = catalogItemRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Item não encontrado"));
        }

        BigDecimal delta = scale(request.quantity());
        if (request.type() == StockMovementType.OUT) {
            delta = delta.negate();
        }

        BigDecimal newQty = item.getStockQuantity().add(delta);
        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body(new MessageResponse("Estoque insuficiente"));
        }

        item.setStockQuantity(scale(newQty));
        catalogItemRepository.save(item);

        StockMovement movement = StockMovement.builder()
                .ownerEmail(ownerEmail)
                .catalogItemId(item.getId())
                .itemName(item.getName())
                .type(request.type())
                .quantity(scale(request.quantity()))
                .reason(normalize(request.reason()))
                .createdAt(LocalDateTime.now())
                .build();
        stockMovementRepository.save(movement);

        return ResponseEntity.ok(Map.of(
                "message", "Estoque atualizado",
                "item", toCatalogResponse(item)
        ));
    }

    @GetMapping("/stock/low")
    public ResponseEntity<?> listLowStock(Authentication authentication) {
        String ownerEmail = owner(authentication);
        List<Map<String, Object>> lowStock = catalogItemRepository.findByOwnerEmailOrderByNameAsc(ownerEmail)
                .stream()
                .filter(item -> item.getStockQuantity().compareTo(item.getMinStock()) <= 0)
                .map(this::toCatalogResponse)
                .toList();
        return ResponseEntity.ok(lowStock);
    }

    @GetMapping("/stock/movements")
    public ResponseEntity<?> listStockMovements(Authentication authentication) {
        String ownerEmail = owner(authentication);
        List<Map<String, Object>> data = stockMovementRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail)
                .stream()
                .map(this::toStockMovementResponse)
                .toList();
        return ResponseEntity.ok(data);
    }

    private Map<String, Object> toCatalogResponse(CatalogItem item) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", item.getId());
        response.put("name", item.getName());
        response.put("sku", item.getSku() == null ? "" : item.getSku());
        response.put("qrCode", item.getQrCode() == null ? "" : item.getQrCode());
        response.put("type", item.getType());
        response.put("unit", item.getUnit() == null ? "" : item.getUnit());
        response.put("unitPrice", item.getUnitPrice());
        response.put("costPrice", item.getCostPrice() == null ? BigDecimal.ZERO : item.getCostPrice());
        response.put("description", item.getDescription() == null ? "" : item.getDescription());
        response.put("productImageBase64", item.getProductImageBase64() == null ? "" : item.getProductImageBase64());
        response.put("stockQuantity", item.getStockQuantity());
        response.put("minStock", item.getMinStock());
        response.put("createdAt", item.getCreatedAt());
        return response;
    }

    private String validateImage(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        if (!normalized.startsWith("data:image/")) {
            return "Formato de imagem invalido";
        }
        if (normalized.length() > MAX_IMAGE_BASE64_LENGTH) {
            return "Imagem muito grande";
        }
        return null;
    }

    private Map<String, Object> toStockMovementResponse(StockMovement movement) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", movement.getId());
        response.put("catalogItemId", movement.getCatalogItemId());
        response.put("itemName", movement.getItemName());
        response.put("type", movement.getType());
        response.put("quantity", movement.getQuantity());
        response.put("reason", movement.getReason() == null ? "" : movement.getReason());
        response.put("createdAt", movement.getCreatedAt());
        return response;
    }
}

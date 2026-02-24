package com.authapp.backend.controller.finance;

import com.authapp.backend.entity.finance.*;
import com.authapp.backend.repository.finance.CatalogItemRepository;
import com.authapp.backend.repository.finance.StockMovementRepository;
import com.authapp.backend.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/finance/nfe-import")
@RequiredArgsConstructor
@Tag(name = "NFe Import", description = "Import stock from NFe XML")
public class NFeImportController {

    private final CatalogItemRepository catalogItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuditService auditService;

    @PostMapping("/upload")
    @Operation(summary = "Upload NFe XML and import stock")
    public ResponseEntity<?> uploadNFeXml(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        
        String userEmail = authentication.getName();
        
        try {
            // Parse XML
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(file.getBytes()));
            doc.getDocumentElement().normalize();
            
            // Extract NFe info
            String nfeNumber = extractValue(doc, "nNF");
            String nfeKey = extractValue(doc, "chNFe");
            String issuer = extractValueFromPath(doc, "emit", "xNome");
            
            // Extract items
            NodeList itemNodes = doc.getElementsByTagName("det");
            List<Map<String, Object>> importedItems = new ArrayList<>();
            int itemsImported = 0;
            int itemsUpdated = 0;
            
            for (int i = 0; i < itemNodes.getLength(); i++) {
                Element detElement = (Element) itemNodes.item(i);
                
                // Extract product info
                Element prodElement = (Element) detElement.getElementsByTagName("prod").item(0);
                
                String code = getElementText(prodElement, "cProd");
                String ean = getElementText(prodElement, "cEAN");
                String name = getElementText(prodElement, "xProd");
                String ncm = getElementText(prodElement, "NCM");
                String cfop = getElementText(prodElement, "CFOP");
                String unit = getElementText(prodElement, "uCom");
                String qComStr = getElementText(prodElement, "qCom");
                String vUnComStr = getElementText(prodElement, "vUnCom");
                
                // Parse numeric values
                BigDecimal quantity = new BigDecimal(qComStr.replace(",", "."));
                BigDecimal unitPrice = new BigDecimal(vUnComStr.replace(",", "."));
                
                // Check if product exists in catalog (by EAN/code)
                Optional<CatalogItem> existingItem = Optional.empty();
                
                // Try to find by QR code (EAN)
                if (ean != null && !ean.isEmpty() && !ean.equals("SEM GTIN")) {
                    existingItem = catalogItemRepository.findByQrCodeAndOwnerEmail(ean, userEmail);
                }
                
                // Try to find by SKU (code)
                if (existingItem.isEmpty()) {
                    List<CatalogItem> items = catalogItemRepository.findByOwnerEmailOrderByNameAsc(userEmail);
                    existingItem = items.stream()
                            .filter(item -> code.equals(item.getSku()))
                            .findFirst();
                }
                
                if (existingItem.isPresent()) {
                    // Update existing item stock
                    CatalogItem item = existingItem.get();
                    BigDecimal oldStock = item.getStockQuantity();
                    BigDecimal newStock = oldStock.add(quantity);
                    item.setStockQuantity(newStock);
                    
                    // Update price if needed
                    if (unitPrice.compareTo(BigDecimal.ZERO) > 0) {
                        item.setCostPrice(unitPrice);
                    }
                    
                    // Update NCM and CFOP if available
                    if (ncm != null && !ncm.isEmpty()) {
                        item.setNcm(ncm);
                    }
                    if (cfop != null && !cfop.isEmpty()) {
                        item.setCfop(cfop);
                    }
                    
                    catalogItemRepository.save(item);
                    
                    // Create stock movement
                    StockMovement movement = StockMovement.builder()
                            .ownerEmail(userEmail)
                            .catalogItemId(item.getId())
                            .itemName(item.getName())
                            .type(StockMovementType.IN)
                            .quantity(quantity)
                            .reason("Entrada via NFe " + nfeNumber + " - " + issuer)
                            .createdAt(LocalDateTime.now())
                            .build();
                    stockMovementRepository.save(movement);
                    
                    Map<String, Object> itemInfo = new HashMap<>();
                    itemInfo.put("name", name);
                    itemInfo.put("quantity", quantity);
                    itemInfo.put("status", "updated");
                    itemInfo.put("oldStock", oldStock);
                    itemInfo.put("newStock", newStock);
                    importedItems.add(itemInfo);
                    
                    itemsUpdated++;
                } else {
                    // Create new item in catalog
                    CatalogItem newItem = CatalogItem.builder()
                            .ownerEmail(userEmail)
                            .name(name)
                            .sku(code)
                            .qrCode(ean != null && !ean.equals("SEM GTIN") ? ean : null)
                            .type(ItemType.PRODUCT)
                            .unit(unit)
                            .unitPrice(unitPrice.multiply(new BigDecimal("1.3"))) // 30% markup
                            .costPrice(unitPrice)
                            .ncm(ncm)
                            .cfop(cfop)
                            .stockQuantity(quantity)
                            .minStock(BigDecimal.ZERO)
                            .createdAt(LocalDateTime.now())
                            .build();
                    
                    CatalogItem saved = catalogItemRepository.save(newItem);
                    
                    // Create stock movement
                    StockMovement movement = StockMovement.builder()
                            .ownerEmail(userEmail)
                            .catalogItemId(saved.getId())
                            .itemName(saved.getName())
                            .type(StockMovementType.IN)
                            .quantity(quantity)
                            .reason("Entrada inicial via NFe " + nfeNumber + " - " + issuer)
                            .createdAt(LocalDateTime.now())
                            .build();
                    stockMovementRepository.save(movement);
                    
                    Map<String, Object> itemInfo = new HashMap<>();
                    itemInfo.put("name", name);
                    itemInfo.put("quantity", quantity);
                    itemInfo.put("status", "created");
                    itemInfo.put("newStock", quantity);
                    importedItems.add(itemInfo);
                    
                    itemsImported++;
                }
            }
            
            // Log audit
            auditService.logAction(
                    userEmail,
                    "NFE_IMPORT",
                    null,
                    "IMPORT",
                    "NFe " + nfeNumber + " importada: " + itemsImported + " novos, " + itemsUpdated + " atualizados"
            );
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("nfeNumber", nfeNumber);
            response.put("nfeKey", nfeKey);
            response.put("issuer", issuer);
            response.put("totalItems", itemNodes.getLength());
            response.put("itemsImported", itemsImported);
            response.put("itemsUpdated", itemsUpdated);
            response.put("items", importedItems);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro ao processar XML: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    private String extractValue(Document doc, String tagName) {
        NodeList nodes = doc.getElementsByTagName(tagName);
        if (nodes.getLength() > 0) {
            return nodes.item(0).getTextContent();
        }
        return "";
    }
    
    private String extractValueFromPath(Document doc, String parentTag, String childTag) {
        NodeList parentNodes = doc.getElementsByTagName(parentTag);
        if (parentNodes.getLength() > 0) {
            Element parent = (Element) parentNodes.item(0);
            NodeList childNodes = parent.getElementsByTagName(childTag);
            if (childNodes.getLength() > 0) {
                return childNodes.item(0).getTextContent();
            }
        }
        return "";
    }
    
    private String getElementText(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        if (nodes.getLength() > 0) {
            return nodes.item(0).getTextContent();
        }
        return "";
    }
}

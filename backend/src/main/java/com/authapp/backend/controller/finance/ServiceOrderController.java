package com.authapp.backend.controller.finance;

import com.authapp.backend.dto.finance.ServiceOrderItemRequest;
import com.authapp.backend.dto.finance.ServiceOrderRequest;
import com.authapp.backend.entity.finance.ServiceOrder;
import com.authapp.backend.entity.finance.ServiceOrderItem;
import com.authapp.backend.entity.finance.ServiceOrderStatus;
import com.authapp.backend.repository.finance.ServiceOrderRepository;
import com.authapp.backend.service.AuditService;
import com.authapp.backend.service.EmailService;
import com.authapp.backend.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance/service-orders")
public class ServiceOrderController {

    private final ServiceOrderRepository serviceOrderRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final PdfService pdfService;

    public ServiceOrderController(ServiceOrderRepository serviceOrderRepository,
                                 AuditService auditService,
                                 EmailService emailService,
                                 PdfService pdfService) {
        this.serviceOrderRepository = serviceOrderRepository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.pdfService = pdfService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ServiceOrderRequest request, Principal principal) {
        try {
            String ownerEmail = principal.getName();
            
            ServiceOrder serviceOrder = ServiceOrder.builder()
                    .ownerEmail(ownerEmail)
                    .customerId(request.getCustomerId())
                    .customerName(request.getCustomerName())
                    .customerPhone(request.getCustomerPhone())
                    .customerAddress(request.getCustomerAddress())
                    .status(request.getStatus() != null ? request.getStatus() : ServiceOrderStatus.PENDING)
                    .startDate(request.getStartDate())
                    .estimatedEndDate(request.getEstimatedEndDate())
                    .description(request.getDescription())
                    .technicianNotes(request.getTechnicianNotes())
                    .assignedTechnician(request.getAssignedTechnician())
                    .laborCost(BigDecimal.ZERO)
                    .partsCost(BigDecimal.ZERO)
                    .total(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            BigDecimal laborCost = BigDecimal.ZERO;
            BigDecimal partsCost = BigDecimal.ZERO;
            
            if (request.getItems() != null) {
                for (ServiceOrderItemRequest itemReq : request.getItems()) {
                    BigDecimal itemTotal = itemReq.getUnitPrice()
                            .multiply(BigDecimal.valueOf(itemReq.getQuantity()));
                    
                    ServiceOrderItem item = ServiceOrderItem.builder()
                            .serviceOrder(serviceOrder)
                            .catalogId(itemReq.getCatalogId())
                            .itemName(itemReq.getItemName())
                            .description(itemReq.getDescription())
                            .quantity(itemReq.getQuantity())
                            .unitPrice(itemReq.getUnitPrice())
                            .total(itemTotal)
                            .isService(itemReq.getIsService() != null ? itemReq.getIsService() : false)
                            .build();
                    
                    serviceOrder.getItems().add(item);
                    
                    if (item.getIsService()) {
                        laborCost = laborCost.add(itemTotal);
                    } else {
                        partsCost = partsCost.add(itemTotal);
                    }
                }
            }
            
            serviceOrder.setLaborCost(laborCost);
            serviceOrder.setPartsCost(partsCost);
            serviceOrder.setTotal(laborCost.add(partsCost));
            
            ServiceOrder saved = serviceOrderRepository.save(serviceOrder);
            
            // Audit log
            auditService.logAction(ownerEmail, "SERVICE_ORDER", saved.getId(), "CREATED", 
                "Ordem de serviço criada para " + saved.getCustomerName());
            
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erro ao criar ordem de serviço: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<List<ServiceOrder>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Principal principal) {
        String ownerEmail = principal.getName();
        List<ServiceOrder> orders = serviceOrderRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        
        // Filter by status if provided
        if (status != null && !status.isEmpty()) {
            ServiceOrderStatus statusEnum = ServiceOrderStatus.valueOf(status);
            orders = orders.stream()
                .filter(o -> o.getStatus() == statusEnum)
                .toList();
        }
        
        // Search filter
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            orders = orders.stream()
                .filter(o -> o.getCustomerName().toLowerCase().contains(searchLower) ||
                            o.getDescription().toLowerCase().contains(searchLower) ||
                            (o.getAssignedTechnician() != null && o.getAssignedTechnician().toLowerCase().contains(searchLower)))
                .toList();
        }
        
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, Principal principal) {
        String ownerEmail = principal.getName();
        return serviceOrderRepository.findById(id)
                .filter(order -> order.getOwnerEmail().equals(ownerEmail))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, 
                                         @RequestBody Map<String, String> request, 
                                         Principal principal) {
        String ownerEmail = principal.getName();
        
        return serviceOrderRepository.findById(id)
                .filter(order -> order.getOwnerEmail().equals(ownerEmail))
                .map(order -> {
                    ServiceOrderStatus oldStatus = order.getStatus();
                    ServiceOrderStatus newStatus = ServiceOrderStatus.valueOf(request.get("status"));
                    order.setStatus(newStatus);
                    order.setUpdatedAt(LocalDateTime.now());
                    
                    if (newStatus == ServiceOrderStatus.COMPLETED && order.getCompletedDate() == null) {
                        order.setCompletedDate(java.time.LocalDate.now());
                    }
                    
                    ServiceOrder updated = serviceOrderRepository.save(order);
                    
                    // Audit log
                    auditService.logAction(ownerEmail, "SERVICE_ORDER", id, "STATUS_CHANGED",
                        "Status alterado de " + oldStatus + " para " + newStatus,
                        oldStatus.name(), newStatus.name());
                    
                    // Send email notification
                    try {
                        emailService.sendServiceOrderStatusNotification(updated, oldStatus, ownerEmail);
                    } catch (Exception e) {
                        System.err.println("Failed to send notification: " + e.getMessage());
                    }
                    
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id, Principal principal) {
        String ownerEmail = principal.getName();
        
        return serviceOrderRepository.findById(id)
                .filter(order -> order.getOwnerEmail().equals(ownerEmail))
                .map(order -> {
                    try {
                        byte[] pdf = pdfService.generateServiceOrderPdf(order);
                        
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_PDF);
                        headers.setContentDispositionFormData("attachment", "OS_" + id + ".pdf");
                        
                        // Audit log
                        auditService.logAction(ownerEmail, "SERVICE_ORDER", id, "PDF_GENERATED",
                            "PDF gerado para OS #" + id);
                        
                        return ResponseEntity.ok()
                                .headers(headers)
                                .body(pdf);
                    } catch (Exception e) {
                        return ResponseEntity.internalServerError().<byte[]>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long id, Principal principal) {
        String ownerEmail = principal.getName();
        
        return serviceOrderRepository.findById(id)
                .filter(order -> order.getOwnerEmail().equals(ownerEmail))
                .map(order -> {
                    var history = auditService.getEntityHistory("SERVICE_ORDER", id);
                    return ResponseEntity.ok(history);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Principal principal) {
        String ownerEmail = principal.getName();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", serviceOrderRepository.countByOwnerEmailAndStatus(ownerEmail, ServiceOrderStatus.PENDING));
        stats.put("inProgress", serviceOrderRepository.countByOwnerEmailAndStatus(ownerEmail, ServiceOrderStatus.IN_PROGRESS));
        stats.put("completed", serviceOrderRepository.countByOwnerEmailAndStatus(ownerEmail, ServiceOrderStatus.COMPLETED));
        stats.put("total", serviceOrderRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail).size());
        
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        String ownerEmail = principal.getName();
        
        return serviceOrderRepository.findById(id)
                .filter(order -> order.getOwnerEmail().equals(ownerEmail))
                .map(order -> {
                    serviceOrderRepository.delete(order);
                    return ResponseEntity.ok().body(Map.of("message", "Ordem de serviço excluída"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

package com.authapp.backend.controller.finance;

import com.authapp.backend.dto.MessageResponse;
import com.authapp.backend.dto.finance.QuoteItemRequest;
import com.authapp.backend.dto.finance.QuoteRequest;
import com.authapp.backend.entity.finance.Quote;
import com.authapp.backend.entity.finance.QuoteItem;
import com.authapp.backend.repository.finance.QuoteRepository;
import com.authapp.backend.service.AuditService;
import com.authapp.backend.service.PdfService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance/quotes")
public class QuoteController extends FinanceBaseController {

    private final QuoteRepository quoteRepository;
    private final AuditService auditService;
    private final PdfService pdfService;

    public QuoteController(QuoteRepository quoteRepository, AuditService auditService, PdfService pdfService) {
        this.quoteRepository = quoteRepository;
        this.auditService = auditService;
        this.pdfService = pdfService;
    }

    @GetMapping
    public ResponseEntity<?> listQuotes(Authentication authentication) {
        String ownerEmail = owner(authentication);
        List<Map<String, Object>> data = quoteRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail)
                .stream()
                .map(this::toQuoteResponse)
                .toList();
        return ResponseEntity.ok(data);
    }

    @PostMapping
    public ResponseEntity<?> createQuote(Authentication authentication, @Valid @RequestBody QuoteRequest request) {
        String ownerEmail = owner(authentication);
        Quote quote = buildQuote(ownerEmail, request, Quote.builder().build());
        quote.setCreatedAt(LocalDateTime.now());
        quoteRepository.save(quote);
        return ResponseEntity.status(HttpStatus.CREATED).body(toQuoteResponse(quote));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuote(Authentication authentication,
                                         @PathVariable Long id,
                                         @Valid @RequestBody QuoteRequest request) {
        String ownerEmail = owner(authentication);
        Quote quote = quoteRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (quote == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Orçamento não encontrado"));
        }
        buildQuote(ownerEmail, request, quote);
        quoteRepository.save(quote);
        return ResponseEntity.ok(toQuoteResponse(quote));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuote(Authentication authentication, @PathVariable Long id) {
        String ownerEmail = owner(authentication);
        Quote quote = quoteRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (quote == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Orçamento não encontrado"));
        }
        quoteRepository.delete(quote);
        return ResponseEntity.ok(new MessageResponse("Orçamento removido"));
    }

    private Quote buildQuote(String ownerEmail, QuoteRequest request, Quote quote) {
        quote.setOwnerEmail(ownerEmail);
        quote.setCustomerId(request.customerId());
        quote.setCustomerName(request.customerName().trim());
        quote.setStatus(request.status());
        quote.setIssueDate(request.issueDate());
        quote.setValidUntil(request.validUntil());
        quote.setNotes(normalize(request.notes()));

        List<QuoteItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (QuoteItemRequest itemRequest : request.items()) {
            BigDecimal quantity = scale(itemRequest.quantity());
            BigDecimal unitPrice = scale(itemRequest.unitPrice());
            BigDecimal total = scale(quantity.multiply(unitPrice));
            subtotal = subtotal.add(total);

            QuoteItem item = QuoteItem.builder()
                    .quote(quote)
                    .catalogItemId(itemRequest.catalogItemId())
                    .description(itemRequest.description().trim())
                    .unit(normalize(itemRequest.unit()))
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .total(total)
                    .build();
            items.add(item);
        }

        quote.getItems().clear();
        quote.getItems().addAll(items);
        quote.setSubtotal(scale(subtotal));
        quote.setTotal(scale(subtotal));
        return quote;
    }

    private Map<String, Object> toQuoteResponse(Quote quote) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", quote.getId());
        response.put("customerId", quote.getCustomerId());
        response.put("customerName", quote.getCustomerName());
        response.put("status", quote.getStatus());
        response.put("issueDate", quote.getIssueDate());
        response.put("validUntil", quote.getValidUntil());
        response.put("notes", quote.getNotes() == null ? "" : quote.getNotes());
        response.put("subtotal", quote.getSubtotal());
        response.put("total", quote.getTotal());
        response.put("createdAt", quote.getCreatedAt());
        response.put("items", quote.getItems().stream().map(item -> {
            Map<String, Object> itemResponse = new LinkedHashMap<>();
            itemResponse.put("id", item.getId());
            itemResponse.put("catalogItemId", item.getCatalogItemId());
            itemResponse.put("description", item.getDescription());
            itemResponse.put("unit", item.getUnit() == null ? "" : item.getUnit());
            itemResponse.put("quantity", item.getQuantity());
            itemResponse.put("unitPrice", item.getUnitPrice());
            itemResponse.put("total", item.getTotal());
            return itemResponse;
        }).toList());
        return response;
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id, Authentication authentication) {
        String ownerEmail = owner(authentication);
        
        return quoteRepository.findById(id)
                .filter(quote -> quote.getOwnerEmail().equals(ownerEmail))
                .map(quote -> {
                    try {
                        byte[] pdf = pdfService.generateQuotePdf(quote);
                        
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_PDF);
                        headers.setContentDispositionFormData("attachment", "Orcamento_" + id + ".pdf");
                        
                        auditService.logAction(ownerEmail, "QUOTE", id, "PDF_GENERATED",
                            "PDF gerado para orçamento #" + id);
                        
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
    public ResponseEntity<?> getHistory(@PathVariable Long id, Authentication authentication) {
        String ownerEmail = owner(authentication);
        
        return quoteRepository.findById(id)
                .filter(quote -> quote.getOwnerEmail().equals(ownerEmail))
                .map(quote -> {
                    var history = auditService.getEntityHistory("QUOTE", id);
                    return ResponseEntity.ok(history);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

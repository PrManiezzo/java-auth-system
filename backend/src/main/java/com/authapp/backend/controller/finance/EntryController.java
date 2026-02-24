package com.authapp.backend.controller.finance;

import com.authapp.backend.dto.MessageResponse;
import com.authapp.backend.dto.finance.FinancialEntryRequest;
import com.authapp.backend.entity.finance.FinancialEntry;
import com.authapp.backend.repository.finance.FinancialEntryRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance/entries")
public class EntryController extends FinanceBaseController {

    private final FinancialEntryRepository financialEntryRepository;

    public EntryController(FinancialEntryRepository financialEntryRepository) {
        this.financialEntryRepository = financialEntryRepository;
    }

    @GetMapping
    public ResponseEntity<?> listEntries(Authentication authentication) {
        String ownerEmail = owner(authentication);
        List<Map<String, Object>> data = financialEntryRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail)
                .stream()
                .map(this::toEntryResponse)
                .toList();
        return ResponseEntity.ok(data);
    }

    @PostMapping
    public ResponseEntity<?> createEntry(Authentication authentication, @Valid @RequestBody FinancialEntryRequest request) {
        String ownerEmail = owner(authentication);
        FinancialEntry entry = FinancialEntry.builder()
                .ownerEmail(ownerEmail)
                .type(request.type())
                .status(request.status())
                .amount(scale(request.amount()))
                .category(request.category().trim())
                .description(request.description().trim())
                .dueDate(request.dueDate())
                .paidDate(request.paidDate())
                .createdAt(LocalDateTime.now())
                .build();
        financialEntryRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED).body(toEntryResponse(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEntry(Authentication authentication,
                                         @PathVariable Long id,
                                         @Valid @RequestBody FinancialEntryRequest request) {
        String ownerEmail = owner(authentication);
        FinancialEntry entry = financialEntryRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (entry == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Lançamento não encontrado"));
        }
        entry.setType(request.type());
        entry.setStatus(request.status());
        entry.setAmount(scale(request.amount()));
        entry.setCategory(request.category().trim());
        entry.setDescription(request.description().trim());
        entry.setDueDate(request.dueDate());
        entry.setPaidDate(request.paidDate());
        financialEntryRepository.save(entry);
        return ResponseEntity.ok(toEntryResponse(entry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEntry(Authentication authentication, @PathVariable Long id) {
        String ownerEmail = owner(authentication);
        FinancialEntry entry = financialEntryRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (entry == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Lançamento não encontrado"));
        }
        financialEntryRepository.delete(entry);
        return ResponseEntity.ok(new MessageResponse("Lançamento removido"));
    }

    private Map<String, Object> toEntryResponse(FinancialEntry entry) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", entry.getId());
        response.put("type", entry.getType());
        response.put("status", entry.getStatus());
        response.put("amount", entry.getAmount());
        response.put("category", entry.getCategory());
        response.put("description", entry.getDescription());
        response.put("dueDate", entry.getDueDate());
        response.put("paidDate", entry.getPaidDate());
        response.put("createdAt", entry.getCreatedAt());
        return response;
    }
}

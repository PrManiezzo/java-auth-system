package com.authapp.backend.controller.finance;

import com.authapp.backend.entity.finance.EntryStatus;
import com.authapp.backend.entity.finance.EntryType;
import com.authapp.backend.entity.finance.FinancialEntry;
import com.authapp.backend.entity.finance.Quote;
import com.authapp.backend.entity.finance.QuoteStatus;
import com.authapp.backend.repository.finance.CatalogItemRepository;
import com.authapp.backend.repository.finance.CustomerRepository;
import com.authapp.backend.repository.finance.FinancialEntryRepository;
import com.authapp.backend.repository.finance.QuoteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance/summary")
public class SummaryController extends FinanceBaseController {

    private final FinancialEntryRepository financialEntryRepository;
    private final QuoteRepository quoteRepository;
    private final CustomerRepository customerRepository;
    private final CatalogItemRepository catalogItemRepository;

    public SummaryController(FinancialEntryRepository financialEntryRepository,
                             QuoteRepository quoteRepository,
                             CustomerRepository customerRepository,
                             CatalogItemRepository catalogItemRepository) {
        this.financialEntryRepository = financialEntryRepository;
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
        this.catalogItemRepository = catalogItemRepository;
    }

    @GetMapping
    public ResponseEntity<?> summary(Authentication authentication,
                                     @RequestParam(required = false) String month) {
        String ownerEmail = owner(authentication);
        YearMonth yearMonth = month == null || month.isBlank() ? YearMonth.now() : YearMonth.parse(month);

        List<FinancialEntry> allEntries = financialEntryRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        BigDecimal monthlyIncome = BigDecimal.ZERO;
        BigDecimal monthlyExpense = BigDecimal.ZERO;
        BigDecimal totalPending = BigDecimal.ZERO;
        BigDecimal paidIncome = BigDecimal.ZERO;
        BigDecimal paidExpense = BigDecimal.ZERO;

        for (FinancialEntry entry : allEntries) {
            LocalDate referenceDate = entry.getPaidDate() != null ? entry.getPaidDate() : entry.getDueDate();
            if (referenceDate == null) {
                referenceDate = entry.getCreatedAt().toLocalDate();
            }

            if (entry.getStatus() == EntryStatus.PENDING) {
                totalPending = totalPending.add(entry.getAmount());
            }

            if (entry.getStatus() == EntryStatus.PAID) {
                if (entry.getType() == EntryType.INCOME) {
                    paidIncome = paidIncome.add(entry.getAmount());
                } else {
                    paidExpense = paidExpense.add(entry.getAmount());
                }
            }

            if (YearMonth.from(referenceDate).equals(yearMonth)) {
                if (entry.getType() == EntryType.INCOME) {
                    monthlyIncome = monthlyIncome.add(entry.getAmount());
                } else {
                    monthlyExpense = monthlyExpense.add(entry.getAmount());
                }
            }
        }

        List<Quote> quotes = quoteRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        long approvedQuotes = quotes.stream().filter(q -> q.getStatus() == QuoteStatus.APPROVED).count();
        long openQuotes = quotes.stream().filter(q -> q.getStatus() == QuoteStatus.DRAFT || q.getStatus() == QuoteStatus.SENT).count();
        long lowStock = catalogItemRepository.findByOwnerEmailOrderByNameAsc(ownerEmail)
                .stream()
                .filter(item -> item.getStockQuantity().compareTo(item.getMinStock()) <= 0)
                .count();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("month", yearMonth.toString());
        response.put("monthlyIncome", scale(monthlyIncome));
        response.put("monthlyExpense", scale(monthlyExpense));
        response.put("monthlyBalance", scale(monthlyIncome.subtract(monthlyExpense)));
        response.put("totalPending", scale(totalPending));
        response.put("paidBalance", scale(paidIncome.subtract(paidExpense)));
        response.put("approvedQuotes", approvedQuotes);
        response.put("openQuotes", openQuotes);
        response.put("customers", customerRepository.findByOwnerEmailOrderByNameAsc(ownerEmail).size());
        response.put("lowStock", lowStock);
        return ResponseEntity.ok(response);
    }
}

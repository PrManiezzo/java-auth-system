package com.authapp.backend.controller;

import com.authapp.backend.entity.finance.ServiceOrderStatus;
import com.authapp.backend.entity.finance.Sale;
import com.authapp.backend.entity.finance.SaleStatus;
import com.authapp.backend.entity.finance.SaleItem;
import com.authapp.backend.repository.finance.*;
import com.authapp.backend.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ServiceOrderRepository serviceOrderRepository;
    private final QuoteRepository quoteRepository;
    private final CustomerRepository customerRepository;
    private final FinancialEntryRepository financialEntryRepository;
    private final CatalogItemRepository catalogItemRepository;
    private final SaleRepository saleRepository;
    private final AuditService auditService;

    public DashboardController(ServiceOrderRepository serviceOrderRepository,
                              QuoteRepository quoteRepository,
                              CustomerRepository customerRepository,
                              FinancialEntryRepository financialEntryRepository,
                              CatalogItemRepository catalogItemRepository,
                              SaleRepository saleRepository,
                              AuditService auditService) {
        this.serviceOrderRepository = serviceOrderRepository;
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
        this.financialEntryRepository = financialEntryRepository;
        this.catalogItemRepository = catalogItemRepository;
        this.saleRepository = saleRepository;
        this.auditService = auditService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(Principal principal) {
        String ownerEmail = principal.getName();
        Map<String, Object> stats = new HashMap<>();

        // Service Orders Stats
        stats.put("serviceOrders", getServiceOrdersStats(ownerEmail));

        // Quotes Stats
        stats.put("quotes", getQuotesStats(ownerEmail));

        // Financial Stats
        stats.put("financial", getFinancialStats(ownerEmail));

        // Recent Activity
        stats.put("recentActivity", auditService.getRecentActivity(ownerEmail).stream()
                .limit(10)
                .map(log -> {
                    Map<String, Object> activity = new HashMap<>();
                    activity.put("id", log.getId());
                    activity.put("entityType", log.getEntityType());
                    activity.put("entityId", log.getEntityId());
                    activity.put("action", log.getAction());
                    activity.put("details", log.getDetails());
                    activity.put("timestamp", log.getTimestamp());
                    return activity;
                })
                .toList());

        // Low Stock Items
        long lowStockCount = catalogItemRepository.findByOwnerEmailOrderByNameAsc(ownerEmail).stream()
                .filter(item -> item.getStockQuantity().compareTo(item.getMinStock()) <= 0)
                .count();
        stats.put("lowStock", lowStockCount);

        // Customers Count
        stats.put("customersCount", customerRepository.countByOwnerEmail(ownerEmail));

        return ResponseEntity.ok(stats);
    }

    private Map<String, Object> getServiceOrdersStats(String ownerEmail) {
        Map<String, Object> stats = new HashMap<>();
        
        var allOrders = serviceOrderRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        
        stats.put("total", allOrders.size());
        stats.put("pending", allOrders.stream().filter(o -> o.getStatus() == ServiceOrderStatus.PENDING).count());
        stats.put("inProgress", allOrders.stream().filter(o -> o.getStatus() == ServiceOrderStatus.IN_PROGRESS).count());
        stats.put("completed", allOrders.stream().filter(o -> o.getStatus() == ServiceOrderStatus.COMPLETED).count());
        stats.put("paused", allOrders.stream().filter(o -> o.getStatus() == ServiceOrderStatus.PAUSED).count());
        stats.put("cancelled", allOrders.stream().filter(o -> o.getStatus() == ServiceOrderStatus.CANCELLED).count());
        
        // Monthly trend
        YearMonth currentMonth = YearMonth.now();
        long thisMonth = allOrders.stream()
                .filter(o -> {
                    YearMonth orderMonth = YearMonth.from(o.getStartDate());
                    return orderMonth.equals(currentMonth);
                })
                .count();
        
        stats.put("thisMonth", thisMonth);
        
        // Revenue from completed orders
        BigDecimal revenue = allOrders.stream()
                .filter(o -> o.getStatus() == ServiceOrderStatus.COMPLETED)
                .map(o -> o.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.put("revenue", revenue);
        
        return stats;
    }

    private Map<String, Object> getQuotesStats(String ownerEmail) {
        Map<String, Object> stats = new HashMap<>();
        
        var allQuotes = quoteRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        
        stats.put("total", allQuotes.size());
        
        // Count by status
        Map<String, Long> byStatus = allQuotes.stream()
                .collect(Collectors.groupingBy(
                    q -> q.getStatus().name(),
                    Collectors.counting()
                ));
        
        stats.put("draft", byStatus.getOrDefault("DRAFT", 0L));
        stats.put("sent", byStatus.getOrDefault("SENT", 0L));
        stats.put("approved", byStatus.getOrDefault("APPROVED", 0L));
        stats.put("rejected", byStatus.getOrDefault("REJECTED", 0L));
        
        // Conversion rate
        long sent = byStatus.getOrDefault("SENT", 0L);
        long approved = byStatus.getOrDefault("APPROVED", 0L);
        double conversionRate = sent > 0 ? (approved * 100.0 / sent) : 0;
        stats.put("conversionRate", Math.round(conversionRate * 100.0) / 100.0);
        
        // Total value
        BigDecimal totalValue = allQuotes.stream()
                .map(q -> q.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.put("totalValue", totalValue);
        
        return stats;
    }

    private Map<String, Object> getFinancialStats(String ownerEmail) {
        Map<String, Object> stats = new HashMap<>();
        
        var entries = financialEntryRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        
        // Current month
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();
        
        BigDecimal monthlyIncome = entries.stream()
                .filter(e -> "INCOME".equals(e.getType()) && 
                            e.getDueDate() != null &&
                            !e.getDueDate().isBefore(startOfMonth) && 
                            !e.getDueDate().isAfter(endOfMonth))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal monthlyExpense = entries.stream()
                .filter(e -> "EXPENSE".equals(e.getType()) && 
                            e.getDueDate() != null &&
                            !e.getDueDate().isBefore(startOfMonth) && 
                            !e.getDueDate().isAfter(endOfMonth))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.put("monthlyIncome", monthlyIncome);
        stats.put("monthlyExpense", monthlyExpense);
        stats.put("monthlyBalance", monthlyIncome.subtract(monthlyExpense));
        
        // Pending
        BigDecimal totalPending = entries.stream()
                .filter(e -> "PENDING".equals(e.getStatus()))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.put("totalPending", totalPending);
        
        return stats;
    }
    
    @GetMapping("/sales-stats")
    public ResponseEntity<Map<String, Object>> getSalesStats(Principal principal) {
        String ownerEmail = principal.getName();
        Map<String, Object> stats = new HashMap<>();
        
        var allSales = saleRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        
        // Current month sales
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        var thisMonthSales = allSales.stream()
                .filter(s -> s.getSaleDate().isAfter(startOfMonth))
                .toList();
        
        // Total stats
        stats.put("total", allSales.size());
        stats.put("pending", allSales.stream().filter(s -> s.getStatus() == SaleStatus.PENDING).count());
        stats.put("paid", allSales.stream().filter(s -> s.getStatus() == SaleStatus.PAID).count());
        stats.put("cancelled", allSales.stream().filter(s -> s.getStatus() == SaleStatus.CANCELLED).count());
        
        // Revenue
        BigDecimal totalRevenue = allSales.stream()
                .filter(s -> s.getStatus() == SaleStatus.PAID)
                .map(Sale::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalRevenue", totalRevenue);
        
        BigDecimal monthRevenue = thisMonthSales.stream()
                .filter(s -> s.getStatus() == SaleStatus.PAID)
                .map(Sale::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("monthRevenue", monthRevenue);
        
        // Average ticket
        BigDecimal avgTicket = allSales.isEmpty() ? BigDecimal.ZERO : 
                totalRevenue.divide(BigDecimal.valueOf(allSales.stream()
                        .filter(s -> s.getStatus() == SaleStatus.PAID).count()), 2, BigDecimal.ROUND_HALF_UP);
        stats.put("averageTicket", avgTicket);
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/sales-chart")
    public ResponseEntity<Map<String, Object>> getSalesChart(Principal principal) {
        String ownerEmail = principal.getName();
        
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        var sales = saleRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail).stream()
                .filter(s -> s.getSaleDate().isAfter(thirtyDaysAgo))
                .sorted((a, b) -> a.getSaleDate().compareTo(b.getSaleDate()))
                .toList();
        
        // Group by day
        Map<LocalDate, BigDecimal> salesByDay = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            salesByDay.put(LocalDate.now().minusDays(i), BigDecimal.ZERO);
        }
        
        for (Sale sale : sales) {
            if (sale.getStatus() == SaleStatus.PAID) {
                LocalDate date = sale.getSaleDate().toLocalDate();
                salesByDay.merge(date, sale.getTotal(), BigDecimal::add);
            }
        }
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", salesByDay.keySet().stream()
                .map(date -> date.toString())
                .toList());
        chartData.put("values", salesByDay.values().stream()
                .map(BigDecimal::doubleValue)
                .toList());
        
        return ResponseEntity.ok(chartData);
    }
    
    @GetMapping("/top-products")
    public ResponseEntity<List<Map<String, Object>>> getTopProducts(Principal principal) {
        String ownerEmail = principal.getName();
        
        var sales = saleRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
        
        // Count products sold
        Map<String, ProductStats> productStatsMap = new HashMap<>();
        
        for (Sale sale : sales) {
            if (sale.getStatus() == SaleStatus.PAID) {
                for (SaleItem item : sale.getItems()) {
                    String name = item.getDescription();
                    productStatsMap.computeIfAbsent(name, k -> new ProductStats())
                            .addSale(item.getQuantity(), item.getTotal());
                }
            }
        }
        
        // Sort by revenue and get top 5
        List<Map<String, Object>> topProducts = productStatsMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().revenue.compareTo(a.getValue().revenue))
                .limit(5)
                .map(entry -> {
                    Map<String, Object> product = new HashMap<>();
                    product.put("name", entry.getKey());
                    product.put("quantity", entry.getValue().quantity);
                    product.put("revenue", entry.getValue().revenue);
                    return product;
                })
                .toList();
        
        return ResponseEntity.ok(topProducts);
    }
    
    @GetMapping("/recent-sales")
    public ResponseEntity<List<Map<String, Object>>> getRecentSales(Principal principal) {
        String ownerEmail = principal.getName();
        
        var sales = saleRepository.findByOwnerEmailOrderByCreatedAtDesc(ownerEmail).stream()
                .limit(5)
                .map(sale -> {
                    Map<String, Object> saleData = new HashMap<>();
                    saleData.put("id", sale.getId());
                    saleData.put("customerName", sale.getCustomerName());
                    saleData.put("total", sale.getTotal());
                    saleData.put("status", sale.getStatus());
                    saleData.put("saleDate", sale.getSaleDate());
                    return saleData;
                })
                .toList();
        
        return ResponseEntity.ok(sales);
    }
    
    // Helper class for product statistics
    private static class ProductStats {
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal revenue = BigDecimal.ZERO;
        
        void addSale(BigDecimal qty, BigDecimal rev) {
            this.quantity = this.quantity.add(qty);
            this.revenue = this.revenue.add(rev);
        }
    }
}

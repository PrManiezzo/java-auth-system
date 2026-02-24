package com.authapp.backend.controller.finance;

import com.authapp.backend.dto.MessageResponse;
import com.authapp.backend.dto.finance.CustomerRequest;
import com.authapp.backend.entity.finance.Customer;
import com.authapp.backend.repository.finance.CustomerRepository;
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
@RequestMapping("/api/finance/customers")
public class CustomerController extends FinanceBaseController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<?> listCustomers(Authentication authentication) {
        String ownerEmail = owner(authentication);
        List<Map<String, Object>> data = customerRepository.findByOwnerEmailOrderByNameAsc(ownerEmail)
                .stream()
                .map(this::toCustomerResponse)
                .toList();
        return ResponseEntity.ok(data);
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(Authentication authentication, @Valid @RequestBody CustomerRequest request) {
        String ownerEmail = owner(authentication);
        Customer customer = Customer.builder()
                .ownerEmail(ownerEmail)
                .name(request.name().trim())
                .email(normalize(request.email()))
                .phone(normalize(request.phone()))
                .notes(normalize(request.notes()))
                .createdAt(LocalDateTime.now())
                .build();
        customerRepository.save(customer);
        return ResponseEntity.status(HttpStatus.CREATED).body(toCustomerResponse(customer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(Authentication authentication,
                                            @PathVariable Long id,
                                            @Valid @RequestBody CustomerRequest request) {
        String ownerEmail = owner(authentication);
        Customer customer = customerRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Cliente não encontrado"));
        }
        customer.setName(request.name().trim());
        customer.setEmail(normalize(request.email()));
        customer.setPhone(normalize(request.phone()));
        customer.setNotes(normalize(request.notes()));
        customerRepository.save(customer);
        return ResponseEntity.ok(toCustomerResponse(customer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(Authentication authentication, @PathVariable Long id) {
        String ownerEmail = owner(authentication);
        Customer customer = customerRepository.findByIdAndOwnerEmail(id, ownerEmail).orElse(null);
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Cliente não encontrado"));
        }
        customerRepository.delete(customer);
        return ResponseEntity.ok(new MessageResponse("Cliente removido"));
    }

    private Map<String, Object> toCustomerResponse(Customer customer) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", customer.getId());
        response.put("name", customer.getName());
        response.put("email", customer.getEmail() == null ? "" : customer.getEmail());
        response.put("phone", customer.getPhone() == null ? "" : customer.getPhone());
        response.put("notes", customer.getNotes() == null ? "" : customer.getNotes());
        response.put("createdAt", customer.getCreatedAt());
        return response;
    }
}

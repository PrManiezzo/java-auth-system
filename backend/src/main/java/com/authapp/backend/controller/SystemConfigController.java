package com.authapp.backend.controller;

import com.authapp.backend.entity.SystemConfig;
import com.authapp.backend.repository.SystemConfigRepository;
import com.authapp.backend.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "System Settings", description = "System configuration management")
public class SystemConfigController {

    private final SystemConfigRepository systemConfigRepository;
    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Get system configuration")
    public ResponseEntity<SystemConfig> getConfig(Authentication authentication) {
        String userEmail = authentication.getName();
        
        SystemConfig config = systemConfigRepository.findByOwnerEmail(userEmail)
                .orElse(createDefaultConfig(userEmail));
        
        return ResponseEntity.ok(config);
    }

    @PostMapping
    @Operation(summary = "Create or update system configuration")
    public ResponseEntity<SystemConfig> saveConfig(
            Authentication authentication,
            @RequestBody SystemConfig config) {
        
        String userEmail = authentication.getName();
        
        SystemConfig existingConfig = systemConfigRepository.findByOwnerEmail(userEmail)
                .orElse(null);
        
        if (existingConfig != null) {
            String oldValue = existingConfig.toString();
            
            // Update existing config
            existingConfig.setCompanyName(config.getCompanyName());
            existingConfig.setCnpj(config.getCnpj());
            existingConfig.setIe(config.getIe());
            existingConfig.setIm(config.getIm());
            existingConfig.setAddress(config.getAddress());
            existingConfig.setNumber(config.getNumber());
            existingConfig.setComplement(config.getComplement());
            existingConfig.setDistrict(config.getDistrict());
            existingConfig.setCity(config.getCity());
            existingConfig.setState(config.getState());
            existingConfig.setZipCode(config.getZipCode());
            existingConfig.setPhone(config.getPhone());
            existingConfig.setEmail(config.getEmail());
            existingConfig.setWebsite(config.getWebsite());
            existingConfig.setLogoBase64(config.getLogoBase64());
            existingConfig.setPrinterName(config.getPrinterName());
            existingConfig.setPaperWidth(config.getPaperWidth());
            existingConfig.setPaperHeight(config.getPaperHeight());
            existingConfig.setAutoPrint(config.getAutoPrint());
            existingConfig.setCopies(config.getCopies());
            existingConfig.setSystemName(config.getSystemName());
            existingConfig.setDefaultCurrency(config.getDefaultCurrency());
            existingConfig.setDateFormat(config.getDateFormat());
            existingConfig.setTimeFormat(config.getTimeFormat());
            existingConfig.setNfeEnabled(config.getNfeEnabled());
            existingConfig.setNfeApiUrl(config.getNfeApiUrl());
            existingConfig.setNfeApiToken(config.getNfeApiToken());
            existingConfig.setNfeSeries(config.getNfeSeries());
            existingConfig.setNfeLastNumber(config.getNfeLastNumber());
            existingConfig.setNfeEnvironment(config.getNfeEnvironment());
            
            SystemConfig saved = systemConfigRepository.save(existingConfig);
            
            auditService.logAction(
                userEmail,
                "SYSTEM_CONFIG",
                saved.getId(),
                "UPDATE",
                "Configurações do sistema atualizadas",
                oldValue,
                saved.toString()
            );
            
            return ResponseEntity.ok(saved);
        } else {
            // Create new config
            config.setOwnerEmail(userEmail);
            SystemConfig saved = systemConfigRepository.save(config);
            
            auditService.logAction(
                userEmail,
                "SYSTEM_CONFIG",
                saved.getId(),
                "CREATE",
                "Configurações do sistema criadas"
            );
            
            return ResponseEntity.ok(saved);
        }
    }

    private SystemConfig createDefaultConfig(String ownerEmail) {
        return SystemConfig.builder()
                .ownerEmail(ownerEmail)
                .systemName("Negócio")
                .defaultCurrency("BRL")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("24h")
                .autoPrint(false)
                .copies(1)
                .paperWidth(80)
                .paperHeight(297)
                .nfeEnabled(false)
                .nfeEnvironment("HOMOLOGATION")
                .build();
    }
}

package com.authapp.backend.controller.finance;

import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.math.RoundingMode;

public abstract class FinanceBaseController {

    protected String owner(Authentication authentication) {
        return authentication.getName();
    }

    protected String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    protected BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}

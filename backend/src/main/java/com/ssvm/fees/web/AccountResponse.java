package com.ssvm.fees.web;

import java.math.BigDecimal;

public record AccountResponse(
    String entityId,
    String entityType,
    BigDecimal currentBalance,
    String name,
    String info // Class for student, Department for teacher
) {}

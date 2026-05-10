package com.ssvm.fees.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "accounts")
public class Account {
    @Id
    private String entityId;

    @Enumerated(EnumType.STRING)
    private EntityType entityType;

    @Column(nullable = false)
    private BigDecimal currentBalance = BigDecimal.ZERO;

    public enum EntityType {
        STUDENT, TEACHER
    }

    public Account() {}

    public Account(String entityId, EntityType entityType, BigDecimal currentBalance) {
        this.entityId = entityId;
        this.entityType = entityType;
        this.currentBalance = currentBalance;
    }

    // Getters and Setters
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public EntityType getEntityType() { return entityType; }
    public void setEntityType(EntityType entityType) { this.entityType = entityType; }

    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }

    public void debit(BigDecimal amount) {
        this.currentBalance = this.currentBalance.add(amount);
    }

    public void credit(BigDecimal amount) {
        this.currentBalance = this.currentBalance.subtract(amount);
    }

    // Builder pattern
    public static AccountBuilder builder() { return new AccountBuilder(); }

    public static class AccountBuilder {
        private String entityId;
        private EntityType entityType;
        private BigDecimal currentBalance = BigDecimal.ZERO;

        public AccountBuilder entityId(String entityId) { this.entityId = entityId; return this; }
        public AccountBuilder entityType(EntityType entityType) { this.entityType = entityType; return this; }
        public AccountBuilder currentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; return this; }

        public Account build() {
            return new Account(entityId, entityType, currentBalance);
        }
    }
}

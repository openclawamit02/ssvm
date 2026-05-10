package com.ssvm.fees.domain.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private BigDecimal amount;

    private String description;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private boolean voided = false;

    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode;

    private boolean verified = true;

    public Transaction() {}

    public Transaction(Long id, String entityId, TransactionType type, BigDecimal amount,
                       String description, LocalDateTime timestamp, boolean voided,
                       PaymentMode paymentMode, boolean verified) {
        this.id = id;
        this.entityId = entityId;
        this.type = type;
        this.amount = amount;
        this.description = description;
        this.timestamp = timestamp;
        this.voided = voided;
        this.paymentMode = paymentMode;
        this.verified = verified;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public boolean isVoided() { return voided; }
    public void setVoided(boolean voided) { this.voided = voided; }

    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    // Builder pattern
    public static TransactionBuilder builder() { return new TransactionBuilder(); }

    public static class TransactionBuilder {
        private Long id;
        private String entityId;
        private TransactionType type;
        private BigDecimal amount;
        private String description;
        private LocalDateTime timestamp;
        private boolean voided = false;
        private PaymentMode paymentMode;
        private boolean verified = true;

        public TransactionBuilder id(Long id) { this.id = id; return this; }
        public TransactionBuilder entityId(String entityId) { this.entityId = entityId; return this; }
        public TransactionBuilder type(TransactionType type) { this.type = type; return this; }
        public TransactionBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public TransactionBuilder description(String description) { this.description = description; return this; }
        public TransactionBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public TransactionBuilder voided(boolean voided) { this.voided = voided; return this; }
        public TransactionBuilder paymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; return this; }
        public TransactionBuilder verified(boolean verified) { this.verified = verified; return this; }

        public Transaction build() {
            return new Transaction(id, entityId, type, amount, description, timestamp, voided, paymentMode, verified);
        }
    }

    public enum TransactionType {
        DEBIT, CREDIT
    }

    public enum PaymentMode {
        CASH, ONLINE, BANK_TRANSFER
    }
}

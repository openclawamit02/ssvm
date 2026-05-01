package com.ssvm.fees.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // DEBIT (Due), CREDIT (Payment)

    @Column(nullable = false)
    private BigDecimal amount;

    private String description;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private boolean voided = false;

    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode; // CASH, ONLINE, BANK_TRANSFER

    private boolean verified = true; // For Bank Transfers, admin must verify

    public enum TransactionType {
        DEBIT, CREDIT
    }

    public enum PaymentMode {
        CASH, ONLINE, BANK_TRANSFER
    }
}

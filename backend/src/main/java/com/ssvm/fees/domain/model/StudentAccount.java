package com.ssvm.fees.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "student_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAccount {
    @Id
    private String studentId; // Matches the Student ID from the main directory

    @Column(nullable = false)
    private BigDecimal currentBalance = BigDecimal.ZERO;

    public void debit(BigDecimal amount) {
        this.currentBalance = this.currentBalance.add(amount);
    }

    public void credit(BigDecimal amount) {
        this.currentBalance = this.currentBalance.subtract(amount);
    }
}

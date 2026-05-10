package com.ssvm.fees.domain.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "student_accounts")
public class StudentAccount {
    @Id
    private String studentId;

    @Column(nullable = false)
    private BigDecimal currentBalance = BigDecimal.ZERO;

    public StudentAccount() {}

    public StudentAccount(String studentId, BigDecimal currentBalance) {
        this.studentId = studentId;
        this.currentBalance = currentBalance;
    }

    // Getters and Setters
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }

    public void debit(BigDecimal amount) {
        this.currentBalance = this.currentBalance.add(amount);
    }

    public void credit(BigDecimal amount) {
        this.currentBalance = this.currentBalance.subtract(amount);
    }

    // Builder pattern
    public static StudentAccountBuilder builder() { return new StudentAccountBuilder(); }

    public static class StudentAccountBuilder {
        private String studentId;
        private BigDecimal currentBalance = BigDecimal.ZERO;

        public StudentAccountBuilder studentId(String studentId) { this.studentId = studentId; return this; }
        public StudentAccountBuilder currentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; return this; }

        public StudentAccount build() {
            return new StudentAccount(studentId, currentBalance);
        }
    }
}

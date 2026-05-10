package com.ssvm.fees.domain.service;

import com.ssvm.fees.domain.model.StudentAccount;
import com.ssvm.fees.domain.model.Transaction;
import com.ssvm.fees.infrastructure.StudentAccountRepository;
import com.ssvm.fees.infrastructure.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class AccountingService {

    private final TransactionRepository transactionRepository;
    private final StudentAccountRepository studentAccountRepository;

    public AccountingService(TransactionRepository transactionRepository,
                             StudentAccountRepository studentAccountRepository) {
        this.transactionRepository = transactionRepository;
        this.studentAccountRepository = studentAccountRepository;
    }

    @Transactional
    public void postFee(String studentId, BigDecimal amount, String description) {
        StudentAccount account = getOrCreateAccount(studentId);
        account.debit(amount);

        Transaction tx = Transaction.builder()
                .studentId(studentId)
                .type(Transaction.TransactionType.DEBIT)
                .amount(amount)
                .description(description)
                .timestamp(LocalDateTime.now())
                .verified(true)
                .build();

        studentAccountRepository.save(account);
        transactionRepository.save(tx);
    }

    @Transactional
    public void recordPayment(String studentId, BigDecimal amount, String description, Transaction.PaymentMode mode) {
        StudentAccount account = getOrCreateAccount(studentId);
        account.credit(amount);

        Transaction tx = Transaction.builder()
                .studentId(studentId)
                .type(Transaction.TransactionType.CREDIT)
                .amount(amount)
                .description(description)
                .timestamp(LocalDateTime.now())
                .paymentMode(mode)
                .verified(mode != Transaction.PaymentMode.BANK_TRANSFER)
                .build();

        studentAccountRepository.save(account);
        transactionRepository.save(tx);
    }

    @Transactional
    public void voidTransaction(Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (tx.isVoided()) return;

        StudentAccount account = getOrCreateAccount(tx.getStudentId());

        if (tx.getType() == Transaction.TransactionType.DEBIT) {
            account.credit(tx.getAmount());
        } else {
            account.debit(tx.getAmount());
        }

        tx.setVoided(true);
        tx.setDescription(tx.getDescription() + " (VOIDED)");

        studentAccountRepository.save(account);
        transactionRepository.save(tx);
    }

    private StudentAccount getOrCreateAccount(String studentId) {
        return studentAccountRepository.findById(studentId)
                .orElse(StudentAccount.builder()
                        .studentId(studentId)
                        .currentBalance(BigDecimal.ZERO)
                        .build());
    }
}

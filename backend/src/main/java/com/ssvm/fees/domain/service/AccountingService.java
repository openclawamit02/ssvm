package com.ssvm.fees.domain.service;

import com.ssvm.fees.domain.model.Account;
import com.ssvm.fees.domain.model.Transaction;
import com.ssvm.fees.infrastructure.AccountRepository;
import com.ssvm.fees.infrastructure.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class AccountingService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public AccountingService(TransactionRepository transactionRepository,
                             AccountRepository accountRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public void postFee(String entityId, Account.EntityType type, BigDecimal amount, String description) {
        Account account = getOrCreateAccount(entityId, type);
        account.debit(amount);

        Transaction tx = Transaction.builder()
                .entityId(entityId)
                .type(Transaction.TransactionType.DEBIT)
                .amount(amount)
                .description(description)
                .timestamp(LocalDateTime.now())
                .verified(true)
                .build();

        accountRepository.save(account);
        transactionRepository.save(tx);
    }

    @Transactional
    public void recordPayment(String entityId, Account.EntityType type, BigDecimal amount, String description, Transaction.PaymentMode mode) {
        Account account = getOrCreateAccount(entityId, type);
        account.credit(amount);

        Transaction tx = Transaction.builder()
                .entityId(entityId)
                .type(Transaction.TransactionType.CREDIT)
                .amount(amount)
                .description(description)
                .timestamp(LocalDateTime.now())
                .paymentMode(mode)
                .verified(mode != Transaction.PaymentMode.BANK_TRANSFER)
                .build();

        accountRepository.save(account);
        transactionRepository.save(tx);
    }

    @Transactional
    public void voidTransaction(Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (tx.isVoided()) return;

        Account account = accountRepository.findByEntityId(tx.getEntityId())
                .orElseThrow(() -> new RuntimeException("Account not found for entity: " + tx.getEntityId()));

        if (tx.getType() == Transaction.TransactionType.DEBIT) {
            account.credit(tx.getAmount());
        } else {
            account.debit(tx.getAmount());
        }

        tx.setVoided(true);
        tx.setDescription(tx.getDescription() + " (VOIDED)");

        accountRepository.save(account);
        transactionRepository.save(tx);
    }

    private Account getOrCreateAccount(String entityId, Account.EntityType type) {
        return accountRepository.findByEntityId(entityId)
                .orElse(Account.builder()
                        .entityId(entityId)
                        .entityType(type)
                        .currentBalance(BigDecimal.ZERO)
                        .build());
    }
}

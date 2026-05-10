package com.ssvm.fees.web;

import com.ssvm.fees.domain.model.Transaction;
import com.ssvm.fees.domain.service.AccountingService;
import com.ssvm.fees.infrastructure.StudentAccountRepository;
import com.ssvm.fees.infrastructure.TransactionRepository;
import com.ssvm.fees.infrastructure.FeeHeadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
@CrossOrigin(origins = "*")
public class FeeController {

    private final AccountingService accountingService;
    private final TransactionRepository transactionRepository;
    private final StudentAccountRepository studentAccountRepository;
    private final FeeHeadRepository feeHeadRepository;

    public FeeController(AccountingService accountingService,
                         TransactionRepository transactionRepository,
                         StudentAccountRepository studentAccountRepository,
                         FeeHeadRepository feeHeadRepository) {
        this.accountingService = accountingService;
        this.transactionRepository = transactionRepository;
        this.studentAccountRepository = studentAccountRepository;
        this.feeHeadRepository = feeHeadRepository;
    }

    @PostMapping("/post")
    public ResponseEntity<?> postFee(@RequestBody Map<String, Object> payload) {
        String studentId = (String) payload.get("studentId");
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        String description = (String) payload.get("description");

        accountingService.postFee(studentId, amount, description);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Fee posted"));
    }

    @PostMapping("/pay")
    public ResponseEntity<?> recordPayment(@RequestBody Map<String, Object> payload) {
        String studentId = (String) payload.get("studentId");
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        String description = (String) payload.get("description");
        Transaction.PaymentMode mode = Transaction.PaymentMode.valueOf(payload.get("paymentMode").toString());

        accountingService.recordPayment(studentId, amount, description, mode);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Payment recorded"));
    }

    @PostMapping("/void/{id}")
    public ResponseEntity<?> voidTransaction(@PathVariable Long id) {
        accountingService.voidTransaction(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Transaction voided"));
    }

    @GetMapping("/ledger/{studentId}")
    public ResponseEntity<List<Transaction>> getLedger(@PathVariable String studentId) {
        return ResponseEntity.ok(transactionRepository.findByStudentIdOrderByTimestampDesc(studentId));
    }

    @GetMapping("/accounts")
    public ResponseEntity<?> getAllAccounts() {
        return ResponseEntity.ok(studentAccountRepository.findAll());
    }

    @GetMapping("/fee-heads")
    public ResponseEntity<?> getAllFeeHeads() {
        return ResponseEntity.ok(feeHeadRepository.findAll());
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "SSVM Fees API"));
    }
}

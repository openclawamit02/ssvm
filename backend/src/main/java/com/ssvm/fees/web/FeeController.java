package com.ssvm.fees.web;

import com.ssvm.fees.domain.model.Account;
import com.ssvm.fees.domain.model.Transaction;
import com.ssvm.fees.domain.service.AccountingService;
import com.ssvm.fees.infrastructure.AccountRepository;
import com.ssvm.fees.infrastructure.TransactionRepository;
import com.ssvm.fees.infrastructure.FeeHeadRepository;
import com.ssvm.fees.infrastructure.StudentRepository;
import com.ssvm.fees.infrastructure.TeacherRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
@CrossOrigin(origins = "*")
public class FeeController {

    private final AccountingService accountingService;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final FeeHeadRepository feeHeadRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    public FeeController(AccountingService accountingService,
                         TransactionRepository transactionRepository,
                         AccountRepository accountRepository,
                         FeeHeadRepository feeHeadRepository,
                         StudentRepository studentRepository,
                         TeacherRepository teacherRepository) {
        this.accountingService = accountingService;
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.feeHeadRepository = feeHeadRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
    }


    // Java Records for cleaner DTOs
    public record PostFeeRequest(String entityId, Account.EntityType type, BigDecimal amount, String description) {}
    public record PayFeeRequest(String entityId, Account.EntityType type, BigDecimal amount, String description, Transaction.PaymentMode paymentMode) {}

    @PostMapping("/post")
    public ResponseEntity<?> postFee(@RequestBody PostFeeRequest request) {
        accountingService.postFee(request.entityId(), request.type(), request.amount(), request.description());
        return ResponseEntity.ok(Map.of("status", "success", "message", "Fee posted"));
    }

    @PostMapping("/pay")
    public ResponseEntity<?> recordPayment(@RequestBody PayFeeRequest request) {
        accountingService.recordPayment(request.entityId(), request.type(), request.amount(), request.description(), request.paymentMode());
        return ResponseEntity.ok(Map.of("status", "success", "message", "Payment recorded"));
    }

    @PostMapping("/void/{id}")
    public ResponseEntity<?> voidTransaction(@PathVariable Long id) {
        accountingService.voidTransaction(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Transaction voided"));
    }

    @GetMapping("/ledger/{entityId}")
    public ResponseEntity<?> getLedger(
            @PathVariable String entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var pageRequest = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return ResponseEntity.ok(transactionRepository.findByEntityIdOrderByTimestampDesc(entityId, pageRequest));
    }

    @GetMapping("/accounts")
    public ResponseEntity<Page<AccountResponse>> getAllAccounts(
            @RequestParam(required = false) Account.EntityType type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        var pageRequest = PageRequest.of(page, size);
        Page<Account> accounts;
        
        if (type != null) {
            if (search != null && !search.isBlank()) {
                accounts = accountRepository.findByEntityTypeAndEntityIdContainingIgnoreCase(type, search, pageRequest);
            } else {
                accounts = accountRepository.findByEntityType(type, pageRequest);
            }
        } else if (search != null && !search.isBlank()) {
            accounts = accountRepository.findByEntityIdContainingIgnoreCase(search, pageRequest);
        } else {
            accounts = accountRepository.findAll(pageRequest);
        }

        Page<AccountResponse> responses = accounts.map(acc -> {
            String name = "Unknown";
            String info = "";
            if (acc.getEntityType() == Account.EntityType.STUDENT) {
                var student = studentRepository.findById(acc.getEntityId());
                if (student.isPresent()) {
                    name = student.get().getName();
                    info = student.get().getStudentClass();
                }
            } else {
                var teacher = teacherRepository.findById(acc.getEntityId());
                if (teacher.isPresent()) {
                    name = teacher.get().getName();
                    info = teacher.get().getDepartment();
                }
            }
            return new AccountResponse(acc.getEntityId(), acc.getEntityType().name(), acc.getCurrentBalance(), name, info);
        });

        return ResponseEntity.ok(responses);
    }


    @GetMapping("/fee-heads")
    public ResponseEntity<?> getAllFeeHeads() {
        return ResponseEntity.ok(feeHeadRepository.findAll());
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        BigDecimal collectedToday = transactionRepository.getTotalByTimestamp(Transaction.TransactionType.CREDIT, todayStart);
        BigDecimal totalPosted = transactionRepository.getTotalByType(Transaction.TransactionType.DEBIT);
        BigDecimal totalReceived = transactionRepository.getTotalByType(Transaction.TransactionType.CREDIT);
        
        collectedToday = (collectedToday != null) ? collectedToday : BigDecimal.ZERO;
        totalPosted = (totalPosted != null) ? totalPosted : BigDecimal.ZERO;
        totalReceived = (totalReceived != null) ? totalReceived : BigDecimal.ZERO;
        
        BigDecimal totalArrears = totalPosted.subtract(totalReceived);
        
        var breakdown = transactionRepository.getCollectionBreakdown(Transaction.TransactionType.CREDIT);
        Map<String, BigDecimal> modeBreakdown = new java.util.HashMap<>();
        for (Object[] row : breakdown) {
            String mode = (row[0] != null) ? row[0].toString() : "UNKNOWN";
            modeBreakdown.put(mode, (BigDecimal) row[1]);
        }

        return ResponseEntity.ok(Map.of(
            "collectedToday", collectedToday,
            "totalArrears", totalArrears,
            "verificationRate", 98,
            "breakdown", modeBreakdown,
            "studentCount", accountRepository.countByEntityType(Account.EntityType.STUDENT),
            "teacherCount", accountRepository.countByEntityType(Account.EntityType.TEACHER)
        ));
    }

    @GetMapping("/defaulters")
    public ResponseEntity<?> getDefaulters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(accountRepository.findByCurrentBalanceGreaterThan(BigDecimal.ZERO, PageRequest.of(page, size)));
    }

    @GetMapping("/transactions/recent")
    public ResponseEntity<List<Transaction>> getRecentTransactions() {
        return ResponseEntity.ok(transactionRepository.findTop10ByOrderByTimestampDesc());
    }


    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "SSVM Fees API", "version", "2.1-GENERIC-ACCOUNTS"));
    }
}

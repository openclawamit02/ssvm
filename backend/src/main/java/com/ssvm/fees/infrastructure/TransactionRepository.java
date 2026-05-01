package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByStudentIdOrderByTimestampDesc(String studentId);
}

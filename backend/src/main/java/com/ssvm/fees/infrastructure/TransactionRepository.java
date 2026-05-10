package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByEntityIdOrderByTimestampDesc(String entityId);
    Page<Transaction> findByEntityIdOrderByTimestampDesc(String entityId, Pageable pageable);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.type = :type AND t.timestamp >= :since AND t.voided = false")
    BigDecimal getTotalByTimestamp(@Param("type") Transaction.TransactionType type, @Param("since") LocalDateTime since);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.type = :type AND t.voided = false")
    BigDecimal getTotalByType(@Param("type") Transaction.TransactionType type);

    @Query("SELECT t.paymentMode, SUM(t.amount) FROM Transaction t WHERE t.type = :type AND t.voided = false GROUP BY t.paymentMode")
    List<Object[]> getCollectionBreakdown(@Param("type") Transaction.TransactionType type);

    List<Transaction> findTop10ByOrderByTimestampDesc();
}


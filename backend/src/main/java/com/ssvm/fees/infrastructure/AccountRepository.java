package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
    Optional<Account> findByEntityId(String entityId);
    Page<Account> findByEntityType(Account.EntityType entityType, Pageable pageable);
    Page<Account> findByEntityIdContainingIgnoreCase(String entityId, Pageable pageable);
    Page<Account> findByEntityTypeAndEntityIdContainingIgnoreCase(Account.EntityType entityType, String entityId, Pageable pageable);

    Page<Account> findByCurrentBalanceGreaterThan(java.math.BigDecimal balance, Pageable pageable);
    long countByEntityType(Account.EntityType type);
}


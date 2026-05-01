package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.FeeHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeeHeadRepository extends JpaRepository<FeeHead, Long> {
}

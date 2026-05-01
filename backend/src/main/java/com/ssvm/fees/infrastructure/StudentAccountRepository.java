package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.StudentAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentAccountRepository extends JpaRepository<StudentAccount, String> {
}

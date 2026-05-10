package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Page<Teacher> findByNameContainingIgnoreCaseOrEmployeeIdContainingIgnoreCase(String name, String employeeId, Pageable pageable);
}

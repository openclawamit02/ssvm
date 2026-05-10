package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    Page<Student> findByNameContainingIgnoreCaseOrRollNumberContainingIgnoreCase(String name, String rollNumber, Pageable pageable);
    Page<Student> findByStudentClass(String studentClass, Pageable pageable);
    Page<Student> findByStudentClassAndNameContainingIgnoreCase(String studentClass, String name, Pageable pageable);
    
    long countByGenderIgnoreCase(String gender);
    long countByStatusIgnoreCase(String status);
}

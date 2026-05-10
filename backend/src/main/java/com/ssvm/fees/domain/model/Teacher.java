package com.ssvm.fees.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Teacher {
    @Id
    private String id;
    private String name;
    private String fatherName;
    private String employeeId;
    private String department;
    private String contactNumber;
    private String emergencyNumber;
    private String address;
    private String gender;
    private String bloodGroup;
    private String joiningDate;
    private String qualification;
    private String subjects;
    private String status; // Active, Inactive
}

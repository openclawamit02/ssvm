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
public class Student {
    @Id
    private String id;
    private String name;
    private String fatherName;
    private String rollNumber;
    private String studentClass;
    private String section;
    private String contactNumber;
    private String fatherMobile;
    private String address;
    private String dob;
    private String gender;
    private String bloodGroup;
    private String isSpecialAbled;
    private String height;
    private String status; // Active, Inactive
}

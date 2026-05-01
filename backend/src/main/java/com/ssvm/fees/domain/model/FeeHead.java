package com.ssvm.fees.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "fee_heads")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeHead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // e.g., ACADEMIC, TRANSPORT, OTHER

    @Column(nullable = false)
    private BigDecimal defaultAmount;

    @Column(nullable = false)
    private String frequency; // MONTHLY, YEARLY, ONCE
}

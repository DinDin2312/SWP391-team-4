package com.team4.sportscenter.modules.member.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "PACKAGES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Package {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    private Integer packageId;

    @Column(name = "package_name")
    private String packageName;

    @Column(name = "package_type")
    private String packageType;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "price")
    private BigDecimal price;
}

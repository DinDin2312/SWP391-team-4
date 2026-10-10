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

    @Column(length=1000) private String description;
    @Column(columnDefinition="TEXT") private String terms;
    @Column(name="purchase_limit_per_member") private Integer purchaseLimitPerMember;
    @Column(name="selling_status",nullable=false,length=20,columnDefinition="varchar(20) default 'SELLING'") private String sellingStatus;

    @Column(name = "image_path", length = 255)
    private String imagePath;
}

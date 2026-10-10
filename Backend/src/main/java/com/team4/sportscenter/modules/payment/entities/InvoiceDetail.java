package com.team4.sportscenter.modules.payment.entities;

import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Package;
import com.team4.sportscenter.modules.member.entities.Schedule;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "INVOICE_DETAILS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Integer detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private GymClass gymClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private Package aPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    @Column(name="membership_id") private Integer membershipId;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;
}

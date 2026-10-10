package com.team4.sportscenter.modules.member.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "USER_MEMBERSHIPS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "membership_id")
    private Integer membershipId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "package_id")
    private Package aPackage;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "remaining_sessions")
    private Integer remainingSessions;

    @Column(name = "status")
    private String status;

    @Column(name="package_name_snapshot") private String packageNameSnapshot;
    @Column(name="package_type_snapshot") private String packageTypeSnapshot;
    @Column(name="type_name_snapshot") private String typeNameSnapshot;
    @Column(name="duration_days_snapshot") private Integer durationDaysSnapshot;
    @Column(name="price_snapshot",precision=10,scale=2) private java.math.BigDecimal priceSnapshot;

    @Column(name="description_snapshot",length=1000) private String descriptionSnapshot;
    @Column(name="terms_snapshot",columnDefinition="TEXT") private String termsSnapshot;
    @Column(name="purchase_completed_at") private java.time.LocalDateTime purchaseCompletedAt;
    @Column(name="purchase_source") private String purchaseSource;
    @Column(name="checkout_invoice_id") private Integer checkoutInvoiceId;

    public String purchasedName() { return packageNameSnapshot!=null?packageNameSnapshot:aPackage.getPackageName(); }
    public String purchasedType() { return packageTypeSnapshot!=null?packageTypeSnapshot:aPackage.getPackageType(); }
    public Integer purchasedDuration() { return durationDaysSnapshot!=null?durationDaysSnapshot:aPackage.getDurationDays(); }
    public java.math.BigDecimal purchasedPrice() { return priceSnapshot!=null?priceSnapshot:aPackage.getPrice(); }
}

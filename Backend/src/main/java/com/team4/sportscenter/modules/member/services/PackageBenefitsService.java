package com.team4.sportscenter.modules.member.services;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.SubjectBenefitRequest;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Membership packages only grant Gym access (GYM_ACCESS), AI access (AI_ACCESS),
 * Combo (COMBO), or VIP (PREMIUM). Subject course benefits are decoupled from packages.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PackageBenefitsService {
    private final JdbcTemplate jdbc;
    private final com.team4.sportscenter.modules.manager.services.PackageTypeCatalog packageTypes;

    public void saveDefinition(int packageId, String type, List<SubjectBenefitRequest> benefits) {
        packageTypes.require(type);
        jdbc.update("DELETE FROM PACKAGE_SUBJECT_BENEFITS WHERE package_id=?", packageId);
    }

    public List<Map<String, Object>> packageBenefits(int packageId) {
        return List.of();
    }

    public Map<Integer, List<Map<String, Object>>> allPackageBenefits() {
        return Map.of();
    }

    public void validateClassRoom(int classId, int roomId) {
        // Packages do not bind to courses or course rooms.
    }

    public void snapshot(UserMembership membership) {
        var pkg = membership.getAPackage();
        membership.setDescriptionSnapshot(pkg.getDescription());
        membership.setTermsSnapshot(pkg.getTerms());
        membership.setPackageNameSnapshot(pkg.getPackageName());
        membership.setPackageTypeSnapshot(pkg.getPackageType());
        membership.setTypeNameSnapshot((String) packageTypes.require(pkg.getPackageType()).get("typeName"));
        membership.setDurationDaysSnapshot(pkg.getDurationDays());
        membership.setPriceSnapshot(pkg.getPrice());
    }

    public void snapshotSubjects(int membershipId, int packageId) {
        // Packages do not include subject session quotas.
    }

    public List<Map<String, Object>> membershipBenefits(int membershipId) {
        return List.of();
    }

    public int reserve(String email, int membershipId, int subjectId, List<LocalDateTime> dates) {
        return reserve(email, membershipId, subjectId, null, dates);
    }

    public int reserve(String email, int membershipId, int subjectId, Integer roomId, List<LocalDateTime> dates) {
        throw new IllegalArgumentException("Membership packages cannot be used to book courses. Courses are enrolled and paid separately.");
    }

    public void allocate(int bookingId, int benefitId) {
        // No-op: courses are not booked via packages.
    }

    public void validateSessionDates(int scheduleId, LocalDateTime start, LocalDateTime end) {
        // No-op: course session dates are independent of membership packages.
    }
}

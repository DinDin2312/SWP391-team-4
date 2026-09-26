package com.team4.sportscenter.modules.receptionist.repositories;

import com.team4.sportscenter.modules.member.entities.Package;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReceptionistPackageRepository extends JpaRepository<Package, Integer> {
    // Kế thừa JpaRepository giúp bạn có sẵn các hàm cơ bản như:
    // - findAll(): Lấy tất cả các gói tập
    // - findById(id): Tìm gói tập theo ID
    // - save(): Lưu hoặc cập nhật gói tập
    // - deleteById(id): Xóa gói tập
}
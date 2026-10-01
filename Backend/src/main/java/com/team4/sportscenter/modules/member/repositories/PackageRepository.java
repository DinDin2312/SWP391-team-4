package com.team4.sportscenter.modules.member.repositories;

import com.team4.sportscenter.modules.member.entities.Package;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("memberPackageRepository")
public interface PackageRepository extends JpaRepository<Package, Integer> {
}

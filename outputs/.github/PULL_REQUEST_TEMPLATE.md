## 📌 Mô tả thay đổi (Summary)
<!-- Mô tả ngắn gọn tính năng/bản vá trong PR này theo chuẩn Conventional Commits (feat/fix/refactor/docs/test/ci) -->

## 🎯 Phân hệ & Luồng nghiệp vụ bị ảnh hưởng (Affected Flows & Actors)
- **Actors:**
  - [ ] Center Manager (Quản lý trung tâm)
  - [ ] Coach (Huấn luyện viên)
  - [ ] Member (Hội viên)
  - [ ] Receptionist (Nhân viên lễ tân)
- **Flows:**
  - [ ] **Flow 1 (Must Have):** User & Membership Management
  - [ ] **Flow 2 (Must Have):** Class Booking & Schedule Management
  - [ ] **Flow 3 (Must Have):** Payment & Report Management
  - [ ] **Flow 4 (Nice to Have):** Training & Attendance Management
  - [ ] **Flow 5 (Nice to Have):** AI Workout Recommendation
  - [ ] **Flow 6 (Nice to Have):** AI Assistant (Nexus AI)
  - [ ] **CI/CD & DevSecOps Infrastructure**

## ✅ Checklist Kiểm tra trước khi Merge (Pre-Merge Verification)
- [ ] **Frontend Lint & Build:** `npm run lint` và `npm run build` chạy thành công không lỗi.
- [ ] **Frontend Tests:** `npm test` (52/52 test cases) pass 100%.
- [ ] **Backend Build & Tests:** `./mvnw clean verify` (Unit + Integration + Flyway V1–V6 migrations) pass 100%.
- [ ] **Security Gate (Snyk/Trivy):** Không phát sinh lỗ hổng Critical/High trong `Backend/pom.xml` hoặc `Frontend/package.json` và không lộ API key/secret.
- [ ] **Architecture Rule:** Không sửa đổi trái phép `common/` hoặc `security/` nếu chưa thống nhất với nhóm.

# 🚀 Hướng Dẫn Áp Dụng CI/CD & DevSecOps Pipeline (2026 Standard)
**Dự án:** Hệ thống Quản lý Trung tâm Thể thao (NEXUS Sports Center - SWP391 Team 4)  
**Giảng viên hướng dẫn:** MinhTTH5 (Đề tài số 4)

---

## 1. Tổng Quan Kiến Trúc CI/CD & DevSecOps

Bộ cấu hình trong thư mục `outputs/` thiết lập quy trình **CI/CD & DevSecOps 4 tầng** cho dự án `SWP391_Code` (Spring Boot + React/Vite + MySQL 8 + Flyway):

```text
[Push / Pull Request]
        │
        ├──► Tầng 1: Frontend CI (.github/workflows/ci.yml -> job: frontend)
        │       ├── Cài đặt dependencies khóa phiên bản (npm ci)
        │       ├── Kiểm tra tĩnh mã nguồn (npm run lint - Oxlint)
        │       ├── Chạy 52 Unit & Rendering Tests (npm test: Manager, i18n, Images, Benefits, Member)
        │       └── Đóng gói Production Bundle (npm run build -> artifact frontend-dist)
        │
        ├──► Tầng 2: Backend CI (.github/workflows/ci.yml -> job: backend)
        │       ├── Khởi tạo MySQL 8.4 Service Container (UTF8MB4)
        │       ├── Nạp schema gốc (database_init.sql) & 4 Roles (Center Manager, Receptionist, Coach, Member)
        │       ├── Kiểm chứng tự động 6 phiên bản Flyway Migration (V1 -> V6 trên disposable schema)
        │       ├── Chạy toàn bộ Unit & Integration Tests (./mvnw clean verify)
        │       └── Xuất Surefire XML Reports & JAR Package (artifact backend-jar)
        │
        ├──► Tầng 3: DevSecOps Security Gate (.github/workflows/snyk-security.yml)
        │       ├── GitHub Dependency Review (chặn PR có dependency dính CVE mức High/Critical)
        │       ├── Kiểm tra chính sách bảo mật Maven (chặn 2 dependency DEMO Snyk khi merge vào main)
        │       ├── Snyk SCA / SAST Scan (tự động kích hoạt khi cấu hình SNYK_TOKEN)
        │       └── Trivy Filesystem Vulnerability & Secret Scan
        │
        └──► Tầng 4: Continuous Delivery & Smoke Test (.github/workflows/cd.yml)
                ├── Build Multi-stage Docker Images (Backend JRE 17 non-root & Frontend Nginx 1.27)
                ├── Khởi chạy toàn bộ hệ thống qua Docker Compose (MySQL + Backend + Frontend)
                └── Smoke Test tự động các Public APIs (/api/guest/packages, /api/guest/schedules) & Giao diện Web
```

---

## 2. Các Điểm Cải Tiến Quan Trọng So Với `ci.yml` Hiện Tại

| Hạng mục | Trạng thái cũ trong `SWP391_Code` | Trạng thái mới trong `outputs/` |
| :--- | :--- | :--- |
| **Frontend Automated Tests (`npm test`)** | ⚠️ **Chưa chạy trong `ci.yml`** (chỉ chạy `lint` và `build`, bỏ sót 52 test cases có sẵn trong `package.json`) | ✅ Đã bổ sung bước `npm test` chạy đầy đủ 52 tests (`test:manager`, `test:i18n`, `test:images`, `test:benefits`, `test:member`) |
| **Nhánh kích hoạt CI (`on.push` / `on.pull_request`)** | ⚠️ Giới hạn PR vào `main` | ✅ Hỗ trợ đầy đủ mô hình nhánh trong `Rules.md` (`main`, `develop`, `feature/**`, `bugfix/**`, `fix/**`, `hotfix/**`, `update/**`) |
| **Lỗ hổng DEMO Snyk trong `Backend/pom.xml`** | 🔴 Đang chứa `commons-collections:3.2.2` (Critical RCE) và `org.dom4j:dom4j:2.1.3` (High XXE) làm fail cổng bảo mật | ✅ Cung cấp workflow `snyk-security.yml` + bản `outputs/Backend/pom.xml` đã gỡ bỏ 2 thư viện lỗ hổng không sử dụng trong code |
| **Báo cáo Test Backend (Surefire Reports)** | ⚠️ Không lưu lại khi test fail | ✅ Tự động upload `backend-test-reports` (`if: always()`) để tra cứu lỗi nhanh trên GitHub Actions |
| **Đóng gói Container & CD Smoke Test** | ❌ Chưa có `Dockerfile`, `nginx.conf`, `docker-compose.yml`, `cd.yml` | ✅ Đầy đủ Multi-stage `Dockerfile` cho Backend/Frontend, `nginx.conf` hỗ trợ React Router SPA & proxy `/api/`, cùng `docker-compose.yml` và `cd.yml` |

---

## 3. Hướng Dẫn Kiểm Tra & Áp Dụng Trước Khi Merge Vào `main`

### Bước 1: Chạy kịch bản kiểm tra CI cục bộ (Local CI Verification)
Tại thư mục gốc, chạy script PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File ".\outputs\scripts\verify-ci-local.ps1"
```
Script sẽ tự động thực thi:
1. Kiểm tra cấu trúc các file CI/CD trong `outputs/`
2. Kiểm tra lỗ hổng DEMO Snyk trong `Backend/pom.xml`
3. Chạy `npm run lint`, `npm test` (52 tests), `npm run build` tại `Frontend/`
4. Chạy `./mvnw test-compile` và các Unit Tests tại `Backend/`

### Bước 2: Xem trước (Dry-Run) việc áp dụng vào `SWP391_Code`
```powershell
powershell -ExecutionPolicy Bypass -File ".\outputs\scripts\apply-to-project.ps1" -DryRun
```

### Bước 3: Áp dụng chính thức vào `SWP391_Code` để chuẩn bị Merge vào `main`
- **Giữ nguyên 2 thư viện DEMO Snyk** (nếu bạn đang cần demo cảnh báo lỗi trên Snyk):
  ```powershell
  powershell -ExecutionPolicy Bypass -File ".\outputs\scripts\apply-to-project.ps1"
  ```
- **Áp dụng kèm bản vá `pom.xml` sạch lỗ hổng** (khuyên dùng trước khi merge vào `main`):
  ```powershell
  powershell -ExecutionPolicy Bypass -File ".\outputs\scripts\apply-to-project.ps1" -IncludeRemediatedPom
  ```

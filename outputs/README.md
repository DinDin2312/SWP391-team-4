# 📦 Thư Mục Kiểm Duyệt CI/CD & DevSecOps (`outputs/`)
**Dự án:** Hệ thống Quản lý Trung tâm Thể thao (NEXUS Sports Center - SWP391 Team 4)  
**Đề tài số 4 — Giảng viên:** MinhTTH5

Toàn bộ cấu hình **CI/CD Pipeline, DevSecOps (Snyk/Trivy), Dockerization và Ma trận Kiểm thử 6 Flows** đã được đóng gói độc lập vào thư mục `outputs/` này để bạn kiểm tra trước khi merge vào nhánh `main` (không làm ảnh hưởng tới các file đang sửa dở trên nhánh `fix/member-AI-context`).

---

## 📂 Cấu Trúc Thư Mục `outputs/`

```text
outputs/
├── README.md                                       # Tài liệu tổng quan thư mục kiểm duyệt này
├── .env.example                                    # Mẫu biến môi trường chuẩn cho Local / Docker / CI
├── docker-compose.yml                              # Khởi chạy trọn bộ MySQL 8.4 + Spring Boot Backend + React/Nginx Frontend
│
├── .github/
│   ├── dependabot.yml                              # Tự động kiểm tra bản vá bảo mật hàng tuần (Maven, npm, GitHub Actions)
│   ├── PULL_REQUEST_TEMPLATE.md                    # Checklist PR theo đúng Rules.md và 6 Flows nghiệp vụ
│   └── workflows/
│       ├── ci.yml                                  # Pipeline CI nâng cấp (Thêm bước chạy 52 Frontend Tests + Flyway V1-V6 + Backend Verify)
│       ├── snyk-security.yml                       # Pipeline DevSecOps (Dependency Review + Snyk SCA/SAST + Trivy + Kiểm tra pom.xml)
│       └── cd.yml                                  # Pipeline CD (Build Docker multi-stage & chạy Smoke Test toàn hệ thống)
│
├── Backend/
│   ├── Dockerfile                                  # Multi-stage Dockerfile (Temurin JDK 17 build -> JRE 17 Alpine non-root runtime)
│   ├── .dockerignore                               # Loại trừ target/, uploads/, .idea/ khi build image
│   └── pom.xml                                     # Bản pom.xml đã gỡ bỏ 2 dependency DEMO Snyk (commons-collections:3.2.2 & dom4j:2.1.3)
│
├── Frontend/
│   ├── Dockerfile                                  # Multi-stage Dockerfile (Node 22 Alpine build -> Nginx 1.27 Alpine runtime)
│   ├── .dockerignore                               # Loại trừ node_modules/, dist/, .env khi build image
│   └── nginx.conf                                  # Cấu hình Nginx hỗ trợ React Router SPA fallback & Reverse Proxy /api/, /uploads/
│
├── docs/
│   ├── CI_CD_PIPELINE_GUIDE.md                     # Hướng dẫn chi tiết kiến trúc CI/CD & các điểm cải tiến
│   └── FLOW_TRACEABILITY_AND_TEST_MATRIX.md        # Ma trận đối chiếu 4 Actors (32 tính năng) & 6 Flows (3 Must-Have + 3 Nice-to-Have)
│
└── scripts/
    ├── verify-ci-local.ps1                         # Script chạy kiểm tra toàn bộ cổng CI ngay trên máy Windows
    └── apply-to-project.ps1                        # Script copy tự động từ outputs/ vào SWP391_Code/ khi sẵn sàng merge vào main
```

---

## ⚡ Cách Kiểm Tra Nhanh Trước Khi Merge Vào `main`

1. **Chạy kiểm chứng toàn bộ CI Pipeline trên máy local:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File ".\outputs\scripts\verify-ci-local.ps1" -RunDatabaseTests
   ```
2. **Xem trước các file sẽ được cập nhật vào `SWP391_Code`:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File ".\outputs\scripts\apply-to-project.ps1" -DryRun -IncludeRemediatedPom
   ```
3. **Áp dụng vào `SWP391_Code` sau khi đã kiểm tra xong:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File ".\outputs\scripts\apply-to-project.ps1" -IncludeRemediatedPom
   ```

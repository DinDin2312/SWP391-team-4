# 🏋️ NEXUS SPORTS CENTER — HỆ THỐNG QUẢN LÝ TRUNG TÂM THỂ THAO ĐA NĂNG

[![CI](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/ci.yml/badge.svg)](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/ci.yml)
[![Comprehensive Test & Coverage CI (>= 95%)](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/comprehensive-test-ci.yml/badge.svg)](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/comprehensive-test-ci.yml)
[![CD - Deploy to VPS](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/deploy.yml/badge.svg)](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/deploy.yml)

> **Đồ án môn học SWP391 (Team 4)** — *Nền tảng Quản lý và Vận hành Trung tâm Thể thao & Thể hình Toàn diện (`NEXUS Sports Lab`)*.
> Kết nối đồng bộ 4 vai trò nội bộ (**Center Manager**, **Receptionist**, **Coach**, **Member**) cùng **Trang công khai cho Khách vãng lai**, tích hợp **Thanh toán trực tuyến đa cổng (PayOS / VietQR / VNPay / MoMo)**, **Trợ lý ảo RAG + Agentic UI streaming (Google Gemini)**, **Kiểm định tự động (Coverage ≥ 95%)** và **Docker + Caddy HTTPS CD**.

---

## 📌 MỤC LỤC
1. [Tổng quan & Các phân hệ chức năng](#1-tổng-quan--các-phân-hệ-chức-năng)
2. [Công nghệ sử dụng (Tech Stack)](#2-công-nghệ-sử-dụng-tech-stack)
3. [Kiến trúc & Cấu trúc dự án](#3-kiến-trúc--cấu-trúc-dự-án)
4. [Cơ sở dữ liệu & Flyway Migrations (`V1`–`V36`)](#4-cơ-sở-dữ-liệu--flyway-migrations-v1v36)
5. [Quy tắc nghiệp vụ & Tác vụ tự động](#5-quy-tắc-nghiệp-vụ--tác-vụ-tự-động)
6. [Tài khoản Demo dùng thử](#6-tài-khoản-demo-dùng-thử)
7. [Hướng dẫn Cài đặt & Khởi chạy](#7-hướng-dẫn-cài-đặt--khởi-chạy)
8. [Cấu hình Biến môi trường](#8-cấu-hình-biến-môi-trường)
9. [Kiểm thử & CI/CD Quality Gates](#9-kiểm-thử--cicd-quality-gates)
10. [Danh mục API Endpoints chính](#10-danh-mục-api-endpoints-chính)
11. [Tài liệu liên quan](#11-tài-liệu-liên-quan)

---

## 1. TỔNG QUAN & CÁC PHÂN HỆ CHỨC NĂNG

### 🌐 Khách vãng lai & Xác thực (`/`, `/login`, `/register`)
*   **Landing Page (`NEXUS Sports Lab`)**: Trình diễn video/hình ảnh cơ sở vật chất, tra cứu danh mục gói tập (`SELLING`), lớp học và lịch tập công khai qua `/api/guest/**`.
*   **Xác thực & Hồ sơ bảo mật**: Đăng ký tự phục vụ xác thực OTP 6 số qua Email, đăng nhập JWT Stateless / **Google OAuth2**, khôi phục mật khẩu OTP 3 bước, đổi Email xác thực OTP và tải ảnh đại diện (`multipart/form-data`).
*   **Trải nghiệm UI**: Hỗ trợ đầy đủ **Song ngữ Anh – Việt (`i18n`)**, **Chế độ Sáng / Tối (`Dark / Light Theme`)** lưu theo trình duyệt và linh vật tương tác **CyberFox Mascot (`NEXUS AI`)**.

### 🏃 Hội viên (`Member` — `/member/*`)
*   **Dashboard & Thẻ thành viên (`CustomerDashboard`, `Memberships`, `PackageStore`)**: Theo dõi ngày hiệu lực gói (hỗ trợ **cộng dồn/xếp hàng `Queued`** khi gia hạn trước hạn), lượt buổi còn lại theo từng môn/phòng, hạng thành viên tích điểm (`Silver` / `Gold` / `Platinum`) và chỉ số InBody gần nhất.
*   **Đặt lớp, Lịch tập & QR Check-in (`BookClass`, `MySchedule`, `AttendanceHistory`)**: Đăng ký khóa học bằng quyền lợi gói tập hoặc thanh toán giỏ hàng, lấy mã **QR cá nhân từng buổi** để check-in tại quầy, tra cứu lịch sử điểm danh.
*   **Chính sách Hủy / Bảo lưu / Chuyển lớp & Trung tâm Hỗ trợ (`MemberSupportView`)**: Xem trước mức hoàn/chuyển (`cancel-preview`, `transfer-preview`), tự hủy nhận **Credit Voucher**, chuyển lớp, gửi ticket phản hồi/bảo trì cơ sở vật chất/khiếu nại và quản lý ví Credit (`USER_CREDITS`).
*   **Hồ sơ Sức khỏe, Body Transformation & Nộp bài tập**: Quản lý hồ sơ sức khỏe (`HealthProfileSection`), tự ghi nhận & theo dõi biểu đồ thể trạng **InBody / FPS** (`BodyTransformationModal`), xem giáo án của HLV và **nộp video bài tập** (`SubmitWorkoutModal`) để Coach chấm & nhận xét.
*   **Phản hồi Dời lịch & Ca học bù**: Nhận thông báo ngay trên Topbar, chủ động chọn **Tham gia ca bù** hoặc **Bận — Tự động hoàn 1 lượt / Credit**.
*   **Trợ lý ảo `NEXUS AI` (RAG + SSE Streaming + Agentic UI)**: Tư vấn thời gian thực dựa trên kho tri thức 8 tài liệu nghiệp vụ/dinh dưỡng/chấn thương/kỹ thuật (`rag/knowledge/*.md`), tự động highlight lớp/gói và hỗ trợ thao tác giỏ hàng.

### 🏋️ Huấn luyện viên (`Coach` — `/coach/*`)
*   **Lịch dạy & Điểm danh đối soát (`CoachSchedule`)**: Theo dõi ca dạy, danh sách học viên từng buổi và điểm danh (`PRESENT` / `ABSENT` / `NOT_YET`) liên thông đối soát chéo với quầy Lễ tân.
*   **Đổi lịch & Dạy bù (`CoachRescheduleRequests`)**: Gửi yêu cầu dời sang ca học bù (kiểm tra trống phòng, trống lịch HLV và trùng lịch học viên theo thời gian thực) hoặc xin phân công HLV dạy thay khi bận đột xuất.
*   **Học viên, Giáo án, Đánh giá & Chấm video (`CoachStudents`, `CoachWorkoutPlans`)**: Quản lý thư viện động tác, soạn & giao giáo án chi tiết (`Sets`, `Reps`, `Rest`), chấm & phản hồi video bài nộp của học viên, đánh giá chỉ số thể lực định kỳ và gửi thông báo lớp học.
*   **Trợ lý `NEXUS Coach AI`**: Chat AI streaming riêng cho HLV hỗ trợ thiết kế chương trình tập và tra cứu quy định.

### 🛎️ Lễ tân (`Receptionist` — `/receptionist`, `/staff`)
*   **Quản lý Hội viên & Giao dịch tại quầy (`MemberManagementView`, `RegisterMemberView`, `ManageMembershipsView`, `InvoiceManagementView`)**: Tra cứu hồ sơ 360°, đăng ký hội viên mới, bán & kích hoạt gói tại quầy (`COUNTER`), đăng ký/hủy lớp, gợi ý & xác nhận gia hạn lớp học (`suggest-renewal` / `confirm-renewal`), tra cứu & in biên lai hóa đơn.
*   **Check-in Thông minh & Đối soát chéo (`MemberCheckInView`, `CoachCheckInTab`, `QrScannerModal`)**: Quét QR check-in cả Hội viên và HLV; phân tích tự động 4 trường hợp quyền lợi (cấp mã mở cửa khu Gym `GYM-PASS-...` đúng gói), phát hiện & lọc các ca bất thường (`ANOMALY`).
*   **Bàn Hỗ trợ & Quầy Đồ thất lạc (`SupportDeskView`, `LostAndFoundView`)**: Tiếp nhận/trả lời/thu hồi/chuyển cấp (`ESCALATED`) yêu cầu hỗ trợ, tạo ticket thay mặt hội viên; ghi nhận, xác minh trả đồ (`claim`), thanh lý (`dispose`) và thống kê đồ thất lạc.

### 🧑‍💼 Quản lý Trung tâm (`Center Manager` — `/manager`, `/admin`)
*   **Trung tâm Điều hành (`OperationalOverview`)**: Biểu đồ doanh thu, hàng đợi quyết định (`decisions`), cảnh báo ca học cần xử lý gấp (`attention`) và danh sách hội viên sắp hết hạn cần gia hạn (`renewals`).
*   **Vận hành & Xếp lịch Thông minh (`OperationsPage`)**: Quản trị Bộ môn (`SUBJECTS`), Phòng tập (`ROOMS` + ma trận `ROOM_SUBJECTS`), Lớp học (`CLASSES` theo mã 1xx/2xx/3xx), ca học cố định (`TeachingSlotSettings`) & số ngày mở khóa trước (`CourseLeadDays`), tự động xem trước và sinh chuỗi lịch (`SchedulePlanner` / `CourseSchedulePlanner`), hỗ trợ đổi phòng riêng cho từng buổi học đơn lẻ.
*   **Phê duyệt Dời lịch & Dạy thay (`ManagerRescheduleView`)**: Kiểm tra xung đột **Phòng tập – HLV (gồm thời gian nghỉ chuyển ca) – Học viên**, chặn slot quá khứ, thiết lập sĩ số tối thiểu (**Quorum**) & hạn chót xác nhận, hoặc phân công trực tiếp HLV rảnh lịch dạy thay.
*   **Gói tập, Giao dịch, Nhân sự, Báo cáo & Audit Log**: Quản lý loại gói động (`PACKAGE_TYPES`), upload ảnh tài nguyên, theo dõi lịch sử chỉnh sửa gói, đối soát sổ cái giao dịch (`REVIEW`), khóa/mở tài khoản an toàn, báo cáo doanh thu lớp học & giờ dạy HLV (hỗ trợ xuất báo cáo) và nhật ký kiểm toán (`AUDIT_LOGS`).

---

## 2. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ & Phiên bản trong mã nguồn |
| :--- | :--- |
| **Backend** | Java 17+, **Spring Boot 4.1.1**, Spring Security 6, Spring Data JPA / Hibernate (`ddl-auto=validate`), Lombok |
| **Xác thực & Tài liệu API** | **JJWT 0.12.6** (JWT Stateless), BCrypt, **SpringDoc OpenAPI 3.2.0** (Swagger UI tại `/api/swagger-ui.html`) |
| **Database & Migration** | **MySQL 8.0 / 8.4**, **Flyway DB Migration** (`V1`–`V36`, hỗ trợ cả SQL & Java migrations) |
| **AI & RAG** | **Google Gemini REST API** (`gemini-3-flash-preview`, `gemini-embedding-001` 768 chiều), Vector Index in-memory + DB (`KNOWLEDGE_DOCUMENTS`, `DOCUMENT_CHUNKS`), **SSE Streaming** |
| **Thanh toán & Email** | **PayOS** (Webhook & Callback), **VietQR Napas 247**, **VNPay Sandbox**, **MoMo Sandbox**, Spring Mail (Gmail SMTP) |
| **Frontend** | **React 19.2.8**, **Vite 8.3.0**, Tailwind CSS + Design Tokens (`tokens.css`), **Framer Motion 14**, **Lucide React**, Axios, `@react-oauth/google`, **jsQR** |
| **Chất lượng & Hạ tầng** | **JaCoCo 0.8.12** (≥ 95% Backend gate), **Oxlint 1.81** + **Node Test Runner** (≥ 95% Frontend gate), **Docker Compose**, **Nginx**, **Caddy 2** (auto HTTPS), GitHub Actions |

---

## 3. KIẾN TRÚC & CẤU TRÚC DỰ ÁN

Dự án tổ chức theo kiến trúc **Module / Feature-Based** giúp tách biệt rõ theo từng phân hệ:

```text
SWP391_Code/
├── README.md                                  # Tài liệu tổng quan dự án (file này)
├── ARCHITECTURE.md                            # Quy ước kiến trúc module & git workflow nhóm
├── BUSINESS_ARCHITECTURE_AND_ROLE_MATRIX.md   # Ma trận phân quyền & kiến trúc nghiệp vụ
├── BUSINESS_RULES_AND_WORKFLOWS.md            # Đặc tả quy tắc nghiệp vụ & luồng xử lý
├── docker-compose.yml                         # Triển khai local/dev bằng Docker (MySQL + Backend + Nginx)
├── docker-compose.server.yml                  # Mở rộng triển khai VPS kèm Caddy auto HTTPS (80/443)
├── Caddyfile                                  # Cấu hình reverse proxy & TLS tự động cho Caddy
├── .env.docker.example                        # Mẫu biến môi trường cho Docker / Server
├── .github/workflows/                         # ci.yml, comprehensive-test-ci.yml, deploy.yml
├── docs/                                      # Tài liệu kỹ thuật bổ sung & hướng dẫn deploy CD
├── scripts/                                   # Script hỗ trợ triển khai VPS (deploy-vps.sh)
│
├── Backend/                                   # Spring Boot 4.1.1 API Server
│   ├── pom.xml                                # Cấu hình dependencies & JaCoCo >= 95% check
│   ├── database_init.sql                      # Dump schema + dữ liệu mẫu dùng để dựng demo nhanh
│   ├── migrations/README.md                   # Hướng dẫn vận hành & test Flyway migration
│   └── src/main/
│       ├── java/com/team4/sportscenter/
│       │   ├── config/                        # Cấu hình VNPayConfig, MoMoConfig...
│       │   ├── common/                        # SecurityConfig, CORS, Exception Handler, Utils
│       │   ├── security/                      # JwtService, JwtAuthenticationFilter, CustomUserDetails
│       │   └── modules/
│       │       ├── auth/                      # AuthController, UserController (OTP, Google OAuth2, Avatar)
│       │       ├── coach/                     # Lịch dạy, Điểm danh, Giáo án, Đánh giá, Video, Dời lịch, Coach AI
│       │       ├── guest/                     # API công khai gói tập, lớp học, lịch học
│       │       ├── manager/                   # Điều hành, Xếp lịch tự động, Gói tập, Nhân sự, Báo cáo, Audit, Duyệt dời lịch
│       │       ├── member/                    # Dashboard, Đặt lớp, Quyền lợi Snapshot, Hồ sơ sức khỏe, AI Chat, Dời lịch
│       │       ├── notification/              # Trung tâm thông báo & Cron nhắc lịch / gia hạn
│       │       ├── payment/                   # Giỏ hàng, PayOS, VietQR, VNPay, MoMo, Hóa đơn & Sổ cái
│       │       ├── rag/                       # VectorIndex, DocumentIngestion, Embedding & Retrieval Service
│       │       ├── receptionist/              # Check-in 4 trường hợp, Gia hạn lớp, Hỗ trợ tại quầy & LostAndFound
│       │       └── support/                   # Ticket hỗ trợ, Hủy/Chuyển lớp, Ví Credit Voucher
│       └── resources/
│           ├── application.properties         # Cấu hình chính (đọc từ biến môi trường)
│           ├── springdoc.properties           # Swagger/OpenAPI tại /api/swagger-ui.html
│           ├── rag/knowledge/*.md             # 8 tài liệu tri thức nội bộ nạp vào RAG Vector Index
│           └── db/migration/                  # Các script Flyway V1 -> V36
│
└── Frontend/                                  # React 19 + Vite 8 + Tailwind CSS
    ├── package.json                           # Scripts lint, build & test coverage >= 95%
    ├── nginx.conf                             # Nginx config cho Docker container (hỗ trợ SSE AI stream)
    ├── public/favicon.svg                     # Biểu tượng NEXUS Sports Center
    └── src/
        ├── config/                            # apiBase.js, roles.js
        ├── context/                           # AuthContext, ThemeContext
        ├── i18n/                              # LanguageStore, LanguageSwitcher & từ điển EN/VI (messages.js)
        ├── layouts/                           # AuthLayout, MemberLayout, CoachLayout, ReceptionistLayout
        ├── routes/                            # AppRoutes.jsx & ProtectedRoute.jsx
        ├── services/                          # Axios interceptors & contract tests
        ├── styles/tokens.css                  # Hệ thống màu Sáng / Tối & biến giao diện
        └── features/
            ├── auth/                          # Login, Register, OTPVerification, ForgotPassword
            ├── public/                        # LandingPage công khai
            ├── member/                        # Dashboard, Store, Cart, VietQR/PayOS Result, Schedule, Support, Health, AI Chat
            ├── coach/                         # Dashboard, Schedule, Reschedule, Students, Workouts, Submissions, Assessments, Coach AI
            ├── receptionist/                  # Check-in QR/Hội viên/HLV, Members, SupportDesk, LostAndFound, Invoices
            └── manager/                       # Overview, Staff, Operations, Reschedule, Packages, Transactions, Reports, Audit, Settings
```

---

## 4. CƠ SỞ DỮ LIỆU & FLYWAY MIGRATIONS (`V1`–`V36`)

Hệ thống dùng **MySQL 8** với `spring.jpa.hibernate.ddl-auto=validate` và **Flyway** quản lý toàn bộ tiến hóa schema (`Backend/src/main/resources/db/migration/`, chi tiết xem thêm tại [`Backend/migrations/README.md`](./Backend/migrations/README.md)). Một số nhóm bảng cốt lõi hiện tại gồm:

*   **Tài khoản & Phân quyền**: `ROLES`, `USERS`, `USER_SPECIALTIES`, `USER_CREDITS` (ví hoàn tiền/voucher tín dụng).
*   **Vận hành & Xếp lịch**: `SUBJECTS`, `ROOMS`, `ROOM_SUBJECTS` (`V26`), `CLASSES`, `SCHEDULES` (hỗ trợ `room_id` ghi đè phòng riêng từng buổi ở `V36`), cấu hình trung tâm (`V28`, `V29`).
*   **Gói tập Snapshot & Đặt lịch**: `PACKAGE_TYPES`, `PACKAGES`, `PACKAGE_SUBJECT_BENEFITS`, `PACKAGE_BENEFIT_ROOMS`, `USER_MEMBERSHIPS`, `MEMBERSHIP_SUBJECT_BENEFITS`, `MEMBERSHIP_BENEFIT_ROOMS`, `BOOKINGS`, `BOOKING_BENEFITS`.
*   **Thanh toán & Hóa đơn**: `INVOICES`, `INVOICE_DETAILS`, `INVOICE_BOOKINGS`, `PAYMENTS` (hỗ trợ trường giảm giá/voucher `V30`).
*   **Huấn luyện, Sức khỏe & Nộp bài**: `EXERCISES`, `COACH_WORKOUT_PLANS`, `COACH_PLAN_DETAILS`, `TRAINEE_ASSESSMENTS`, `MEMBER_HEALTH_PROFILES` (`V20`), `WORKOUT_SUBMISSIONS` (`V24`).
*   **Vận hành Lễ tân, Hỗ trợ & Dời ca**: `RECEPTIONIST_CHECKINS`, `SUPPORT_REQUESTS` (`V12`, `V13`, `V33`), `LOST_AND_FOUND_ITEMS` (`V16`), `SCHEDULE_RESCHEDULE_REQUESTS` & `RESCHEDULE_MEMBER_RESPONSES` (`V21`).
*   **AI RAG & Hệ thống**: `KNOWLEDGE_DOCUMENTS`, `DOCUMENT_CHUNKS` (`V23`), `NOTIFICATIONS`, `AUDIT_LOGS`.

---

## 5. QUY TẮC NGHIỆP VỤ & TÁC VỤ TỰ ĐỘNG

> 📖 Xem đặc tả chi tiết hơn tại [`BUSINESS_RULES_AND_WORKFLOWS.md`](./BUSINESS_RULES_AND_WORKFLOWS.md) và [`BUSINESS_ARCHITECTURE_AND_ROLE_MATRIX.md`](./BUSINESS_ARCHITECTURE_AND_ROLE_MATRIX.md).

1.  **Chống trùng lịch đa chiều & Xếp lịch Tự động (`SchedulePlanner`)**: Kiểm tra xung đột **Phòng tập (tôn trọng phòng ghi đè V36) – Huấn luyện viên (kể cả phút nghỉ chuyển ca) – Học viên** trước khi đặt lớp, xếp lịch hay duyệt dời ca.
2.  **Snapshot Quyền lợi Gói tập & Cộng dồn kỳ hạn**: Toàn bộ giá, thời hạn, môn học và phạm vi phòng được chụp cứng khi mua (`USER_MEMBERSHIPS`); mua gói cùng loại khi gói cũ còn hạn sẽ tự xếp hàng (`Queued`) nối tiếp ngày kết thúc.
3.  **Hợp đồng Dời ca & Sĩ số tối thiểu (`Quorum`)**: Manager duyệt ca học bù kèm `min_attendees` và `confirmation_deadline` (ca có `0` hội viên xác nhận được chốt ngay); hội viên tự chọn tham gia hoặc nhận hoàn lượt/Credit từ Topbar.
4.  **Check-in Thông minh 4 Trường hợp & Đối soát Chéo**: Chỉ cấp mã cửa khu Gym (`GYM-PASS-xxxx`) khi có quyền lợi Gym tương ứng; tự động đối soát 2 chiều giữa Check-in Lễ tân và Điểm danh của Coach để gắn cờ bất thường (`ANOMALY`).
5.  **Khóa Giỏ hàng 15 Phút, Hạng thẻ & Trạng thái `REVIEW`**:
    *   Chiết khấu tự động theo điểm tích lũy (`loyaltyPoints`): `Silver` ($\ge 500$: `-5%`), `Gold` ($\ge 1500$: `-10%`), `Platinum` ($\ge 3000$: `-15%`).
    *   Nếu callback/webhook thu tiền thành công nhưng đơn hết hạn hoặc lớp đầy chỗ cùng lúc, giao dịch giữ nguyên `COMPLETED` và chuyển hóa đơn sang `REVIEW` để nhân viên xử lý, không mất dấu thanh toán.
6.  **4 Tác vụ nền tự động (`@Scheduled`)**:
    *   `BookingCleanupTask` (mỗi `5 phút`): Tự hủy các booking `PENDING` quá hạn giữ chỗ 15 phút và gửi thông báo.
    *   `RescheduleDeadlineTask` (mỗi `5 phút`): Xử lý các yêu cầu dời lịch đã quá hạn xác nhận (chốt ca bù nếu đủ Quorum, hoặc hủy & hoàn lượt/voucher 100%).
    *   `AttendanceAutoClosureTask` (mỗi `15 phút`): Tự chốt trạng thái điểm danh cho các buổi học đã kết thúc.
    *   `SystemNotificationScheduler` (`08:00` & `19:00` hàng ngày): Gửi nhắc lịch học sắp tới và cảnh báo gói tập sắp hết hạn.

---

## 6. TÀI KHOẢN DEMO DÙNG THỬ

Khi khởi tạo từ `Backend/database_init.sql` (hoặc chạy với `docker compose`), hệ thống có sẵn các tài khoản mẫu với mật khẩu mặc định **`123456`**:

| Vai trò (Role) | Họ và Tên | Email đăng nhập | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Center Manager** | Quản Lý Trung Tâm | `admin@sport.com` | Điều hành, duyệt dời lịch, vận hành lớp/phòng/gói, nhân sự, báo cáo |
| **Receptionist** | Lễ Tân Thúy Kiều | `letan@sport.com` | Check-in QR/tại quầy, bán gói, gia hạn lớp, hỗ trợ & đồ thất lạc |
| **Coach** | HLV Nguyễn Văn Tuấn | `tuanpt@sport.com` | Lịch dạy, điểm danh, xin dời lịch, giáo án, chấm video, Coach AI |
| **Coach** | HLV Phạm Minh Hoàng | `hoangpt@sport.com` | Huấn luyện & quản lý lớp phụ trách |
| **Member** | Nguyễn Kiều Oanh | `oanh@gmail.com` | Đặt lớp, mua gói, giỏ hàng/thanh toán, hồ sơ sức khỏe, NEXUS AI |
| **Member** | Phạm Trung Kiên | `member_kien@gmail.com` | Hội viên Gym & Bơi lội |

*(Cơ sở dữ liệu demo còn chứa thêm nhiều HLV `hlv_*@sport.com` và hội viên `member_*@gmail.com` phục vụ test lịch & báo cáo nhiều dữ liệu.)*

---

## 7. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### Cách 1: Chạy nhanh bằng Docker 🐳 (Khuyên dùng)
Chỉ cần **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (không cần cài sẵn Java, Node hay MySQL trên máy).

```bash
cp .env.docker.example .env        # Trên Windows CMD/PowerShell: copy .env.docker.example .env
docker compose up -d --build
```

Sau khi các container `mysql`, `backend`, `frontend` khởi chạy xong:

| Dịch vụ | Địa chỉ truy cập |
| :--- | :--- |
| **Ứng dụng Web (Frontend + `/api` proxy)** | **http://localhost:8088** |
| **Swagger UI (OpenAPI)** | http://localhost:8088/api/swagger-ui.html |
| **MySQL (Workbench / DBeaver)** | `localhost:3307`, user `root`, password = `DB_PASSWORD` trong `.env` |

> Database lần đầu khởi tạo từ `Backend/database_init.sql` (hoặc file riêng qua `DB_INIT_FILE` trong `.env`) và `backend` sẽ tự động chạy Flyway migrate lên phiên bản mới nhất (`V36`). Muốn tạo lại database sạch từ đầu: `docker compose down -v && docker compose up -d --build`.

### Cách 2: Triển khai trên VPS kèm HTTPS tự động (Caddy 2)
Xem thêm hướng dẫn CI/CD tại [`docs/deploy-cd.md`](./docs/deploy-cd.md). Trên server đã cài Docker:
1. Tạo `.env` từ `.env.docker.example`, điền `DOMAIN` (VD: `203.0.113.10.sslip.io` hoặc domain riêng) và `PUBLIC_URL=https://<domain>`.
2. Mở cổng `80` và `443`, sau đó chạy:
```bash
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --build
```
*(Chế độ này ẩn cổng MySQL/Frontend trực tiếp ra internet, chỉ public qua Caddy 2 kèm SSL tự động.)*

### Cách 3: Chạy thủ công cho môi trường phát triển (Dev Local)
**Yêu cầu:** Java **17** hoặc **21+**, Node.js **22+** (hoặc 18+), MySQL **8.0+**.

1. **Khởi tạo MySQL Database:**
   ```sql
   CREATE DATABASE SportCenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   *Tùy chọn nạp dữ liệu mẫu demo:* import file `Backend/database_init.sql` vào schema `SportCenter`. Nếu để schema trống, Backend khi khởi chạy sẽ tự chạy Flyway (`V1`–`V36`) để dựng cấu trúc bảng chuẩn (không chèn tài khoản demo).
2. **Chạy Backend (`http://localhost:8080`):**
   ```bash
   cd Backend
   ./mvnw spring-boot:run          # Windows: .\mvnw.cmd spring-boot:run
   ```
   Swagger UI (dev local): `http://localhost:8080/api/swagger-ui.html`.
3. **Chạy Frontend (`http://localhost:5173`):**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

---

## 8. CẤU HÌNH BIẾN MÔI TRƯỜNG

Mọi thông tin nhạy cảm đều đọc từ biến môi trường (có giá trị fallback an toàn trong `Backend/src/main/resources/application.properties` và mẫu trong `.env.docker.example`). **Không commit file `.env` lên Git.**

| Biến môi trường | Mục đích | Ghi chú / Giá trị mẫu |
| :--- | :--- | :--- |
| `DB_URL` | JDBC URL kết nối MySQL | `jdbc:mysql://localhost:3306/SportCenter?useSSL=false&allowPublicKeyRetrieval=true&connectionTimeZone=Asia/Ho_Chi_Minh` |
| `DB_USERNAME` / `DB_PASSWORD` | Tài khoản đăng nhập MySQL | Mặc định local: `root` / `123456` (Docker `.env`: `sportscenter`) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Tài khoản & App Password Gmail gửi OTP | Dùng Google App Password 16 ký tự; bỏ trống nếu chỉ test tài khoản demo |
| `GEMINI_API_KEY` | API Key của Google Gemini cho AI Chat & RAG Embedding | Bỏ trống thì chatbot AI sẽ tạm trả lời fallback/không gọi LLM |
| `GEMINI_CHAT_MODEL` / `GEMINI_EMBEDDING_MODEL` | Model LLM & Vector Embedding | Mặc định: `gemini-3-flash-preview` / `gemini-embedding-001` |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | Khóa tích hợp cổng thanh toán PayOS | Lấy tại PayOS Merchant Dashboard (tùy chọn) |
| `PAYOS_RETURN_URL` / `PAYOS_CANCEL_URL` | URL chuyển hướng sau khi thanh toán/hủy PayOS | `http://localhost:5173/member/payment-result` và `/member/cart` (Docker dùng `PUBLIC_URL`) |
| `BANK_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` | Cấu hình tài khoản nhận tiền VietQR Napas 247 | VD: `VCB`, số tài khoản & tên chủ tài khoản nhận chuyển khoản |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `MOMO_*` | Tham số Sandbox VNPay & MoMo | Có sẵn thông số test mặc định trong `application.properties` |
| `PUBLIC_URL`, `DOMAIN`, `WEB_PORT`, `MYSQL_PORT` | Cấu hình port & domain cho Docker / Caddy HTTPS | Mặc định Docker local: `WEB_PORT=8088`, `MYSQL_PORT=3307` |
| `MIGRATION_TEST_URL`, `MIGRATION_TEST_USERNAME`, `MIGRATION_TEST_PASSWORD` | Chạy test tạo schema tạm cho `DatabaseMigrationTests` | Bỏ trống thì 7 test trong `DatabaseMigrationTests` sẽ tự `skip` an toàn |

---

## 9. KIỂM THỬ & CI/CD QUALITY GATES

Dự án cấu hình pipeline tự động trên GitHub Actions (`.github/workflows/ci.yml`, `comprehensive-test-ci.yml`) với cổng chất lượng **Coverage ≥ 95%**:

### Frontend (`Frontend/`)
```bash
npm run lint               # Kiểm tra tĩnh bằng Oxlint (0 errors)
npm test                   # Chạy toàn bộ test + đo coverage >= 95% lines (test:coverage)
npm run build              # Build production bundle (Vite)
```
Các nhóm test lẻ có sẵn: `test:manager`, `test:member`, `test:coach`, `test:receptionist`, `test:contracts`, `test:consistency`, `test:i18n`, `test:benefits`, `test:images`.

### Backend (`Backend/`)
```bash
./mvnw test                # Chạy toàn bộ Unit & Integration Tests + kiểm tra JaCoCo >= 95%
./mvnw clean verify        # Chạy đầy đủ kiểm thử + đóng gói artifact
```
*(Lưu ý: Khi chạy test tích hợp trên local, cần MySQL đang hoạt động với schema `SportCenter` đã có dữ liệu role chuẩn; riêng `DatabaseMigrationTests` chỉ chạy khi đặt biến môi trường `MIGRATION_TEST_URL` trỏ tới MySQL cho phép tạo/xóa schema tạm.)*

---

## 10. DANH MỤC API ENDPOINTS CHÍNH

Khi khởi chạy Backend, có thể xem & thử trực tiếp đầy đủ schema tại **Swagger UI**: `/api/swagger-ui.html`.

*   **Xác thực & Người dùng (`/api/v1/auth`, `/api/v1/user`)**:
    *   `POST /api/v1/auth/register`, `POST /api/v1/auth/verify-otp`, `POST /api/v1/auth/resend-otp`
    *   `POST /api/v1/auth/login`, `POST /api/v1/auth/google`
    *   `POST /api/v1/auth/forgot-password/send-otp`, `verify-otp`, `reset`
    *   `GET/PUT /api/v1/user/profile`, `POST/DELETE /api/v1/user/avatar`, `POST /api/v1/user/email-change/*`, `PUT /api/v1/user/change-password`
*   **Khách vãng lai (`/api/guest`)**:
    *   `GET /api/guest/packages`, `GET /api/guest/packages/{id}`, `GET /api/guest/classes`, `GET /api/guest/schedules`
*   **Hội viên (`/api/v1/member`)**:
    *   Tổng quan, gói & đặt lớp: `my-membership`, `my-packages`, `packages`, `available-classes`, `calendar-bookings`, `enrolled-classes`, `book-class/{classId}`, `cancel-class/{classId}`, `add-package-to-cart/{packageId}`
    *   Sức khỏe, giáo án & nộp bài: `GET/PUT/DELETE /api/v1/member/health-profile`, `GET /my-workouts`, `POST/GET /assessments*`, `POST /workouts/{planId}/submit`, `GET /workouts/{planId}/submissions`
    *   Hỗ trợ, đổi/hủy lớp & Credit: `/api/v1/member/support/classes/{classId}/cancel-preview`, `cancel-direct`, `transfer-preview`, `transfer-to/{toClassId}`, `POST/GET /requests`, `GET /credits`, `PUT /requests/{requestId}/withdraw`
    *   Xác nhận ca học bù: `GET /api/v1/member/reschedule-responses/my`, `POST /api/v1/member/reschedule-responses/{requestId}/respond`
    *   NEXUS AI: `POST /api/v1/member/ai/chat`, `POST /api/v1/member/ai/chat/stream` (SSE)
*   **Huấn luyện viên (`/api/v1/coach`)**:
    *   `GET/PUT /profile`, `GET /subjects`, `GET /schedules`, `GET /schedules/{scheduleId}/students`, `PUT /schedules/{scheduleId}/attendance`
    *   `GET /students`, `GET /classes`, `POST /notifications/send`, `exercises`, `workouts/assign`, `assessments*`
    *   `GET /workouts/submissions`, `POST /submissions/{submissionId}/feedback`
    *   `POST/GET /reschedule-requests/**`, `GET /reschedule-requests/check-availability`, `PUT /reschedule-requests/{requestId}/cancel`
    *   Coach AI: `POST /api/v1/coach/ai/chat`, `POST /api/v1/coach/ai/chat/stream` (SSE)
*   **Lễ tân (`/api/receptionist`)**:
    *   Hội viên & Bán hàng: `/members/search`, `/members/{userId}`, `/members/register`, `/packages*`, `/classes/*`, `/invoices*`
    *   Check-in: `/checkin/rooms`, `/checkin/history`, `POST /checkin`, `POST /checkin/{checkInId}/checkout`, `/coaches/schedules`, `/coaches/checkin*`
    *   Hỗ trợ & Đồ thất lạc: `/api/receptionist/support/**` (`requests`, `stats`, `respond`, `revoke`, `on-behalf/{memberUserId}`), `/api/receptionist/lost-and-found/**` (`items`, `stats`, `claim`, `dispose`)
*   **Quản lý Trung tâm (`/api/manager`, `/api/v1/manager`)**:
    *   Điều hành: `/dashboard`, `/dashboard/decisions`, `/dashboard/attention`, `/dashboard/renewals`
    *   Tài nguyên & Lịch: `/users*`, `/roles`, `/subjects*`, `/rooms*`, `/classes*`, `/schedules*`, `/schedules/plan/preview`, `/schedules/plan/availability`, `/schedules/plan`, `/schedule-policy*`, `/{resource}/{id}/image`
    *   Gói tập, Tài chính & Giám sát: `/packages*`, `/package-types*`, `/transactions*`, `/reports`, `/reports/coach-teaching`, `/audit-logs*`
    *   Duyệt dời lịch: `/api/v1/manager/reschedule-requests/**` (`approve`, `reject`, `assign-substitute`, `available-coaches`)
*   **Thanh toán, Hóa đơn & Thông báo (`/api/v1/payment`, `/api/v1/invoices`, `/api/v1/notifications`)**:
    *   Giỏ hàng & Thanh toán: `GET /cart`, `POST /checkout`, `DELETE /cart/*`, `POST /cart/cancel-pending`, `GET /momo-callback`, `vnpay-callback`, `payos-callback`, `POST /payos-webhook`, `GET /vietqr-info/{invoiceId}`, `POST /vietqr-submit-transfer/{invoiceId}`
    *   Hóa đơn & Thông báo: `GET /api/v1/invoices`, `GET/PUT/DELETE /api/v1/notifications/**`

---

## 11. TÀI LIỆU LIÊN QUAN

*   [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Quy ước cấu trúc thư mục & quy trình làm việc nhóm.
*   [`BUSINESS_ARCHITECTURE_AND_ROLE_MATRIX.md`](./BUSINESS_ARCHITECTURE_AND_ROLE_MATRIX.md) — Ma trận phân quyền và kiến trúc nghiệp vụ các vai trò.
*   [`BUSINESS_RULES_AND_WORKFLOWS.md`](./BUSINESS_RULES_AND_WORKFLOWS.md) — Đặc tả chi tiết máy trạng thái & quy tắc nghiệp vụ.
*   [`Backend/migrations/README.md`](./Backend/migrations/README.md) — Hướng dẫn vận hành & kiểm thử Flyway DB Migrations.
*   [`docs/deploy-cd.md`](./docs/deploy-cd.md) — Hướng dẫn thiết lập CD tự động triển khai lên VPS.

---

## 👥 TEAM 4 — SWP391
Dự án được phát triển bởi các thành viên **Team 4 — Môn học SWP391**.

# 🏋️ NEXUS SPORTS CENTER - HỆ THỐNG QUẢN LÝ TRUNG TÂM THỂ THAO ĐA NĂNG

[![CI](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/ci.yml/badge.svg)](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/ci.yml)

> **Đồ án môn học SWP391** — *Hệ thống Quản lý và Vận hành Trung tâm Thể thao & Thể hình Toàn diện (Sports Center Management System)*.  
> Nền tảng kết nối 360 độ giữa **Hội viên (Member)**, **Huấn luyện viên (Coach)**, **Lễ tân (Receptionist)** và **Ban quản lý (Center Manager)**, tích hợp **Cổng thanh toán trực tuyến** và **Trợ lý ảo thông minh (Agentic AI)**.

---

## 📌 MỤC LỤC
1. [Giới thiệu & Phạm vi Nghiệp vụ](#1-giới-thiệu--phạm-vi-nghiệp-vụ)
2. [Công nghệ Sử dụng (Tech Stack)](#2-công-nghệ-sử-dụng-tech-stack)
3. [Kiến trúc Dự án (Architecture)](#3-kiến-trúc-dự-án-architecture)
4. [Mô hình Dữ liệu Chuẩn BCNF](#4-mô-hình-dữ-liệu-chuẩn-bcnf)
5. [Quy tắc Nghiệp vụ Cốt lõi (Core Business Rules)](#5-quy-tắc-nghiệp-vụ-cốt-lõi-core-business-rules)
6. [Tài khoản Demo Dùng thử (Demo Accounts)](#6-tài-khoản-demo-dùng-thử-demo-accounts)
7. [Hướng dẫn Cài đặt & Khởi chạy](#7-hướng-dẫn-cài-đặt--khởi-chạy)
8. [Cấu hình Biến môi trường](#8-cấu-hình-biến-môi-trường)
9. [Danh mục API Endpoints](#9-danh-mục-api-endpoints)

---

## 1. GIỚI THIỆU & PHẠM VI NGHIỆP VỤ

Dự án đã hoàn thiện trọn vẹn cả **3 luồng bắt buộc (Must Have)** và **3 luồng mở rộng (Nice to Have)** theo đúng đặc tả môn học:

### 🌟 Các Phân hệ Nghiệp vụ Cốt lõi:
*   **Flow 1: Quản lý Người dùng & Gói tập (User & Membership Management)**:
    *   Đăng ký tài khoản tự phục vụ kèm xác thực mã OTP gửi qua Email.
    *   Cơ chế xác thực bảo mật JWT Stateless, phân quyền 4 vai trò rõ rệt (Manager, Coach, Receptionist, Member).
    *   Quản lý danh mục gói tập (Gym, Yoga, Boxing, VIP), phân bổ quyền lợi phòng tập và bộ môn, quản lý thời hạn và vòng đời thẻ hội viên.
*   **Flow 2: Quản lý Lớp học & Xếp lịch (Class Booking & Schedule Management)**:
    *   Quản lý Danh mục Bộ môn (`SUBJECTS`), Phòng tập (`ROOMS`), Lớp học (`CLASSES`).
    *   Xếp lịch linh hoạt theo từng ca hoặc tạo chuỗi lịch định kỳ hàng tuần (`series`).
    *   Thuật toán chống trùng lịch ba chiều: Chống trùng lịch Huấn luyện viên, Phòng tập và Hội viên.
    *   Đặt lịch lớp học bằng lượt thẻ hội viên hoặc thanh toán lẻ, hủy lịch có hoàn trả lượt.
*   **Flow 3: Thanh toán & Báo cáo Thống kê (Payment & Analytics Management)**:
    *   Cơ chế giỏ hàng (`Cart`) thanh toán gộp nhiều gói tập/lớp học.
    *   Tích hợp cổng thanh toán trực tuyến **VNPay Sandbox** và **MoMo Sandbox** với xử lý Webhook / IPN tự động kích hoạt thẻ và sinh hóa đơn điện tử (`INVOICES`).
    *   Dashboard báo cáo doanh thu theo thời gian thực (ngày/tháng/năm), tỷ lệ tăng trưởng hội viên, tỷ lệ lấp đầy phòng tập và cảnh báo lớp vắng.
*   **Flow 4: Quản lý Huấn luyện & Điểm danh (Training & Attendance Management)**:
    *   Xem lịch dạy trực quan, danh sách học viên theo lớp dành cho Huấn luyện viên.
    *   Nghiệp vụ điểm danh khắt khe: Chỉ cho phép điểm danh vào đúng ngày diễn ra buổi học (`sessionDate == today`).
    *   Thư viện động tác (`EXERCISES`), soạn giáo án (`Coach Workout Plans`: Sets, Reps, Rest Time) gán cho học viên/lớp học.
    *   Đánh giá định kỳ chỉ số thể lực học viên (`Trainee Assessments`: Cân nặng, BMI, Body Fat, nhận xét tiến độ).
*   **Flow 5 & Flow 6: Trí tuệ Nhân tạo & Trợ lý Ảo (AI Workout & Agentic AI Assistant)**:
    *   Gợi ý bài tập cá nhân hóa tự động theo mục tiêu thể hình (`AiWorkoutPlan`).
    *   **Trợ lý Nexus AI (Google Gemini 1.5 Flash)**: Giải đáp thắc mắc dịch vụ, phân tích chế độ dinh dưỡng, tự động phát lệnh điều khiển giao diện (**Agentic UI**: Highlight gói tập/lớp học viền sáng Siri, tự động thêm vào giỏ hàng `ADD_CART`).

---

## 2. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

### Backend
*   **Ngôn ngữ & Framework**: Java 17 / 21, Spring Boot 3.x
*   **Bảo mật**: Spring Security 6, JWT (JSON Web Tokens), BCrypt Password Encoder
*   **Truy xuất Dữ liệu**: Spring Data JPA, Hibernate ORM
*   **Cơ sở dữ liệu & Migration**: MySQL 8.0, Flyway DB Migration
*   **Thư viện Email**: Spring Mail (JavaMailSender) tích hợp SMTP Gmail
*   **Thanh toán Trực tuyến**: VNPay Payment Gateway (Checksum SHA512), MoMo QR Gateway
*   **Trí tuệ Nhân tạo**: Google Gemini AI REST API (Gemini 1.5 Flash)

### Frontend
*   **Nền tảng**: React 19, Vite
*   **Styling & UI**: Tailwind CSS, CSS Custom Variables (Hỗ trợ Dark / Light Theme)
*   **Hiệu ứng & Icons**: Framer Motion, Lucide React
*   **HTTP Client**: Axios (kèm Interceptor tự động gắn Bearer Token)
*   **Đa ngôn ngữ**: Hệ thống i18n linh hoạt (Tiếng Việt & Tiếng Anh)

---

## 3. KIẾN TRÚC DỰ ÁN (ARCHITECTURE)

Dự án áp dụng mô hình phân tách rõ ràng theo kiến trúc **Feature-Based / Module-Based**, hạn chế tối đa xung đột mã nguồn khi làm việc nhóm:

```text
SWP391_Code/
│
├── 📄 BUSINESS_RULES_AND_WORKFLOWS.md      # Tài liệu Quy tắc Nghiệp vụ & Luồng đi toàn dự án
├── Backend/                                # Mã nguồn Spring Boot
│   └── src/main/java/com/team4/sportscenter/
│       ├── config/                         # Cấu hình VNPayConfig, MoMoConfig
│       ├── common/                         # Cấu hình SecurityConfig, CORS, Exception Handler toàn cục
│       ├── security/                       # Cấu hình JWT, CustomUserDetails, JwtAuthenticationFilter
│       └── modules/                        # Đóng gói logic theo từng phân hệ nghiệp vụ
│           ├── auth/                       # Đăng ký, Đăng nhập, OTP Email, Google OAuth2, Đổi Email/MK
│           ├── coach/                      # Lịch dạy, Điểm danh đối soát, Giáo án bài tập, Đánh giá thể lực, Hồ sơ HLV
│           ├── guest/                      # API công khai xem Gói tập & Lịch học cho khách vãng lai
│           ├── manager/                    # Quản trị Nhân sự, Bộ môn, Phòng, Lớp, Xếp lịch tự động, Gói tập, Sổ cái, Báo cáo, Audit Log
│           ├── member/                     # Đặt lớp, Quyền lợi gói tập (Snapshot), Lịch tập, NEXUS AI Chat, Cron dọn booking
│           ├── notification/               # Trung tâm thông báo & Cronjob nhắc lịch học / nhắc gia hạn thẻ
│           ├── payment/                    # Giỏ hàng, Thanh toán VNPay / MoMo, Hậu kiểm hóa đơn (REVIEW)
│           └── receptionist/               # Quản lý hội viên, Bán gói/Đặt lịch tại quầy, Check-in thông minh & Đối soát chéo
│
└── Frontend/                               # Mã nguồn React + Vite
    └── src/
        ├── components/                     # UI components dùng chung (Navbar, Footer, Sidebar...)
        ├── context/                        # State toàn cục (AuthContext, ThemeContext, LanguageContext)
        ├── routes/                         # Cấu hình AppRoutes & ProtectedRoute phân quyền theo Role
        ├── i18n/                           # Hệ thống từ điển đa ngôn ngữ Anh - Việt (messages.js)
        └── features/                       # Màn hình chức năng phân theo Actor
            ├── auth/                       # Login, Register, Verify OTP, Forgot Password, Change First Password
            ├── coach/                      # CoachDashboard, Lịch dạy, Điểm danh, Giáo án, Đánh giá, Hồ sơ
            ├── guest/                      # HomePage giới thiệu, Bảng giá & Lịch học công khai
            ├── manager/                    # ManagerPortalPage (Tổng quan, Tài khoản, Vận hành, Gói tập, Giao dịch, Báo cáo, Nhật ký)
            ├── member/                     # MemberDashboard, Đặt lớp, Lịch tập, Cửa hàng gói tập, Hồ sơ, NEXUS AI Chat
            ├── notification/               # NotificationPage
            ├── payment/                    # CartPage, PaymentSuccessPage, InvoiceHistoryPage
            └── receptionist/               # ReceptionistMembersPage, MemberCheckInView, ReceptionistSchedulePage
```

---

## 4. MÔ HÌNH DỮ LIỆU CHUẨN BCNF

Hệ thống được thiết kế và chuẩn hóa dữ liệu cao cấp, loại bỏ hoàn toàn dư thừa dữ liệu:

*   **`ROLES` & `USERS`**: Quản lý thông tin tài khoản, trạng thái (`PENDING`, `ACTIVE`, `INACTIVE`), cờ `force_password_change` và điểm tích lũy (`loyalty_points`).
*   **`USER_SPECIALTIES`**: Kỹ năng chuyên môn của từng Huấn luyện viên (HLV nào phụ trách bộ môn nào).
*   **`SUBJECTS`, `ROOMS`, `CLASSES`, `SCHEDULES`**:
    *   `CLASSES` quản lý danh mục lớp học gắn với Bộ môn (`subject_id`), Huấn luyện viên (`coach_id`), Phòng tập (`room_id`), đơn giá và sĩ số tối đa (`max_slots`).
    *   `SCHEDULES` quản lý từng buổi học cụ thể theo khung giờ (`start_time`, `end_time`, `status`: `SCHEDULED`, `COMPLETED`, `CANCELLED`).
*   **`PACKAGE_TYPES`, `PACKAGES`, `PACKAGE_SUBJECT_BENEFITS`, `PACKAGE_BENEFIT_ROOMS`**:
    *   Định nghĩa gói tập (`SELLING` / `STOPPED`), giới hạn mua (`purchase_limit_per_member`) và ma trận quyền lợi bộ môn/phòng tập.
*   **`USER_MEMBERSHIPS`, `MEMBERSHIP_SUBJECT_BENEFITS`, `MEMBERSHIP_BENEFIT_ROOMS`, `BOOKING_BENEFITS`**:
    *   Lưu trữ **Bản chụp bất biến (Immutable Snapshot)** của gói tập tại thời điểm hội viên mua và theo dõi phân bổ hạn mức buổi học cho từng booking.
*   **`BOOKINGS`**: Ghi nhận lượt đăng ký lớp học (`PENDING`, `CONFIRMED`, `CANCELLED`) và trạng thái điểm danh (`NOT_YET`, `PRESENT`, `ABSENT`).
*   **`RECEPTIONIST_CHECKINS`**: Lưu lịch sử Check-in tại quầy Lễ tân, mục đích vào cửa (`GYM_WORKOUT`, `CLASS_ATTENDANCE`, `BOTH`), mã mở cửa khu Gym (`access_code`) và trạng thái đối soát chéo (`anomaly_status`).
*   **`INVOICES`, `INVOICE_DETAILS`, `INVOICE_BOOKINGS`, `PAYMENTS`**: Quản lý giỏ hàng, thanh toán (`VNPAY`, `MOMO`, `CASH`, `FREE`), đối soát hậu kiểm (`REVIEW`) và mã giao dịch (`transaction_no`).
*   **`COACH_WORKOUT_PLANS`, `COACH_PLAN_DETAILS`, `EXERCISES`, `TRAINEE_ASSESSMENTS`**: Quản lý thư viện bài tập, giáo án và nhật ký đánh giá thể lực học viên.
*   **`AUDIT_LOGS` & `NOTIFICATIONS`**: Lưu vết kiểm toán toàn hệ thống và thông báo đa kênh.

---

## 5. QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

> 📖 **Tài liệu Đặc tả Đầy đủ**: Xem chi tiết toàn bộ quy tắc nghiệp vụ, máy trạng thái và sơ đồ luồng xử lý của cả 7 phân hệ tại **[`BUSINESS_RULES_AND_WORKFLOWS.md`](./BUSINESS_RULES_AND_WORKFLOWS.md)**.

1.  **Chống trùng lịch 3 Chiều & Xếp lịch Tự động (`SchedulePlanner`)**:
    *   *Học viên:* Không thể đăng ký khóa học có bất kỳ buổi nào giao nhau thời gian (`StartA < EndB AND StartB < EndA`) với lịch đã đặt.
    *   *Huấn luyện viên & Phòng tập:* Không thể xếp 2 ca học trùng giờ cho cùng 1 HLV hoặc cùng 1 phòng. Công cụ xếp lịch tự động quét khung giờ ưu tiên theo bước nhảy 15 phút kèm thời gian nghỉ đệm (`breakMinutes`).
2.  **Snapshot Quyền lợi Gói tập Bất biến & Hoàn trả Hạn mức (`PackageBenefitsService`)**:
    *   Khi hội viên mua gói, toàn bộ thông tin giá, thời hạn, danh sách môn học, số buổi và phạm vi phòng được chụp cứng (`Snapshot`) vào `USER_MEMBERSHIPS`. Việc Manager chỉnh sửa gói gốc về sau không làm ảnh hưởng đến gói hội viên đã mua.
    *   Hủy buổi học tương lai khi chưa điểm danh `PRESENT` sẽ tự động hoàn trả lại hạn mức buổi vào gói tập.
3.  **Check-in Thông minh 4 Trường hợp & Đối soát Chéo Lễ tân ↔ Coach (`Smart Check-in & Cross-Checking`)**:
    *   Tự động phân tích quyền lợi hội viên tại quầy: Chỉ cấp mã mở cửa khu Gym (`GYM-PASS-xxxx`) khi hội viên có gói Gym (`GYM_ONLY` hoặc `BOTH`). Hội viên chỉ đăng ký lớp (`CLASS_ONLY`) chỉ được hướng dẫn lên đúng phòng học, không cấp mã vào phòng Gym tự do.
    *   **Đối soát chéo 2 chiều**: (1) Học viên được Coach điểm danh `PRESENT` nhưng chưa qua quầy Lễ tân $\rightarrow$ Tự động gắn cờ `WARNING_NO_RECEPTION_CHECKIN`; (2) Học viên check-in lấy cớ đi học (`CLASS_ATTENDANCE`, không có gói Gym) nhưng Coach điểm danh `ABSENT` $\rightarrow$ Tự động gắn cờ `WARNING_SKIPPED_CLASS` báo động tại màn hình Lễ tân.
4.  **Khóa Giỏ hàng 15 Phút, Chiết khấu Hạng Thẻ & Hậu kiểm Thanh toán (`REVIEW` State)**:
    *   Tự động giảm giá theo điểm tích lũy (`loyaltyPoints`): Silver (`>= 500` điểm: `-5%`), Gold (`>= 1500` điểm: `-10%`), Platinum (`>= 3000` điểm: `-15%`).
    *   Khi callback VNPay/MoMo báo thu tiền thành công nhưng đơn hàng đã quá hạn 15 phút hoặc lớp vừa đầy chỗ, hệ thống giữ nguyên trạng thái thu tiền `COMPLETED` và chuyển hóa đơn sang `REVIEW` để Lễ tân đối soát/hoàn tiền, tuyệt đối không làm mất dấu giao dịch.
5.  **Bảo vệ Toàn vẹn Vận hành (`Operational Safeguards`)**:
    *   Không cho phép khóa/hạ quyền `Center Manager` đang hoạt động cuối cùng; không cho phép khóa/đổi quyền hoặc đổi bộ môn của `Coach` khi đang phụ trách lớp `ACTIVE` hoặc còn lịch dạy tương lai.

---

## 6. TÀI KHOẢN DEMO DÙNG THỬ (DEMO ACCOUNTS)

Hệ thống được khởi tạo sẵn dữ liệu mẫu trong file `database_init.sql`. Mật khẩu mặc định cho tất cả tài khoản là: **`123456`**

| Vai trò (Role) | Họ và Tên | Email Đăng Nhập | Mật khẩu | Chức năng kiểm thử chính |
| :--- | :--- | :--- | :---: | :--- |
| **Quản Lý Trung Tâm (Manager)** | Quản Lý Trung Tâm | `admin@sport.com` | `123456` | Dashboard doanh thu, Quản lý lớp, phòng, lịch, gói tập, phân quyền user, Audit log |
| **Nhân Viên Lễ Tân (Receptionist)** | Lễ Tân Thúy Kiều | `letan@sport.com` | `123456` | Tra cứu thành viên, đăng ký hội viên tại quầy, gợi ý & xác nhận gia hạn khóa học |
| **Huấn Luyện Viên (Coach - Gym)** | HLV Nguyễn Văn Tuấn | `tuanpt@sport.com` | `123456` | Lịch dạy, điểm danh lớp học, soạn giáo án, đánh giá thể chất học viên |
| **Huấn Luyện Viên (Coach - Yoga)** | HLV Trần Mai Anh | `maianh@sport.com` | `123456` | Quản lý học viên lớp Yoga, thông báo bài tập |
| **Huấn Luyện Viên (Coach - Boxing)**| HLV Phạm Minh Hoàng | `hoangpt@sport.com` | `123456` | Quản lý học viên lớp Boxing, điểm danh |
| **Hội Viên (Member 1)** | Trần Bùi Thái | `thai@gmail.com` | `123456` | Đặt lớp, mua gói VNPay/MoMo, xem lịch tập, chat AI |
| **Hội Viên (Member 2)** | Nguyễn Kiều Oanh | `oanh@gmail.com` | `123456` | Xem lịch sử điểm danh, xem giáo án HLV giao |

---

## 7. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### Yêu cầu Tiên quyết (Prerequisites)
*   **Java SDK**: Phiên bản 17 hoặc 21+
*   **Node.js**: Phiên bản 18+ (kèm npm)
*   **MySQL Server**: Phiên bản 8.0+
*   **IDE khuyên dùng**: IntelliJ IDEA (Backend) & VS Code / WebStorm (Frontend)

---

### Bước 1: Khởi tạo Cơ sở Dữ liệu MySQL
1. Mở MySQL Workbench hoặc DBeaver, tạo cơ sở dữ liệu `SportCenter`:
   ```text
   CREATE DATABASE SportCenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Chạy toàn bộ mã nguồn trong file `Backend/database_init.sql` để khởi tạo cấu trúc bảng và nạp dữ liệu mẫu hoàn chỉnh (các lớp, môn, gói tập, user demo).

---

### Bước 2: Cấu hình và Khởi chạy Backend (Spring Boot)
1. Mở thư mục `Backend/` bằng IntelliJ IDEA.
2. Kiểm tra file `src/main/resources/application.properties` và đảm bảo kết nối MySQL chính xác:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/SportCenter?useSSL=false&allowPublicKeyRetrieval=true&connectionTimeZone=Asia/Ho_Chi_Minh
   spring.datasource.username=root
   spring.datasource.password=123456
   ```
3. Cấu hình biến môi trường gửi mail OTP (xem mục [Cấu hình Biến môi trường](#8-cấu-hình-biến-môi-trường)).
4. Chạy dự án:
   *   Cách 1: Chạy trực tiếp qua class `SportscenterApplication.java` trong IDE.
   *   Cách 2: Chạy qua dòng lệnh Terminal:
       ```bash
       cd Backend
       ./mvnw spring-boot:run
       ```
   *   Server Backend sẽ khởi chạy tại: **`http://localhost:8080`**

---

### Bước 3: Cài đặt và Khởi chạy Frontend (React + Vite)
1. Mở Terminal mới tại thư mục `Frontend/`:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```
2. Mở trình duyệt web và truy cập địa chỉ: **`http://localhost:5173`**

---

## 8. CẤU HÌNH BIẾN MÔI TRƯỜNG

Hệ thống hỗ trợ truyền biến môi trường hoặc dùng giá trị mặc định được định nghĩa sẵn trong `application.properties`:

| Tên Biến | Mục đích | Giá trị Khuyên dùng |
| :--- | :--- | :--- |
| `DB_URL` | URL kết nối database MySQL | `jdbc:mysql://localhost:3306/SportCenter?...` |
| `DB_USERNAME` | Tên đăng nhập MySQL | Mặc định: `root` |
| `DB_PASSWORD` | Mật khẩu MySQL | Mật khẩu máy của bạn |
| `MAIL_USERNAME` | Tài khoản Gmail gửi OTP | Email của bạn (VD: `nexus.sportscenter@gmail.com`) |
| `MAIL_PASSWORD` | Mật khẩu ứng dụng Gmail (16 ký tự) | Lấy từ Google Account $\rightarrow$ Security $\rightarrow$ App Passwords |
| `gemini.api.key` | API Key của Google Gemini | Đã tích hợp sẵn key demo trong cấu hình |

> 💡 **Lưu ý khi test Đăng ký tài khoản mới**: Nếu chưa cấu hình `MAIL_USERNAME` và `MAIL_PASSWORD`, tính năng gửi mã OTP qua Gmail sẽ báo lỗi SMTP. Đối với việc kiểm thử thông thường, bạn có thể đăng nhập ngay bằng các [Tài khoản Demo có sẵn](#6-tài-khoản-demo-dùng-thử-demo-accounts).

---

## 9. DANH MỤC API ENDPOINTS

Hệ thống cung cấp các nhóm RESTful API chuẩn hóa theo phân hệ:

### 1. Phân hệ Xác thực & Bảo mật Tài khoản (`/api/v1/auth`)
*   `POST /api/v1/auth/register` : Đăng ký tài khoản hội viên mới (`status = PENDING`, gửi OTP 6 số).
*   `POST /api/v1/auth/verify` : Xác thực mã OTP kích hoạt tài khoản (`status = ACTIVE`).
*   `POST /api/v1/auth/login` & `POST /api/v1/auth/google` : Đăng nhập Email/Password hoặc Google OAuth2, trả về JWT Token.
*   `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password` : Khôi phục mật khẩu qua OTP Email.
*   `POST /api/v1/auth/change-first-password` : Đổi mật khẩu bắt buộc lần đầu đăng nhập.
*   `POST /api/v1/auth/request-email-change` & `POST /api/v1/auth/confirm-email-change` : Đổi địa chỉ Email bảo mật bằng OTP và phát hành lại JWT mới.

### 2. Phân hệ Hội viên & Khách vãng lai (`/api/v1/member`, `/api/guest`)
*   `GET /api/guest/packages`, `GET /api/guest/packages/{id}`, `GET /api/guest/schedules` : Tra cứu gói tập và lịch học công khai.
*   `GET /api/v1/member/dashboard` & `GET /api/v1/member/my-packages` : Xem tổng quan hội viên, thẻ đang sở hữu và hạn mức buổi còn lại.
*   `GET /api/v1/member/available-classes` & `GET /api/v1/member/packages` : Xem danh sách lớp học còn chỗ và gói tập đang mở bán (`SELLING`).
*   `POST /api/v1/member/book-class/{classId}` : Đặt khóa học lẻ (đưa vào Giỏ hàng `PENDING`).
*   `POST /api/v1/member/book-class/{classId}/with-package/{membershipId}` : Đặt khóa học trực tiếp bằng quyền lợi Gói tập (`CONFIRMED`).
*   `POST /api/v1/member/cancel-class/{classId}` : Hủy các buổi học tương lai của khóa học và hoàn trả hạn mức buổi vào gói tập.
*   `POST /api/v1/member/cart/add-package/{packageId}` : Thêm gói tập vào giỏ hàng (kèm chụp Snapshot quyền lợi).
*   `GET /api/v1/member/my-schedule`, `GET /api/v1/member/enrolled-classes`, `GET /api/v1/member/my-workouts`, `GET /api/v1/member/my-assessments` : Xem lịch học, giáo án và đánh giá tiến độ từ HLV.
*   `POST /api/v1/member/ai-chat` : Trò chuyện với trợ lý ảo **NEXUS AI** (tư vấn RAG thời gian thực + điều khiển giao diện tự động `ADD_CART`, `BOOK_CLASS`, `HIGHLIGHT_*`, `NAVIGATE`).

### 3. Phân hệ Huấn luyện viên (`/api/v1/coach`)
*   `GET /api/v1/coach/schedules` & `GET /api/v1/coach/schedules/{scheduleId}/students` : Xem lịch dạy và danh sách học viên của từng buổi.
*   `PUT /api/v1/coach/bookings/{bookingId}/attendance` : Điểm danh học viên (`PRESENT` / `ABSENT` / `NOT_YET`) tích hợp **Đối soát chéo 2 chiều** với quầy Lễ tân.
*   `GET /api/v1/coach/exercises` & `POST /api/v1/coach/exercises` : Quản lý thư viện bài tập.
*   `POST /api/v1/coach/workout-plans/assign`, `GET /api/v1/coach/workout-plans`, `DELETE /api/v1/coach/workout-plans/{planId}` : Giao giáo án cho cá nhân hoặc cả lớp.
*   `POST /api/v1/coach/assessments`, `GET /api/v1/coach/assessments`, `DELETE /api/v1/coach/assessments/{id}` : Đánh giá chỉ số hình thể & tiến độ học viên.
*   `GET /api/v1/coach/profile` & `PUT /api/v1/coach/profile` : Quản lý hồ sơ và chuyên môn giảng dạy.

### 4. Phân hệ Lễ tân (`/api/receptionist`)
*   `GET /api/receptionist/members/search` & `GET /api/receptionist/members/{userId}` : Tìm kiếm và xem hồ sơ 360° của hội viên (gói tập, lịch sử lớp học, quyền Check-in hôm nay, số lần vi phạm đối soát).
*   `POST /api/receptionist/members/register` : Đăng ký trực tiếp tài khoản hội viên mới tại quầy.
*   `GET /api/receptionist/packages` & `POST /api/receptionist/packages/subscribe` : Bán và kích hoạt gói tập trực tiếp tại quầy (`COUNTER`).
*   `GET /api/receptionist/checkin/rooms` : Kiểm tra danh sách phòng tập và mật độ người tập thời gian thực.
*   `POST /api/receptionist/checkin` & `POST /api/receptionist/checkin/{checkInId}/checkout` : Check-in tự động theo Ma trận 4 trường hợp quyền lợi (cấp mã mở cửa `GYM-PASS-...` nếu có gói Gym) và Check-out khi ra về.
*   `GET /api/receptionist/checkin/history` : Tra cứu lịch sử Check-in và lọc các ca cảnh báo đối soát chéo (`status=ANOMALY`).
*   `GET /api/receptionist/classes/suggest-renewal` & `POST /api/receptionist/classes/confirm-renewal` : Gợi ý và xác nhận gia hạn khóa học kế tiếp cho hội viên.

### 5. Phân hệ Quản lý Trung tâm (`/api/manager`)
*   `GET /api/manager/dashboard` & `GET /api/manager/dashboard/overview` : Bảng điều khiển doanh thu, cảnh báo lớp ít học viên (`< 25%`), ca học khẩn cấp trong 6 giờ tới và thẻ sắp hết hạn.
*   `GET/POST/PUT/DELETE /api/manager/users` & `PATCH /api/manager/users/{id}/status` : Quản trị nhân sự, khóa/mở khóa tài khoản có kiểm tra bảo vệ Manager cuối cùng và Coach đang đứng lớp.
*   `GET/POST/PUT /api/manager/subjects`, `/api/manager/rooms`, `/api/manager/classes` : Quản trị Bộ môn, Phòng tập và Lớp học.
*   `GET/POST/PUT /api/manager/schedules`, `POST /api/manager/schedules/series` : Xếp lịch đơn lẻ hoặc theo chuỗi tuần.
*   `POST /api/manager/schedules/plan/preview` & `POST /api/manager/schedules/plan/commit` : Công cụ xếp lịch tự động (`SchedulePlanner`) chống trùng giờ HLV & Phòng.
*   `GET/POST/PUT /api/manager/packages`, `/api/manager/package-types`, `PATCH /api/manager/packages/{id}/selling-status` : Quản trị Gói tập, loại gói, phạm vi môn/phòng và trạng thái mở bán.
*   `GET /api/manager/transactions` & `GET /api/manager/transactions/{id}` : Sổ cái đối soát Hóa đơn (`INVOICES`) và Giao dịch thanh toán (`PAYMENTS`).
*   `GET /api/manager/reports` & `GET /api/manager/audit-logs` : Báo cáo phân tích chuyên sâu và nhật ký kiểm toán (`AUDIT_LOGS`).

### 6. Phân hệ Thanh toán, Giỏ hàng & Thông báo (`/api/v1/payment`, `/api/v1/notifications`)
*   `GET /api/v1/payment/cart`, `DELETE /api/v1/payment/cart/remove/{classId}`, `DELETE /api/v1/payment/cart/remove-package/{packageId}`, `DELETE /api/v1/payment/cart/clear` : Quản lý Giỏ hàng.
*   `POST /api/v1/payment/checkout` : Khóa giỏ hàng 15 phút, áp dụng chiết khấu hạng thẻ (`Silver`/`Gold`/`Platinum`), khấu trừ Voucher tín dụng và sinh URL thanh toán VietQR (PayOS nhận tiền vào STK thật) / VNPay / MoMo.
*   `GET /api/v1/payment/payos-callback`, `POST /api/v1/payment/payos-webhook`, `GET /api/v1/payment/vnpay-callback` & `GET /api/v1/payment/momo-callback` : Xác thực chữ ký số, xử lý Webhook nhận tiền thật, hậu kiểm điều kiện đơn hàng (`PAID` hoặc chuyển `REVIEW` nếu phát sinh xung đột).
*   `GET /api/v1/payment/vietqr-info/{invoiceId}` & `POST /api/v1/payment/vietqr-confirm/{invoiceId}` : Cung cấp thông tin tài khoản ngân hàng cấu hình từ `application.properties`, mã VietQR Napas 247 và cơ chế xác nhận thanh toán tức thì.
*   `GET /api/v1/payment/my-invoices` : Tra cứu lịch sử hóa đơn của hội viên.
*   `GET /api/v1/notifications`, `PUT /api/v1/notifications/{id}/read`, `PUT /api/v1/notifications/read-all` : Quản lý thông báo người dùng.

---

## 👥 THÀNH VIÊN DỰ ÁN (TEAM 4)
*   Dự án được xây dựng và phát triển bởi các thành viên **Team 4 - Môn học SWP391**.
*   Mọi đóng góp hoặc thắc mắc vui lòng liên hệ qua kênh trao đổi chính thức của nhóm.

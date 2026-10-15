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
├── Backend/                                # Mã nguồn Spring Boot
│   └── src/main/java/com/team4/sportscenter/
│       ├── common/                         # Cấu hình CORS, Exception Handler toàn cục, Utils
│       ├── security/                       # Cấu hình JWT, Spring Security Filter Chain
│       └── modules/                        # Đóng gói logic theo từng phân hệ nghiệp vụ
│           ├── auth/                       # Đăng ký, Đăng nhập, OTP Email, Quên MK
│           ├── user/                       # Hồ sơ người dùng, Đổi mật khẩu, Avatar
│           ├── member/                     # Đặt lớp, Lịch tập, Điểm danh, Gói hội viên
│           ├── coach/                      # Lịch dạy, Điểm danh, Giáo án bài tập, Đánh giá thể lực
│           ├── receptionist/               # Tra cứu hội viên, Đăng ký tại quầy, Gia hạn khóa học
│           ├── manager/                    # Quản lý Bộ môn, Phòng, Lớp, Lịch, Gói tập, Audit Log
│           ├── payment/                    # Tích hợp giỏ hàng, VNPay, MoMo, Hóa đơn
│           └── ai/                         # Gemini AI Assistant, Nhận diện Intent & Action UI
│
└── Frontend/                               # Mã nguồn React + Vite
    └── src/
        ├── components/                     # UI components dùng chung (Navbar, AIChat, NotificationBell)
        ├── context/                        # State toàn cục (AuthContext, CartContext)
        ├── layouts/                        # Bố cục giao diện (MemberLayout, CoachLayout, ManagerLayout)
        ├── routes/                         # Cấu hình Router & ProtectedRoute phân quyền theo Role
        ├── i18n/                           # Hệ thống từ điển đa ngôn ngữ (messages.js)
        └── features/                       # Màn hình chức năng phân theo Actor
            ├── auth/                       # Trang Login, Register, VerifyOtp, ForgotPassword
            ├── member/                     # Dashboard, MySchedule, AttendanceHistory, Classes, Packages
            ├── coach/                      # CoachDashboard, CoachSchedule, CoachStudents, WorkoutPlans
            ├── receptionist/               # ReceptionistDashboard (Tra cứu, Đăng ký, Gia hạn)
            ├── manager/                    # AnalyticsDashboard, ManageClasses, Rooms, Subjects, Schedules
            └── public/                     # Landing Page giới thiệu, Bảng giá & Lịch học công khai
```

---

## 4. MÔ HÌNH DỮ LIỆU CHUẨN BCNF

Hệ thống được thiết kế và chuẩn hóa dữ liệu cao cấp, loại bỏ hoàn toàn dư thừa dữ liệu:

*   **`ROLES` & `USERS`**: Quản lý thông tin tài khoản, phân quyền 1 tài khoản gắn với 1 vai trò duy nhất (`role_id`: 1-Admin/Manager, 2-Receptionist, 3-Coach, 4-Member).
*   **`USER_SUBJECTS`**: Kỹ năng chuyên môn của từng Huấn luyện viên (HLV nào dạy được môn nào).
*   **`SUBJECTS`, `ROOMS`, `CLASSES`, `SCHEDULES`**:
    *   `CLASSES` đóng vai trò là danh mục lớp học, gắn với Bộ môn (`subject_id`), đơn giá và số lượng học viên tối đa (`max_slots`).
    *   `SCHEDULES` quản lý từng buổi học cụ thể, phân công Phòng tập (`room_id`) và Huấn luyện viên (`coach_id`) cho từng khung giờ (`start_time`, `end_time`).
*   **`PACKAGES`, `PACKAGE_SUBJECT_BENEFITS`, `PACKAGE_BENEFIT_ROOMS`**:
    *   Định nghĩa gói tập và ma trận quyền lợi: Thẻ tập này được check-in vào những phòng nào và được học những bộ môn nào.
*   **`USER_MEMBERSHIPS`**: Thẻ hội viên được kích hoạt sau khi thanh toán, theo dõi ngày hiệu lực (`start_date`, `end_date`) và số buổi tập khả dụng (`remaining_sessions`).
*   **`BOOKINGS`**: Ghi nhận lượt đăng ký lớp học của hội viên và trạng thái điểm danh (`attendance_status`: `PRESENT`, `ABSENT`, `NOT_YET`).
*   **`INVOICES`, `INVOICE_DETAILS`, `PAYMENTS`**: Quản lý giỏ hàng, thông tin thanh toán, lưu vết mã giao dịch ngân hàng (`transaction_no`) phục vụ đối soát kế toán.
*   **`COACH_WORKOUT_PLANS`, `COACH_PLAN_DETAILS`, `EXERCISES`**: Quản lý thư viện bài tập và giáo án phân bổ cho học viên.
*   **`TRAINEE_ASSESSMENTS`**: Nhật ký đánh giá thể lực định kỳ của học viên.
*   **`AUDIT_LOGS`**: Lưu lại vết mọi thao tác quản trị quan trọng trong hệ thống.

---

## 5. QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

1.  **Chống trùng lịch 3 Chiều (Three-way Conflict Check)**:
    *   *Học viên:* Không thể đăng ký 2 lớp học có khung giờ chồng lấn nhau trong cùng 1 ngày.
    *   *Huấn luyện viên:* Hệ thống chặn không cho phép xếp 1 HLV dạy 2 lớp cùng lúc.
    *   *Phòng tập:* Không thể xếp 2 lớp vào cùng 1 phòng trong cùng một khung giờ.
2.  **Ràng buộc Điểm danh (Attendance Date Rule)**:
    *   Huấn luyện viên **chỉ được phép thực hiện điểm danh vào đúng ngày diễn ra ca học** (`sessionDate == today`).
    *   Không cho phép điểm danh trước ngày học và khóa sửa đổi đối với các buổi đã chốt trong quá khứ.
3.  **Quyền lợi Gói tập & Trừ buổi (Package Benefits & Deductions)**:
    *   Khi hội viên đặt lớp học: Nếu sở hữu thẻ hội viên còn hạn (`today <= end_date`), còn lượt (`remaining_sessions > 0`), và bộ môn của lớp nằm trong danh mục ưu đãi của thẻ $\rightarrow$ Đặt lớp thành công với giá 0đ, trừ 1 buổi trong thẻ.
    *   Hủy lớp trước giờ quy định: Hoàn trả lại 1 buổi vào thẻ và mở lại slot trống cho lớp.
4.  **Kiểm soát Sĩ số Lớp học (Capacity Rule)**:
    *   Số học viên ghi danh (`booked_slots`) không được vượt quá `max_slots` của lớp và `capacity` của phòng tập. Khi chạm ngưỡng, lớp tự động chuyển trạng thái `FULL`.
5.  **Kích hoạt Thanh toán Tự động (IPN / Webhook Activation)**:
    *   Hệ thống chỉ kích hoạt thẻ hội viên và sinh hóa đơn điện tử khi nhận được phản hồi thanh toán thành công với chữ ký SHA512 hợp lệ từ VNPay (`00`) hoặc MoMo (`0`).

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

Hệ thống cung cấp hơn 110 endpoints phân tầng chuẩn RESTful API:

### 1. Phân hệ Xác thực & Tài khoản (`/api/v1/auth`, `/api/v1/user`)
*   `POST /api/v1/auth/register` : Đăng ký tài khoản hội viên mới.
*   `POST /api/v1/auth/verify-otp` : Xác thực mã OTP kích hoạt tài khoản.
*   `POST /api/v1/auth/login` : Đăng nhập hệ thống, trả về Token JWT và thông tin Role.
*   `POST /api/v1/auth/forgot-password` : Yêu cầu liên kết khôi phục mật khẩu qua Email.
*   `POST /api/v1/auth/reset-password` : Đặt lại mật khẩu mới với token xác nhận.
*   `GET /api/v1/user/profile` : Lấy thông tin cá nhân của tài khoản đang đăng nhập.
*   `PUT /api/v1/user/profile` : Cập nhật thông tin thể hình, số điện thoại, ngày sinh.
*   `POST /api/v1/user/avatar` : Upload ảnh đại diện người dùng.

### 2. Phân hệ Hội viên (`/api/v1/member`, `/api/guest`)
*   `GET /api/guest/packages` & `GET /api/guest/schedules` : Tra cứu gói tập và lịch học công khai.
*   `GET /api/v1/member/memberships` : Danh sách các thẻ hội viên đang sở hữu và thời hạn sử dụng.
*   `POST /api/v1/member/book-class/{classId}/with-package/{membershipId}` : Đặt lớp học sử dụng quyền lợi thẻ hội viên.
*   `DELETE /api/v1/member/cancel-class/{classId}` : Hủy đăng ký lớp học và hoàn trả lượt.
*   `GET /api/v1/member/my-schedule` : Lấy danh sách lịch tập cá nhân.
*   `GET /api/v1/member/attendance-history` : Xem chi tiết lịch sử điểm danh các buổi học.
*   `GET /api/v1/member/workout-plans` : Xem giáo án bài tập được Huấn luyện viên giao.

### 3. Phân hệ Huấn luyện viên (`/api/v1/coach`)
*   `GET /api/v1/coach/schedules` : Tra cứu lịch dạy của HLV theo ngày/tuần/tháng.
*   `PUT /api/v1/coach/schedules/{id}/attendance` : Thực hiện điểm danh học viên tại lớp.
*   `GET /api/v1/coach/students` : Danh sách toàn bộ học viên đang theo học các lớp của HLV.
*   `POST /api/v1/coach/workout-plans` : Soạn giáo án bài tập mới (Sets, Reps, Rest seconds).
*   `POST /api/v1/coach/workout-plans/assign` : Gán giáo án cho học viên hoặc cho cả lớp.
*   `POST /api/v1/coach/assessments` : Ghi nhận đánh giá chỉ số thể lực và nhận xét tiến độ học viên.
*   `POST /api/v1/coach/notifications/send` : Gửi thông báo/nhắc nhở bài tập về nhà cho học viên.

### 4. Phân hệ Lễ tân (`/api/receptionist`)
*   `GET /api/receptionist/members/search` : Tìm kiếm hội viên theo Tên, SĐT, Email.
*   `GET /api/receptionist/members/{userId}` : Xem chi tiết hồ sơ và gói tập của hội viên.
*   `POST /api/receptionist/members/register` : Đăng ký trực tiếp tài khoản hội viên mới tại quầy.
*   `GET /api/receptionist/classes/suggest-renewal` : Gợi ý khóa học sắp hết hạn cần gia hạn.
*   `POST /api/receptionist/classes/confirm-renewal` : Xác nhận gia hạn khóa học cho hội viên.
*   `POST /api/receptionist/packages/subscribe` : Đăng ký gói tập cho hội viên tại quầy.

### 5. Phân hệ Quản lý Trung tâm (`/api/v1/manager`)
*   `GET /api/v1/manager/analytics/dashboard` : Báo cáo doanh thu, tăng trưởng thành viên, tỷ lệ lấp đầy phòng.
*   `GET /api/v1/manager/users` & `PATCH /api/v1/manager/users/toggle-status/{id}` : Quản trị và khóa/mở tài khoản.
*   `GET/POST/PUT/DELETE /api/v1/manager/classes` : Quản trị danh mục Lớp học.
*   `GET/POST/PUT/DELETE /api/v1/manager/schedules` : Quản trị và xếp lịch ca học (hỗ trợ tạo lịch hàng loạt).
*   `GET/POST/PUT/DELETE /api/v1/manager/rooms` : Quản trị danh mục Phòng tập và sức chứa.
*   `GET/POST/PUT/DELETE /api/v1/manager/subjects` : Quản trị danh mục Bộ môn thể thao.
*   `GET/POST/PUT/DELETE /api/v1/manager/packages` : Quản trị Gói tập và phân quyền lợi phòng/môn học.
*   `GET /api/v1/manager/audit-logs` : Tra cứu nhật ký kiểm toán hệ thống.

### 6. Phân hệ Thanh toán & Hóa đơn (`/api/v1/payment`)
*   `POST /api/v1/payment/cart/checkout` : Tạo đơn hàng và sinh URL thanh toán VNPay / MoMo.
*   `GET /api/v1/payment/vnpay-callback` : Tiếp nhận và xử lý kết quả thanh toán từ VNPay.
*   `POST /api/v1/payment/vnpay-ipn` : Xử lý tín hiệu giao dịch ngầm an toàn (IPN Webhook).
*   `GET /api/v1/payment/invoices` : Lịch sử hóa đơn và trạng thái thanh toán.

### 7. Phân hệ Trợ lý Ảo AI (`/api/v1/ai`)
*   `POST /api/v1/ai/chat` : Gửi tin nhắn tới Nexus AI, phân tích thể hình, nhận phản hồi tư vấn kèm lệnh điều khiển giao diện (**Agentic Actions**: `HIGHLIGHT_PACKAGE`, `HIGHLIGHT_CLASS`, `ADD_CART`).

---

## 👥 THÀNH VIÊN DỰ ÁN (TEAM 4)
*   Dự án được xây dựng và phát triển bởi các thành viên **Team 4 - Môn học SWP391**.
*   Mọi đóng góp hoặc thắc mắc vui lòng liên hệ qua kênh trao đổi chính thức của nhóm.

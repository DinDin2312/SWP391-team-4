# Hướng dẫn Kiến trúc Dự án & Quy trình Làm việc Nhóm
**Dự án:** NEXUS Sports Center (Hệ thống quản lý trung tâm thể thao)

Tài liệu này hướng dẫn chi tiết về cấu trúc thư mục của dự án. Nhóm chúng ta sử dụng kiến trúc **Feature-Based (Chia theo Module/Chức năng)** thay vì MVC truyền thống.

## 🎯 Tại sao lại dùng kiến trúc này?
- **Tránh Conflict Code (Xung đột):** Mỗi thành viên code một module riêng biệt ở các thư mục khác nhau. Khi gộp code (Merge) trên Github sẽ không bao giờ bị đè code của nhau.
- **Dễ bảo trì & Mở rộng:** Code liên quan đến một chức năng (ví dụ: Auth) được gom hết vào một chỗ, không bị rải rác khắp nơi.

---

## 🏗️ 1. Cấu trúc Backend (Spring Boot)

Toàn bộ code Backend nằm trong: `Backend/src/main/java/com/team4/sportscenter/`

```text
com.team4.sportscenter/
│
├── 🚀 SportscenterApplication.java    # File khởi chạy server Spring Boot
│
├── ⚙️ config/                         # Cấu hình cổng thanh toán (VNPayConfig, MoMoConfig)
├── 🛠️ common/                         # Code DÙNG CHUNG cho toàn hệ thống
│   ├── config/                        # Các cấu hình (SecurityConfig, CORS, Database...)
│   ├── exception/                     # GlobalExceptionHandler, PackageRuleException
│   └── utils/                         # Các hàm tiện ích dùng chung
│
├── 🔐 security/                       # Hệ thống bảo mật
│   ├── auth/                          # CustomUserDetails, UserDetailsServiceImpl
│   └── jwt/                           # Sinh và xác thực Token (JwtService, JwtAuthenticationFilter)
│
└── 🧩 modules/                        # Nơi chứa các CHỨC NĂNG CHÍNH (Team code ở đây)
    │
    ├── auth/                          # Module Xác thực (Đăng nhập, Đăng ký, OTP, Google OAuth2)
    │   ├── controllers/               # API Endpoints (AuthController)
    │   ├── dtos/                      # Các object truyền nhận data (Request/Response)
    │   ├── entities/                  # Entity map với Database (User, Role)
    │   ├── repositories/              # Giao tiếp DB (UserRepository, RoleRepository)
    │   └── services/                  # Xử lý Logic (UserService, EmailService)
    │
    ├── coach/                         # Module cho HLV (Lịch dạy, Điểm danh, Giáo án, Đánh giá, Hồ sơ)
    ├── guest/                         # Module công khai cho Khách vãng lai (Xem gói tập, lịch lớp)
    ├── manager/                       # Module cho Quản lý (Nhân sự, Bộ môn, Phòng, Lớp, Xếp lịch tự động, Gói tập, Sổ cái, Báo cáo, Audit Log)
    ├── member/                        # Module cho Hội viên (Đặt lịch, Gói tập, Quyền lợi, NEXUS AI Chat, Cron dọn booking)
    ├── notification/                  # Module Thông báo & Cronjob nhắc lịch/nhắc gia hạn tự động
    ├── payment/                       # Module Giỏ hàng, Hóa đơn & Cổng thanh toán (VNPay, MoMo)
    └── receptionist/                  # Module cho Lễ tân (Quản lý hội viên, Bán gói tại quầy, Đặt lịch, Check-in thông minh & Đối soát chéo)
```

### 💡 Quy tắc code Backend:
1. Bạn được giao code chức năng cho **Role/Phân hệ nào**, hãy vào đúng thư mục trong `modules/` tương ứng để tạo Controller, Service, Entity...
2. **Tuyệt đối không** sửa code trong thư mục `common/` hoặc `security/` nếu chưa thông báo cho cả nhóm (vì nó ảnh hưởng đến toàn hệ thống).
3. Xem chi tiết toàn bộ quy tắc nghiệp vụ và luồng đi tại [`BUSINESS_RULES_AND_WORKFLOWS.md`](./BUSINESS_RULES_AND_WORKFLOWS.md).

---

## 🎨 2. Cấu trúc Frontend (ReactJS + Vite)

Toàn bộ code Frontend nằm trong: `Frontend/src/`

```text
src/
│
├── 🚀 main.jsx & App.jsx              # Điểm khởi chạy React, cấu hình UI
├── 🧱 components/                     # Layout dùng chung (Navbar, Footer, Sidebar...)
├── 🌍 context/                        # State toàn cục (AuthContext, ThemeContext, LanguageContext)
├── 🌐 i18n/                           # Từ điển đa ngôn ngữ Anh - Việt (messages.js)
├── 🛣️ routes/                         # Cấu hình đường dẫn & phân quyền (AppRoutes, ProtectedRoute)
│
└── 🧩 features/                       # Nơi chứa các MÀN HÌNH CHÍNH (Team code ở đây)
    │
    ├── auth/                          # Feature Xác thực (Login, Register, Verify OTP, Forgot Password, Change First Password)
    ├── coach/                         # Feature Huấn luyện viên (CoachDashboard, Lịch dạy, Điểm danh, Giáo án, Đánh giá, Hồ sơ)
    ├── guest/                         # Feature Trang chủ công khai (HomePage)
    ├── manager/                       # Feature Quản lý trung tâm (ManagerPortalPage, Tổng quan, Tài khoản, Vận hành, Gói tập, Giao dịch, Báo cáo, Nhật ký)
    ├── member/                        # Feature Hội viên (MemberDashboard, Đặt lớp, Lịch tập, Cửa hàng gói tập, Hồ sơ, NEXUS AI Chat)
    ├── notification/                  # Feature Trung tâm thông báo (NotificationPage)
    ├── payment/                       # Feature Giỏ hàng, Hóa đơn & Kết quả thanh toán (CartPage, PaymentSuccessPage, InvoiceHistoryPage)
    └── receptionist/                  # Feature Lễ tân (ReceptionistMembersPage, MemberCheckInView, ReceptionistSchedulePage)
```

### 💡 Quy tắc code Frontend:
1. Bạn phụ trách UI cho đối tượng nào, hãy tạo các Component và Page trong đúng thư mục `features/` của đối tượng đó.
2. Các màn hình đã được phân luồng tự động dựa trên Role đăng nhập (Xem trong `AppRoutes.jsx`) và hỗ trợ song ngữ Anh – Việt qua `src/i18n/messages.js`.

---

## 🚀 3. Quy trình Đẩy code (Git Workflow)
Khi một thành viên hoàn thành tính năng của mình:
1. Chạy lệnh: `git pull origin main` (Để kéo code mới nhất từ team về, tránh lỗi).
2. Chạy lệnh: `git add .`
3. Chạy lệnh: `git commit -m "Thêm tính năng [Tên tính năng] cho [Module]"`
4. Chạy lệnh: `git push origin [tên-branch-của-bạn]`
5. Lên Github tạo Pull Request và nhờ một bạn khác review rồi Merge vào `main`.


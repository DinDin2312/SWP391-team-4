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
├── 🛠️ common/                         # Code DÙNG CHUNG cho toàn hệ thống
│   ├── config/                        # Các cấu hình (SecurityConfig, CORS...)
│   ├── exception/                     # GlobalExceptionHandler (Xử lý lỗi chung)
│   └── utils/                         # Các hàm tiện ích dùng chung
│
├── 🔐 security/                       # Hệ thống bảo mật
│   ├── auth/                          # CustomUserDetails, UserDetailsServiceImpl
│   └── jwt/                           # Sinh và xác thực Token (JwtService, Filter)
│
└── 🧩 modules/                        # Nơi chứa các CHỨC NĂNG CHÍNH (Team code ở đây)
    │
    ├── auth/                          # Module Xác thực (Đăng nhập, Đăng ký, Quên MK)
    │   ├── controllers/               # API Endpoints (VD: AuthController)
    │   ├── dtos/                      # Các object truyền nhận data (Request/Response)
    │   ├── entities/                  # Entity map với Database (User, Role)
    │   ├── repositories/              # Giao tiếp DB (UserRepository)
    │   └── services/                  # Xử lý Logic (UserService, EmailService)
    │
    ├── coach/                         # Module cho HLV (Lịch dạy, học viên...)
    ├── manager/                       # Module cho Quản lý (Thống kê, nhân sự...)
    ├── member/                        # Module cho Khách hàng (Đặt lịch, Mua gói...)
    └── receptionist/                  # Module cho Lễ tân (Điểm danh, Bán hàng...)
```

### 💡 Quy tắc code Backend:
1. Bạn được giao code chức năng cho **Role nào**, hãy vào đúng thư mục trong `modules/` của Role đó để tạo Controller, Service, Entity... tương ứng.
2. **Tuyệt đối không** sửa code trong thư mục `common/` hoặc `security/` nếu chưa thông báo cho cả nhóm (vì nó ảnh hưởng đến toàn hệ thống).

---

## 🎨 2. Cấu trúc Frontend (ReactJS + Vite)

Toàn bộ code Frontend nằm trong: `Frontend/src/`

```text
src/
│
├── 🚀 main.jsx & App.jsx              # Điểm khởi chạy React, cấu hình UI
├── 🌍 context/                        # State toàn cục (AuthContext - Lưu phiên đăng nhập)
├── 🛣️ routes/                         # Cấu hình đường dẫn (AppRoutes, ProtectedRoute)
│
└── 🧩 features/                       # Nơi chứa các MÀN HÌNH CHÍNH (Team code ở đây)
    │
    ├── auth/                          # Feature Xác thực
    │   ├── components/                # Nút bấm, Form input nhỏ dùng riêng cho Auth
    │   └── pages/                     # Màn hình (LoginPage.jsx, RegisterPage.jsx...)
    │
    ├── admin/                         # Feature màn hình Quản lý
    ├── customer/                      # Feature màn hình Khách hàng (Member)
    ├── staff/                         # Feature màn hình Lễ tân (Receptionist)
    └── trainer/                       # Feature màn hình Huấn luyện viên (Coach)
```

### 💡 Quy tắc code Frontend:
1. Bạn phụ trách UI cho đối tượng nào, hãy tạo các Component và Page trong đúng thư mục `features/` của đối tượng đó.
2. Các màn hình đã được phân luồng tự động dựa trên Role đăng nhập (Xem trong `AppRoutes.jsx`).

---

## 🚀 3. Quy trình Đẩy code (Git Workflow)
Khi một thành viên hoàn thành tính năng của mình:
1. Chạy lệnh: `git pull origin main` (Để kéo code mới nhất từ team về, tránh lỗi).
2. Chạy lệnh: `git add .`
3. Chạy lệnh: `git commit -m "Thêm tính năng [Tên tính năng] cho [Module]"`
4. Chạy lệnh: `git push origin [tên-branch-của-bạn]`
5. Lên Github tạo Pull Request và nhờ một bạn khác review rồi Merge vào `main`.


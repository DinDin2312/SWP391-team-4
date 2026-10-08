    # NEXUS — Báo cáo refactor giao diện

Ngày kiểm tra: 03/10/2026. Đã triển khai đợt 1 (light theme) và đợt 2 (Center Operations với API hiện có). Backend, schema, phân quyền, routing và các service gọi API không thay đổi. Không thêm dependency frontend; chỉ bổ sung test vào script `test:manager`.

## 1. Light theme

- Palette tập trung tại `src/styles/tokens.css`; CSS thường, Tailwind CDN trong `index.html` và inline styles tham chiếu token.
- Sidebar, form, card, table, modal và drawer dùng nền sáng. Nút xanh giữ chữ trắng; ảnh hero được giữ với lớp phủ và chữ sáng.
- Gỡ `RoleThemeToggle` và `useRoleTheme`. Startup ép `nexusTheme` về `light`, bỏ `managerTheme`, gỡ class `dark` và đặt `data-theme="light"`.
- Kiểm tra migration bằng dữ liệu giả lập có theme cũ: chuyển sang light, giữ nguyên khóa token xác thực; startup vẫn chạy khi localStorage không khả dụng.
- Login rút gọn khoảng cách; Google có viền; demo roles nằm trong luồng cuộn trên mobile. Heading trang và breadcrumb được tách rõ.
- Định dạng ngày hiển thị `dd/MM/yyyy`, giờ 24h, tiền `1.500.000 ₫`. Giá trị gửi API và `datetime-local` vẫn giữ hợp đồng cũ. Date/time picker native có thể hiển thị theo locale trình duyệt.

Các cặp màu chính được tính bằng công thức luminance sRGB:

| Chữ / nền | Tương phản |
| --- | ---: |
| text / surface | 17,85:1 |
| text-muted / surface-hover | 6,92:1 |
| primary / primary-soft | 4,75:1 |
| on-primary / primary | 5,17:1 |
| on-primary / success-hover | 5,02:1 |
| on-primary / danger | 4,83:1 |
| success-text / success-soft | 6,49:1 |
| warning-text / warning-soft | 6,38:1 |
| danger-text / danger-soft | 6,80:1 |

Đã rà JSX/CSS đang dùng: không còn màu literal hay utility nền dark trong phạm vi rà soát ngoài file tokens. `App.css` và asset Vite mẫu có màu riêng nhưng không được import vào giao diện. Các `!important` có sẵn cho bố cục nhân sự không được dùng để ghi đè theme; không bổ sung color override bằng `!important`.

## 2. Center Operations

### Chức năng đã triển khai

- Ba tab: **Schedules** mặc định, **Classes**, **Catalog**.
- Lịch tuần bắt đầu thứ Hai; tuần trước/sau, Today; nhóm theo phòng hoặc HLV. Danh sách cũng nhóm theo tài nguyên, là chế độ mặc định trên mobile.
- Bộ lọc ngày, môn, HLV, phòng, trạng thái. Khoảng ngày tùy chọn dùng danh sách; chọn Week trở về một tuần đầy đủ.
- Buổi được xếp theo giờ trong mỗi ô, giữ tất cả buổi thay vì chồng lên nhau. Calendar cuộn bên trong ở màn hình hẹp, không làm tràn ngang toàn trang.
- Màu môn là ánh xạ frontend; trạng thái Ongoing suy ra từ giờ, không gửi lên API.
- Ô trống mở form điền sẵn ngày/09:00, chỉ cho chọn lớp ACTIVE đúng tài nguyên. Nút Create session mặc định giờ tròn tiếp theo. Phòng/HLV luôn lấy từ lớp.
- Drawer chi tiết có thời gian, tài nguyên, booked/capacity và roster chỉ đọc; sửa giờ, hủy, hoàn thành buổi đã kết thúc. Buổi COMPLETED/CANCELLED không được sửa/mở lại.
- Hủy có xác nhận booking bị hủy, hội viên được thông báo, không hứa hoàn tiền tự động. Payload hủy/hoàn thành giữ nguyên lớp và thời gian gốc.
- Bảng lớp có search/status filter, capacity per session, peak booked theo đúng định nghĩa backend và học phí theo đăng ký lớp; sửa/ngưng hoạt động/tạo lịch lặp.
- Series dùng một request `/manager/schedules/series`: 2–52 buổi, mỗi 1–4 tuần. Cảnh báo rõ toàn bộ series bị từ chối khi trùng và hội viên cũ không tự được thêm booking vào buổi mới.
- Catalog chỉ dùng trường có thật: môn (tên, mô tả, số lớp), phòng (tên, sức chứa, số lớp).
- Form bên phải, validation theo field, giữ input khi API lỗi và hiển thị nguyên văn business error; skeleton, empty/error state, phục hồi về tuần hiện tại khi khoảng ngày bị API từ chối.
- Tab hỗ trợ phím mũi tên/Home/End; drawer/dialog có focus trap, Escape, khôi phục focus và khóa cuộn nền.

### Định nghĩa thống kê

- **Sessions today:** buổi bắt đầu hôm nay, không hủy, trong bộ lọc hiện tại.
- **Sessions in range:** buổi không hủy trong phạm vi hiện tại.
- **Seat occupancy:** tổng `booked` / tổng `maxSlots` của buổi không hủy; `booked` gồm CONFIRMED + PENDING theo SQL backend.
- **Low registrations:** buổi SCHEDULED dưới 25% chỗ đã đặt. Hằng số `LOW_OCCUPANCY_THRESHOLD = 0.25`; gần đầy từ 80%.
- `class.enrolled` là số chỗ đặt cao nhất trong một buổi không hủy, không phải tổng số học viên riêng biệt.

### Chức năng không đưa vào vì backend chưa hỗ trợ

Không có ghi điểm danh bởi manager, trạng thái Trễ, waitlist, lưu lý do hủy, đổi phòng/HLV riêng từng buổi, nhiều thứ trong tuần lưu trên lớp, màu môn lưu DB, thông tin thiết bị/bảo trì phòng. Không dựng mock để giả lập các chức năng này.

## 3. Kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run build` | Thành công |
| `npm run lint` | Exit 0; 72 cảnh báo cũ, so sánh nội dung với baseline: không có cảnh báo mới |
| `npm run test:manager` | 10/10 pass (4 test cũ + 6 test Operations) |
| `mvnw.cmd -Dtest=ManagerIntegrationTests test` | 12/12 pass; dùng fixture độc lập và cleanup của bộ test hiện có |
| `git diff --check` | Không có lỗi whitespace |
| Phạm vi backend/auth/routing/services | Không có thay đổi source |

Test frontend bao phủ biên tuần/tháng/năm/ngày nhuận, định nghĩa occupancy, ngưỡng ít đăng ký, lọc/join môn, các buổi sát nhau, lớp đủ điều kiện theo tài nguyên, payload schedule/series và biên thời gian Ongoing.

Test tích hợp hiện có bao phủ lịch trùng/lịch sát nhau, rollback series khi trùng, lưu đủ các buổi lặp, hủy booking và thông báo, không mở lại buổi, giới hạn sức chứa, ngưng lớp có lịch tương lai, xung đột lịch hội viên, quyền API và lỗi validation.

### Kiểm tra trình duyệt thật

- Auth: login desktop/mobile, lỗi đăng nhập, register, OTP, trang đầu forgot password. Giữ ảnh hero và kiểm tra bằng mắt; không gửi OTP hay reset mật khẩu.
- Manager: Overview, Reports, Staff & Permissions/form tài khoản, Membership Packages, Audit Log; cả ba tab Operations, drawer chi tiết/roster/form/catalog, dialog hủy, series validation.
- Member: dashboard, schedule, packages, package store, book courses, notifications, billing, settings và cart rỗng.
- Coach: dashboard, teaching schedule, assigned trainees và modal chi tiết học viên.
- Receptionist: danh sách/chi tiết hội viên, form đăng ký, packages & renewals.
- Responsive: 1440×900, 1024×768 và 375×812 trên các màn hình đại diện. Operations/mobile drawer và form lễ tân không tràn ngang; calendar có vùng cuộn riêng.
- Operations: chuyển tuần qua tháng; lọc môn/đổi nhóm; tạo lịch trùng thật được API từ chối với `The time slot conflicts with the coach or room schedule`, input được giữ; khoảng ngày quá dài báo lỗi API và phục hồi về tuần hiện tại; validation field; Escape đóng drawer và trả focus đúng nút mở.
- Đo các cặp chữ/nền solid hiển thị trên những trang đã mở không còn lỗi dưới mục tiêu 4.5:1. Bộ đo DOM không thay thế kiểm định accessibility đầy đủ; ảnh hero, gradient và mọi trạng thái động cần QA bằng mắt.

### Giới hạn kiểm tra còn lại

- Chưa thực hiện tạo mới thành công rồi reload, hủy booking hoặc hoàn thành buổi từ trình duyệt trên dữ liệu vận hành hiện có. Luồng lưu/persist/hủy được kiểm tra bằng test tích hợp với fixture; dialog và lỗi API được kiểm tra trực tiếp bằng UI.
- Chưa kiểm tra checkout/thanh toán thật, Google OAuth, gửi OTP, reset mật khẩu, gửi AI chat hoặc tất cả trạng thái thành công/lỗi của các form ngoài Operations.
- Chưa có dữ liệu dày hàng trăm buổi để đo hiệu năng lịch; các ô xếp chồng theo thời gian và vùng cuộn đã được triển khai, test lọc giữ các buổi sát nhau.
- Widget mô phỏng và module placeholder có sẵn ngoài Operations được giữ nguyên theo phạm vi giao diện; báo cáo này không khẳng định các tính năng đó đã có backend.
- Tailwind CDN vẫn là cách chạy hiện có. Chuyển sang build Tailwind riêng là công việc khác, không nằm trong đợt này.

## 4. File mới

- `src/styles/tokens.css`
- `src/utils/displayFormat.js`
- `src/features/manager/operations/OperationsPage.jsx`
- `src/features/manager/operations/OperationsDrawers.jsx`
- `src/features/manager/operations/OperationsUI.jsx`
- `src/features/manager/operations/operations.css`
- `src/features/manager/operations/operationsUtils.js`
- `src/features/manager/operations/operationsUtils.test.js`
- `UI_REFACTOR_REPORT.md`

## 5. File đã sửa hoặc gỡ

- `index.html`, `package.json`, `src/main.jsx`, `src/index.css`, `src/styles/role-theme.css`.
- Layouts: `src/layouts/MemberLayout.jsx`, `CoachLayout.jsx`, `ReceptionistLayout.jsx`.
- Auth pages: `LoginPage.jsx`, `Register.jsx`, `OTPVerification.jsx`, `ForgotPassword.jsx`.
- Coach pages: `CoachDashboard.jsx`, `CoachSchedule.jsx`, `CoachStudents.jsx`.
- Manager: `pages/ManagerDashboard.jsx`, `pages/manager.css`, `staff/staffData.js`.
- Member: `components/NexusAiChat.jsx`; pages `CustomerDashboard.jsx`, `MySchedule.jsx`, `Memberships.jsx`, `BookClass.jsx`, `Notifications.jsx`, `BillingHistory.jsx`, `Settings.jsx`, `PackageStore.jsx`, `PaymentCart.jsx`, `PaymentResult.jsx`.
- Receptionist: `pages/ReceptionistDashboard.jsx`; components `MemberManagementView.jsx`, `MemberDetailModal.jsx`, `RegisterMemberView.jsx`, `ManageMembershipsView.jsx`.
- Gỡ: `src/components/RoleThemeToggle.jsx`, `src/hooks/useRoleTheme.js`.

Ảnh QA Operations được lưu tại `C:/Users/anhv7/.codex/visualizations/2026/10/03/01a100c3-446d-74b2-9853-a76bab4cb236/operations-desktop.jpg`.

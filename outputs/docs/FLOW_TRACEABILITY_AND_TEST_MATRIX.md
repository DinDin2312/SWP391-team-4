# 📊 Ma Trận Truy Vết Nghiệp Vụ & Kiểm Thử Tự Động (Flows 1–6)
**Đề tài số 4 (GV: MinhTTH5):** Hệ thống Quản lý Trung tâm Thể thao (*Sports Center Management System*)  
**Đối tượng sử dụng (4 Actors):** `Center Manager`, `Coach`, `Member`, `Receptionist`

---

## 1. Đối Chiếu 6 Luồng Nghiệp Vụ (Must Have & Nice to Have) Trong CI/CD Pipeline

### ✅ Nhóm Bắt Buộc (Must Have)

| Luồng (Flow) | Các Actor tham gia | Module Backend & API chính | Giao diện Frontend (`src/features/`) | Kiểm thử tự động trong CI (`npm test` & `./mvnw verify`) |
| :--- | :--- | :--- | :--- | :--- |
| **Flow 1: User & Membership Management** *(Required)* | `Center Manager`<br>`Receptionist`<br>`Member` | - `modules/auth` (`/api/v1/auth/*`, `/api/v1/user/*`)<br>- `modules/manager` (`/api/manager/users*`, `/api/manager/packages*`)<br>- `modules/receptionist` (`/api/receptionist/members*`, `/api/receptionist/packages/subscribe`)<br>- `modules/member` (`/api/v1/member/my-membership`, `/api/v1/member/packages*`) | - `auth/pages/` (`LoginPage`, `Register`, `OTPVerification`, `ForgotPassword`)<br>- `manager/staff/`, `manager/packages/`<br>- `receptionist/components/` (`RegisterMemberView`, `ManageMembershipsView`, `MemberManagementView`)<br>- `member/pages/` (`Memberships`, `PackageStore`, `PackageBenefits`, `Settings`) | - **Backend:** `DatabaseMigrationTests` (7 tests: V1–V6 schema, email uniqueness, user creation dates, package snapshots), `ManagerIntegrationTests`, `AvatarStorageServiceTests`, `ResourceImageStorageServiceTests`<br>- **Frontend:** `staffData.test.js`, `packagesState.test.js`, `packagesRendering.test.js`, `packageBookingOptions.test.js` |
| **Flow 2: Class Booking & Schedule Management** *(Required)* | `Center Manager`<br>`Receptionist`<br>`Coach`<br>`Member` | - `modules/manager` (`/api/manager/classes*`, `/api/manager/schedules*`, `/api/manager/rooms*`, `/api/manager/subjects*`)<br>- `modules/member` (`/api/v1/member/available-classes`, `/api/v1/member/book-class/*`, `/api/v1/member/cancel-class/*`, `/api/v1/member/calendar-bookings`)<br>- `modules/receptionist` (`/api/receptionist/classes/*`) | - `manager/operations/` (`OperationsPage`, `OperationsDrawers`, `OperationsUI`)<br>- `member/pages/` (`BookClass`, `MySchedule`)<br>- `coach/pages/` (`CoachSchedule`) | - **Backend:** `SchedulePlannerTests` (4 tests: conflict avoidance, break time, holiday skip, session validation), `ManagerIntegrationTests`<br>- **Frontend:** `operationsUtils.test.js`, `operationsState.test.js`, `operationsRendering.test.js`, `packageBookingOptions.test.js`, `memberUtils.test.js` |
| **Flow 3: Payment & Report Management** *(Required)* | `Center Manager`<br>`Receptionist`<br>`Member` | - `modules/payment` (`/api/v1/payment/cart*`, `/api/v1/payment/checkout`, `/api/v1/payment/vnpay*`, `/api/v1/payment/momo*`)<br>- `modules/manager` (`/api/manager/reports*`, `/api/manager/transactions*`, `/api/manager/audit-logs*`) | - `member/pages/` (`PaymentCart`, `PaymentResult`, `BillingHistory`)<br>- `manager/reports/`, `manager/transactions/`, `manager/audit/`, `manager/components/OperationalOverview.jsx` | - **Backend:** `TransactionIntegrationTests` (2 tests: ledger pagination, invoice vs payment date filtering, SQLi protection, RBAC 401/403, REVIEW status exclusion), `ManagerReportCompletionTests` (2 tests)<br>- **Frontend:** `reportsRendering.test.js`, `transactionsRendering.test.js`, `overviewUtils.test.js`, `overviewRendering.test.js`, `auditUtils.test.js`, `auditRendering.test.js` |

---

### 🌟 Nhóm Mở Rộng (Nice to Have)

| Luồng (Flow) | Các Actor tham gia | Module Backend & API chính | Giao diện Frontend (`src/features/`) | Kiểm thử tự động trong CI (`npm test` & `./mvnw verify`) |
| :--- | :--- | :--- | :--- | :--- |
| **Flow 4: Training & Attendance Management** *(Optional)* | `Coach`<br>`Member`<br>`Receptionist` | - `modules/coach` (`/api/v1/coach/schedules*`, `/api/v1/coach/attendance*`, `/api/v1/coach/students*`, `/api/v1/coach/workout-plans*`, `/api/v1/coach/assessments*`)<br>- `modules/notification` (`/api/v1/notifications*`)<br>- `modules/member` (`/api/v1/member/attendance-history`, `/api/v1/member/workout-plans`, `/api/v1/member/assessments`) | - `coach/pages/` (`CoachDashboard`, `CoachSchedule`, `CoachStudents`, `CoachWorkoutPlans`, `CoachSettings`)<br>- `coach/components/` (`TraineeAssessmentModal`, `SendNotificationModal`)<br>- `member/pages/` (`AttendanceHistory`, `Notifications`) | - **Backend:** `CoachProfileServiceTests` (4 tests: profile retrieval, subject change rules when active classes exist), Flyway `V5__trainee_progress_assessments.sql` & `V6__add_class_to_coach_workout_plans.sql` verified in `DatabaseMigrationTests`<br>- **Frontend:** `memberUtils.test.js` (`calculateAttendanceStats`, `filterBookingsByStatus`, `sortBookingsByTime`) |
| **Flow 5: AI Workout Recommendation** *(Optional)* | `Coach`<br>`Member` | - `modules/coach` & `modules/member` (`AiWorkoutPlan`, `AiPlanDetail`, `Exercise` entities & workout generation services) | - `coach/pages/CoachWorkoutPlans.jsx`<br>- `member/pages/CustomerDashboard.jsx` | - **Backend:** Context & entity validation via `SportscenterApplicationTests` & `DatabaseMigrationTests` (`AI_WORKOUT_PLANS`, `AI_PLAN_DETAILS`, `EXERCISES`) |
| **Flow 6: AI Assistant (Nexus AI)** *(Optional)* | `Member` | - `modules/member/controllers/AiChatController.java` (`POST /api/v1/member/ai-chat`)<br>- `modules/member/services/impl/AiChatServiceImpl.java` (Gemini AI + Agentic UI commands `HIGHLIGHT_PACKAGE`, `HIGHLIGHT_CLASS`, `ADD_CART`) | - `member/components/NexusAiChat.jsx` (Floating AI Assistant + Siri-style highlight & auto-cart integration) | - **Frontend & Backend:** Compiled & bundled in `ci.yml` (`npm run build` + `./mvnw test-compile`) |

---

## 2. Chi Tiết Đáp Ứng Chức Năng Theo Từng Actor (32/32 Yêu Cầu Đề Bài)

### 2.1. Center Manager (Quản lý Trung tâm)
1. **Quản lý danh sách thành viên, huấn luyện viên và nhân viên:** `StaffPage.jsx`, `StaffTable.jsx`, `StaffDrawer.jsx` + `ManagerController` (`/api/manager/users`).
2. **Quản lý các lớp học, bộ môn, phòng tập và lịch hoạt động:** `OperationsPage.jsx` + `/api/manager/classes`, `/api/manager/subjects`, `/api/manager/rooms`, `/api/manager/schedules`.
3. **Phân công huấn luyện viên phụ trách từng lớp học:** Hỗ trợ gán HLV theo chuyên môn (`USER_SUBJECTS`) và kiểm tra chống trùng lịch tự động (`SchedulePlanner.java`).
4. **Xem báo cáo số lượng thành viên, tình trạng đăng ký lớp và doanh thu theo thời gian:** `ReportsPage.jsx`, `OperationalOverview.jsx` + `ManagerReportCompletionTests.java`.
5. **Quản lý các gói thành viên, học phí và thời hạn sử dụng:** `PackagesPage.jsx` + `V2__adopt_existing_package_schema.java` (lưu snapshot giá, thời hạn, quyền lợi môn học và phòng tập).
6. **Phân quyền truy cập hệ thống cho từng vai trò:** `SecurityConfig.java` + `ProtectedRoute.jsx` + `RoleControl.jsx`.
7. **Xem lịch sử thao tác quan trọng trên hệ thống:** `AuditPage.jsx` + bảng `AUDIT_LOGS` (`auditUtils.test.js`, `auditRendering.test.js`).

### 2.2. Coach (Huấn luyện viên)
1. **Xem lịch dạy và danh sách học viên trong các lớp phụ trách:** `CoachDashboard.jsx` (`CoachScheduleController`).
2. **Xem thông tin cơ bản và mục tiêu tập luyện của từng học viên:** `CoachDashboard.jsx` + API học viên (`/api/v1/coach/schedules/{scheduleId}/students`).
3. **Tạo kế hoạch tập luyện cho cá nhân hoặc cho cả lớp:** `CoachDashboard.jsx` (`CoachWorkoutController` + Flyway `V6__add_class_to_coach_workout_plans.sql`).
4. **Ghi nhận kết quả tập luyện của học viên sau mỗi buổi:** `CoachDashboard.jsx` (`CoachAssessmentController`).
5. **Đánh giá tiến độ của học viên và ghi nhận nhận xét:** Flyway `V5__trainee_progress_assessments.sql` (`TRAINEE_ASSESSMENTS`).
6. **Điểm danh học viên trong từng buổi tập & Đối soát chéo với Quầy Lễ tân:** `CoachDashboard.jsx` + `CoachScheduleServiceImpl.java` (tự động phát hiện `WARNING_NO_RECEPTION_CHECKIN` khi có mặt mà chưa qua lễ tân, và `WARNING_SKIPPED_CLASS` khi check-in lễ tân nhưng vắng mặt trên lớp).
7. **Gửi thông báo hoặc bài tập về nhà cho học viên:** Tự động gửi thông báo loại `WORKOUT` & `COACH` vào bảng `NOTIFICATIONS`.
8. **Quản lý hồ sơ chuyên môn giảng dạy:** `CoachProfilePage.jsx` + `CoachProfileServiceImpl.java` (chặn đổi môn khi đang còn lớp `ACTIVE` hoặc lịch dạy tương lai).

### 2.3. Member (Học viên / Thành viên)
1. **Đăng ký tài khoản và cập nhật thông tin cá nhân:** `RegisterPage.jsx`, `VerifyOtpPage.jsx`, `SettingsPage.jsx` (kèm đổi Email OTP bảo mật & upload avatar).
2. **Xem các gói thành viên và đăng ký/gia hạn gói tập:** `PackageStorePage.jsx`, `MyMembershipsPage.jsx`, `PackageBenefitsPanel.jsx`.
3. **Xem danh sách các lớp học và lịch học:** `BookClassPage.jsx`, `HomePage.jsx`.
4. **Đăng ký hoặc hủy đăng ký lớp học:** `BookClassPage.jsx`, `MySchedulePage.jsx` (hỗ trợ đặt lớp bằng quyền lợi thẻ hoặc giỏ hàng, kiểm tra chống trùng lịch cá nhân, hủy lớp tương lai tự động hoàn lượt).
5. **Xem lịch tập cá nhân và thông tin huấn luyện viên:** `MySchedulePage.jsx`, `MemberDashboard.jsx`.
6. **Xem lịch sử điểm danh và kết quả tập luyện:** `MemberDashboard.jsx` (`RecentActivityResponse`).
7. **Xem kế hoạch tập luyện và nhận xét từ huấn luyện viên:** `MemberDashboard.jsx`, `MySchedulePage.jsx`.
8. **Gửi câu hỏi cho hệ thống AI về lịch tập, bài tập hoặc dịch vụ:** `AiChatWidget.jsx` (`AiChatServiceImpl.java` với RAG thời gian thực & Agentic UI Actions).
9. **Nhận thông báo về lịch học, thay đổi lịch hoặc thời hạn gói:** `NotificationPage.jsx` + `SystemNotificationScheduler.java` (nhắc lịch học lúc 19:00 và nhắc gia hạn trước 3 ngày lúc 08:00).

### 2.4. Receptionist (Nhân viên Lễ tân)
1. **Tìm kiếm và xem thông tin thành viên:** `ReceptionistMembersPage.jsx`, `MemberDetailModal.jsx`.
2. **Đăng ký thành viên mới tại quầy:** `CreateMemberModal.jsx` (`POST /api/receptionist/members` — tự sinh mật khẩu tạm 8 ký tự kèm cờ `force_password_change = true`).
3. **Quản lý đăng ký/gia hạn các gói thành viên tại quầy:** `AssignPackageModal.jsx` (`POST /api/receptionist/members/{id}/packages`).
4. **Kiểm tra trạng thái gói tập và thời hạn sử dụng:** `MemberDetailModal.jsx`, `MemberCheckInView.jsx`.
5. **Check-in thông minh theo Ma trận 4 Quyền lợi & Kiểm soát sức chứa phòng:** `MemberCheckInView.jsx` (`GET /api/receptionist/checkin/context/{userId}`, `POST /api/receptionist/checkin` — cấp mã mở cửa `GYM-PASS-xxxx` cho hội viên có gói Gym, chặn check-in khi phòng chạm ngưỡng `capacity`).
6. **Theo dõi & Xử lý Cảnh báo Đối soát Chéo Lễ tân ↔ Coach:** `MemberCheckInView.jsx` (`GET /api/receptionist/checkin/anomalies`, `POST /api/receptionist/checkin/anomalies/{checkinId}/resolve`).
7. **Đăng ký lớp học tại quầy cho thành viên:** `ReceptionistSchedulePage.jsx` (`POST /api/receptionist/schedules/book`).
8. **Ghi nhận các khoản thanh toán tiền mặt và xuất hóa đơn tại quầy:** Tự động sinh `INVOICES (PAID)` & `PAYMENTS (COMPLETED, CASH)` kèm cộng điểm tích lũy `loyaltyPoints`.

> 📖 **Tham khảo chi tiết toàn bộ quy tắc nghiệp vụ và luồng xử lý tại:** [`BUSINESS_RULES_AND_WORKFLOWS.md`](../../BUSINESS_RULES_AND_WORKFLOWS.md)

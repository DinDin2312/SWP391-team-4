# TÀI LIỆU HƯỚNG DẪN DỰ ÁN SPORTS CENTER (SWP391)

[![CI](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/ci.yml/badge.svg)](https://github.com/DinDin2312/SWP391-team-4/actions/workflows/ci.yml)

Tài liệu này được lập ra nhằm giúp tất cả các thành viên trong nhóm nắm bắt chính xác mục tiêu (Goal), phạm vi chức năng (Scope) và hướng phát triển hiện tại của dự án. Yêu cầu các thành viên đọc kỹ để thống nhất luồng logic trước khi bắt tay vào viết code.

## 1. Mục tiêu hiện tại (Giai đoạn 1 - Core MVP)
Hiện tại, nhóm chúng ta sẽ tập trung hoàn thiện 4 luồng nghiệp vụ (Flow) bắt buộc phải có để hệ thống phòng Gym có thể vận hành và thu tiền cơ bản:
*   **Flow 1:** Quản lý Người dùng, Gói tập và Thông báo (User, Packages & Notifications).
*   **Flow 2:** Quản lý Chuyên môn: Môn học, Phòng tập và Huấn luyện viên (Subjects, Rooms, Coaches).
*   **Flow 3:** Quản lý Lớp học, Xếp lịch và Điểm danh (Class, Schedule & Booking).
*   **Flow 4:** Quản lý Giỏ hàng và Thanh toán thực tế (Cart, Invoice & Payments API).

Mục tiêu là phải làm cho 4 luồng này chạy mượt mà, không xảy ra lỗi dữ liệu. Các tính năng nâng cao (AI, Giáo án, Theo dõi tiến độ) sẽ được dời sang Giai đoạn 2 sau khi Giai đoạn 1 đã hoàn tất.

## 2. Giải thích chức năng và Logic nghiệp vụ cốt lõi (Chuẩn BCNF)

Để đảm bảo việc lập trình (Code) không bị sai lệch, toàn nhóm cần thống nhất các quy tắc sau:

### 2.1. Phân quyền và Tài khoản (Roles & Subtyping)
*   Một tài khoản (User) chỉ có một vai trò (Role) duy nhất. Cổng đăng nhập (`USERS`) dùng chung cho cả Quản lý, Khách hàng và HLV.
*   **Hồ sơ Huấn luyện viên:** Kế thừa 1-1 từ bảng `USERS` sang bảng `COACHES` để chứa các thông tin chuyên môn (số năm kinh nghiệm, tiểu sử) mà khách hàng không có.

### 2.2. Sự khác biệt giữa Gói tập và Lớp học
*   **Gói tập (Packages):** Chỉ cấp quyền vào cửa phòng Gym sử dụng thiết bị. Bán theo ngày/tháng, không có giờ giấc cố định. Nếu mua trùng gói đang có thì hệ thống tự động cộng dồn thời gian.
*   **Lớp học (Classes):** Là thực thể trung tâm. Khi tạo 1 Lớp học, bắt buộc phải gán chết với **1 Môn học, 1 Phòng tập và 1 HLV chủ nhiệm**. 
*   **Ngoại lệ (Thuê PT):** Nếu lớp chỉ có giới hạn 1 người tham gia (`max_slots = 1`) thì hệ thống hiểu đó là tính năng Thuê PT Cá nhân.

### 2.3. Logic Ngày tháng và Chuẩn hóa Dữ liệu (BCNF)
*   **Không lưu ngày cứng:** Bảng `CLASSES` tuyệt đối không chứa cột ngày bắt đầu và kết thúc. Thời hạn của khóa học sẽ được tính toán bằng hàm `MIN(start_time)` và `MAX(end_time)` của các buổi học trong bảng `SCHEDULES`. Điều này giúp Database đạt chuẩn BCNF 100%, chống được dị thường cập nhật.

### 2.4. Logic Giỏ hàng, Hóa đơn và Tích hợp Thanh toán (VNPay/MoMo)
*   Mọi giao dịch mua bán đều phải đi qua hệ thống Giỏ hàng (Bảng `INVOICES` và `INVOICE_DETAILS`). Cột loại trừ lẫn nhau giúp 1 hóa đơn chứa được cả Gói tập, Lớp học và Vé vãng lai.
*   **Lịch sử Thanh toán:** Bảng `PAYMENTS` được tách rời khỏi Hóa đơn. Mục đích để lưu lại mọi lần thử thanh toán (SUCCESS/FAILED) và quan trọng nhất là hứng mã `transaction_no` từ API VNPay/MoMo trả về để Kế toán đối soát.
*   **Đối với khách VIP:** Khi đăng ký lớp học vãng lai, hệ thống bắt buộc phải tạo 1 Hóa đơn 0 đồng (`total_amount = 0`), sau đó tạo 1 bản ghi `PAYMENTS` với phương thức `VIP_BENEFIT` và trạng thái PAID.

### 2.5. Khách Vãng Lai và Kiểm tra trùng lịch (Conflict Check)
*   **Khách vãng lai:** Sẽ được ghép chung vào học cùng Lớp, cùng Phòng và cùng HLV với các khách hàng mua trọn khóa. Hệ thống chỉ sinh ra 1 dòng `BOOKINGS` cho 1 `SCHEDULES` tương ứng.
*   **Check trùng lịch:** Bắt buộc phải so sánh `start_time` và `end_time` của món hàng với bảng `BOOKINGS` trước khi cho vào Giỏ hàng. Không check trùng lịch đối với Gói tập.

### 2.6. Điểm danh và Thông báo
*   **Điểm danh:** Bảng `SCHEDULES` không dùng để điểm danh. Mọi thao tác điểm danh (Có mặt, Vắng) của HLV đều phải tác động trực tiếp vào cột `attendance_status` của bảng `BOOKINGS`.
*   **Thông báo:** Hệ thống dùng bảng `NOTIFICATIONS` độc lập để gửi tin tự động (mua thành công, nhắc lịch, hủy lớp) tới người dùng.

## 3. Cấu trúc Cơ sở dữ liệu (ERD Bản V4)

Database đã được thiết kế chuẩn hóa cực độ (BCNF) bao gồm hệ thống Payment. Yêu cầu các thành viên bám sát bảng này để tạo Entity.
<img width="2828" height="1100" alt="ERD_Version_4" src="https://github.com/user-attachments/assets/1347c566-ad5b-4755-b3ab-5f1faf01f667" />


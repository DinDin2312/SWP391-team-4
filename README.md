# TÀI LIỆU HƯỚNG DẪN DỰ ÁN SPORTS CENTER (SWP391)

Tài liệu này được lập ra nhằm giúp tất cả các thành viên trong nhóm nắm bắt chính xác mục tiêu (Goal), phạm vi chức năng (Scope) và hướng phát triển hiện tại của dự án. Yêu cầu các thành viên đọc kỹ để thống nhất luồng logic trước khi bắt tay vào viết code.

## 1. Mục tiêu hiện tại (Giai đoạn 1 - Core MVP)
Hiện tại, nhóm chúng ta sẽ tập trung hoàn thiện 3 luồng nghiệp vụ (Flow) bắt buộc phải có để hệ thống phòng Gym có thể vận hành và thu tiền cơ bản:
*   **Flow 1:** Quản lý Người dùng và Gói tập (User & Packages).
*   **Flow 2:** Quản lý Lớp học, Xếp lịch và Đặt chỗ (Class, Schedule & Booking).
*   **Flow 3:** Quản lý Giỏ hàng và Thanh toán (Cart & Payment).

Mục tiêu là phải làm cho 3 luồng này chạy mượt mà, không xảy ra lỗi dữ liệu. Các tính năng nâng cao (AI, Giáo án, Theo dõi tiến độ) sẽ được dời sang Giai đoạn 2 sau khi Giai đoạn 1 đã hoàn tất.

## 2. Giải thích chức năng và Logic nghiệp vụ cốt lõi

Để đảm bảo việc lập trình (Code) không bị sai lệch, toàn nhóm cần thống nhất các quy tắc sau:

### 2.1. Phân quyền (Roles)
*   Một tài khoản (User) chỉ có một vai trò (Role) duy nhất. Không có sự chồng chéo.
*   Chỉ có Quản lý (Manager) mới có quyền tạo Gói tập (Packages), tạo Lớp học (Classes) và phân công lịch dạy cho Huấn luyện viên (Schedules).

### 2.2. Sự khác biệt giữa Gói tập và Lớp học
*   **Gói tập (Packages):** Chỉ cấp quyền vào cửa phòng Gym sử dụng thiết bị. Bán theo ngày/tháng, không có giờ giấc cố định. Nếu mua trùng gói đang có thì hệ thống tự động cộng dồn thời gian.
*   **Lớp học (Classes):** Phải có thời gian biểu cụ thể (Schedules), có Huấn luyện viên dạy, có giới hạn số người tham gia. Nếu lớp chỉ có giới hạn 1 người tham gia (max_slots = 1) thì hệ thống hiểu đó là tính năng Thuê PT Cá nhân.

### 2.3. Logic Giỏ hàng và Hóa đơn
*   Mọi giao dịch mua bán đều phải đi qua hệ thống Giỏ hàng (Bảng INVOICES và INVOICE_DETAILS).
*   Khách hàng có thể mua cùng lúc Gói tập, Đăng ký cả Khóa học, hoặc Đăng ký từng Buổi lẻ vãng lai.
*   **Đối với khách VIP:** Khi đăng ký lớp học vãng lai, hệ thống vẫn bắt buộc phải tạo 1 Hóa đơn nhưng tổng tiền (total_amount) sẽ bằng 0 và trạng thái lập tức chuyển sang Đã thanh toán (PAID). Việc này giúp đồng nhất dữ liệu kế toán và không phải viết 2 luồng code riêng biệt.

### 2.4. Logic kiểm tra trùng lịch (Conflict Check)
*   Hệ thống chỉ kiểm tra trùng lịch đối với Lớp học (Classes/Schedules). Không kiểm tra trùng lịch đối với Gói tập (Packages).
*   Việc kiểm tra mốc thời gian (bắt đầu, kết thúc) phải được Code xử lý hoàn tất trước khi cho phép món hàng được thêm vào giỏ.

## 3. Cấu trúc Cơ sở dữ liệu (ERD)

Database đã được thiết kế chuẩn hóa và khóa sổ cho Giai đoạn 1. Yêu cầu các thành viên bám sát bảng này để tạo Entity.

<img width="2355" height="1377" alt="ERD_Version_1png" src="https://github.com/user-attachments/assets/01c314a0-5a75-4449-9977-b0821bbf8797" />



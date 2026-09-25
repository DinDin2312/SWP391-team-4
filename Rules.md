# 📌 Hướng Dẫn Quy Trình Làm Việc Với Git & GitHub (Team Workflow)

Tài liệu này quy định cách thức các thành viên trong nhóm thao tác với Git và GitHub để đảm bảo code không bị conflict, dễ quản lý và mô phỏng đúng môi trường dự án thực tế.

---

## 1. Cấu Trúc Nhánh (Branching Model)

Dự án áp dụng mô hình Git Flow rút gọn. Tuyệt đối **KHÔNG** push trực tiếp (commit) lên các nhánh chính.

*   **`main`**: Nhánh chứa source code ổn định nhất, sẵn sàng để deploy lên môi trường Production. (Chỉ merge từ `develop` hoặc `hotfix`).
*   **`develop`**: Nhánh tích hợp code chính của team. Tất cả các tính năng mới sau khi làm xong sẽ được merge vào đây để test.
*   **`feature/*`**: Nhánh dùng để phát triển các tính năng mới (tách ra từ `develop`).
*   **`bugfix/*`**: Nhánh dùng để sửa các lỗi phát hiện trong quá trình code/test (tách ra từ `develop`).
*   **`hotfix/*`**: Nhánh dùng để sửa lỗi khẩn cấp trên production (tách ra từ `main`).

---

## 2. Nguyên Tắc Đặt Tên Nhánh (Branch Naming)

**Cú pháp:** `<loại-nhánh>/<tên-ngắn-gọn-của-task>`
*(Toàn bộ viết thường, không dấu, ngăn cách bằng dấu gạch ngang `-`, tuyệt đối không dùng tên thành viên)*

**Ví dụ chuẩn:**
*   ✅ `feature/user-login-api` (Làm API đăng nhập)
*   ✅ `feature/payment-vnpay` (Tích hợp thanh toán)
*   ✅ `bugfix/fix-header-responsive` (Sửa lỗi giao diện header)

**Cần tránh:**
*   ❌ `theanh` (Không dùng tên người)
*   ❌ `feature/UserLogin` (Không dùng viết hoa, CamelCase)
*   ❌ `xuansinh/member-dashboard` (Không gắn tên người vào tiền tố)

---

## 3. Quy Tắc Viết Lời Nhắn Commit (Commit Messages)

Dự án sử dụng chuẩn **Conventional Commits**. Viết tiếng Anh hoặc tiếng Việt nhưng phải thống nhất và rõ ràng.

**Cú pháp:** `<type>: <Mô tả ngắn gọn>`

**Các `<type>` thường dùng:**
*   **`feat:`** Thêm một tính năng mới. *(VD: feat: add user login API)*
*   **`fix:`** Sửa một lỗi (bug). *(VD: fix: resolve null pointer exception in cart)*
*   **`docs:`** Cập nhật tài liệu (README, comments). *(VD: docs: update API documentation)*
*   **`style:`** Chỉnh sửa format, format code, CSS (không ảnh hưởng logic). *(VD: style: format code with Prettier)*
*   **`refactor:`** Tối ưu hóa, cấu trúc lại code nhưng không đổi tính năng. *(VD: refactor: optimize database query)*
*   **`test:`** Thêm hoặc sửa test case.

---

## 4. Quy Trình Làm Việc Hàng Ngày (Daily Workflow)

Mỗi khi nhận một task mới, thành viên thực hiện theo các bước sau:

### Bước 1: Cập nhật code mới nhất về máy
Luôn bắt đầu từ nhánh `develop`.
```bash
git checkout develop
git pull origin develop
```

### Bước 2: Tạo nhánh mới để làm task
```bash
git checkout -b feature/ten-task-cua-ban
```

### Bước 3: Code và Commit
Lưu ý commit thường xuyên khi xong từng phần nhỏ.
```bash
git add .
git commit -m "feat: add user schema to database"
```

### Bước 4: Đẩy code lên GitHub
```bash
git push origin feature/ten-task-cua-ban
```

### Bước 5: Tạo Pull Request (PR)
1. Lên GitHub, bấm nút **Compare & pull request**.
2. **Base branch** (nhánh đích) phải chọn là **`develop`**.
3. Điền mô tả PR rõ ràng: task này làm gì, có lưu ý gì cho người review không.
4. Gắn thẻ Assignees (chính bạn) và Reviewers (người review code).

---

## 5. Xử Lý Xung Đột Code (Conflict)

Nếu PR báo có Conflict, người tạo PR phải tự xử lý (không để người review sửa):
1. Chuyển về nhánh `develop` ở máy và pull code mới nhất: `git pull origin develop`
2. Quay lại nhánh của bạn: `git checkout feature/ten-task-cua-ban`
3. Merge `develop` vào nhánh của bạn: `git merge develop`
4. Mở IDE (VS Code) lên để giải quyết conflict (chọn Keep Current, Keep Incoming, hoặc tự kết hợp).
5. Add, Commit và Push lại lên nhánh của bạn. PR trên GitHub sẽ tự động cập nhật và báo hết conflict.

---

## 6. Quy Tắc Dành Cho Người Duyệt Code (Reviewer)

*   **Không tự merge code của chính mình.**
*   Đọc kỹ code thay đổi trong tab *Files changed*.
*   Chạy thử (test) code trên máy cá nhân nếu tính năng phức tạp.
*   Nếu code có vấn đề: Comment trực tiếp vào dòng code bị lỗi và chọn **Request changes**.
*   Nếu code tốt: Bấm **Approve** và tiến hành **Squash and Merge** (hoặc báo lại cho Assignee tự merge).
*   Sau khi merge, nhấn nút **Delete branch** trên GitHub để giữ repo sạch sẽ.
# Kế Hoạch Triển Khai: Biểu Đồ So Sánh Tiến Độ Thể Trạng (Body Transformation Visualizer) & Xuất Báo Cáo PDF

**Mục tiêu:** Xây dựng tính năng trực quan hóa tiến trình biến đổi thể trạng theo thời gian (giảm mỡ, tăng cơ, biến động cân nặng qua từng tháng) dựa trên các chỉ số InBody đo định kỳ; tính điểm "Chỉ số Cải thiện Thể chất" (Fitness Progress Score - FPS) để tạo động lực mạnh mẽ cho học viên; cung cấp công cụ xuất nhanh bản tóm tắt PDF chuẩn A4 và bản tin Zalo/Email cho Huấn luyện viên (Coach).

---

## 1. Kiến Trúc & Thiết Kế Giải Thuật (Architecture & Algorithm)

### 1.1. Giải thuật Điểm "Chỉ số Cải thiện Thể chất" (Fitness Progress Score - FPS)
Hệ thống tính điểm minh bạch trên thang điểm **100**, chia thành các nhóm trọng số khoa học:

$$\text{FPS} = \text{Base} + \Delta\text{FatScore} + \Delta\text{MuscleScore} + \text{ConsistencyScore} + \text{EffortBonus}$$

1. **Điểm Nền Tảng (Base Score - 50 điểm):**
   - Áp dụng ngay khi học viên có ít nhất 1 mốc đo InBody được ghi nhận (cột mốc bắt đầu).
2. **Điểm Giảm Mỡ Dư Thừa ($\Delta\text{FatScore}$ - Tối đa +20 điểm):**
   - So sánh mốc đo đầu tiên vs mốc đo mới nhất. Mỗi $1\%$ mỡ giảm được cộng $+4$ điểm (tối đa $+20$ điểm).
   - Nếu tỷ lệ mỡ đã ở ngưỡng chuẩn lý tưởng ($10\% - 18\%$ nam, $18\% - 24\%$ nữ) và duy trì ổn định: thưởng $+15$ điểm.
3. **Điểm Tăng Khối Lượng Cơ Nạc ($\Delta\text{MuscleScore}$ - Tối đa +20 điểm):**
   - Mỗi $+0.5\text{ kg}$ cơ tăng thêm được cộng $+5$ điểm (tối đa $+20$ điểm).
4. **Điểm Chuyên Cần & Đo Định Kỳ (Consistency Score - Tối đa +10 điểm):**
   - Có từ 2 mốc đo cách nhau $\ge 14$ ngày: $+5$ điểm.
   - Có từ 3 mốc đo định kỳ qua các tháng: $+10$ điểm.
5. **Điểm Đánh Giá Từ Huấn Luyện Viên (Effort Bonus - Tối đa +10 điểm):**
   - Dựa trên trung bình đánh giá `performanceRating` & `attendanceRating` từ các buổi tập của HLV ($\ge 4/5$ sao: $+5$ đến $+10$ điểm).

**Phân Cấp Danh Hiệu Động Lực (Achievement Badges):**
- 🏆 **85 - 100 điểm:** **Kim Cương (Diamond) — Bứt Phá Thần Tốc (Elite Transformation)**
- 🥇 **70 - 84 điểm:** **Vàng (Gold) — Tiến Bộ Vượt Bậc (Strong Progress)**
- 🥈 **55 - 69 điểm:** **Bạc (Silver) — Kiên Trì Bền Bỉ (Steady Improver)**
- 🥉 **Dưới 55 điểm:** **Đồng (Bronze) — Khởi Động Nền Tảng (Journey Started)**

---

### 1.2. Thiết Kế Biểu Đồ Đường Trực Quan (Interactive SVG Line Chart)
- **Công nghệ:** Sử dụng SVG Native, tương thích 100% React 19, zero-dependency, tốc độ render tức thì, không xung đột thư viện.
- **Các đường chỉ số (Multi-Series):**
  - **Tỷ lệ mỡ (Body Fat %):** Đường nét màu Cam Hổ phách (`#f59e0b`), vùng gradient mềm mờ.
  - **Khối lượng cơ (Muscle Mass kg):** Đường nét màu Xanh lục bảo (`#10b981`).
  - **Cân nặng (Weight kg):** Đường nét màu Xanh dương (`#3b82f6`).
- **Tương tác trực quan:**
  - Bộ lọc xem: "Tất cả chỉ số", "Tái cấu trúc (Cơ & Mỡ)", "Cân nặng".
  - Hover / Touch Tooltip: Hiển thị popup chi tiết ngày đo, chỉ số đo, chênh lệch $\Delta$ so với lần trước.
  - Thẻ tóm tắt biến đổi (Transformation Delta Cards): So sánh $\Delta$ Cân nặng, $\Delta$ Mỡ %, $\Delta$ Cơ kg.

---

### 1.3. Cơ Chế Xuất Bản Tóm Tắt PDF & Gửi Zalo/Email
1. **Xuất Bản Tóm Tắt PDF (A4 Report Card / Certificate):**
   - Áp dụng kỹ thuật in ẩn iframe đã chuẩn hóa trong dự án (tương tự `InvoiceReceiptModal.jsx`).
   - Thiết kế giao diện báo cáo khổ A4 chuẩn in ấn:
     - Header thương hiệu: **NEXUS SPORTS CENTER - TRUNG TÂM THỂ THAO ĐẲNG CẤP**.
     - Thông tin học viên (Họ tên, Mã HV, Chiều cao) & HLV phụ trách, ngày lập báo cáo.
     - Bảng đối chiếu chỉ số Trước vs Sau (Cân nặng, Tỷ lệ mỡ, Khối lượng cơ, BMI).
     - Huy hiệu Điểm Cải Thiện Thể Chất (FPS) kèm xếp hạng.
     - Biểu đồ tiến trình thể trạng thu nhỏ trực quan.
     - Nhận xét chi tiết & Lời khuyên định hướng tập luyện/dinh dưỡng từ HLV.
     - Khu vực chữ ký xác nhận của Huấn luyện viên & Trung tâm.
   - Khi bấm "Xuất PDF", hệ thống kích hoạt hộp thoại lưu PDF của trình duyệt (Save as PDF) với định dạng sắc nét 100% vector.
2. **Sao Chép Tóm Tắt Gửi Zalo / Email (1-Click Copy Summary):**
   - Tự động định dạng văn bản ngắn gọn, có emoji nổi bật để Coach copy và dán trực tiếp vào chat Zalo hoặc Email gửi cho học viên trong 1 giây.

---

## 2. Phạm Vi Thực Hiện (Scope & Boundaries)

### Trong Phạm Vi (In Scope):
- **Utility logic & tính toán:** `bodyTransformationUtils.js` (thuật toán FPS, delta, tính toán tọa độ SVG, format bản tin Zalo, HTML template cho PDF).
- **Kiểm thử tự động TDD:** `bodyTransformationUtils.test.js` kiểm thử toàn diện bằng `node --test` (tích hợp vào `npm run test:member`).
- **Component giao diện:**
  - `BodyTransformationModal.jsx` (Modal xem biểu đồ, điểm FPS, lịch sử đo InBody, xuất PDF và copy Zalo).
  - `bodyTransformation.css` (hiệu ứng gradient, layout responsive và print stylesheet).
- **Tích hợp phía Huấn Luyện Viên (Coach):**
  - Trong `CoachStudents.jsx`: Thêm nút "Biểu đồ thể trạng" trong bảng danh sách học viên và trong popup chi tiết học viên.
  - Trong `TraineeAssessmentModal.jsx`: Thêm nút mở nhanh biểu đồ thể trạng cho học viên đang đánh giá.
- **Tích hợp phía Hội Viên (Member):**
  - Trong `MemberAssessmentsModal.jsx`: Thêm tab "Biểu đồ Biến đổi Thể trạng (FPS)".
  - Trong `CustomerDashboard.jsx`: Nút xem biểu đồ tiến trình tại phần thống kê InBody.
- **Hệ thống đa ngôn ngữ (i18n):** Bổ sung đầy đủ từ khóa tiếng Việt & tiếng Anh vào `messages.js`.

### Ngoài Phạm Vi (Out of Scope):
- Không sửa cấu trúc cơ sở dữ liệu (Database Schema) vì bảng `TRAINEE_ASSESSMENTS` đã có đầy đủ: `weight`, `height`, `body_fat_percentage`, `muscle_mass`, `attendance_rating`, `performance_rating`.
- Không cài đặt các thư viện chart/pdf nặng (như Chart.js, Recharts, jsPDF) để tránh lỗi tương thích React 19 và giữ tốc độ ứng dụng siêu mượt.

---

## 3. Danh Sách Tệp Tác Động (Impacted Files)

| STT | Tệp tin | Thao tác | Mục đích chi tiết |
|---|---|---|---|
| 1 | `Frontend/src/features/member/bodyTransformationUtils.js` | **Tạo mới** | Thuật toán tính FPS, tính $\Delta$, tọa độ SVG, bản tin Zalo, HTML print PDF |
| 2 | `Frontend/src/features/member/bodyTransformationUtils.test.js` | **Tạo mới** | Bộ Unit Tests kiểm thử thuật toán và các trường hợp biên |
| 3 | `Frontend/src/features/member/components/BodyTransformationModal.jsx` | **Tạo mới** | Modal biểu đồ trực quan, bảng FPS, chức năng xuất PDF & gửi Zalo |
| 4 | `Frontend/src/features/member/components/bodyTransformation.css` | **Tạo mới** | CSS styling, theme variables, hiệu ứng gradient & in ấn |
| 5 | `Frontend/src/features/coach/pages/CoachStudents.jsx` | **Chỉnh sửa** | Thêm nút mở biểu đồ & xuất PDF thể trạng cho học viên |
| 6 | `Frontend/src/features/coach/components/TraineeAssessmentModal.jsx` | **Chỉnh sửa** | Thêm liên kết mở nhanh visualizer từ tab Lịch sử |
| 7 | `Frontend/src/features/member/components/MemberAssessmentsModal.jsx` | **Chỉnh sửa** | Thêm tab xem biểu đồ tiến trình cơ mỡ |
| 8 | `Frontend/src/features/member/pages/CustomerDashboard.jsx` | **Chỉnh sửa** | Thêm nút mở visualizer tại widget InBody cá nhân |
| 9 | `Frontend/src/i18n/messages.js` | **Chỉnh sửa** | Cung cấp từ khóa song ngữ cho biểu đồ, điểm FPS, nút xuất PDF |
| 10 | `Frontend/package.json` | **Chỉnh sửa** | Thêm `bodyTransformationUtils.test.js` vào kịch bản test tự động |

---

## 4. Các Nhiệm Vụ Triển Khai Tuần Tự (Atomic Tasks)

### Task 1: Xây dựng Thuật toán Core & Bộ Kiểm Thử TDD
- **Nội dung:** 
  1. Viết bộ kiểm thử `bodyTransformationUtils.test.js` với các ca kiểm thử: mảng rỗng, 1 mốc đo, nhiều mốc đo (giảm mỡ, tăng cơ), điểm tối đa/tối thiểu, tạo tọa độ SVG hợp lệ không bị `NaN`, tạo text Zalo và HTML PDF.
  2. Viết mã nguồn triển khai trong `bodyTransformationUtils.js`.
  3. Cập nhật `package.json` đưa file test vào kịch bản `test:member`.
- **Xác minh:** Chạy lệnh `npm run test:member` đạt 100% pass.

### Task 2: Xây dựng Component `BodyTransformationModal` & Stylesheet
- **Nội dung:**
  1. Viết `bodyTransformation.css` với các biến giao diện, hiệu ứng phát sáng mờ ảo, giao diện bảng thẻ chỉ số và `@media print`.
  2. Viết `BodyTransformationModal.jsx` hiển thị:
     - Header thông tin học viên & lớp học.
     - Vùng điểm số FPS & Huy hiệu thành tích (Diamond, Gold, Silver, Bronze).
     - 4 thẻ Delta KPI: Cân nặng ($\Delta$), Mỡ ($\Delta$), Cơ ($\Delta$), BMI hiện tại.
     - Biểu đồ đường SVG đa chuỗi (Multi-line paths) kèm hiệu ứng hover tooltip.
     - Nút "Xuất Bản Tóm Tắt PDF" (iframe print) và nút "Sao chép gửi Zalo/Email".
     - Bảng nhật ký lịch sử các lần đo InBody.
- **Xác minh:** Chạy `npm run build` không có lỗi cú pháp JSX hay import.

### Task 3: Tích hợp Tính Năng Vào Phía Huấn Luyện Viên (Coach Portal)
- **Nội dung:**
  1. Trong `CoachStudents.jsx`: Thêm nút biểu tượng tiến độ (`TrendingUp` / `Activity`) tại mỗi dòng học viên và trong popup chi tiết học viên. Bấm nút sẽ mở `BodyTransformationModal` của học viên đó.
  2. Trong `TraineeAssessmentModal.jsx`: Thêm nút "Xem Biểu đồ Xu hướng & Báo cáo PDF" ở tab Lịch sử đánh giá.
- **Xác minh:** Kiểm tra giao diện phía Coach, mở modal hiển thị đúng dữ liệu học viên đã chọn.

### Task 4: Tích hợp Tính Năng Vào Phía Hội Viên (Member Portal)
- **Nội dung:**
  1. Trong `MemberAssessmentsModal.jsx`: Bổ sung tab chuyển đổi "Biểu đồ Tiến trình Thể trạng".
  2. Trong `CustomerDashboard.jsx`: Thêm nút mở nhanh visualizer ngay tại khu vực chỉ số InBody.
- **Xác minh:** Học viên đăng nhập vào có thể xem biểu đồ tiến trình và tự tải báo cáo cá nhân.

### Task 5: Cập Nhật Bản Dịch Đa Ngôn Ngữ (i18n) & Kiểm Tra Toàn Diện
- **Nội dung:**
  1. Thêm tất cả nhãn song ngữ vào `messages.js` (tiếng Việt và tiếng Anh).
  2. Chạy toàn bộ test suites (`test:member`, `test:i18n`, `build`) đảm bảo không có bất kỳ lỗi hồi quy nào.
- **Xác minh:** Chạy `npm run test:member`, `npm run test:i18n` và `npm test` thành công.

---

## 5. Rủi Ro & Biện Pháp Phòng Ngừa (Risks & Mitigations)

| Rủi ro tiềm ẩn | Biện pháp xử lý |
|---|---|
| Học viên mới chỉ có 1 lần đo InBody, chưa đủ dữ liệu để vẽ đường nối. | Hiển thị giao diện "Mốc khởi đầu" với huy hiệu chào mừng, giải thích rõ cần tối thiểu 2 lần đo để xuất hiện đường nối biến đổi, vẫn tính điểm Base 50 và hiển thị đầy đủ thẻ chỉ số hiện tại. |
| Một số lần đo bị khuyết trường (ví dụ chỉ có cân nặng, thiếu tỷ lệ mỡ). | Thuật toán trong `bodyTransformationUtils` lọc và xử lý an toàn giá trị `null`/`undefined`, không làm gãy đường biểu đồ. |
| In PDF bị vỡ giao diện trên các trình duyệt khác nhau. | Sử dụng template HTML in độc lập trong iframe với style CSS cố định kích thước khổ A4 chuẩn (`210mm x 297mm`), đảm bảo màu sắc và font chữ hiển thị chuẩn xác 100%. |

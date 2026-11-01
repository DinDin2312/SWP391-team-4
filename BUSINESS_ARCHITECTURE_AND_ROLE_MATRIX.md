# TÀI LIỆU QUY LUẬN NGHIỆP VỤ & MA TRẬN VAI TRÒ TOÀN HỆ THỐNG
## (SPORTS CENTER BUSINESS ARCHITECTURE & ROLE INTERACTION MATRIX)

> **Tài liệu được tổng hợp và quy luận ngược từ 100% mã nguồn thực tế (Backend Spring Boot, Frontend React, CSDL MySQL và Bản mô phỏng 2.5D Simulator)**.

---

## MỤC LỤC
1. [Nguyên Lý Cốt Lõi Của Hệ Thống (Core Domain Principles)](#1-nguyên-lý-cốt-lõi-của-hệ-thống)
2. [Bản Đồ Thực Thể & Vòng Đời Dữ Liệu (Domain Entities & Lifecycles)](#2-bản-đồ-thực-thể--vòng-đời-dữ-liệu)
3. [Phân Định 4 Vai Trò & Ma Trận Phân Quyền (RACI Matrix)](#3-phân-định-4-vai-trò--ma-trận-phân-quyền)
4. [Các Ràng Buộc Nghiệp Vụ Cốt Tử (Hard Business Constraints)](#4-các-ràng-buộc-nghiệp-vụ-cốt-tử)
5. [Chuỗi Tương Tác Đa Chiều Giữa Các Vai Trò (Cross-Role Workflows)](#5-chuỗi-tương-tác-đa-chiều-giữa-các-vai-trò)
6. [Cơ Chế Chống Lỗi Ngầm & Xử Lý Đồng Thời (Concurrency & Edge-Cases Defense)](#6-cơ-chế-chống-lỗi-ngầm--xử-lý-đồng-thời)

---

## 1. NGUYÊN LÝ CỐT LÕI CỦA HỆ THỐNG

```mermaid
graph TD
    subgraph "TẦNG 1: HOẠCH ĐỊNH & THƯƠNG MẠI"
        M[Center Manager] -->|Cấu hình Gói tập & Lịch học| PKG[PACKAGES & CLASSES]
        MEM[Hội Viên / Member] -->|Mua Gói / Đặt Chỗ| UM[USER_MEMBERSHIPS & BOOKINGS]
    end

    subgraph "TẦNG 2: KIỂM SOÁT VẬN HÀNH SẢNH (GATEWAY)"
        REC[Lễ Tân / Receptionist] -->|Quẹt thẻ mở Cổng Turnstile| CHK[CHECK-IN 2 LỚP: Member & Coach]
        CHK -->|Xác nhận vào cửa| SEC[ĐÃ QUA CỔNG LỄ TÂN]
    end

    subgraph "TẦNG 3: GIẢNG DẠY & ĐÁNH GIÁ CHUYÊN MÔN"
        SEC -->|Học viên vào phòng| CCH[Huấn Luyện Viên / Coach]
        CCH -->|Điểm danh có mặt| ATT[ATTENDANCE: PRESENT/ABSENT]
        CCH -->|Đo InBody & Đánh giá| ASS[TRAINEE_ASSESSMENTS & WORKOUT_PLANS]
    end

    subgraph "TẦNG 4: HẬU MÃI & GIẢI QUYẾT KHIẾU NẠI"
        MEM -.->|Yêu cầu hủy lớp / Đổi lớp| SUP[SUPPORT_REQUESTS & CANCELLATIONS]
        REC -->|Duyệt hoàn trả| CRD[USER_CREDITS]
    end
```

### 1.1. Mô hình Trung tâm Phức hợp Lai (Hybrid Multi-Sport Facility)
Hệ thống không vận hành như một phòng Gym đơn lẻ, mà quản lý một tổ hợp thể thao 3 tầng gồm 5 phòng bộ môn chuyên biệt (`ROOMS`):
1. **Phòng Gym Tầng 1** (Sức chứa 50 - Thể hình tự do)
2. **Phòng Yoga Tầng 2** (Sức chứa 30 - Lớp Yoga Hatha, Vinyasa)
3. **Phòng Zumba Tầng 3** (Sức chứa 40 - Nhảy hiện đại, Dance Fitness)
4. **Bể Bơi Bốn Mùa Tầng 1** (Sức chứa 100 - Bơi lội & Thể thao dưới nước)
5. **Phòng Đạp Xe Spinning Tầng 2** (Sức chứa 20 - Đạp xe cường độ cao)

Trung tâm cung cấp **2 phương thức tập luyện đồng thời**:
* **Tự do (Free Access):** Vào khu gym, bơi, xông hơi không cần HLV theo gói thời hạn.
* **Theo lớp có HLV (Coach-led Structured Sessions):** Phải đặt chỗ (`BOOKING`), giới hạn sĩ số (`max_slots`), tuân thủ ca dạy cố định (`SCHEDULES`).

### 1.2. Nguyên lý Snapshot Dữ liệu Bất biến (Financial & Benefit Snapshot)
Khi hội viên mua một gói tập, toàn bộ quyền lợi (giá tiền, thời hạn, danh sách phòng được phép vào, số buổi học) được **chụp lại (Snapshot)** vào bản ghi `USER_MEMBERSHIPS` (`package_name_snapshot`, `price_snapshot`, `type_name_snapshot`, `MEMBERSHIP_BENEFIT_ROOMS`).  
$\rightarrow$ **Ý nghĩa:** Nếu sau này Quản lý tăng giá gói hoặc cắt giảm số phòng tập của gói đó trên hệ thống, quyền lợi của những hội viên đã mua trước đó **không bao giờ bị thay đổi hay phương hại**.

---

## 2. BẢN ĐỒ THỰC THỂ & VÒNG ĐỜI DỮ LIỆU

### 2.1. Vòng đời Gói tập & Quyền lợi (`USER_MEMBERSHIPS`)
```
[GIAO DỊCH MUA THÀNH CÔNG]
          │
          ▼
   ┌───────────────┐
   │   UPCOMING    │ (Nếu ngày bắt đầu > Hôm nay)
   └───────┬───────┘
           │ (Đến ngày bắt đầu HOẶC Lễ tân Kích Hoạt Sớm tại quầy)
           ▼
   ┌───────────────┐
   │    ACTIVE     │ (Trong khoảng: start_date <= today <= end_date)
   └───────┬───────┘
           │ (Hết hạn ngày kết thúc HOẶC hết số buổi remaining_sessions)
           ▼
   ┌───────────────┐
   │    EXPIRED    │ (Vô hiệu hóa quyền vào cửa)
   └───────────────┘
```

### 2.2. Vòng đời Buổi Đặt Chỗ (`BOOKINGS`)
```
[HỘI VIÊN ĐẶT CHỖ TRÊN APP / LỄ TÂN ĐĂNG KÝ]
          │
          ▼
   ┌───────────────┐
   │   CONFIRMED   │ (Giữ 1 slot trong lớp, trừ 1 lượt session_limit)
   └───────┬───────┘
           │
           ├──────────────────────────────┬──────────────────────────────┐
           ▼                              ▼                              ▼
   ┌───────────────┐              ┌───────────────┐              ┌───────────────┐
   │   CANCELLED   │              │    PRESENT    │              │    ABSENT     │
   │ (Hủy trước ca │              │ (Qua lễ tân + │              │ (Không đến,   │
   │ hoàn lại slot)│              │  HLV xác nhận)│              │  bị trừ lượt) │
   └───────────────┘              └───────────────┘              └───────────────┘
```

---

## 3. PHÂN ĐỊNH 4 VAI TRÒ & MA TRẬN PHÂN QUYỀN (RACI MATRIX)

| Nghiệp vụ / Hành động | Center Manager (Quản Lý) | Receptionist (Lễ Tân) | Coach (Huấn Luyện Viên) | Member (Hội Viên) |
| :--- | :---: | :---: | :---: | :---: |
| **Cấu hình Gói tập, Giá tiền, Bộ môn** | **A / R** (Toàn quyền) | I (Chỉ xem) | I (Chỉ xem) | I (Chỉ xem) |
| **Tạo Lớp học, Phân bổ HLV & Phòng** | **A / R** (Toàn quyền) | I | I | I |
| **Xếp Lịch Học (`SCHEDULES`)** | **A / R** | I | I (Xem lịch cá nhân) | I (Xem lịch trống) |
| **Bán Gói Tập & Thu Tiền Tại Quầy** | I (Xem doanh thu) | **A / R** (Thực hiện) | - | C (Người mua) |
| **Mua Gói Tập & Đặt Lớp Trực Tuyến** | - | - | - | **A / R** |
| **Check-in Vào Cửa Cho Hội Viên** | I (Giám sát) | **A / R** (Mở cổng) | - | C (Quẹt mã QR) |
| **Check-in / Chấm Công Cho HLV** | I (Theo dõi chuyên cần) | **A / R** (Xác nhận) | C (Có mặt) | - |
| **Điểm Danh Học Viên Trong Lớp** | I | - | **A / R** (Xác nhận) | I |
| **Soạn Giáo Án & Bài Tập Thể Lực** | - | - | **A / R** (Chuyên môn) | I (Nhận bài tập) |
| **Đo & Đánh Giá Chỉ Số InBody Định Kỳ** | I (Theo dõi chất lượng) | - | **A / R** (Đánh giá mốc) | **R** (Tự ghi nhận) |
| **Đánh Giá Buổi Học Hàng Ngày (Kỹ thuật & Chuyên cần)** | I | - | **A / R** (Bắt buộc sau ca) | I (Nhận phản hồi) |
| **Đề Xuất Dời Lịch Dạy Bù (Không có HLV thay thế)** | **A** (Thẩm định & Duyệt) | I (Nắm lịch vận hành) | **R** (Tạo đơn >12h) | **C / R** (Biểu quyết tự quyết) |
| **Hủy Lớp / Đổi Lớp Hạn Chế** | A (Duyệt ca đặc biệt) | **R** (Xử lý tại quầy) | I (Nhận thông báo) | **R** (Gửi yêu cầu) |

*Ghi chú RACI:* **A** (Accountable - Chịu trách nhiệm chính), **R** (Responsible - Trực tiếp thực hiện), **C** (Consulted - Tham vấn/Phối hợp), **I** (Informed - Nhận thông tin/Xem).

---

## 4. CÁC RÀNG BUỘC NGHIỆP VỤ CỐT TỬ (HARD CONSTRAINTS)

### 4.1. Ràng Buộc Không Gian & Thời Gian (Anti-Collision Constraints)
1. **Phòng tập (Room Constraint):** Trong cùng một khoảng thời gian $[StartTime, EndTime]$, một phòng tập (`room_id`) **chỉ được phép gán cho duy nhất 1 ca học**.
2. **Huấn luyện viên (Coach Constraint):** Một HLV (`coach_id`) **không thể dạy 2 lớp khác nhau trong cùng một khung giờ** hoặc có ca học đè lên nhau.
3. **Sĩ số lớp (Capacity Constraint):** Tổng số `BOOKINGS` có trạng thái `CONFIRMED` **không bao giờ được vượt quá** `max_slots` của lớp hoặc `capacity` của phòng tập tương ứng.

### 4.2. Ràng Buộc Kiểm Soát Cửa 2 Lớp (Double-Check In Enforcement)
1. **Điều kiện để Member được vào sảnh:**
   $$\text{Access Granted} \iff (\text{Active Gym Membership Hôm nay}) \lor (\text{Có Booking Class Hôm nay } \land \text{CONFIRMED})$$
2. **Khóa cứng điểm danh HLV:**
   HLV **bị khóa nút "Có Mặt" (Present)** nếu học viên chưa qua quầy lễ tân check-in (`st.checkedInAtFrontDesk = false`). HLV không thể "điểm danh khống" cho người không có mặt ở trung tâm.

### 4.3. Ràng Buộc Hủy Lớp Theo Mốc Giờ (Class Cancellation Policy)
Hệ thống áp dụng công thức 3 mốc thời gian chặt chẽ tính từ thời điểm hiện tại tới giờ học ($T = StartTime - CurrentTime$):
* **$T \ge 12\text{ giờ}$:** Hội viên được quyền **Tự Hủy Trực Tuyến** $\rightarrow$ Hệ thống hoàn lại 100% lượt tập vào gói tập ngay lập tức.
* **$2\text{ giờ} \le T < 12\text{ giờ}$ (Hủy muộn):** Hệ thống khóa hủy tự động $\rightarrow$ Chuyển thành **Yêu Cầu Hỗ Trợ (`SUPPORT_REQUESTS`)** gửi tới Lễ tân. Lễ tân thẩm tra lý do bất khả kháng để quyết định cấp mã bồi hoàn tín dụng (`USER_CREDITS`).
* **$T < 2\text{ giờ}$ hoặc đã qua giờ học:** **Khóa hủy tuyệt đối**. Buổi tập được tính là đã thực hiện hoặc vắng mặt không phép (`ABSENT`) để đảm bảo quyền lợi và phụ cấp đứng lớp cho Huấn luyện viên đã đến trung tâm.

---

## 5. CHUỖI TƯƠNG TÁC ĐA CHIỀU GIỮA CÁC VAI TRÒ

### 5.1. Luồng 1: Vận hành Vào Cửa & Điểm Danh (Check-in & Attendance Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor M as Hội Viên (Member)
    actor C as Huấn Luyện Viên (Coach)
    actor R as Lễ Tân (Receptionist)
    participant S as Backend & DB (MySQL)

    Note over C,R: Bước 1: HLV đến trung tâm trước giờ dạy
    C->>R: Đến quầy / Xuất trình thẻ HLV
    R->>S: Bấm [Xác nhận HLV Có Mặt] trên Tab Check-in HLV
    S-->>R: Ghi nhận giờ đến (Timestamp) + Trạng thái CHECKED_IN
    S-->>C: Mở quyền điểm danh cho ca dạy hôm nay

    Note over M,R: Bước 2: Hội viên đến trung tâm vào lớp học
    M->>R: Xuất trình mã QR trên App
    R->>S: Quét mã / Bấm Check-in Hội viên
    S->>S: Kiểm tra Gói tập & Lịch học hôm nay
    S-->>R: Hợp lệ -> Cổng Turnstile mở + Cập nhật checkedInAtFrontDesk = true

    Note over M,C: Bước 3: Diễn ra buổi học trong phòng tập
    M->>C: Bước vào phòng tập tham gia lớp
    C->>S: Mở danh sách học viên trên app Coach
    Note right of C: Thấy học viên có nhãn "Đã qua lễ tân" -> Nút [Present] mở sáng
    C->>S: Bấm [Có Mặt / Present]
    S-->>C: Lưu trạng thái điểm danh buổi học thành công!
```

---

### 5.2. Luồng 2: Đo Đạc InBody Định Kỳ & Đánh Giá Buổi Học Hàng Ngày

* **Phân định rõ ràng giữa hai khái niệm**:
  1. **Đánh giá Buổi học Hàng ngày (Daily Session Feedback - Bắt buộc)**:
     - Sau mỗi ca dạy, HLV chấm sao thể lực/chuyên cần (1-5 sao) và ghi nhận xét kỹ thuật, dặn dò phục hồi cho học viên.
     - **Không bắt buộc nhập InBody**: Sau 1 buổi tập cơ thể mất nước, cơ mỏi, đo InBody sẽ bị sai lệch sinh học (BIA mất nước) và cơ mỡ không biến đổi sau 1 giờ tập.
  2. **Đo đạc Chỉ số InBody (Milestone InBody - Tùy chọn định kỳ 2-4 tuần/lần)**:
     - Nhập khi đến cột mốc (buổi đầu, giữa, cuối khóa) hoặc kiểm tra thể lực định kỳ.

* **Cơ chế Đồng bộ Thể chất 2 Chiều (Bidirectional Sync)**:
  * **Hội viên tự đo (Self-Log)**: Hội viên tự đo máy tại sảnh, tự cập nhật trên App $\rightarrow$ Bản ghi lưu với nhãn **Tự cập nhật**. Dữ liệu này **tự động đồng bộ và hiển thị ngay trên Cổng HLV (`TraineeAssessmentModal`)**, giúp HLV nắm bắt số đo mới nhất của học viên trước khi soạn giáo án.
  * **HLV đo và đánh giá (Coach Assessment)**: HLV nhập số đo định kỳ $\rightarrow$ Tự động lưu lịch sử `INBODY_RECORDS` và cập nhật hồ sơ thể trạng `HEALTH_PROFILES` của học viên.

* **Trực quan hóa & Điểm số Thể chất FPS (Fitness Progress Score)**:
  * Tự động tính điểm FPS (thang 100) phản ánh độ kiên trì, xu hướng giảm mỡ, tăng cơ nạc và chỉ số BMI lý tưởng ($18.5 - 24.9$).
  * Biểu đồ tiến trình đa trục (SVG Polyline) kèm bảng lịch sử có **Sticky Header** và **Phân trang thu gọn (5 bản ghi/trang)** chống tràn modal khi có nhiều dữ liệu đo.
  * Tối ưu độ tương phản cao (High-Contrast WCAG) ở cả chế độ Sáng và Tối.

---

### 5.3. Luồng 3: Chuyển Lớp, Hủy Lớp, Bảo Lưu Học Phí & Quản Trị Dòng Tiền

```mermaid
sequenceDiagram
    autonumber
    actor M as Hội Viên
    actor R as Lễ Tân
    actor CM as Quản Lý (Manager)
    participant S as Support & Payment Engine

    alt 1. Chuyển Lớp Trực Tiếp (Lớp chưa bắt đầu, đồng giá)
        M->>S: Chọn lớp đồng giá chưa khai giảng -> Bấm chuyển trực tiếp
        S->>S: Hủy booking lớp cũ + Tạo booking lớp mới (1-Click, không cần đơn)
        S-->>M: Thông báo chuyển lớp thành công!
    else 2. Chuyển Lớp Khi Đã Bắt Đầu Học
        M->>S: Yêu cầu chuyển lớp đang học dở dang
        S-->>M: Chặn chuyển trực tiếp -> Điều hướng sang luồng Hủy lớp nhận Voucher
    else 3. Hủy Lớp Chưa Khai Giảng (Auto-Approved 100%)
        M->>S: Bấm hủy lớp chưa khai giảng (Chọn Voucher hoặc Gym Pass)
        S->>S: Tự động phê duyệt đơn (Auto-Approved) + Cấp mã CRED- hoặc GYMPASS- 100%
        S-->>M: Trả mã Voucher/Gym Pass tức thì có hạn 60 ngày
    else 4. Hủy Lớp Đang Học Dở Dang (Xét duyệt bồi hoàn số buổi còn lại)
        M->>S: Gửi đơn yêu cầu hủy/bảo lưu số buổi còn lại
        R->>S: Xem xét số buổi đã học / còn lại (Hệ thống đề xuất Prorated Credit)
        R->>S: Bấm [Phê Duyệt] cấp mã tín dụng CRED-
        S->>S: Hủy các buổi tương lai + Tạo mã USER_CREDITS (VD: 9/10 buổi = 585.000 đ)
        S-->>M: Thông báo mã tín dụng bồi hoàn nạp vào ví tài khoản
    else 5. Đòi Hoàn Tiền Mặt (Chính sách giữ dòng tiền trung tâm)
        M->>S: Kiên quyết yêu cầu rút tiền mặt / chuyển khoản ngân hàng
        Note over R: Lễ tân TUYỆT ĐỐI KHÔNG có quyền nhả tiền mặt
        R->>S: Bấm [Chuyển Quản lý / Escalate]
        CM->>S: Quản lý thẩm định lý do bất khả kháng (y tế, bất khả kháng)
        alt Quản lý thuyết phục thành công
            CM->>S: Chuyển sang cấp Voucher tín dụng / Gym Pass (Giữ dòng tiền)
        else Ngoại lệ đặc biệt được chấp thuận
            CM->>S: Phê duyệt lệnh hoàn tiền chi trả (CASH_REFUND)
        end
    end
```

#### Nguyên tắc vận hành cốt lõi:
1. **Chuyển lớp linh hoạt trước giờ G**: Học viên tự chuyển 1-click trước khi lớp bắt đầu. Khi lớp đã học $\ge 1$ buổi, chặn tự chuyển để tránh lệch tiến độ chuyên môn $\rightarrow$ phải qua luồng bảo lưu lấy voucher đăng ký lớp mới.
2. **Cơ chế Kép của Thẻ Gym Pass (`GYMPASS-`)**: Vừa dùng để nhập pass tại cửa ra vào tập Gym tự do, vừa có thể sử dụng như một Voucher giảm trừ trong Giỏ hàng khi mua gói tập/lớp học khác.
3. **Prorated Credit Engine**: Tính tiền bồi hoàn chính xác theo số buổi thực tế chưa học ($Price \times Remaining / Total$), làm tròn đến hàng nghìn đồng.
4. **Bảo toàn dòng tiền (Cash Retention Defense)**: Tiền đã vào trung tâm được ưu tiên giữ lại bằng Store Credit hoặc Gym Pass. Cửa xuất tiền mặt chỉ mở duy nhất qua thẩm quyền Quản lý.

---

### 5.4. Luồng 4: Huấn Luyện Viên Dời Lịch Dạy Bù & Quản Lý Thẩm Định (Coach Reschedule & Makeup Plan)

```mermaid
sequenceDiagram
    autonumber
    actor C as Huấn Luyện Viên (Coach)
    actor CM as Quản Lý (Center Manager)
    actor M as Hội Viên (Members)
    participant S as Reschedule Engine & DB

    Note over C,S: 1. HLV gặp sự cố đột xuất & không có người dạy thay
    C->>S: Tạo đơn dời lịch bù tại [/coach/reschedule] (>12h trước ca gốc)
    S->>S: Hậu kiểm: >12h, phòng bù trống, HLV không trùng lịch
    S-->>CM: Thông báo thẩm định đơn dời lịch tới Quản lý

    Note over CM,S: 2. Quản lý Thẩm định & Phê duyệt
    CM->>S: Mở Admin Dashboard thẩm định xung đột phòng & giáo viên
    alt Từ chối
        CM->>S: Bấm Từ chối kèm lý do -> Bắn thông báo cho HLV
    else Phê duyệt
        CM->>S: Bấm Phê duyệt ca dạy bù -> Mở giai đoạn VOTING
        S-->>M: Bắn chuông thông báo Topbar tới toàn bộ học viên trong lớp
    end

    Note over M,S: 3. Hội viên Tự quyết Tham gia hay Hoàn lượt
    M->>S: Mở thông báo dời lịch, tự do chọn 1 trong 2 nút:
    alt Đồng ý học bù
        M->>S: Bấm [Đồng ý ca bù] -> Chuyển giữ chỗ sang ca học bù
    else Bận lịch cá nhân
        M->>S: Bấm [Bận - Hoàn 1 lượt] -> Tự động hoàn lại 1 lượt tập / Credit 100%
    end

    Note over S: 4. Quá hạn chót xác nhận (Confirmation Deadline)
    alt Sĩ số đồng ý >= Sĩ số tối thiểu (min_students)
        S->>S: Ca dạy bù chính thức CONFIRMED -> Diễn ra bình thường
    else Sĩ số < tối thiểu HOẶC học viên chưa kịp xác nhận
        S->>S: Tự động HỦY ca dạy bù (CANCELLED)
        S->>S: Tự động hoàn trả 100% lượt tập / Credit cho toàn bộ học viên
        S-->>C: Thông báo hủy ca bù do không đủ sĩ số
    end
```

#### Nguyên tắc cốt lõi của Ca Dạy Bù:
1. **Chỉ áp dụng khi không có HLV dạy thay**: Tránh lạm dụng dời lịch làm gián đoạn kế hoạch tập luyện của khách hàng.
2. **Nguyên tắc Tự quyết (Member Sovereignty)**: Ca bù do trung tâm dời lịch nên khách hàng không bao giờ bị ép phải theo giờ mới; luôn có nút nhận hoàn 1 lượt tập tức thì.
3. **Cơ chế Hạn chót & An toàn Tuyệt đối**: Quá hạn chót mà khách chưa kịp chọn, hệ thống luôn ưu tiên phương án bảo vệ khách hàng: tự động hoàn trả 1 lượt tập vào tài khoản.

---

## 6. CƠ CHẾ CHỐNG LỖI NGẦM & XỬ LÝ ĐỒNG THỜI (CONCURRENCY DEFENSE)

### 6.1. Chống Tranh Chấp Cửa & Trùng Lặp Check-in (Race Condition Defense)
* Khi 2 lễ tân cùng bấm Check-in cho cùng 1 hội viên tại 2 quầy khác nhau ở cùng 1 phần nghìn giây:
  * Hệ thống dùng **Pessimistic Locking (`FOR UPDATE`)** tại `bookingRepository.lockOperations()`.
  * Giao dịch nào đến trước 1ms sẽ chiếm khóa, ghi nhận check-in.
  * Giao dịch đến sau bị hàng đợi giữ lại; khi mở khóa, hệ thống kiểm tra thấy hội viên này đã ở trạng thái `CHECKED_IN` trong ngày $\rightarrow$ **Ném ngoại lệ chặn đứng ngay lập tức**, không bao giờ bị trừ 2 lần lượt tập.

### 6.2. Chống Trùng Mã Ca Dạy HLV (Exact Integer Schedule ID Matching)
* Khi kiểm tra lịch sử chấm công HLV trong `AUDIT_LOGS`, hệ thống phân tích JSON và ép kiểu số nguyên tuyệt đối (`Objects.equals(loggedSchedId, schedule.getScheduleId())`), loại bỏ hoàn toàn lỗi nhận diện nhầm chuỗi con giữa ca có ID nhỏ (ví dụ: `5`) và ca có ID lớn (ví dụ: `50`).

### 6.3. Khả năng Chịu Tải & Tốc Độ Truy Vấn (Zero N+1 Query)
* Ở màn hình Lễ tân và Dashboard Hội viên, toàn bộ các bảng liên kết (`Schedule`, `GymClass`, `Coach`, `Room`, `Package`) đều được truy vấn qua **Batch Query / `JOIN FETCH` trong 1 - 2 câu SQL duy nhất**, thay vì truy vấn trong vòng lặp $O(N)$ $\rightarrow$ Tốc độ phản hồi đạt mức **15 - 30ms**, chịu tải tốt ngay cả khi hàng trăm học viên cùng ùa vào sảnh giờ cao điểm.

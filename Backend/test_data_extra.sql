-- ================================================================
--  EXTRA TEST DATA - Chạy file này SAU KHI đã chạy database_init.sql
--  Mục đích: Bổ sung dữ liệu để test đầy đủ các trường hợp
-- ================================================================

USE SportCenter;

-- ================================================================
-- PHẦN 1: BỔ SUNG PACKAGES - Test đủ loại gói
-- ================================================================
-- Hiện tại đã có ID 1-5, thêm từ ID 6 trở đi
INSERT INTO PACKAGES VALUES
    -- Gói AI thêm lựa chọn
    (6,  'Gói AI Premium 3 Tháng',     'AI_ACCESS',  90,  249000),
    (7,  'Gói AI VIP 1 Năm',           'AI_ACCESS',  365, 799000),
    -- Gói Gym thêm lựa chọn
    (8,  'Gói Yoga Chuyên Sâu 1 Tháng','GYM_ACCESS', 30,  650000),
    (9,  'Gói Bơi Lội 1 Tháng',        'GYM_ACCESS', 30,  800000),
    -- Gói combo - type AI_ACCESS để unlock tính năng AI chat
    (10, 'Gói Combo Gym + AI 1 Tháng', 'AI_ACCESS', 30,  550000);

-- ================================================================
-- PHẦN 2: BỔ SUNG SCHEDULES TƯƠNG LAI - Để test đặt lớp
-- ================================================================
-- Lớp 1 (Yoga Giãn Cơ): thêm lịch tháng 10-11
INSERT INTO SCHEDULES VALUES
    (21, 1, '2026-10-08 06:00:00', '2026-10-08 07:30:00', 'SCHEDULED'),
    (22, 1, '2026-10-10 06:00:00', '2026-10-10 07:30:00', 'SCHEDULED'),
    (23, 1, '2026-10-12 06:00:00', '2026-10-12 07:30:00', 'SCHEDULED'),
    (24, 1, '2026-10-15 06:00:00', '2026-10-15 07:30:00', 'SCHEDULED'),
    -- Lớp 3 (Gym Căn Bản): thêm lịch tương lai
    (25, 3, '2026-10-09 17:00:00', '2026-10-09 18:30:00', 'SCHEDULED'),
    (26, 3, '2026-10-11 17:00:00', '2026-10-11 18:30:00', 'SCHEDULED'),
    (27, 3, '2026-10-16 17:00:00', '2026-10-16 18:30:00', 'SCHEDULED'),
    -- Lớp 5 (Zumba): thêm lịch tương lai
    (28, 5, '2026-10-08 19:00:00', '2026-10-08 20:30:00', 'SCHEDULED'),
    (29, 5, '2026-10-10 19:00:00', '2026-10-10 20:30:00', 'SCHEDULED'),
    (30, 5, '2026-10-15 19:00:00', '2026-10-15 20:30:00', 'SCHEDULED'),
    -- Lớp 4 (Siết Cơ Cấp Tốc - chỉ 8 slot, để test LỚP GẦN ĐẦY): thêm lịch
    (31, 4, '2026-10-10 20:00:00', '2026-10-10 21:00:00', 'SCHEDULED'),
    (32, 4, '2026-10-17 20:00:00', '2026-10-17 21:00:00', 'SCHEDULED'),
    -- Lớp 9 (Cử Tạ - chỉ 5 slot, dễ test LỚP ĐẦY): thêm lịch
    (33, 9, '2026-10-22 17:00:00', '2026-10-22 18:30:00', 'SCHEDULED'),
    (34, 9, '2026-10-29 17:00:00', '2026-10-29 18:30:00', 'SCHEDULED');

-- ================================================================
-- PHẦN 3: TEST TRƯỜNG HỢP LỚP GẦN ĐẦY
-- Lớp 4 (Siết Cơ Cấp Tốc) có max_slots = 8
-- Đặt 7/8 chỗ cho lịch 31 → chỉ còn 1 chỗ trống
-- ================================================================
INSERT INTO BOOKINGS (booking_id, user_id, schedule_id, status, attendance_status, booking_time) VALUES
    (18, 6,  31, 'CONFIRMED', 'NOT_YET', '2026-10-02 08:00:00'),
    (19, 7,  31, 'CONFIRMED', 'NOT_YET', '2026-10-02 08:01:00'),
    (20, 8,  31, 'CONFIRMED', 'NOT_YET', '2026-10-02 08:02:00'),
    (21, 9,  31, 'CONFIRMED', 'NOT_YET', '2026-10-02 08:03:00'),
    (22, 10, 31, 'CONFIRMED', 'NOT_YET', '2026-10-02 08:04:00'),
    (23, 11, 31, 'CONFIRMED', 'NOT_YET', '2026-10-02 08:05:00'),
    (24, 12, 31, 'CONFIRMED', 'NOT_YET', '2026-10-02 08:06:00');
-- → Lịch 31 (Lớp 4) đã có 7/8 chỗ. Chỉ còn 1 slot cuối cùng!

-- ================================================================
-- PHẦN 4: TEST TRƯỜNG HỢP LỚP ĐẦY HOÀN TOÀN
-- Lớp 9 (Cử Tạ) có max_slots = 5
-- Đặt đủ 5/5 chỗ cho lịch 33 → test xem hệ thống có chặn không
-- ================================================================
INSERT INTO BOOKINGS (booking_id, user_id, schedule_id, status, attendance_status, booking_time) VALUES
    (25, 6,  33, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:00:00'),
    (26, 7,  33, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:01:00'),
    (27, 8,  33, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:02:00'),
    (28, 9,  33, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:03:00'),
    (29, 10, 33, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:04:00');
-- → Lịch 33 (Lớp 9) đã FULL 5/5 chỗ. Đặt thêm phải bị từ chối!

-- ================================================================
-- PHẦN 5: BỔ SUNG USER_MEMBERSHIPS - Các trường hợp thẻ thành viên
-- ================================================================
INSERT INTO USER_MEMBERSHIPS VALUES
    -- Test gói AI đang ACTIVE (user 11 có AI)
    (6,  11, 4, '2026-09-01', '2026-10-31', 30, 'ACTIVE'),
    -- Test gói AI đã HẾT HẠN (EXPIRED)
    (7,  12, 4, '2026-08-01', '2026-08-31', 30, 'EXPIRED'),
    -- Test user có cả Gym lẫn AI cùng lúc
    (8,  13, 1, '2026-10-01', '2026-10-31', 30, 'ACTIVE'),
    (9,  13, 4, '2026-10-01', '2026-10-31', 30, 'ACTIVE'),
    -- Test gói Gym 1 năm
    (10, 14, 3, '2026-10-01', '2027-10-01', 365, 'ACTIVE'),
    -- Test gói sắp hết hạn (còn 3 ngày)
    (11, 15, 1, '2026-09-02', '2026-10-05', 30, 'ACTIVE');

-- ================================================================
-- TỔNG KẾT CÁC KỊCH BẢN TEST:
-- ================================================================
-- 🟢 PACKAGE STORE:
--   - Xem đủ 10 gói (5 cũ + 5 mới)
--   - Gói miễn phí (ID 5): 0đ
--   - Gói AI các loại: 1 tháng, 3 tháng, 1 năm
--   - Gói Gym các loại: 1 tháng, 3 tháng, 1 năm
--
-- 🟢 BOOK A CLASS:
--   - Lớp CÒN NHIỀU CHỖ: Lớp 1,2,5 (20-30 slot, chỉ vài booking)
--   - Lớp GẦN ĐẦY (còn 1 chỗ): Lớp 4 lịch 31 (7/8 đã đặt)
--   - Lớp ĐẦY HOÀN TOÀN: Lớp 9 lịch 33 (5/5 đã đặt → bị từ chối)
--   - Lớp đã QUA (quá khứ): Lịch 1,2,4,6,8,10 (ngày 01/10)
--
-- 🟢 MY PACKAGES (Memberships):
--   - Gói ACTIVE bình thường: user 6,7,8,9,10
--   - Gói AI đang ACTIVE: user 11 (có thể dùng AI)
--   - Gói AI đã EXPIRED: user 12 (không dùng AI được)
--   - Có CẢ 2 gói cùng lúc: user 13 (Gym + AI)
--   - Gói SẮP HẾT HẠN (còn 3 ngày): user 15
--
-- 🟢 AI CHAT:
--   - Đăng nhập user 11 (long@gmail.com / 123456) → CÓ AI
--   - Đăng nhập user 12 (truong@gmail.com / 123456) → KHÔNG CÓ AI
-- ================================================================

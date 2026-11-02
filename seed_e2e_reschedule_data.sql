-- ========================================================
-- SEED DATA FOR E2E TESTING: COACHES, MEMBERS, SCHEDULES & BOOKINGS
-- Database: SportCenter
-- ========================================================
SET NAMES utf8mb4;
USE SportCenter;

-- 1. INSERT COACHES (role_id = 3)
INSERT INTO USERS (email, full_name, phone, password_hash, role_id, status, bio, force_password_change, loyalty_points)
VALUES 
('hlv_quang@sport.com', 'HLV Lê Hồng Quang', '0912345671', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 3, 'ACTIVE', 'Chuyên gia Thể hình Hypertrophy & Huấn luyện Thể lực Chức năng', 0, 50),
('hlv_lananh@sport.com', 'HLV Đặng Lan Anh', '0912345672', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 3, 'ACTIVE', 'Master Yoga Quốc tế 500H, Trị liệu Cột sống & Phục hồi Thân tâm', 0, 50),
('hlv_minhtri@sport.com', 'HLV Vũ Minh Trí', '0912345673', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 3, 'ACTIVE', 'Kiện tướng Bơi lội Quốc gia, Huấn luyện Kỹ thuật Bơi Sải & Sinh tồn', 0, 50),
('hlv_thuha@sport.com', 'HLV Hoàng Thu Hà', '0912345674', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 3, 'ACTIVE', 'HLV Trưởng Zumba Dance Latin & Cardio Spinning RPM', 0, 50),
('hlv_hoanganh@sport.com', 'HLV Bùi Hoàng Anh', '0912345675', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 3, 'ACTIVE', 'HLV Đa năng Thể hình & Cardio Đốt mỡ Cường độ cao', 0, 50)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), status = 'ACTIVE';

-- 2. ASSIGN SUBJECTS TO NEW COACHES
INSERT IGNORE INTO USER_SUBJECTS (user_id, subject_id)
SELECT u.user_id, s.subject_id
FROM USERS u
CROSS JOIN (SELECT 1 AS subject_id UNION SELECT 5) s
WHERE u.email = 'hlv_quang@sport.com';

INSERT IGNORE INTO USER_SUBJECTS (user_id, subject_id)
SELECT u.user_id, s.subject_id
FROM USERS u
CROSS JOIN (SELECT 2 AS subject_id UNION SELECT 253) s
WHERE u.email = 'hlv_lananh@sport.com';

INSERT IGNORE INTO USER_SUBJECTS (user_id, subject_id)
SELECT u.user_id, s.subject_id
FROM USERS u
CROSS JOIN (SELECT 4 AS subject_id UNION SELECT 1) s
WHERE u.email = 'hlv_minhtri@sport.com';

INSERT IGNORE INTO USER_SUBJECTS (user_id, subject_id)
SELECT u.user_id, s.subject_id
FROM USERS u
CROSS JOIN (SELECT 3 AS subject_id UNION SELECT 5) s
WHERE u.email = 'hlv_thuha@sport.com';

INSERT IGNORE INTO USER_SUBJECTS (user_id, subject_id)
SELECT u.user_id, s.subject_id
FROM USERS u
CROSS JOIN (SELECT 1 AS subject_id UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) s
WHERE u.email = 'hlv_hoanganh@sport.com';

-- 3. INSERT CLASSES FOR NEW COACHES
INSERT INTO CLASSES (class_name, subject_id, coach_id, room_id, max_slots, price, status)
SELECT 'Gym Siết Cơ Cắt Nét Pro', 1, u.user_id, 1, 15, 200000.00, 'ACTIVE'
FROM USERS u WHERE u.email = 'hlv_quang@sport.com'
AND NOT EXISTS (SELECT 1 FROM CLASSES WHERE class_name = 'Gym Siết Cơ Cắt Nét Pro');

INSERT INTO CLASSES (class_name, subject_id, coach_id, room_id, max_slots, price, status)
SELECT 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy', 2, u.user_id, 2, 15, 250000.00, 'ACTIVE'
FROM USERS u WHERE u.email = 'hlv_lananh@sport.com'
AND NOT EXISTS (SELECT 1 FROM CLASSES WHERE class_name = 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy');

INSERT INTO CLASSES (class_name, subject_id, coach_id, room_id, max_slots, price, status)
SELECT 'Bơi Sải Tốc Độ & Sức Bền Kỹ Thuật', 4, u.user_id, 4, 12, 300000.00, 'ACTIVE'
FROM USERS u WHERE u.email = 'hlv_minhtri@sport.com'
AND NOT EXISTS (SELECT 1 FROM CLASSES WHERE class_name = 'Bơi Sải Tốc Độ & Sức Bền Kỹ Thuật');

INSERT INTO CLASSES (class_name, subject_id, coach_id, room_id, max_slots, price, status)
SELECT 'Zumba Dance Latin Nóng Bỏng', 3, u.user_id, 3, 20, 180000.00, 'ACTIVE'
FROM USERS u WHERE u.email = 'hlv_thuha@sport.com'
AND NOT EXISTS (SELECT 1 FROM CLASSES WHERE class_name = 'Zumba Dance Latin Nóng Bỏng');

-- 4. INSERT 15 NEW MEMBERS (role_id = 4)
INSERT INTO USERS (email, full_name, phone, password_hash, role_id, status, bio, force_password_change, loyalty_points)
VALUES
('member_kien@gmail.com', 'Phạm Trung Kiên', '0987111001', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Hội viên Gym & Bơi lội', 0, 100),
('member_huong@gmail.com', 'Ngô Thu Hương', '0987111002', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Yêu thích Yoga & Thư giãn', 0, 120),
('member_dung@gmail.com', 'Đỗ Tiến Dũng', '0987111003', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Đam mê Thể hình & Tăng cơ', 0, 80),
('member_linh@gmail.com', 'Bùi Phương Linh', '0987111004', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Học viên lớp Zumba năng động', 0, 150),
('member_nam@gmail.com', 'Hoàng Nhật Nam', '0987111005', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Đạp xe Spinning & Bơi lội', 0, 90),
('member_thanh@gmail.com', 'Lê Minh Thành', '0987111006', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Hội viên VIP Bạch Kim', 0, 200),
('member_van@gmail.com', 'Vũ Thúy Vân', '0987111007', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Yoga Cân bằng Thân tâm', 0, 110),
('member_hai@gmail.com', 'Trịnh Quốc Hải', '0987111008', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Học viên Thể hình Tăng cơ', 0, 75),
('member_trang@gmail.com', 'Nguyễn Thu Trang', '0987111009', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Zumba Dance Vũ Điệu Đốt Mỡ', 0, 130),
('member_hoang@gmail.com', 'Đặng Huy Hoàng', '0987111010', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Bơi lội & Thể lực', 0, 95),
('member_mai@gmail.com', 'Lý Tuyết Mai', '0987111011', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Yoga & Trị liệu Cột sống', 0, 140),
('member_quan@gmail.com', 'Trần Anh Quân', '0987111012', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Spinning RPM & Thể lực', 0, 85),
('member_nga@gmail.com', 'Dương Thúy Nga', '0987111013', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Zumba Party & Dance', 0, 105),
('member_tuan@gmail.com', 'Phan Minh Tuấn', '0987111014', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Gym Cardio Siết Cân', 0, 90),
('member_uyen@gmail.com', 'Hà Phương Uyên', '0987111015', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 4, 'ACTIVE', 'Yoga Năng lượng Buổi sáng', 0, 115)
ON DUPLICATE KEY UPDATE status = 'ACTIVE';

-- 5. INSERT ACTIVE PACKAGES FOR MEMBERS
INSERT INTO USER_MEMBERSHIPS (user_id, package_id, start_date, end_date, remaining_sessions, status, package_name_snapshot, package_type_snapshot, price_snapshot, purchase_completed_at, purchase_source)
SELECT u.user_id, 3, '2026-10-01', '2027-10-01', 120, 'ACTIVE', 'Thẻ Gym 1 Năm', 'GYM_ACCESS', 4500000.00, NOW(), 'WEB_CHECKOUT'
FROM USERS u
WHERE u.role_id = 4
AND NOT EXISTS (
    SELECT 1 FROM USER_MEMBERSHIPS um WHERE um.user_id = u.user_id AND um.status = 'ACTIVE'
);

-- 6. INSERT SCHEDULES (GIỜ DẠY MỚI) TỪ 02/11/2026 ĐẾN 08/11/2026
-- Xóa các schedule trùng lặp vừa tạo nếu có trước khi insert mới
-- Thứ 2 (2026-11-02)
INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-02 08:45:00', '2026-11-02 10:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-02 08:45:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-02 10:30:00', '2026-11-02 12:00:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Gym Siết Cơ Cắt Nét Pro'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-02 10:30:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-02 14:00:00', '2026-11-02 15:30:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Bơi Sải Tốc Độ & Sức Bền Kỹ Thuật'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-02 14:00:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-02 15:45:00', '2026-11-02 17:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Zumba Dance Latin Nóng Bỏng'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-02 15:45:00');

-- Thứ 3 (2026-11-03)
INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-03 08:45:00', '2026-11-03 10:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Gym Siết Cơ Cắt Nét Pro'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-03 08:45:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-03 10:30:00', '2026-11-03 12:00:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-03 10:30:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-03 14:00:00', '2026-11-03 15:30:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Zumba Dance Latin Nóng Bỏng'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-03 14:00:00');

-- Thứ 4 (2026-11-04)
INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-04 08:45:00', '2026-11-04 10:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-04 08:45:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-04 10:30:00', '2026-11-04 12:00:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Gym Siết Cơ Cắt Nét Pro'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-04 10:30:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-04 14:00:00', '2026-11-04 15:30:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Bơi Sải Tốc Độ & Sức Bền Kỹ Thuật'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-04 14:00:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-04 15:45:00', '2026-11-04 17:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Zumba Dance Latin Nóng Bỏng'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-04 15:45:00');

-- Thứ 5 (2026-11-05)
INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-05 08:45:00', '2026-11-05 10:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Gym Siết Cơ Cắt Nét Pro'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-05 08:45:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-05 10:30:00', '2026-11-05 12:00:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-05 10:30:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-05 14:00:00', '2026-11-05 15:30:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Zumba Dance Latin Nóng Bỏng'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-05 14:00:00');

-- Thứ 6 (2026-11-06)
INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-06 08:45:00', '2026-11-06 10:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-06 08:45:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-06 10:30:00', '2026-11-06 12:00:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Gym Siết Cơ Cắt Nét Pro'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-06 10:30:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-06 14:00:00', '2026-11-06 15:30:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Bơi Sải Tốc Độ & Sức Bền Kỹ Thuật'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-06 14:00:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-06 15:45:00', '2026-11-06 17:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Zumba Dance Latin Nóng Bỏng'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-06 15:45:00');

-- Thứ 7 & Chủ Nhật (2026-11-07 & 2026-11-08)
INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-07 14:00:00', '2026-11-07 15:30:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Zumba Dance Latin Nóng Bỏng'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-07 14:00:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-08 08:45:00', '2026-11-08 10:15:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Yoga Trị Liệu Cột Sống & Cổ Vai Gáy'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-08 08:45:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-08 10:30:00', '2026-11-08 12:00:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Gym Siết Cơ Cắt Nét Pro'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-08 10:30:00');

INSERT INTO SCHEDULES (class_id, start_time, end_time, status)
SELECT c.class_id, '2026-11-08 14:00:00', '2026-11-08 15:30:00', 'SCHEDULED'
FROM CLASSES c WHERE c.class_name = 'Bơi Sải Tốc Độ & Sức Bền Kỹ Thuật'
AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id = c.class_id AND s.start_time = '2026-11-08 14:00:00');

-- 7. TỰ ĐỘNG ADD HỌC VIÊN VÀO TỪNG LỚP (ENROLL MEMBERS INTO SCHEDULES)
-- Gán 5 đến 7 học viên vào các ca học (luôn đảm bảo không vượt quá max_slots của lớp)
INSERT IGNORE INTO BOOKINGS (user_id, schedule_id, status, attendance_status, booking_time)
SELECT sub.user_id, sub.schedule_id, 'CONFIRMED', 'NOT_YET', NOW()
FROM (
    SELECT u.user_id, s.schedule_id,
           ROW_NUMBER() OVER (PARTITION BY s.schedule_id ORDER BY u.user_id) as rn,
           c.max_slots
    FROM SCHEDULES s
    JOIN CLASSES c ON s.class_id = c.class_id
    CROSS JOIN USERS u
    WHERE u.role_id = 4 AND u.status = 'ACTIVE'
      AND s.start_time >= '2026-11-01 00:00:00' AND s.start_time <= '2026-11-08 23:59:59'
      AND MOD(u.user_id + s.schedule_id, 3) != 0
) sub
WHERE sub.rn <= LEAST(7, GREATEST(1, sub.max_slots - 3));

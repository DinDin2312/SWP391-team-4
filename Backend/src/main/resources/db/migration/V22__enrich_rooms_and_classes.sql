-- V22__enrich_rooms_and_classes.sql
-- Enrich rooms, room codes, room types, subjects, coach assignments, classes and schedules

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Chuẩn hóa tên và mã phòng cho các phòng hiện hữu (ID 1 - 5)
UPDATE ROOMS SET room_name = '[P101] Phòng Gym & Thể Hình Đa Năng', capacity = 50 WHERE room_id = 1;
UPDATE ROOMS SET room_name = '[P201] Studio Yoga & Giãn Cơ Mặt Trời', capacity = 30 WHERE room_id = 2;
UPDATE ROOMS SET room_name = '[P301] Studio Zumba & Vũ Đạo Latin', capacity = 40 WHERE room_id = 3;
UPDATE ROOMS SET room_name = '[P102] Bể Bơi Bốn Mùa Tiêu Chuẩn Olympic', capacity = 100 WHERE room_id = 4;
UPDATE ROOMS SET room_name = '[P202] Studio Đạp Xe RPM & Spinning', capacity = 20 WHERE room_id = 5;

-- 2. Bổ sung các phòng học mới đa dạng các loại phòng (ID 6 - 12)
INSERT INTO ROOMS (room_id, room_name, capacity) VALUES
  (6, '[P103] Phòng Gym Free-Weight & Cử Tạ Powerlifting', 35),
  (7, '[P104] Bể Bơi Thủy Trị Liệu & Bơi Trẻ Em', 40),
  (8, '[P203] Studio Yoga Thiền Định & Trị Liệu Cột Sống', 25),
  (9, '[P204] Studio Đạp Xe Tương Tác Ảo (Virtual RPM)', 25),
  (10, '[P302] Studio Dance Fitness & Aerobic Hiện Đại', 35),
  (11, '[P303] Võ Đài Boxing & Kickfit Functional Arena', 20),
  (12, '[P205] Studio Pilates Reformer & Core VIP', 15)
ON DUPLICATE KEY UPDATE 
  room_name = VALUES(room_name), 
  capacity = VALUES(capacity);

-- 3. Bổ sung các bộ môn mới (ID 6, 7)
INSERT INTO SUBJECTS (subject_id, subject_name, description) VALUES
  (6, 'Boxing & Kickfit', 'Võ thuật đối kháng kết hợp rèn luyện sức bền, phản xạ và tự vệ thực chiến'),
  (7, 'Pilates Reformer', 'Tập luyện kiểm soát cơ lõi toàn thân và phục hồi vóc dáng trên thiết bị máy chuyên dụng')
ON DUPLICATE KEY UPDATE 
  subject_name = VALUES(subject_name), 
  description = VALUES(description);

-- 4. Bổ sung kỹ năng chuyên môn cho các HLV (USER_SUBJECTS)
INSERT IGNORE INTO USER_SUBJECTS (user_id, subject_id) VALUES
  (3, 1), -- HLV Tuấn: Gym
  (3, 5), -- HLV Tuấn: Đạp xe Spinning
  (3, 6), -- HLV Tuấn: Boxing & Kickfit
  (4, 2), -- HLV Mai Anh: Yoga
  (4, 7), -- HLV Mai Anh: Pilates Reformer
  (5, 3), -- HLV Minh Hoàng: Zumba
  (5, 4), -- HLV Minh Hoàng: Bơi lội
  (5, 6); -- HLV Minh Hoàng: Boxing & Kickfit

-- 5. Chuẩn hóa tên lớp cũ (ID 1 - 10) kèm mã lớp nhận diện
UPDATE CLASSES SET class_name = '[YOGA-101] Yoga Giãn Cơ & Phục Hồi Khớp' WHERE class_id = 1;
UPDATE CLASSES SET class_name = '[YOGA-102] Yoga Giảm Cân & Thon Gọn Vóc Dáng' WHERE class_id = 2;
UPDATE CLASSES SET class_name = '[GYM-101] Gym Căn Bản & Tăng Cơ Cho Nam' WHERE class_id = 3;
UPDATE CLASSES SET class_name = '[GYM-102] Siết Cơ Cấp Tốc (Cut & Shred)' WHERE class_id = 4;
UPDATE CLASSES SET class_name = '[ZUMBA-101] Zumba Đốt Mỡ Buổi Tối Nhạc Latin' WHERE class_id = 5;
UPDATE CLASSES SET class_name = '[SWIM-101] Lớp Học Bơi Sải Tiêu Chuẩn' WHERE class_id = 6;
UPDATE CLASSES SET class_name = '[YOGA-103] Yoga Trị Liệu Cột Sống & Cổ Vai Gáy' WHERE class_id = 7;
UPDATE CLASSES SET class_name = '[ZUMBA-102] Zumba Dance Chuyên Nghiệp & Khỏe Đẹp' WHERE class_id = 8;
UPDATE CLASSES SET class_name = '[GYM-103] Lớp Luyện Cử Tạ Powerlifting' WHERE class_id = 9;
UPDATE CLASSES SET class_name = '[SWIM-102] Bơi Lội Trẻ Em Cơ Bản & Sinh Tồn' WHERE class_id = 10;

-- 6. Bổ sung các lớp học mới phong phú (ID 11 - 25)
INSERT INTO CLASSES (class_id, subject_id, coach_id, room_id, class_name, price, max_slots, status) VALUES
  (11, 5, 3, 5, '[SPIN-201] Đạp Xe Tốc Độ RPM Bứt Phá Calo', 650000, 20, 'ACTIVE'),
  (12, 5, 3, 9, '[SPIN-202] Đạp Xe Tour Ảo Khám Phá Địa Hình', 700000, 20, 'ACTIVE'),
  (13, 1, 3, 6, '[GYM-201] Thể Hình Free-Weight & Sức Mạnh Nặng', 950000, 15, 'ACTIVE'),
  (14, 4, 5, 7, '[SWIM-201] Bơi Thủy Liệu & Phục Hồi Thể Lực', 1100000, 12, 'ACTIVE'),
  (15, 2, 4, 8, '[YOGA-201] Yoga Thiền Định & Cân Bằng Năng Lượng', 750000, 18, 'ACTIVE'),
  (16, 3, 5, 10, '[DANCE-201] Aerobic Dance Bước Nhảy Năng Động', 550000, 25, 'ACTIVE'),
  (17, 6, 5, 11, '[BOX-201] Kickfit Đối Kháng & Tự Vệ Thực Chiến', 1200000, 12, 'ACTIVE'),
  (18, 6, 3, 11, '[BOX-202] Boxing Cardio Xả Stress & Đốt Calo', 900000, 15, 'ACTIVE'),
  (19, 7, 4, 12, '[PILATES-201] Pilates Reformer Giữ Dáng Toàn Thân', 1350000, 10, 'ACTIVE'),
  (20, 7, 4, 12, '[PILATES-202] Pilates Chỉnh Dáng & Cân Trục Cột Sống', 1500000, 8, 'ACTIVE'),
  (21, 1, 3, 6, '[GYM-202] Siết Cơ Thần Tốc & Xả Calo HIIT', 850000, 15, 'ACTIVE'),
  (22, 2, 4, 8, '[YOGA-202] Yoga Vinyasa Chào Ngày Mới Năng Lượng', 650000, 20, 'ACTIVE'),
  (23, 3, 5, 10, '[ZUMBA-201] Zumba Vũ Điệu Samba Cuồng Nhiệt', 600000, 25, 'ACTIVE'),
  (24, 4, 5, 4, '[SWIM-202] Bơi Bướm Nâng Cao Vượt Giới Hạn', 1400000, 10, 'ACTIVE'),
  (25, 5, 3, 5, '[SPIN-203] Đạp Xe Leo Dốc Đốt Mỡ Đêm', 680000, 18, 'ACTIVE')
ON DUPLICATE KEY UPDATE 
  class_name = VALUES(class_name),
  subject_id = VALUES(subject_id),
  coach_id = VALUES(coach_id),
  room_id = VALUES(room_id),
  price = VALUES(price),
  max_slots = VALUES(max_slots),
  status = VALUES(status);

-- 7. Bổ sung lịch học mẫu phong phú cho các lớp mới (SCHEDULES)
INSERT INTO SCHEDULES (class_id, start_time, end_time, status) VALUES
  (11, '2026-11-02 07:00:00', '2026-11-02 08:30:00', 'SCHEDULED'),
  (11, '2026-11-04 07:00:00', '2026-11-04 08:30:00', 'SCHEDULED'),
  (11, '2026-11-06 07:00:00', '2026-11-06 08:30:00', 'SCHEDULED'),
  (12, '2026-11-03 18:00:00', '2026-11-03 19:30:00', 'SCHEDULED'),
  (12, '2026-11-05 18:00:00', '2026-11-05 19:30:00', 'SCHEDULED'),
  (13, '2026-11-02 17:30:00', '2026-11-02 19:00:00', 'SCHEDULED'),
  (13, '2026-11-04 17:30:00', '2026-11-04 19:00:00', 'SCHEDULED'),
  (14, '2026-11-03 08:00:00', '2026-11-03 09:30:00', 'SCHEDULED'),
  (14, '2026-11-05 08:00:00', '2026-11-05 09:30:00', 'SCHEDULED'),
  (15, '2026-11-02 06:00:00', '2026-11-02 07:30:00', 'SCHEDULED'),
  (15, '2026-11-04 06:00:00', '2026-11-04 07:30:00', 'SCHEDULED'),
  (16, '2026-11-02 19:30:00', '2026-11-02 21:00:00', 'SCHEDULED'),
  (16, '2026-11-04 19:30:00', '2026-11-04 21:00:00', 'SCHEDULED'),
  (17, '2026-11-03 17:00:00', '2026-11-03 18:30:00', 'SCHEDULED'),
  (17, '2026-11-05 17:00:00', '2026-11-05 18:30:00', 'SCHEDULED'),
  (18, '2026-11-02 20:00:00', '2026-11-02 21:30:00', 'SCHEDULED'),
  (18, '2026-11-04 20:00:00', '2026-11-04 21:30:00', 'SCHEDULED'),
  (19, '2026-11-03 09:00:00', '2026-11-03 10:30:00', 'SCHEDULED'),
  (19, '2026-11-05 09:00:00', '2026-11-05 10:30:00', 'SCHEDULED'),
  (20, '2026-11-06 15:00:00', '2026-11-06 16:30:00', 'SCHEDULED'),
  (21, '2026-11-03 06:30:00', '2026-11-03 08:00:00', 'SCHEDULED'),
  (22, '2026-11-05 06:00:00', '2026-11-05 07:30:00', 'SCHEDULED'),
  (23, '2026-11-06 18:30:00', '2026-11-06 20:00:00', 'SCHEDULED'),
  (24, '2026-11-07 08:00:00', '2026-11-07 09:30:00', 'SCHEDULED'),
  (25, '2026-11-07 19:00:00', '2026-11-07 20:30:00', 'SCHEDULED');

SET FOREIGN_KEY_CHECKS = 1;

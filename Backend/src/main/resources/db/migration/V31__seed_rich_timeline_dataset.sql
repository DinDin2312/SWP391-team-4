-- ==============================================================================
-- V31: RICH TIMELINE TEST DATASET (PAST - PRESENT - FUTURE) & CONFLICT CLEANUP
-- Covers all 4 roles: Center Manager, Receptionist, Coach, Member
-- Safe for both production servers and empty disposable CI migration test schemas.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 0. Only insert extra test users/coaches when running on an initialized SportCenter DB (where admin@sport.com exists),
-- so empty-schema unit tests in DatabaseMigrationTests keep their exact expected USERS count.
INSERT IGNORE INTO USERS (user_id, role_id, full_name, email, phone, password_hash, status, force_password_change, loyalty_points)
SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone, u.password_hash, u.status, u.force_password_change, u.loyalty_points
FROM (
    SELECT 6 AS user_id, 4 AS role_id, 'Trần Bùi Thái' AS full_name, 'thai@gmail.com' AS email, '0901000006' AS phone, '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW' AS password_hash, 'ACTIVE' AS status, 0 AS force_password_change, 120 AS loyalty_points
    UNION ALL SELECT 10, 4, 'Đinh Thị Thu', 'thu@gmail.com', '0901000010', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 150
    UNION ALL SELECT 19, 4, 'Mai Tiến Dũng', 'dung@gmail.com', '0901000019', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 110
    UNION ALL SELECT 9906, 4, 'Sinh Xuân', 'bich31699@gmail.com', '0909999906', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 200
    UNION ALL SELECT 13275, 3, 'HLV Lê Hồng Quang', 'hlv_quang@sport.com', '0912345671', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 50
    UNION ALL SELECT 13276, 3, 'HLV Đặng Lan Anh', 'hlv_lananh@sport.com', '0912345672', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 50
    UNION ALL SELECT 13277, 3, 'HLV Vũ Minh Trí', 'hlv_minhtri@sport.com', '0912345673', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 50
    UNION ALL SELECT 13278, 3, 'HLV Hoàng Thu Hà', 'hlv_thuha@sport.com', '0912345674', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 50
    UNION ALL SELECT 13279, 3, 'HLV Bùi Hoàng Anh', 'hlv_hoanganh@sport.com', '0912345675', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE', 0, 50
) AS u
WHERE EXISTS (SELECT 1 FROM (SELECT user_id FROM USERS WHERE email = 'admin@sport.com') AS prod_check);

-- 1. Member Health Profiles & InBody Assessments
INSERT INTO MEMBER_HEALTH_PROFILES (user_id, parq_answers, conditions, notes, consent_at, updated_at)
VALUES 
(10, '0000000', 'Viêm gân cổ chân nhẹ', 'Tránh bài tập bật nhảy liên tục cường độ cao', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 2 DAY),
(9906, '0000000', 'Tiền sử trật khớp vai trái', 'Cần HLV theo dõi và hỗ trợ khi đẩy tạ nặng qua đầu', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 1 DAY),
(19, '0000000', 'Không có bệnh lý', 'Thể trạng tốt, sức bền và nhịp tim ổn định', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 3 DAY),
(6, '0000000', 'Thoát vị đĩa đệm L4-L5 nhẹ', 'Ưu tiên bơi lội, yoga giãn cơ; tránh gánh tạ đè nén cột sống', NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 5 DAY)
ON DUPLICATE KEY UPDATE 
    conditions = VALUES(conditions), 
    notes = VALUES(notes), 
    updated_at = VALUES(updated_at);

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 4, 10, 'Đánh giá Thể trạng Tháng 11 - Yoga', 52.5, 162.0, 22.5, 23.8, 5, 5, 'Tập luyện chăm chỉ, tư thế chuẩn, khớp gối cải thiện rõ rệt.', 'Tiếp tục duy trì tuần 3 buổi, tăng thời gian thở sâu.', NOW() - INTERVAL 3 DAY
WHERE NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 10 AND assessment_title = 'Đánh giá Thể trạng Tháng 11 - Yoga');

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 3, 9906, 'Kiểm tra InBody Định kỳ - Gym', 68.2, 175.0, 16.8, 33.5, 4, 5, 'Cơ ngực và xô phát triển tốt, form Squat chuẩn.', 'Nên tăng thêm 15g protein mỗi ngày và khởi động vai kỹ hơn.', NOW() - INTERVAL 5 DAY
WHERE NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 9906 AND assessment_title = 'Kiểm tra InBody Định kỳ - Gym');

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 3, 19, 'Đánh giá Tăng cơ Giảm mỡ - Thể hình', 74.0, 178.0, 18.2, 35.1, 5, 4, 'Thể lực bùng nổ, hoàn thành 100% giáo án tạ nặng.', 'Chuẩn bị bước vào chu kỳ siết cơ (cutting).', NOW() - INTERVAL 7 DAY
WHERE NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 19 AND assessment_title = 'Đánh giá Tăng cơ Giảm mỡ - Thể hình');

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 4, 6, 'Kiểm tra Khớp & Cột sống - Yoga Phục hồi', 71.0, 172.0, 21.0, 31.0, 4, 5, 'Cơ lưng bớt co cứng, độ linh hoạt hông cải thiện.', 'Tránh các động tác uốn lưng quá sâu.', NOW() - INTERVAL 4 DAY
WHERE NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 6 AND assessment_title = 'Kiểm tra Khớp & Cột sống - Yoga Phục hồi');

-- 2. Front Desk Check-In Logs across Nov 9 - Nov 12 (Giữ Đinh Thị Thu #10 chưa check-in để test Present Direct)
INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at)
VALUES
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '9906', 'Check-in thành công tại quầy Lễ tân - Sinh Xuân (#9906)', '{"userId":9906,"memberName":"Sinh Xuân","memberEmail":"bich31699@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-10 06:45:10'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '19', 'Check-in thành công tại quầy Lễ tân - Mai Tiến Dũng (#19)', '{"userId":19,"memberName":"Mai Tiến Dũng","memberEmail":"dung@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-10 06:50:22'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '6', 'Check-in thành công tại quầy Lễ tân - Trần Bùi Thái (#6)', '{"userId":6,"memberName":"Trần Bùi Thái","memberEmail":"thai@gmail.com","checkInType":"FRONT_DESK_CARD","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-10 06:55:04'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '9906', 'Check-in thành công tại quầy Lễ tân - Sinh Xuân (#9906)', '{"userId":9906,"memberName":"Sinh Xuân","memberEmail":"bich31699@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-11 06:45:10'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '19', 'Check-in thành công tại quầy Lễ tân - Mai Tiến Dũng (#19)', '{"userId":19,"memberName":"Mai Tiến Dũng","memberEmail":"dung@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-11 06:50:22'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '6', 'Check-in thành công tại quầy Lễ tân - Trần Bùi Thái (#6)', '{"userId":6,"memberName":"Trần Bùi Thái","memberEmail":"thai@gmail.com","checkInType":"FRONT_DESK_CARD","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-11 06:55:04'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '9906', 'Check-in thành công tại quầy Lễ tân - Sinh Xuân (#9906)', '{"userId":9906,"memberName":"Sinh Xuân","memberEmail":"bich31699@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-12 06:45:10'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '19', 'Check-in thành công tại quầy Lễ tân - Mai Tiến Dũng (#19)', '{"userId":19,"memberName":"Mai Tiến Dũng","memberEmail":"dung@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-12 06:50:22'),
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '6', 'Check-in thành công tại quầy Lễ tân - Trần Bùi Thái (#6)', '{"userId":6,"memberName":"Trần Bùi Thái","memberEmail":"thai@gmail.com","checkInType":"FRONT_DESK_CARD","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-12 06:55:04');

-- 3. Future non-conflicting schedules for Reschedule Requests
INSERT IGNORE INTO SCHEDULES (schedule_id, class_id, start_time, end_time, status, changeover_minutes)
VALUES
(14008, 1, '2026-11-13 07:00:00', '2026-11-13 08:30:00', 'SCHEDULED', 15),
(14011, 3, '2026-11-15 17:30:00', '2026-11-15 19:00:00', 'SCHEDULED', 15);

-- 4. Clean up any room or coach overlapping schedules that have 0 bookings
DELETE FROM SCHEDULES WHERE class_id IN (25, 122, 126, 134) AND NOT EXISTS (SELECT 1 FROM BOOKINGS b WHERE b.schedule_id = SCHEDULES.schedule_id);

DELETE FROM SCHEDULES
WHERE schedule_id IN (
  SELECT id_to_del FROM (
    SELECT DISTINCT s2.schedule_id AS id_to_del
    FROM SCHEDULES s1
    JOIN CLASSES c1 ON c1.class_id = s1.class_id
    JOIN SCHEDULES s2 ON s1.schedule_id < s2.schedule_id
    JOIN CLASSES c2 ON c2.class_id = s2.class_id
    WHERE (c1.room_id = c2.room_id OR COALESCE(s1.substitute_coach_id, c1.coach_id) = COALESCE(s2.substitute_coach_id, c2.coach_id))
      AND s1.start_time < s2.end_time
      AND s1.end_time > s2.start_time
      AND s1.status IN ('SCHEDULED', 'SUBSTITUTE_ASSIGNED')
      AND s2.status IN ('SCHEDULED', 'SUBSTITUTE_ASSIGNED')
      AND NOT EXISTS (SELECT 1 FROM BOOKINGS b WHERE b.schedule_id = s2.schedule_id)
      AND NOT EXISTS (SELECT 1 FROM SCHEDULE_RESCHEDULE_REQUESTS r WHERE r.schedule_id = s2.schedule_id)
      AND NOT EXISTS (SELECT 1 FROM INVOICE_DETAILS id WHERE id.schedule_id = s2.schedule_id)
  ) AS tmp
);

UPDATE CLASSES SET coach_id = 13276 WHERE class_id IN (15, 131);
UPDATE CLASSES SET coach_id = 13278 WHERE class_id IN (16, 133);
UPDATE CLASSES SET coach_id = 13277 WHERE class_id IN (138);
UPDATE CLASSES SET coach_id = 13275 WHERE class_id IN (144);

-- 5. Realistic Past Attendance (~80% PRESENT, ~20% ABSENT) & Current/Future Bookings
UPDATE BOOKINGS b
JOIN SCHEDULES s ON s.schedule_id = b.schedule_id
SET b.attendance_status = CASE WHEN MOD(b.booking_id, 5) = 0 THEN 'ABSENT' ELSE 'PRESENT' END
WHERE b.status = 'CONFIRMED' AND s.end_time < '2026-11-10 00:00:00';

INSERT INTO BOOKINGS (user_id, schedule_id, status, attendance_status, booking_time)
SELECT u.user_id, s.schedule_id, 'CONFIRMED', 'NOT_YET', '2026-11-01 09:00:00'
FROM USERS u
JOIN SCHEDULES s ON s.schedule_id IN (10508, 10520, 10521, 10532, 10533, 10544, 10545, 10556, 10557, 10568, 10569, 10612, 10613, 14008, 14011)
WHERE u.user_id IN (6, 7, 8, 9, 10, 11, 12, 19, 9906)
  AND NOT EXISTS (
    SELECT 1 FROM BOOKINGS b2 WHERE b2.user_id = u.user_id AND b2.schedule_id = s.schedule_id
  );

-- 6. Reschedule Requests (PENDING & APPROVED)
INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS 
(schedule_id, class_id, coach_id, action_type, original_start_time, original_end_time, 
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details, 
 status, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 14008, 1, 4, 'MAKEUP_SESSION', '2026-11-13 07:00:00', '2026-11-13 08:30:00',
 '2026-11-14 14:00:00', '2026-11-14 15:30:00', 2, 'NO_SUBSTITUTE_SICK', 
 'HLV bị sốt xuất huyết đột xuất, đã liên hệ HLV Tuấn và Hoàng nhưng đều bận kín ca. Kính đề nghị dời sang chiều Thứ Bảy 14/11 phòng Yoga trống.',
 'PENDING', '2026-11-13 18:00:00', 2, '2026-11-09 08:30:00', '2026-11-09 08:30:00'
WHERE EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 14008)
  AND NOT EXISTS (SELECT 1 FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE schedule_id = 14008 AND status = 'PENDING');

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS 
(schedule_id, class_id, coach_id, action_type, original_start_time, original_end_time, 
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details, 
 status, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 14011, 3, 3, 'MAKEUP_SESSION', '2026-11-15 17:30:00', '2026-11-15 19:00:00',
 '2026-11-16 15:00:00', '2026-11-16 16:30:00', 1, 'NO_SUBSTITUTE_EMERGENCY', 
 'HLV gia đình có việc khẩn tại quê, xin dời ca Gym sang chiều Thứ Hai phòng Gym trống.',
 'PENDING', '2026-11-15 12:00:00', 2, '2026-11-09 09:15:00', '2026-11-09 09:15:00'
WHERE EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 14011)
  AND NOT EXISTS (SELECT 1 FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE schedule_id = 14011 AND status = 'PENDING');

-- 7. Support Requests & User Credits
INSERT INTO SUPPORT_REQUESTS (user_id, class_id, category, preferred_resolution, title, content, status, priority, created_at, updated_at)
SELECT 19, 3, 'CLASS_CANCELLATION', 'REFUND_CASH_OR_BANK', 
 'Hủy lớp học Gym Siết Cơ & Xin hoàn tiền do chuyển công tác',
 'Em nhận quyết định điều động công tác vào TP.HCM từ tuần tới nên không thể theo học tiếp 10 buổi còn lại. Kính nhờ trung tâm hỗ trợ hoàn phí học kỳ.',
 'PENDING', 'HIGH', '2026-11-09 08:15:20', '2026-11-09 08:15:20'
WHERE NOT EXISTS (SELECT 1 FROM SUPPORT_REQUESTS WHERE title = 'Hủy lớp học Gym Siết Cơ & Xin hoàn tiền do chuyển công tác');

INSERT INTO SUPPORT_REQUESTS (user_id, class_id, category, preferred_resolution, title, content, status, priority, created_at, updated_at)
SELECT 6, 1, 'FACILITY_ISSUE', 'INVESTIGATE_FEEDBACK', 
 'Điều hòa phòng Yoga P201 bị chảy nước và quá lạnh',
 'Sáng nay em tập ca 7h phòng P201 điều hòa góc trái bị rò nước xuống thảm và thổi gió quá lạnh làm nhiều học viên bị buốt.',
 'PENDING', 'HIGH', '2026-11-09 08:45:00', '2026-11-09 08:45:00'
WHERE NOT EXISTS (SELECT 1 FROM SUPPORT_REQUESTS WHERE title = 'Điều hòa phòng Yoga P201 bị chảy nước và quá lạnh');

INSERT INTO USER_CREDITS (user_id, credit_code, amount, remaining_amount, reason, expiry_date, status, created_at)
VALUES
(9906, 'CR-NX-2026-9906', 300000.00, 300000.00, 'Hoàn phí hủy ca lớp Yoga Giãn Cơ - Giữ 100% quyền lợi', '2026-12-31', 'ACTIVE', '2026-11-05 14:00:00'),
(10, 'CR-NX-2026-10', 450000.00, 450000.00, 'Mã tín dụng ưu đãi gia hạn hội viên thân thiết Tháng 11', '2026-12-31', 'ACTIVE', '2026-11-01 09:00:00'),
(19, 'CR-NX-2026-19', 900000.00, 900000.00, 'Tín dụng hoàn hủy lớp Zumba bảo lưu học phí', '2026-12-31', 'ACTIVE', '2026-11-07 16:30:00')
ON DUPLICATE KEY UPDATE remaining_amount = VALUES(remaining_amount);

-- 8. Lost & Found Items
INSERT IGNORE INTO LOST_AND_FOUND_ITEMS 
(item_code, item_name, category, valuation_type, color, found_location, found_date, storage_location, public_description, status, expiry_date, created_by, created_at)
VALUES
('LF-2026-001', 'Bình nước giữ nhiệt Lock&Lock 800ml', 'ACCESSORIES', 'STANDARD', 'Xanh navy', 'Phòng Gym Tầng 1 - Cạnh máy chạy bộ số 3', NOW() - INTERVAL 4 DAY, 'Tủ thất lạc Quầy Lễ Tân (Ngăn A2)', 'Bình giữ nhiệt kim loại màu xanh, có khắc chữ cái T.', 'STORED', CURDATE() + INTERVAL 30 DAY, 2, NOW() - INTERVAL 4 DAY),
('LF-2026-002', 'Tai nghe không dây AirPods Pro 2', 'ELECTRONICS', 'HIGH_VALUE', 'Trắng', 'Studio Yoga P201 Tầng 2', NOW() - INTERVAL 6 DAY, 'Két an toàn Lễ tân', 'Hộp sạc trắng có bao silicon đen, tìm thấy dưới bục giảng HLV.', 'CLAIMED', CURDATE() + INTERVAL 30 DAY, 2, NOW() - INTERVAL 6 DAY),
('LF-2026-003', 'Áo khoác gió thể thao Adidas', 'CLOTHING', 'STANDARD', 'Đen 3 sọc trắng', 'Khu tủ Locker Nam Tầng 1', NOW() - INTERVAL 2 DAY, 'Tủ thất lạc Quầy Lễ Tân (Ngăn B1)', 'Áo size L, còn rất mới để quên trên nóc tủ locker.', 'STORED', CURDATE() + INTERVAL 30 DAY, 2, NOW() - INTERVAL 2 DAY),
('LF-2026-004', 'Đồng hồ thông minh Apple Watch Series 8', 'ELECTRONICS', 'HIGH_VALUE', 'Midnight', 'Ghế nghỉ cạnh Bể bơi Bốn Mùa', NOW() - INTERVAL 1 DAY, 'Két an toàn Quản lý', 'Đồng hồ dây cao su đen, màn hình có dán cường lực.', 'STORED', CURDATE() + INTERVAL 30 DAY, 2, NOW() - INTERVAL 1 DAY);

SET FOREIGN_KEY_CHECKS = 1;

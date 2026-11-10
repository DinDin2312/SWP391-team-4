-- ==============================================================================
-- V31: RICH TIMELINE TEST DATASET (PAST - PRESENT - FUTURE) & CONFLICT CLEANUP
-- Covers all 4 roles: Center Manager, Receptionist, Coach, Member
-- Safe for both production servers and empty disposable CI migration test schemas.
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Detect whether this schema has the real SportCenter initial dataset (admin@sport.com)
-- so unit-test fixtures in DatabaseMigrationTests (@test.invalid) are never overwritten.
SET @is_prod_db = (SELECT COUNT(*) FROM USERS WHERE email = 'admin@sport.com');

-- 0A. Repair corrupted Vietnamese encoding (Mojibake) from initial database_init.sql import on existing servers
UPDATE USERS SET full_name = 'Quản Lý Trung Tâm', phone = COALESCE(phone, '0901000001') WHERE user_id = 1 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Lễ Tân Thúy Kiều', phone = COALESCE(phone, '0901000002') WHERE user_id = 2 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'HLV Nguyễn Văn Tuấn', phone = COALESCE(phone, '0901000003') WHERE user_id = 3 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'HLV Trần Mai Anh', phone = COALESCE(phone, '0901000004') WHERE user_id = 4 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'HLV Phạm Minh Hoàng', phone = COALESCE(phone, '0901000005') WHERE user_id = 5 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Trần Bùi Thái', phone = COALESCE(phone, '0901000006') WHERE user_id = 6 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Nguyễn Kiều Oanh', phone = COALESCE(phone, '0901000007') WHERE user_id = 7 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Lê Hoàng Long', phone = COALESCE(phone, '0901000008') WHERE user_id = 8 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Vũ Đức Mạnh', phone = COALESCE(phone, '0901000009') WHERE user_id = 9 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Đinh Thị Thu', phone = COALESCE(phone, '0901000010') WHERE user_id = 10 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Phạm Tuấn Ngọc', phone = COALESCE(phone, '0901000011') WHERE user_id = 11 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Bùi Tấn Trường', phone = COALESCE(phone, '0901000012') WHERE user_id = 12 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Hoàng Văn Thụ', phone = COALESCE(phone, '0901000013') WHERE user_id = 13 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Đặng Thái Sơn', phone = COALESCE(phone, '0901000014') WHERE user_id = 14 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Ngô Thanh Vân', phone = COALESCE(phone, '0901000015') WHERE user_id = 15 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Lý Nhã Kỳ', phone = COALESCE(phone, '0901000016') WHERE user_id = 16 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Trương Thế Vinh', phone = COALESCE(phone, '0901000017') WHERE user_id = 17 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Hồ Ngọc Hà', phone = COALESCE(phone, '0901000018') WHERE user_id = 18 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Mai Tiến Dũng', phone = COALESCE(phone, '0901000019') WHERE user_id = 19 AND @is_prod_db > 0;
UPDATE USERS SET full_name = 'Nguyễn Tóc Tiên', phone = COALESCE(phone, '0901000020') WHERE user_id = 20 AND @is_prod_db > 0;

UPDATE ROOMS SET room_name = '[P101] Phòng Gym & Thể Hình Đa Năng' WHERE room_id = 1 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P201] Studio Yoga & Giãn Cơ Mặt Trời' WHERE room_id = 2 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P301] Studio Zumba & Vũ Đạo Latin' WHERE room_id = 3 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P102] Bể Bơi Bốn Mùa Tiêu Chuẩn Olympic' WHERE room_id = 4 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P202] Studio Đạp Xe RPM & Spinning' WHERE room_id = 5 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P103] Phòng Gym Free-Weight & Cử Tạ Powerlifting' WHERE room_id = 6 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P104] Bể Bơi Thủy Trị Liệu & Bơi Trẻ Em' WHERE room_id = 7 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P203] Studio Yoga Thiền Định & Trị Liệu Cột Sống' WHERE room_id = 8 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P204] Studio Đạp Xe Tương Tác Ảo (Virtual RPM)' WHERE room_id = 9 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P302] Studio Dance Fitness & Aerobic Hiện Đại' WHERE room_id = 10 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P303] Võ Đài Boxing & Kickfit Functional Arena' WHERE room_id = 11 AND @is_prod_db > 0;
UPDATE ROOMS SET room_name = '[P205] Studio Pilates Reformer & Core VIP' WHERE room_id = 12 AND @is_prod_db > 0;

UPDATE SUBJECTS SET subject_name = 'Thể Hình (Gym)', description = 'Tập tạ tự do và máy móc hiện đại' WHERE subject_id = 1 AND @is_prod_db > 0;
UPDATE SUBJECTS SET subject_name = 'Yoga Căn Bản', description = 'Yoga thư giãn và giãn cơ buổi sáng' WHERE subject_id = 2 AND @is_prod_db > 0;
UPDATE SUBJECTS SET subject_name = 'Zumba Dance', description = 'Nhảy theo nhạc Latin sôi động giảm mỡ' WHERE subject_id = 3 AND @is_prod_db > 0;
UPDATE SUBJECTS SET subject_name = 'Bơi Lội', description = 'Kỹ thuật bơi ếch, bơi sải chuyên nghiệp' WHERE subject_id = 4 AND @is_prod_db > 0;
UPDATE SUBJECTS SET subject_name = 'Đạp Xe (Spinning)', description = 'Đạp xe cường độ cao trên nền nhạc' WHERE subject_id = 5 AND @is_prod_db > 0;
UPDATE SUBJECTS SET subject_name = 'Boxing & Kickfit', description = 'Võ thuật đối kháng kết hợp rèn luyện sức bền, phản xạ và tự vệ thực chiến' WHERE subject_id = 6 AND @is_prod_db > 0;
UPDATE SUBJECTS SET subject_name = 'Pilates Reformer', description = 'Tập luyện kiểm soát cơ lõi toàn thân và phục hồi vóc dáng trên thiết bị máy chuyên dụng' WHERE subject_id = 7 AND @is_prod_db > 0;

UPDATE PACKAGES SET package_name = 'Thẻ Gym 1 Tháng' WHERE package_id = 1 AND @is_prod_db > 0;
UPDATE PACKAGES SET package_name = 'Thẻ Gym 3 Tháng' WHERE package_id = 2 AND @is_prod_db > 0;
UPDATE PACKAGES SET package_name = 'Thẻ Gym 1 Năm' WHERE package_id = 3 AND @is_prod_db > 0;
UPDATE PACKAGES SET package_name = 'Gói Thuê AI Cá Nhân 1 Tháng' WHERE package_id = 4 AND @is_prod_db > 0;
UPDATE PACKAGES SET package_name = 'Thẻ Tập Thử VIP (1 Ngày)' WHERE package_id = 5 AND @is_prod_db > 0;
UPDATE USER_MEMBERSHIPS m JOIN PACKAGES p ON p.package_id = m.package_id SET m.package_name_snapshot = p.package_name WHERE m.package_id IN (1, 2, 3, 4, 5) AND @is_prod_db > 0;

UPDATE CLASSES SET class_name = '[YOGA-101] Yoga Giãn Cơ & Phục Hồi Khớp' WHERE class_id = 1 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-102] Yoga Giảm Cân & Thon Gọn Vóc Dáng' WHERE class_id = 2 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-101] Gym Căn Bản & Tăng Cơ Cho Nam' WHERE class_id = 3 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-102] Siết Cơ Cấp Tốc (Cut & Shred)' WHERE class_id = 4 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[ZUMBA-101] Zumba Đốt Mỡ Buổi Tối Nhạc Latin' WHERE class_id = 5 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-101] Lớp Học Bơi Sải Tiêu Chuẩn' WHERE class_id = 6 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-103] Yoga Trị Liệu Cột Sống & Cổ Vai Gáy' WHERE class_id = 7 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[ZUMBA-102] Zumba Dance Chuyên Nghiệp & Khỏe Đẹp' WHERE class_id = 8 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-103] Lớp Luyện Cử Tạ Powerlifting' WHERE class_id = 9 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-102] Bơi Lội Trẻ Em Cơ Bản & Sinh Tồn' WHERE class_id = 10 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SPIN-201] Đạp Xe Tốc Độ RPM Bứt Phá Calo' WHERE class_id = 11 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SPIN-202] Đạp Xe Tour Ảo Khám Phá Địa Hình' WHERE class_id = 12 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-201] Thể Hình Free-Weight & Sức Mạnh Nặng' WHERE class_id = 13 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-201] Bơi Thủy Liệu & Phục Hồi Thể Lực' WHERE class_id = 14 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-201] Yoga Thiền Định & Cân Bằng Năng Lượng' WHERE class_id = 15 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[DANCE-201] Aerobic Dance Bước Nhảy Năng Động' WHERE class_id = 16 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[BOX-201] Kickfit Đối Kháng & Tự Vệ Thực Chiến' WHERE class_id = 17 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[BOX-202] Boxing Cardio Xả Stress & Đốt Calo' WHERE class_id = 18 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[PILATES-201] Pilates Reformer Giữ Dáng Toàn Thân' WHERE class_id = 19 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[PILATES-202] Pilates Chỉnh Dáng & Cân Trục Cột Sống' WHERE class_id = 20 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-202] Siết Cơ Thần Tốc & Xả Calo HIIT' WHERE class_id = 21 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-202] Yoga Vinyasa Chào Ngày Mới Năng Lượng' WHERE class_id = 22 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[ZUMBA-201] Zumba Vũ Điệu Samba Cuồng Nhiệt' WHERE class_id = 23 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-202] Bơi Bướm Nâng Cao Vượt Giới Hạn' WHERE class_id = 24 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SPIN-203] Đạp Xe Leo Dốc Đốt Mỡ Đêm' WHERE class_id = 25 AND @is_prod_db > 0;

UPDATE EXERCISES SET exercise_name = 'Hít đất (Push up)', muscle_group = 'Ngực' WHERE exercise_id = 1 AND @is_prod_db > 0;
UPDATE EXERCISES SET exercise_name = 'Gập bụng (Crunch)', muscle_group = 'Bụng' WHERE exercise_id = 2 AND @is_prod_db > 0;
UPDATE EXERCISES SET exercise_name = 'Kéo xà đơn (Pull up)', muscle_group = 'Lưng' WHERE exercise_id = 3 AND @is_prod_db > 0;
UPDATE EXERCISES SET exercise_name = 'Squat (Đứng lên ngồi xuống)', muscle_group = 'Đùi' WHERE exercise_id = 4 AND @is_prod_db > 0;
UPDATE EXERCISES SET exercise_name = 'Đẩy tạ đôi (Dumbbell Press)', muscle_group = 'Ngực' WHERE exercise_id = 5 AND @is_prod_db > 0;
UPDATE EXERCISES SET exercise_name = 'Chạy bộ máy (Treadmill)', muscle_group = 'Cardio' WHERE exercise_id = 6 AND @is_prod_db > 0;

UPDATE AI_WORKOUT_PLANS SET goal = 'Tăng cơ ngực và lưng', fitness_level = 'Trung bình' WHERE plan_id = 1 AND @is_prod_db > 0;
UPDATE AI_WORKOUT_PLANS SET goal = 'Giảm mỡ bụng cấp tốc', fitness_level = 'Mới bắt đầu' WHERE plan_id = 2 AND @is_prod_db > 0;

UPDATE TRAINEE_ASSESSMENTS SET
  assessment_title = 'Đánh giá buổi tập Gym đầu tiên',
  feedback_note = 'Học viên có thể lực nền tảng khá, tư thế squat và deadlift cơ bản đúng kỹ thuật. Cần chú ý hít thở đều.',
  recommendation = 'Tập trung siết cơ bụng khi nâng tạ. Uống thêm nước và bổ sung thêm đạm sau buổi tập.'
WHERE assessment_id = 1 AND @is_prod_db > 0;

UPDATE TRAINEE_ASSESSMENTS SET
  assessment_title = 'Kiểm tra độ dẻo dai và hơi thở Yoga',
  feedback_note = 'Khả năng giữ thăng bằng rất tốt, kiểm soát hơi thở đều đặn trong các tư thế chiến binh và uốn lưng.',
  recommendation = 'Tiếp tục duy trì giãn cơ mỗi sáng 15 phút tại nhà để cải thiện khớp háng.'
WHERE assessment_id = 2 AND @is_prod_db > 0;

-- 0. Only insert extra test users/coaches when running on an initialized SportCenter DB (where admin@sport.com exists)
INSERT INTO USERS (user_id, role_id, full_name, email, phone, password_hash, status, force_password_change, loyalty_points)
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
WHERE @is_prod_db > 0
ON DUPLICATE KEY UPDATE
    full_name = u.full_name,
    phone = COALESCE(USERS.phone, u.phone);

-- 1. Member Health Profiles & InBody Assessments
INSERT INTO MEMBER_HEALTH_PROFILES (user_id, parq_answers, conditions, notes, consent_at, updated_at)
SELECT hp.user_id, hp.parq_answers, hp.conditions, hp.notes, hp.consent_at, hp.updated_at
FROM (
    SELECT 10 AS user_id, '0000000' AS parq_answers, 'Viêm gân cổ chân nhẹ' AS conditions, 'Tránh bài tập bật nhảy liên tục cường độ cao' AS notes, NOW() - INTERVAL 10 DAY AS consent_at, NOW() - INTERVAL 2 DAY AS updated_at
    UNION ALL SELECT 9906, '0000000', 'Tiền sử trật khớp vai trái', 'Cần HLV theo dõi và hỗ trợ khi đẩy tạ nặng qua đầu', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 1 DAY
    UNION ALL SELECT 19, '0000000', 'Không có bệnh lý', 'Thể trạng tốt, sức bền và nhịp tim ổn định', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 3 DAY
    UNION ALL SELECT 6, '0000000', 'Thoát vị đĩa đệm L4-L5 nhẹ', 'Ưu tiên bơi lội, yoga giãn cơ; tránh gánh tạ đè nén cột sống', NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 5 DAY
) AS hp
WHERE @is_prod_db > 0
ON DUPLICATE KEY UPDATE 
    conditions = hp.conditions, 
    notes = hp.notes, 
    updated_at = hp.updated_at;

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 4, 10, 'Đánh giá Thể trạng Tháng 11 - Yoga', 52.5, 162.0, 22.5, 23.8, 5, 5, 'Tập luyện chăm chỉ, tư thế chuẩn, khớp gối cải thiện rõ rệt.', 'Tiếp tục duy trì tuần 3 buổi, tăng thời gian thở sâu.', NOW() - INTERVAL 3 DAY
WHERE @is_prod_db > 0 AND NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 10 AND assessment_title = 'Đánh giá Thể trạng Tháng 11 - Yoga');

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 3, 9906, 'Kiểm tra InBody Định kỳ - Gym', 68.2, 175.0, 16.8, 33.5, 4, 5, 'Cơ ngực và xô phát triển tốt, form Squat chuẩn.', 'Nên tăng thêm 15g protein mỗi ngày và khởi động vai kỹ hơn.', NOW() - INTERVAL 5 DAY
WHERE @is_prod_db > 0 AND NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 9906 AND assessment_title = 'Kiểm tra InBody Định kỳ - Gym');

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 3, 19, 'Đánh giá Tăng cơ Giảm mỡ - Thể hình', 74.0, 178.0, 18.2, 35.1, 5, 4, 'Thể lực bùng nổ, hoàn thành 100% giáo án tạ nặng.', 'Chuẩn bị bước vào chu kỳ siết cơ (cutting).', NOW() - INTERVAL 7 DAY
WHERE @is_prod_db > 0 AND NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 19 AND assessment_title = 'Đánh giá Tăng cơ Giảm mỡ - Thể hình');

INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
SELECT 4, 6, 'Kiểm tra Khớp & Cột sống - Yoga Phục hồi', 71.0, 172.0, 21.0, 31.0, 4, 5, 'Cơ lưng bớt co cứng, độ linh hoạt hông cải thiện.', 'Tránh các động tác uốn lưng quá sâu.', NOW() - INTERVAL 4 DAY
WHERE @is_prod_db > 0 AND NOT EXISTS (SELECT 1 FROM TRAINEE_ASSESSMENTS WHERE user_id = 6 AND assessment_title = 'Kiểm tra Khớp & Cột sống - Yoga Phục hồi');

-- 2. Front Desk Check-In Logs across Nov 9 - Nov 12 (Giữ Đinh Thị Thu #10 chưa check-in để test Present Direct)
INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at)
SELECT al.actor_email, al.action, al.entity_type, al.entity_id, al.details, al.changes_json, al.created_at
FROM (
    SELECT 'letan@sport.com' AS actor_email, 'CHECK_IN' AS action, 'MEMBER_CHECKIN' AS entity_type, '9906' AS entity_id, 'Check-in thành công tại quầy Lễ tân - Sinh Xuân (#9906)' AS details, '{"userId":9906,"memberName":"Sinh Xuân","memberEmail":"bich31699@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}' AS changes_json, '2026-11-10 06:45:10' AS created_at
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '19', 'Check-in thành công tại quầy Lễ tân - Mai Tiến Dũng (#19)', '{"userId":19,"memberName":"Mai Tiến Dũng","memberEmail":"dung@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-10 06:50:22'
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '6', 'Check-in thành công tại quầy Lễ tân - Trần Bùi Thái (#6)', '{"userId":6,"memberName":"Trần Bùi Thái","memberEmail":"thai@gmail.com","checkInType":"FRONT_DESK_CARD","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-10 06:55:04'
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '9906', 'Check-in thành công tại quầy Lễ tân - Sinh Xuân (#9906)', '{"userId":9906,"memberName":"Sinh Xuân","memberEmail":"bich31699@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-11 06:45:10'
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '19', 'Check-in thành công tại quầy Lễ tân - Mai Tiến Dũng (#19)', '{"userId":19,"memberName":"Mai Tiến Dũng","memberEmail":"dung@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-11 06:50:22'
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '6', 'Check-in thành công tại quầy Lễ tân - Trần Bùi Thái (#6)', '{"userId":6,"memberName":"Trần Bùi Thái","memberEmail":"thai@gmail.com","checkInType":"FRONT_DESK_CARD","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-11 06:55:04'
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '9906', 'Check-in thành công tại quầy Lễ tân - Sinh Xuân (#9906)', '{"userId":9906,"memberName":"Sinh Xuân","memberEmail":"bich31699@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-12 06:45:10'
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '19', 'Check-in thành công tại quầy Lễ tân - Mai Tiến Dũng (#19)', '{"userId":19,"memberName":"Mai Tiến Dũng","memberEmail":"dung@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-12 06:50:22'
    UNION ALL SELECT 'letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '6', 'Check-in thành công tại quầy Lễ tân - Trần Bùi Thái (#6)', '{"userId":6,"memberName":"Trần Bùi Thái","memberEmail":"thai@gmail.com","checkInType":"FRONT_DESK_CARD","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', '2026-11-12 06:55:04'
) AS al
WHERE @is_prod_db > 0;

-- 3. Future non-conflicting schedules for Reschedule Requests
INSERT INTO SCHEDULES (schedule_id, class_id, start_time, end_time, status, changeover_minutes)
SELECT sc.schedule_id, sc.class_id, sc.start_time, sc.end_time, sc.status, sc.changeover_minutes
FROM (
    SELECT 14008 AS schedule_id, 1 AS class_id, '2026-11-13 07:00:00' AS start_time, '2026-11-13 08:30:00' AS end_time, 'SCHEDULED' AS status, 15 AS changeover_minutes
    UNION ALL SELECT 14011, 3, '2026-11-15 17:30:00', '2026-11-15 19:00:00', 'SCHEDULED', 15
) AS sc
WHERE @is_prod_db > 0
ON DUPLICATE KEY UPDATE status = sc.status;

-- 4. Clean up any room or coach overlapping schedules that have 0 bookings
DELETE FROM SCHEDULES WHERE @is_prod_db > 0 AND class_id IN (25, 122, 126, 134) AND NOT EXISTS (SELECT 1 FROM BOOKINGS b WHERE b.schedule_id = SCHEDULES.schedule_id);

DELETE FROM SCHEDULES
WHERE @is_prod_db > 0 AND schedule_id IN (
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

UPDATE CLASSES SET coach_id = 13276 WHERE class_id IN (15, 131) AND @is_prod_db > 0;
UPDATE CLASSES SET coach_id = 13278 WHERE class_id IN (16, 133) AND @is_prod_db > 0;
UPDATE CLASSES SET coach_id = 13277 WHERE class_id IN (138) AND @is_prod_db > 0;
UPDATE CLASSES SET coach_id = 13275 WHERE class_id IN (144) AND @is_prod_db > 0;

-- 5. Realistic Past Attendance (~80% PRESENT, ~20% ABSENT) & Current/Future Bookings
UPDATE BOOKINGS b
JOIN SCHEDULES s ON s.schedule_id = b.schedule_id
SET b.attendance_status = CASE WHEN MOD(b.booking_id, 5) = 0 THEN 'ABSENT' ELSE 'PRESENT' END
WHERE @is_prod_db > 0 AND b.status = 'CONFIRMED' AND s.end_time < '2026-11-10 00:00:00';

INSERT INTO BOOKINGS (user_id, schedule_id, status, attendance_status, booking_time)
SELECT u.user_id, s.schedule_id, 'CONFIRMED', 'NOT_YET', '2026-11-01 09:00:00'
FROM USERS u
JOIN SCHEDULES s ON s.schedule_id IN (10508, 10520, 10521, 10532, 10533, 10544, 10545, 10556, 10557, 10568, 10569, 10612, 10613, 14008, 14011)
WHERE @is_prod_db > 0
  AND u.user_id IN (6, 7, 8, 9, 10, 11, 12, 19, 9906)
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
WHERE @is_prod_db > 0
  AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 14008)
  AND NOT EXISTS (SELECT 1 FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE schedule_id = 14008 AND status = 'PENDING');

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS 
(schedule_id, class_id, coach_id, action_type, original_start_time, original_end_time, 
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details, 
 status, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 14011, 3, 3, 'MAKEUP_SESSION', '2026-11-15 17:30:00', '2026-11-15 19:00:00',
 '2026-11-16 15:00:00', '2026-11-16 16:30:00', 1, 'NO_SUBSTITUTE_EMERGENCY', 
 'HLV gia đình có việc khẩn tại quê, xin dời ca Gym sang chiều Thứ Hai phòng Gym trống.',
 'PENDING', '2026-11-15 12:00:00', 2, '2026-11-09 09:15:00', '2026-11-09 09:15:00'
WHERE @is_prod_db > 0
  AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 14011)
  AND NOT EXISTS (SELECT 1 FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE schedule_id = 14011 AND status = 'PENDING');

-- 7. Support Requests & User Credits
INSERT INTO SUPPORT_REQUESTS (user_id, class_id, category, preferred_resolution, title, content, status, priority, created_at, updated_at)
SELECT 19, 3, 'CLASS_CANCELLATION', 'REFUND_CASH_OR_BANK', 
 'Hủy lớp học Gym Siết Cơ & Xin hoàn tiền do chuyển công tác',
 'Em nhận quyết định điều động công tác vào TP.HCM từ tuần tới nên không thể theo học tiếp 10 buổi còn lại. Kính nhờ trung tâm hỗ trợ hoàn phí học kỳ.',
 'PENDING', 'HIGH', '2026-11-09 08:15:20', '2026-11-09 08:15:20'
WHERE @is_prod_db > 0
  AND NOT EXISTS (SELECT 1 FROM SUPPORT_REQUESTS WHERE title = 'Hủy lớp học Gym Siết Cơ & Xin hoàn tiền do chuyển công tác');

INSERT INTO SUPPORT_REQUESTS (user_id, class_id, category, preferred_resolution, title, content, status, priority, created_at, updated_at)
SELECT 6, 1, 'FACILITY_ISSUE', 'INVESTIGATE_FEEDBACK', 
 'Điều hòa phòng Yoga P201 bị chảy nước và quá lạnh',
 'Sáng nay em tập ca 7h phòng P201 điều hòa góc trái bị rò nước xuống thảm và thổi gió quá lạnh làm nhiều học viên bị buốt.',
 'PENDING', 'HIGH', '2026-11-09 08:45:00', '2026-11-09 08:45:00'
WHERE @is_prod_db > 0
  AND NOT EXISTS (SELECT 1 FROM SUPPORT_REQUESTS WHERE title = 'Điều hòa phòng Yoga P201 bị chảy nước và quá lạnh');

INSERT INTO USER_CREDITS (user_id, credit_code, amount, remaining_amount, reason, expiry_date, status, created_at)
SELECT uc.user_id, uc.credit_code, uc.amount, uc.remaining_amount, uc.reason, uc.expiry_date, uc.status, uc.created_at
FROM (
    SELECT 9906 AS user_id, 'CR-NX-2026-9906' AS credit_code, 300000.00 AS amount, 300000.00 AS remaining_amount, 'Hoàn phí hủy ca lớp Yoga Giãn Cơ - Giữ 100% quyền lợi' AS reason, '2026-12-31' AS expiry_date, 'ACTIVE' AS status, '2026-11-05 14:00:00' AS created_at
    UNION ALL SELECT 10, 'CR-NX-2026-10', 450000.00, 450000.00, 'Mã tín dụng ưu đãi gia hạn hội viên thân thiết Tháng 11', '2026-12-31', 'ACTIVE', '2026-11-01 09:00:00'
    UNION ALL SELECT 19, 'CR-NX-2026-19', 900000.00, 900000.00, 'Tín dụng hoàn hủy lớp Zumba bảo lưu học phí', '2026-12-31', 'ACTIVE', '2026-11-07 16:30:00'
) AS uc
WHERE @is_prod_db > 0
ON DUPLICATE KEY UPDATE remaining_amount = uc.remaining_amount;

-- 8. Lost & Found Items
INSERT INTO LOST_AND_FOUND_ITEMS 
(item_code, item_name, category, valuation_type, color, found_location, found_date, storage_location, public_description, status, expiry_date, created_by, created_at)
SELECT lf.item_code, lf.item_name, lf.category, lf.valuation_type, lf.color, lf.found_location, lf.found_date, lf.storage_location, lf.public_description, lf.status, lf.expiry_date, lf.created_by, lf.created_at
FROM (
    SELECT 'LF-2026-001' AS item_code, 'Bình nước giữ nhiệt Lock&Lock 800ml' AS item_name, 'ACCESSORIES' AS category, 'STANDARD' AS valuation_type, 'Xanh navy' AS color, 'Phòng Gym Tầng 1 - Cạnh máy chạy bộ số 3' AS found_location, CURDATE() - INTERVAL 4 DAY AS found_date, 'Tủ thất lạc Quầy Lễ Tân (Ngăn A2)' AS storage_location, 'Bình giữ nhiệt kim loại màu xanh, có khắc chữ cái T.' AS public_description, 'STORED' AS status, CURDATE() + INTERVAL 30 DAY AS expiry_date, 2 AS created_by, NOW() - INTERVAL 4 DAY AS created_at
    UNION ALL SELECT 'LF-2026-002', 'Tai nghe không dây AirPods Pro 2', 'ELECTRONICS', 'HIGH_VALUE', 'Trắng', 'Studio Yoga P201 Tầng 2', CURDATE() - INTERVAL 6 DAY, 'Két an toàn Lễ tân', 'Hộp sạc trắng có bao silicon đen, tìm thấy dưới bục giảng HLV.', 'CLAIMED', CURDATE() + INTERVAL 30 DAY, 2, NOW() - INTERVAL 6 DAY
    UNION ALL SELECT 'LF-2026-003', 'Áo khoác gió thể thao Adidas', 'CLOTHING', 'STANDARD', 'Đen 3 sọc trắng', 'Khu tủ Locker Nam Tầng 1', CURDATE() - INTERVAL 2 DAY, 'Tủ thất lạc Quầy Lễ Tân (Ngăn B1)', 'Áo size L, còn rất mới để quên trên nóc tủ locker.', 'STORED', CURDATE() + INTERVAL 30 DAY, 2, NOW() - INTERVAL 2 DAY
    UNION ALL SELECT 'LF-2026-004', 'Đồng hồ thông minh Apple Watch Series 8', 'ELECTRONICS', 'HIGH_VALUE', 'Midnight', 'Ghế nghỉ cạnh Bể bơi Bốn Mùa', CURDATE() - INTERVAL 1 DAY, 'Két an toàn Quản lý', 'Đồng hồ dây cao su đen, màn hình có dán cường lực.', 'STORED', CURDATE() + INTERVAL 30 DAY, 2, NOW() - INTERVAL 1 DAY
) AS lf
WHERE @is_prod_db > 0
ON DUPLICATE KEY UPDATE status = lf.status;

SET FOREIGN_KEY_CHECKS = 1;

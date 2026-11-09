-- ==============================================================================
-- NEXUS SPORTS CENTER: RICH TIMELINE TEST DATASET
-- Past (Quá khứ), Present (Hôm nay 09/11/2026), and Future (Tương lai 10/11 - 30/11)
-- Database: SportCenter
-- ==============================================================================
SET NAMES utf8mb4;
USE SportCenter;

-- ------------------------------------------------------------------------------
-- 1. MEMBER HEALTH PROFILES & INBODY ASSESSMENTS
-- ------------------------------------------------------------------------------
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

-- InBody Trainee Assessments (Quá khứ & Gần đây)
INSERT INTO TRAINEE_ASSESSMENTS (coach_id, user_id, assessment_title, weight, height, body_fat_percentage, muscle_mass, performance_rating, attendance_rating, feedback_note, recommendation, created_at)
VALUES
(4, 10, 'Đánh giá Thể trạng Tháng 11 - Yoga', 52.5, 162.0, 22.5, 23.8, 5, 5, 'Tập luyện chăm chỉ, tư thế chuẩn, khớp gối cải thiện rõ rệt.', 'Tiếp tục duy trì tuần 3 buổi, tăng thời gian thở sâu.', NOW() - INTERVAL 3 DAY),
(3, 9906, 'Kiểm tra InBody Định kỳ - Gym', 68.2, 175.0, 16.8, 33.5, 4, 5, 'Cơ ngực và xô phát triển tốt, form Squat chuẩn.', 'Nên tăng thêm 15g protein mỗi ngày và khởi động vai kỹ hơn.', NOW() - INTERVAL 5 DAY),
(3, 19, 'Đánh giá Tăng cơ Giảm mỡ - Thể hình', 74.0, 178.0, 18.2, 35.1, 5, 4, 'Thể lực bùng nổ, hoàn thành 100% giáo án tạ nặng.', 'Chuẩn bị bước vào chu kỳ siết cơ (cutting).', NOW() - INTERVAL 7 DAY),
(4, 6, 'Kiểm tra Khớp & Cột sống - Yoga Phục hồi', 71.0, 172.0, 21.0, 31.0, 4, 5, 'Cơ lưng bớt co cứng, độ linh hoạt hông cải thiện.', 'Tránh các động tác uốn lưng quá sâu.', NOW() - INTERVAL 4 DAY);

-- ------------------------------------------------------------------------------
-- 2. FRONT DESK CHECK-IN LOGS FOR TODAY (2026-11-09)
-- Giữ Đinh Thị Thu (id=10) CHƯA check-in để test cảnh báo lễ tân & nút 'Present (Direct)'
-- Cho Sinh Xuân (9906), Mai Tiến Dũng (19), Trần Bùi Thái (6) ĐÃ check-in
-- ------------------------------------------------------------------------------
INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at)
VALUES
('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '9906', 
 'Check-in thành công tại quầy Lễ tân - Sinh Xuân (#9906)', 
 '{"userId":9906,"memberName":"Sinh Xuân","memberEmail":"bich31699@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', 
 '2026-11-09 06:45:10'),

('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '19', 
 'Check-in thành công tại quầy Lễ tân - Mai Tiến Dũng (#19)', 
 '{"userId":19,"memberName":"Mai Tiến Dũng","memberEmail":"dung@gmail.com","checkInType":"FRONT_DESK_QR","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', 
 '2026-11-09 06:50:22'),

('letan@sport.com', 'CHECK_IN', 'MEMBER_CHECKIN', '6', 
 'Check-in thành công tại quầy Lễ tân - Trần Bùi Thái (#6)', 
 '{"userId":6,"memberName":"Trần Bùi Thái","memberEmail":"thai@gmail.com","checkInType":"FRONT_DESK_CARD","status":"CHECKED_IN","checkedInBy":"letan@sport.com"}', 
 '2026-11-09 06:55:04');

-- ------------------------------------------------------------------------------
-- 3. ENSURE BOOKINGS FOR TODAY'S CLASSES (2026-11-09)
-- Schedule 10508: [YOGA-101] 07:00 - 08:30 (HLV Trần Mai Anh)
-- Schedule 10532: [GYM-101] 17:30 - 19:00 (HLV Nguyễn Văn Tuấn)
-- Schedule 10556: [ZUMBA-101] 19:15 - 20:45 (HLV Phạm Minh Hoàng)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO BOOKINGS (user_id, schedule_id, status, attendance_status, booking_time)
VALUES
(10, 10508, 'CONFIRMED', 'NOT_YET', '2026-11-08 14:00:00'), -- Đinh Thị Thu (Chưa qua lễ tân)
(9906, 10508, 'CONFIRMED', 'PRESENT', '2026-11-08 15:30:00'), -- Sinh Xuân (Đã qua lễ tân, có mặt)
(19, 10508, 'CONFIRMED', 'NOT_YET', '2026-11-08 16:15:00'),  -- Mai Tiến Dũng (Đã qua lễ tân)
(6, 10508, 'CONFIRMED', 'ABSENT', '2026-11-08 17:00:00'),    -- Trần Bùi Thái (Vắng)

(10, 10532, 'CONFIRMED', 'NOT_YET', '2026-11-08 10:00:00'),
(9906, 10532, 'CONFIRMED', 'NOT_YET', '2026-11-08 11:30:00'),
(19, 10532, 'CONFIRMED', 'NOT_YET', '2026-11-08 12:45:00'),

(10, 10556, 'CONFIRMED', 'NOT_YET', '2026-11-08 13:00:00'),
(9906, 10556, 'CONFIRMED', 'NOT_YET', '2026-11-08 18:20:00');

-- ------------------------------------------------------------------------------
-- 4. FUTURE SCHEDULES FOR TESTING RESCHEDULE REQUESTS (Không trùng giờ với lịch cũ)
-- ------------------------------------------------------------------------------
-- Ca ngày 13/11 để HLV Mai Anh nộp đơn dời lịch bù
INSERT IGNORE INTO SCHEDULES (schedule_id, class_id, start_time, end_time, status, changeover_minutes)
VALUES
(14008, 1, '2026-11-13 07:00:00', '2026-11-13 08:30:00', 'SCHEDULED', 15),
(14011, 3, '2026-11-15 17:30:00', '2026-11-15 19:00:00', 'SCHEDULED', 15);

-- Ghi danh học viên cho ca 14008
INSERT IGNORE INTO BOOKINGS (user_id, schedule_id, status, attendance_status, booking_time)
VALUES
(10, 14008, 'CONFIRMED', 'NOT_YET', NOW()),
(9906, 14008, 'CONFIRMED', 'NOT_YET', NOW()),
(19, 14008, 'CONFIRMED', 'NOT_YET', NOW()),
(6, 14008, 'CONFIRMED', 'NOT_YET', NOW());

-- ------------------------------------------------------------------------------
-- 5. RESCHEDULE REQUESTS & MEMBER RESPONSES (Past, Pending, Voting)
-- ------------------------------------------------------------------------------
-- 5.1. Đơn PENDING của HLV Trần Mai Anh (xuansinh4567@gmail.com, coach_id=4)
-- Xin dời ca 14008 ngày 13/11 sang ngày 14/11 (14:00 - 15:30 tại Phòng [P201] Yoga)
INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS 
(schedule_id, class_id, coach_id, action_type, original_start_time, original_end_time, 
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details, 
 status, confirmation_deadline, min_attendees, created_at, updated_at)
VALUES
(14008, 1, 4, 'MAKEUP_SESSION', '2026-11-13 07:00:00', '2026-11-13 08:30:00',
 '2026-11-14 14:00:00', '2026-11-14 15:30:00', 2, 'NO_SUBSTITUTE_SICK', 
 'HLV bị sốt xuất huyết đột xuất, đã liên hệ HLV Tuấn và Hoàng nhưng đều bận kín ca. Kính đề nghị dời sang chiều Thứ Bảy 14/11 phòng Yoga trống.',
 'PENDING', '2026-11-13 18:00:00', 2, '2026-11-09 08:30:00', '2026-11-09 08:30:00');

-- 5.2. Đơn PENDING của HLV Nguyễn Văn Tuấn (tuanpt@sport.com, coach_id=3)
INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS 
(schedule_id, class_id, coach_id, action_type, original_start_time, original_end_time, 
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details, 
 status, confirmation_deadline, min_attendees, created_at, updated_at)
VALUES
(14011, 3, 3, 'MAKEUP_SESSION', '2026-11-15 17:30:00', '2026-11-15 19:00:00',
 '2026-11-16 15:00:00', '2026-11-16 16:30:00', 1, 'NO_SUBSTITUTE_EMERGENCY', 
 'HLV gia đình có việc khẩn tại quê, xin dời ca Gym sang chiều Thứ Hai phòng Gym trống.',
 'PENDING', '2026-11-15 12:00:00', 2, '2026-11-09 09:15:00', '2026-11-09 09:15:00');

-- 5.3. Đơn APPROVED tuần trước (Lịch sử đã giải quyết)
INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS 
(schedule_id, class_id, coach_id, action_type, original_start_time, original_end_time, 
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details, 
 status, admin_response_note, reviewed_by, reviewed_at, confirmation_deadline, min_attendees, created_at, updated_at)
VALUES
(10508, 1, 4, 'MAKEUP_SESSION', '2026-11-02 07:00:00', '2026-11-02 08:30:00',
 '2026-11-03 07:00:00', '2026-11-03 08:30:00', 2, 'NO_SUBSTITUTE_BUSINESS_TRIP',
 'Tham gia hội thảo Yoga Quốc tế tại Đà Nẵng, xin dời bù ngày 03/11.',
 'APPROVED', 'Đã kiểm tra phòng 201 trống, đồng ý phê duyệt ca dạy bù.', 1, '2026-11-01 15:00:00',
 '2026-11-02 20:00:00', 2, '2026-11-01 10:00:00', '2026-11-01 15:00:00');

-- ------------------------------------------------------------------------------
-- 6. SUPPORT REQUESTS (Hỗ trợ học viên, khiếu nại, hoàn tiền)
-- ------------------------------------------------------------------------------
-- 6.1. Đơn PENDING hôm nay (09/11/2026)
INSERT INTO SUPPORT_REQUESTS (user_id, class_id, category, preferred_resolution, title, content, status, priority, created_at, updated_at)
VALUES
(19, 3, 'CLASS_CANCELLATION', 'REFUND_CASH_OR_BANK', 
 'Hủy lớp học Gym Siết Cơ & Xin hoàn tiền do chuyển công tác',
 'Em nhận quyết định điều động công tác vào TP.HCM từ tuần tới nên không thể theo học tiếp 10 buổi còn lại. Kính nhờ trung tâm hỗ trợ hoàn phí học kỳ.',
 'PENDING', 'HIGH', '2026-11-09 08:15:20', '2026-11-09 08:15:20'),

(6, 1, 'FACILITY_ISSUE', 'INVESTIGATE_FEEDBACK', 
 'Điều hòa phòng Yoga P201 bị chảy nước và quá lạnh',
 'Sáng nay em tập ca 7h phòng P201 điều hòa góc trái bị rò nước xuống thảm và thổi gió quá lạnh làm nhiều học viên bị buốt.',
 'PENDING', 'HIGH', '2026-11-09 08:45:00', '2026-11-09 08:45:00'),

(10, 1, 'COACH_FEEDBACK', 'INVESTIGATE_FEEDBACK', 
 'Góp ý: HLV Mai Anh hướng dẫn tư thế Yoga rất tận tâm',
 'Em bị đau cổ chân được cô Mai Anh chỉnh lại form đứng và bài tập thở rất dễ chịu. Mong trung tâm mở thêm ca buổi chiều của cô.',
 'PENDING', 'NORMAL', '2026-11-09 09:20:11', '2026-11-09 09:20:11');

-- 6.2. Đơn ESCALATED (Đã chuyển Quản lý duyệt)
INSERT INTO SUPPORT_REQUESTS (user_id, class_id, category, preferred_resolution, title, content, status, priority, response_note, responded_by, responded_at, created_at, updated_at)
VALUES
(19, 5, 'CLASS_CANCELLATION', 'REFUND_CASH_OR_BANK', 
 'Hủy lớp Zumba và bảo lưu học phí 900.000đ',
 'Học viên đã học 2/12 buổi, số tiền bảo lưu ước tính 900.000đ. Đã xác nhận lý do chính đáng.',
 'ESCALATED', 'HIGH', 'Lễ tân đã thẩm định và chuyển Giám đốc trung tâm duyệt chi trả qua tài khoản ngân hàng.', 2, '2026-11-09 09:30:00', '2026-11-08 20:00:00', '2026-11-09 09:30:00');

-- 6.3. Đơn RESOLVED trong quá khứ (Lịch sử giải quyết)
INSERT INTO SUPPORT_REQUESTS (user_id, class_id, category, preferred_resolution, title, content, status, priority, response_note, responded_by, responded_at, created_at, updated_at)
VALUES
(9906, 1, 'CLASS_CANCELLATION', 'ISSUE_CREDIT', 
 'Xin hủy lớp Yoga buổi tối & nhận mã Credit hoàn tiền 100%',
 'Em bận ca trực viện nên xin hủy lớp nhận voucher tập ca khác.',
 'RESOLVED', 'NORMAL', 'Đã cấp mã hoàn tiền tín dụng CR-NX-2026-9906 trị giá 300.000đ vào ví tài khoản.', 2, '2026-11-05 14:00:00', '2026-11-05 10:00:00', '2026-11-05 14:00:00');

-- ------------------------------------------------------------------------------
-- 7. USER CREDITS (Voucher hoàn tiền cho hội viên test)
-- ------------------------------------------------------------------------------
INSERT INTO USER_CREDITS (user_id, credit_code, amount, remaining_amount, reason, expiry_date, status, created_at)
VALUES
(9906, 'CR-NX-2026-9906', 300000.00, 300000.00, 'Hoàn phí hủy ca lớp Yoga Giãn Cơ - Giữ 100% quyền lợi', '2026-12-31', 'ACTIVE', '2026-11-05 14:00:00'),
(10, 'CR-NX-2026-10', 450000.00, 450000.00, 'Mã tín dụng ưu đãi gia hạn hội viên thân thiết Tháng 11', '2026-12-31', 'ACTIVE', '2026-11-01 09:00:00'),
(19, 'CR-NX-2026-19', 900000.00, 900000.00, 'Tín dụng hoàn hủy lớp Zumba bảo lưu học phí', '2026-12-31', 'ACTIVE', '2026-11-07 16:30:00')
ON DUPLICATE KEY UPDATE remaining_amount = VALUES(remaining_amount);

-- ------------------------------------------------------------------------------
-- 8. REVENUE & FINANCIAL INVOICES (Trải dài Tháng 10 - Tháng 11 để biểu đồ doanh thu mượt mà)
-- ------------------------------------------------------------------------------
INSERT INTO INVOICES (user_id, subtotal, discount_amount, voucher_code, total_amount, status, created_at)
VALUES
(10, 1500000.00, 0.00, NULL, 1500000.00, 'PAID', '2026-10-15 09:30:00'),
(9906, 2500000.00, 200000.00, 'WELCOME2026', 2300000.00, 'PAID', '2026-10-20 14:15:00'),
(19, 3200000.00, 0.00, NULL, 3200000.00, 'PAID', '2026-10-25 10:00:00'),
(6, 1800000.00, 0.00, NULL, 1800000.00, 'PAID', '2026-10-28 16:45:00'),
(10, 2000000.00, 0.00, NULL, 2000000.00, 'PAID', '2026-11-02 08:20:00'),
(9906, 1200000.00, 0.00, NULL, 1200000.00, 'PAID', '2026-11-05 11:30:00'),
(19, 2800000.00, 300000.00, 'LOYALTYVIP', 2500000.00, 'PAID', '2026-11-07 15:10:00'),
(6, 1500000.00, 0.00, NULL, 1500000.00, 'PAID', '2026-11-09 08:00:00');

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS FOR ALL 4 ROLES
-- ------------------------------------------------------------------------------
INSERT INTO NOTIFICATIONS (user_id, title, message, type, is_read, created_at)
VALUES
-- Cho Member (user_id = 10, 9906)
(10, 'Nhắc lịch học hôm nay', 'Lớp [YOGA-101] của bạn sẽ diễn ra lúc 07:00 sáng nay tại phòng P201.', 'CLASS_REMINDER', 0, NOW() - INTERVAL 2 HOUR),
(9906, 'Cộng điểm thưởng Loyalty', 'Bạn đã được cộng +10 điểm thưởng rèn luyện sau buổi tập chăm chỉ.', 'LOYALTY_POINTS', 0, NOW() - INTERVAL 1 DAY),
(9906, 'Voucher Credit khả dụng', 'Mã hoàn tiền CR-NX-2026-9906 trị giá 300.000đ đã sẵn sàng sử dụng.', 'CREDIT_ISSUED', 0, NOW() - INTERVAL 2 DAY),

-- Cho Coach (user_id = 4 - HLV Trần Mai Anh)
(4, 'Lịch dạy hôm nay', 'Bạn có ca dạy lớp [YOGA-101] sáng nay lúc 07:00 tại Studio Yoga P201.', 'SCHEDULE_ALERT', 0, NOW() - INTERVAL 3 HOUR),
(4, 'Cập nhật đơn xin dời lịch', 'Đơn xin dời lịch dạy bù ca 13/11 đã được gửi tới Ban Quản lý trung tâm.', 'RESCHEDULE_SENT', 0, NOW() - INTERVAL 1 HOUR),

-- Cho Receptionist (user_id = 2 - Lễ tân Thúy Kiều)
(2, 'Yêu cầu hỗ trợ mới', 'Học viên Mai Tiến Dũng (#19) vừa gửi yêu cầu hủy lớp cần thẩm định.', 'SUPPORT_TICKET', 0, NOW() - INTERVAL 2 HOUR),
(2, 'Cảnh báo đồ thất lạc', 'Có 2 món đồ thất lạc lưu kho sắp đến hạn chuyển xử lý.', 'LOST_AND_FOUND', 0, NOW() - INTERVAL 1 DAY),

-- Cho Manager (user_id = 1 - Quản lý trung tâm)
(1, 'Đơn dời lịch dạy bù chờ duyệt', 'HLV Trần Mai Anh và HLV Nguyễn Văn Tuấn vừa gửi 2 đơn dời ca cần thẩm định phòng.', 'MANAGER_APPROVAL', 0, NOW() - INTERVAL 1 HOUR),
(1, 'Đơn khiếu nại hoàn tiền', 'Có 1 đơn hủy lớp giá trị cao (>500.000đ) vừa được lễ tân chuyển lên duyệt chi.', 'MANAGER_REFUND', 0, NOW() - INTERVAL 30 MINUTE);

-- ------------------------------------------------------------------------------
-- 10. LOST AND FOUND ITEMS (Quầy Lễ tân & Quản lý)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO LOST_AND_FOUND_ITEMS 
(item_code, item_name, category, valuation_type, color, found_location, found_date, storage_location, public_description, status, created_by, created_at)
VALUES
('LF-2026-001', 'Bình nước giữ nhiệt Lock&Lock 800ml', 'ACCESSORIES', 'STANDARD', 'Xanh navy', 'Phòng Gym Tầng 1 - Cạnh máy chạy bộ số 3', NOW() - INTERVAL 4 DAY, 'Tủ thất lạc Quầy Lễ Tân (Ngăn A2)', 'Bình giữ nhiệt kim loại màu xanh, có khắc chữ cái T.', 'STORED', 2, NOW() - INTERVAL 4 DAY),
('LF-2026-002', 'Tai nghe không dây AirPods Pro 2', 'ELECTRONICS', 'HIGH_VALUE', 'Trắng', 'Studio Yoga P201 Tầng 2', NOW() - INTERVAL 6 DAY, 'Két an toàn Lễ tân', 'Hộp sạc trắng có bao silicon đen, tìm thấy dưới bục giảng HLV.', 'CLAIMED', 2, NOW() - INTERVAL 6 DAY),
('LF-2026-003', 'Áo khoác gió thể thao Adidas', 'CLOTHING', 'STANDARD', 'Đen 3 sọc trắng', 'Khu tủ Locker Nam Tầng 1', NOW() - INTERVAL 2 DAY, 'Tủ thất lạc Quầy Lễ Tân (Ngăn B1)', 'Áo size L, còn rất mới để quên trên nóc tủ locker.', 'STORED', 2, NOW() - INTERVAL 2 DAY),
('LF-2026-004', 'Đồng hồ thông minh Apple Watch Series 8', 'ELECTRONICS', 'HIGH_VALUE', 'Midnight', 'Ghế nghỉ cạnh Bể bơi Bốn Mùa', NOW() - INTERVAL 1 DAY, 'Két an toàn Quản lý', 'Đồng hồ dây cao su đen, màn hình có dán cường lực.', 'STORED', 2, NOW() - INTERVAL 1 DAY);

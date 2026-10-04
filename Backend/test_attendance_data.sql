-- =========================================================================
-- DATA TEST ĐIỂM DANH (BẢN CHỐNG LỖI 100%)
-- Password chung: 123456
-- Dùng ID 9900 và Email mới hoàn toàn để không bao giờ bị trùng
-- =========================================================================

-- 1. THÊM COACH MỚI HOÀN TOÀN
INSERT INTO USERS (user_id, role_id, full_name, email, password_hash, status) VALUES 
(9901, 3, 'HLV Test Vượt Lỗi', 'coach99@sport.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE');

-- 2. THÊM 3 HỌC VIÊN MỚI
INSERT INTO USERS (user_id, role_id, full_name, email, password_hash, status) VALUES 
(9902, 4, 'Học Viên Test 991', 'test991@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
(9903, 4, 'Học Viên Test 992', 'test992@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
(9904, 4, 'Học Viên Test 993', 'test993@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE');

-- 3. CẤP THẺ TẬP
INSERT INTO USER_MEMBERSHIPS (membership_id, user_id, package_id, start_date, end_date, remaining_sessions, status) VALUES 
(9901, 9902, 3, '2026-10-01', '2027-10-01', 365, 'ACTIVE'),
(9902, 9903, 3, '2026-10-01', '2027-10-01', 365, 'ACTIVE'),
(9903, 9904, 3, '2026-10-01', '2027-10-01', 365, 'ACTIVE');

-- 4. THÊM 1 LỚP HỌC MỚI CHO COACH 9901
INSERT INTO CLASSES (class_id, subject_id, coach_id, room_id, class_name, price, max_slots, status) VALUES 
(9901, 3, 9901, 3, 'Lớp Test Vượt Lỗi Điểm Danh', 600000, 15, 'ACTIVE');

-- 5. LỊCH HỌC HÔM NAY (04/10/2026)
INSERT INTO SCHEDULES (schedule_id, class_id, start_time, end_time, status) VALUES 
(9901, 9901, '2026-10-04 15:00:00', '2026-10-04 16:30:00', 'SCHEDULED');

-- 6. ĐẶT CHỖ (NOT_YET) ĐỂ TEST
INSERT INTO BOOKINGS (booking_id, user_id, schedule_id, status, attendance_status, booking_time) VALUES 
(9901, 9902, 9901, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:00:00'),
(9902, 9903, 9901, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:05:00'),
(9903, 9904, 9901, 'CONFIRMED', 'NOT_YET', '2026-10-02 09:10:00');

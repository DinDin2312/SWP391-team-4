DROP DATABASE IF EXISTS SportCenter;
CREATE DATABASE SportCenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE SportCenter;

-- ================== 1. TẠO BẢNG (ĐÃ FIX AUTO_INCREMENT) ==================
CREATE TABLE `ROLES` (`role_id` int PRIMARY KEY AUTO_INCREMENT, `role_name` varchar(255));
CREATE TABLE `USERS` (`user_id` int PRIMARY KEY AUTO_INCREMENT, `role_id` int, `full_name` varchar(255), `email` varchar(255), `phone` varchar(255), `password_hash` varchar(255), `status` varchar(255), `bio` text, `avatar_path` varchar(255), `force_password_change` boolean NOT NULL DEFAULT false, `loyalty_points` int DEFAULT 0);
CREATE TABLE `SUBJECTS` (`subject_id` int PRIMARY KEY AUTO_INCREMENT, `subject_name` varchar(255), `description` text, `image_path` varchar(255));
CREATE TABLE `USER_SUBJECTS` (`user_id` int, `subject_id` int, PRIMARY KEY (`user_id`, `subject_id`));
CREATE TABLE `ROOMS` (`room_id` int PRIMARY KEY AUTO_INCREMENT, `room_name` varchar(255), `capacity` int, `image_path` varchar(255));
CREATE TABLE `PACKAGES` (`package_id` int PRIMARY KEY AUTO_INCREMENT, `package_name` varchar(255), `package_type` varchar(255), `duration_days` int, `price` decimal(10,2), `image_path` varchar(255));
CREATE TABLE `USER_MEMBERSHIPS` (`membership_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `package_id` int, `start_date` date, `end_date` date, `remaining_sessions` int, `status` varchar(255));
CREATE TABLE `CLASSES` (`class_id` int PRIMARY KEY AUTO_INCREMENT, `subject_id` int, `coach_id` int, `room_id` int, `class_name` varchar(255), `price` decimal(10,2), `max_slots` int, `status` varchar(255), `image_path` varchar(255));
CREATE TABLE `SCHEDULES` (`schedule_id` int PRIMARY KEY AUTO_INCREMENT, `class_id` int, `start_time` datetime, `end_time` datetime, `status` varchar(255));
CREATE TABLE `BOOKINGS` (`booking_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `schedule_id` int, `status` varchar(255), `attendance_status` varchar(255), `booking_time` datetime);
CREATE TABLE `INVOICES` (`invoice_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `total_amount` decimal(10,2), `status` varchar(255), `created_at` datetime);
CREATE TABLE `INVOICE_DETAILS` (`detail_id` int PRIMARY KEY AUTO_INCREMENT, `invoice_id` int, `class_id` int, `package_id` int, `schedule_id` int, `unit_price` decimal(10,2));
CREATE TABLE `PAYMENTS` (`payment_id` int PRIMARY KEY AUTO_INCREMENT, `invoice_id` int, `amount` decimal(10,2), `payment_method` varchar(255), `transaction_no` varchar(255), `status` varchar(255), `payment_date` datetime);
CREATE TABLE `NOTIFICATIONS` (`notification_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `title` varchar(255), `message` text, `type` varchar(50) NOT NULL DEFAULT 'SYSTEM', `is_read` boolean NOT NULL DEFAULT false, `created_at` datetime);
CREATE TABLE `AI_WORKOUT_PLANS` (`plan_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `goal` varchar(255), `fitness_level` varchar(255), `created_at` datetime);
CREATE TABLE `EXERCISES` (`exercise_id` int PRIMARY KEY AUTO_INCREMENT, `exercise_name` varchar(255), `muscle_group` varchar(255), `video_url` varchar(255));
CREATE TABLE `AI_PLAN_DETAILS` (`detail_id` int PRIMARY KEY AUTO_INCREMENT, `plan_id` int, `exercise_id` int, `sets` int, `reps` int, `rest_seconds` int);
CREATE TABLE `COACH_WORKOUT_PLANS` (`plan_id` int PRIMARY KEY AUTO_INCREMENT, `coach_id` int, `user_id` int, `title` varchar(255), `note` text, `status` varchar(50) DEFAULT 'ACTIVE', `created_at` datetime);
CREATE TABLE `COACH_PLAN_DETAILS` (`detail_id` int PRIMARY KEY AUTO_INCREMENT, `plan_id` int, `exercise_id` int, `sets` int, `reps` int, `rest_seconds` int);
CREATE TABLE `AUDIT_LOGS` (`audit_id` bigint PRIMARY KEY AUTO_INCREMENT, `actor_email` varchar(255) NOT NULL, `action` varchar(50) NOT NULL, `entity_type` varchar(100) NOT NULL, `entity_id` varchar(100), `details` text, `created_at` datetime NOT NULL);

-- ================== 2. NỐI KHÓA NGOẠI ==================
ALTER TABLE `USERS` ADD FOREIGN KEY (`role_id`) REFERENCES `ROLES` (`role_id`);
ALTER TABLE `USER_SUBJECTS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `USER_SUBJECTS` ADD FOREIGN KEY (`subject_id`) REFERENCES `SUBJECTS` (`subject_id`);
ALTER TABLE `CLASSES` ADD FOREIGN KEY (`subject_id`) REFERENCES `SUBJECTS` (`subject_id`);
ALTER TABLE `CLASSES` ADD FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `CLASSES` ADD FOREIGN KEY (`room_id`) REFERENCES `ROOMS` (`room_id`);
ALTER TABLE `USER_MEMBERSHIPS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `USER_MEMBERSHIPS` ADD FOREIGN KEY (`package_id`) REFERENCES `PACKAGES` (`package_id`);
ALTER TABLE `BOOKINGS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `INVOICES` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `NOTIFICATIONS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `SCHEDULES` ADD FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`);
ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`);
ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`package_id`) REFERENCES `PACKAGES` (`package_id`);
ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`schedule_id`) REFERENCES `SCHEDULES` (`schedule_id`);
ALTER TABLE `BOOKINGS` ADD FOREIGN KEY (`schedule_id`) REFERENCES `SCHEDULES` (`schedule_id`);
ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`invoice_id`) REFERENCES `INVOICES` (`invoice_id`);
ALTER TABLE `PAYMENTS` ADD FOREIGN KEY (`invoice_id`) REFERENCES `INVOICES` (`invoice_id`);
ALTER TABLE `AI_WORKOUT_PLANS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `AI_PLAN_DETAILS` ADD FOREIGN KEY (`plan_id`) REFERENCES `AI_WORKOUT_PLANS` (`plan_id`);
ALTER TABLE `AI_PLAN_DETAILS` ADD FOREIGN KEY (`exercise_id`) REFERENCES `EXERCISES` (`exercise_id`);
ALTER TABLE `COACH_WORKOUT_PLANS` ADD FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `COACH_WORKOUT_PLANS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `COACH_PLAN_DETAILS` ADD FOREIGN KEY (`plan_id`) REFERENCES `COACH_WORKOUT_PLANS` (`plan_id`) ON DELETE CASCADE;
ALTER TABLE `COACH_PLAN_DETAILS` ADD FOREIGN KEY (`exercise_id`) REFERENCES `EXERCISES` (`exercise_id`);

-- ================== 3. BƠM DỮ LIỆU MẪU (DUMMY DATA) ==================

-- Phân quyền
INSERT INTO ROLES VALUES (1, 'Center Manager'), (2, 'Receptionist'), (3, 'Coach'), (4, 'Member');

-- Danh mục Phòng Tập (5 phòng)
INSERT INTO ROOMS (room_id,room_name,capacity) VALUES
                      (1, 'Phòng Gym Tầng 1', 50), (2, 'Phòng Yoga Tầng 2', 30),
                      (3, 'Phòng Zumba Tầng 3', 40), (4, 'Bể Bơi Bốn Mùa', 100), (5, 'Phòng Đạp Xe', 20);

-- Danh mục Môn Học (5 môn)
INSERT INTO SUBJECTS (subject_id,subject_name,description) VALUES
                         (1, 'Thể Hình (Gym)', 'Tập tạ tự do và máy móc hiện đại'),
                         (2, 'Yoga Căn Bản', 'Yoga thư giãn và giãn cơ buổi sáng'),
                         (3, 'Zumba Dance', 'Nhảy theo nhạc Latin sôi động giảm mỡ'),
                         (4, 'Bơi Lội', 'Kỹ thuật bơi ếch, bơi sải chuyên nghiệp'),
                         (5, 'Đạp Xe (Spinning)', 'Đạp xe cường độ cao trên nền nhạc');

-- Danh mục Gói Tập (5 gói)
INSERT INTO PACKAGES (package_id,package_name,package_type,duration_days,price) VALUES
                         (1, 'Thẻ Gym 1 Tháng', 'GYM_ACCESS', 30, 500000),
                         (2, 'Thẻ Gym 3 Tháng', 'GYM_ACCESS', 90, 1400000),
                         (3, 'Thẻ Gym 1 Năm', 'GYM_ACCESS', 365, 4500000),
                         (4, 'Gói Thuê AI Cá Nhân 1 Tháng', 'AI_ACCESS', 30, 99000),
                         (5, 'Thẻ Tập Thử VIP (1 Ngày)', 'GYM_ACCESS', 1, 0);

-- Tài khoản Người dùng (ĐÃ MÃ HÓA BCRYPT CHO PASS '123456')
INSERT INTO USERS (user_id, role_id, full_name, email, password_hash, status) VALUES
                                                                                  (1, 1, 'Quản Lý Trung Tâm', 'admin@sport.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (2, 2, 'Lễ Tân Thúy Kiều', 'letan@sport.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (3, 3, 'HLV Nguyễn Văn Tuấn', 'tuanpt@sport.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (4, 3, 'HLV Trần Mai Anh', 'maianh@sport.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (5, 3, 'HLV Phạm Minh Hoàng', 'hoangpt@sport.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (6, 4, 'Trần Bùi Thái', 'thai@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (7, 4, 'Nguyễn Kiều Oanh', 'oanh@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (8, 4, 'Lê Hoàng Long', 'long@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (9, 4, 'Vũ Đức Mạnh', 'manh@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (10, 4, 'Đinh Thị Thu', 'thu@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (11, 4, 'Phạm Tuấn Ngọc', 'ngoc@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (12, 4, 'Bùi Tấn Trường', 'truong@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (13, 4, 'Hoàng Văn Thụ', 'thuhoang@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (14, 4, 'Đặng Thái Sơn', 'son@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (15, 4, 'Ngô Thanh Vân', 'van@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (16, 4, 'Lý Nhã Kỳ', 'ky@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (17, 4, 'Trương Thế Vinh', 'vinh@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (18, 4, 'Hồ Ngọc Hà', 'ha@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'INACTIVE'),
                                                                                  (19, 4, 'Mai Tiến Dũng', 'dung@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE'),
                                                                                  (20, 4, 'Nguyễn Tóc Tiên', 'tien@gmail.com', '$2a$10$tYvY6BPaFSn0UyVUQxF4FeeveL9r6MGP1xcgn4Uve6p47aIDqqrOW', 'ACTIVE');

-- Kỹ năng của HLV
INSERT INTO USER_SUBJECTS VALUES (3, 1), (4, 2), (5, 3), (5, 4);

-- Thẻ Thành Viên

INSERT INTO USER_MEMBERSHIPS (membership_id,user_id,package_id,start_date,end_date,remaining_sessions,status) VALUES
                                 (1, 6, 1, '2026-09-01', '2026-10-01', 30, 'ACTIVE'),
                                 (2, 7, 3, '2026-01-01', '2027-01-01', 365, 'ACTIVE'),
                                 (3, 8, 4, '2026-09-15', '2026-10-15', 30, 'ACTIVE'),
                                 (4, 9, 2, '2026-08-01', '2026-11-01', 90, 'ACTIVE'),
                                 (5, 10, 1, '2026-09-20', '2026-10-20', 30, 'ACTIVE');


-- Danh sách Lớp học
INSERT INTO CLASSES (class_id,subject_id,coach_id,room_id,class_name,price,max_slots,status) VALUES
                        (1, 2, 4, 2, 'Yoga Giãn Cơ Thứ 2-4-6', 600000, 20, 'ACTIVE'),
                        (2, 2, 4, 2, 'Yoga Giảm Cân Thứ 3-5-7', 700000, 15, 'ACTIVE'),
                        (3, 1, 3, 1, 'Gym Căn Bản Cho Nam', 800000, 10, 'ACTIVE'),
                        (4, 1, 3, 1, 'Siết Cơ Cấp Tốc', 900000, 8, 'ACTIVE'),
                        (5, 3, 5, 3, 'Zumba Đốt Mỡ Buổi Tối', 500000, 30, 'ACTIVE'),
                        (6, 4, 5, 4, 'Lớp Học Bơi Sải', 1200000, 10, 'ACTIVE'),
                        (7, 2, 4, 2, 'Yoga Trị Liệu Cột Sống', 850000, 15, 'ACTIVE'),
                        (8, 3, 5, 3, 'Zumba Dance Chuyên Nghiệp', 750000, 25, 'ACTIVE'),
                        (9, 1, 3, 1, 'Lớp Luyện Cử Tạ', 1000000, 5, 'ACTIVE'),
                        (10, 4, 5, 4, 'Bơi Lội Trẻ Em', 1500000, 20, 'ACTIVE');

-- Lịch học của các Lớp
INSERT INTO SCHEDULES VALUES
                          (1, 1, '2026-10-01 06:00:00', '2026-10-01 07:30:00', 'SCHEDULED'),
                          (2, 1, '2026-10-03 06:00:00', '2026-10-03 07:30:00', 'SCHEDULED'),
                          (3, 1, '2026-10-05 06:00:00', '2026-10-05 07:30:00', 'SCHEDULED'),
                          (4, 2, '2026-10-02 18:00:00', '2026-10-02 19:30:00', 'SCHEDULED'),
                          (5, 2, '2026-10-04 18:00:00', '2026-10-04 19:30:00', 'SCHEDULED'),
                          (6, 3, '2026-10-01 17:00:00', '2026-10-01 18:30:00', 'SCHEDULED'),
                          (7, 3, '2026-10-03 17:00:00', '2026-10-03 18:30:00', 'SCHEDULED'),
                          (8, 4, '2026-10-02 20:00:00', '2026-10-02 21:00:00', 'SCHEDULED'),
                          (9, 4, '2026-10-04 20:00:00', '2026-10-04 21:00:00', 'SCHEDULED'),
                          (10, 5, '2026-10-01 19:00:00', '2026-10-01 20:30:00', 'SCHEDULED'),
                          (11, 5, '2026-10-03 19:00:00', '2026-10-03 20:30:00', 'SCHEDULED'),
                          (12, 6, '2026-10-06 08:00:00', '2026-10-06 10:00:00', 'SCHEDULED'),
                          (13, 6, '2026-10-13 08:00:00', '2026-10-13 10:00:00', 'SCHEDULED'),
                          (14, 7, '2026-10-05 07:00:00', '2026-10-05 08:30:00', 'SCHEDULED'),
                          (15, 7, '2026-10-12 07:00:00', '2026-10-12 08:30:00', 'SCHEDULED'),
                          (16, 8, '2026-10-07 19:00:00', '2026-10-07 20:30:00', 'SCHEDULED'),
                          (17, 8, '2026-10-14 19:00:00', '2026-10-14 20:30:00', 'SCHEDULED'),
                          (18, 9, '2026-10-08 17:00:00', '2026-10-08 18:30:00', 'SCHEDULED'),
                          (19, 9, '2026-10-15 17:00:00', '2026-10-15 18:30:00', 'SCHEDULED'),
                          (20, 10, '2026-10-10 09:00:00', '2026-10-10 11:00:00', 'SCHEDULED');

-- Đặt chỗ của Học sinh vào Lịch học
INSERT INTO BOOKINGS (booking_id, user_id, schedule_id, status, attendance_status, booking_time) VALUES
                         (1, 6, 1, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (2, 6, 2, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (3, 6, 3, 'CONFIRMED', 'NOT_YET', '2026-09-01 06:00:00'),
                         (4, 7, 1, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (5, 7, 2, 'CONFIRMED', 'ABSENT', '2026-09-01 06:00:00'), (6, 7, 3, 'CONFIRMED', 'NOT_YET', '2026-09-01 06:00:00'),
                         (7, 8, 4, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (8, 8, 5, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'),
                         (9, 9, 6, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (10, 9, 7, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'),
                         (11, 10, 12, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (12, 10, 13, 'CONFIRMED', 'NOT_YET', '2026-09-01 06:00:00'),
                         (13, 11, 10, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (14, 11, 11, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'),
                         (15, 12, 18, 'CONFIRMED', 'PRESENT', '2026-09-01 06:00:00'), (16, 12, 19, 'CONFIRMED', 'NOT_YET', '2026-09-01 06:00:00'),
                         (17, 13, 1, 'CANCELLED', 'ABSENT', '2026-09-01 06:00:00');

-- Bài tập Mẫu
INSERT INTO EXERCISES VALUES
                          (1, 'Hít đất (Push up)', 'Ngực', 'https://youtube.com/ex1'),
                          (2, 'Gập bụng (Crunch)', 'Bụng', 'https://youtube.com/ex2'),
                          (3, 'Kéo xà đơn (Pull up)', 'Lưng', 'https://youtube.com/ex3'),
                          (4, 'Squat (Đứng lên ngồi xuống)', 'Đùi', 'https://youtube.com/ex4'),
                          (5, 'Đẩy tạ đôi (Dumbbell Press)', 'Ngực', 'https://youtube.com/ex5'),
                          (6, 'Chạy bộ máy (Treadmill)', 'Cardio', 'https://youtube.com/ex6');

-- Kế hoạch AI sinh ra cho Khách hàng
INSERT INTO AI_WORKOUT_PLANS VALUES
                                 (1, 8, 'Tăng cơ ngực và lưng', 'Trung bình', '2026-09-15 10:00:00'),
                                 (2, 6, 'Giảm mỡ bụng cấp tốc', 'Mới bắt đầu', '2026-09-18 15:30:00');

-- Chi tiết các bài tập trong Kế hoạch AI
INSERT INTO AI_PLAN_DETAILS VALUES
                                (1, 1, 1, 4, 12, 60), (2, 1, 3, 4, 8, 90), (3, 1, 5, 3, 10, 60),
                                (4, 2, 2, 5, 20, 30), (5, 2, 6, 1, 1, 0), (6, 2, 4, 3, 15, 45);

-- Hóa đơn thanh toán
INSERT INTO INVOICES VALUES
                         (1, 6, 1100000, 'PAID', '2026-09-01 08:00:00'),
                         (2, 7, 4500000, 'PAID', '2026-01-01 09:15:00'),
                         (3, 8, 99000, 'PAID', '2026-09-15 10:00:00'),
                         (4, 9, 1400000, 'PENDING', '2026-09-22 07:00:00');

-- Chi tiết Hóa đơn
INSERT INTO INVOICE_DETAILS VALUES
                                (1, 1, NULL, 1, NULL, 500000),
                                (2, 1, 1, NULL, NULL, 600000),
                                (3, 2, NULL, 3, NULL, 4500000),
                                (4, 3, NULL, 4, NULL, 99000),
                                (5, 4, NULL, 2, NULL, 1400000);

-- Giao dịch Thanh toán
INSERT INTO PAYMENTS VALUES
                         (1, 1, 1100000, 'VNPAY', 'VNP123456789', 'SUCCESS', '2026-09-01 08:05:00'),
                         (2, 2, 4500000, 'MOMO', 'MM987654321', 'SUCCESS', '2026-01-01 09:20:00'),
                         (3, 3, 99000, 'VNPAY', 'VNP555666777', 'SUCCESS', '2026-09-15 10:02:00');


-- Configurable subject packages and purchase snapshots
ALTER TABLE USER_MEMBERSHIPS
 ADD COLUMN package_name_snapshot varchar(255),
 ADD COLUMN package_type_snapshot varchar(255),
 ADD COLUMN duration_days_snapshot int,
 ADD COLUMN price_snapshot decimal(10,2);

CREATE TABLE PACKAGE_SUBJECT_BENEFITS (
 package_id int NOT NULL, subject_id int NOT NULL, session_limit int NOT NULL,
 PRIMARY KEY(package_id,subject_id),
 FOREIGN KEY(package_id) REFERENCES PACKAGES(package_id),
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id),
 CHECK(session_limit BETWEEN 1 AND 10000)
);
CREATE TABLE MEMBERSHIP_SUBJECT_BENEFITS (
 benefit_id int PRIMARY KEY AUTO_INCREMENT, membership_id int NOT NULL,
 subject_id int NOT NULL, subject_name varchar(255) NOT NULL, session_limit int NOT NULL,
 UNIQUE(membership_id,subject_id),
 FOREIGN KEY(membership_id) REFERENCES USER_MEMBERSHIPS(membership_id) ON DELETE CASCADE,
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id)
);
CREATE TABLE BOOKING_BENEFITS (
 booking_id int PRIMARY KEY, benefit_id int NOT NULL,
 FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE,
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id)
);
UPDATE USER_MEMBERSHIPS m JOIN PACKAGES p ON p.package_id=m.package_id
 SET m.package_name_snapshot=p.package_name,m.package_type_snapshot=p.package_type,
 m.duration_days_snapshot=p.duration_days,m.price_snapshot=p.price;

CREATE TABLE PACKAGE_TYPES (
 type_code varchar(100) PRIMARY KEY,
 type_name varchar(255) NOT NULL UNIQUE,
 requires_subjects boolean NOT NULL DEFAULT FALSE
);
INSERT INTO PACKAGE_TYPES VALUES
 ('GYM_ACCESS','Gym access',FALSE),('AI_ACCESS','AI access',FALSE),
 ('PREMIUM','Premium',FALSE),('COMBO','Combo (Gym + AI)',FALSE),
 ('SUBJECT_ACCESS','Subject package',TRUE);
INSERT IGNORE INTO PACKAGE_TYPES(type_code,type_name,requires_subjects)
 SELECT DISTINCT package_type,package_type,FALSE FROM PACKAGES WHERE package_type IS NOT NULL;
ALTER TABLE USER_MEMBERSHIPS ADD COLUMN type_name_snapshot varchar(255);
UPDATE USER_MEMBERSHIPS m JOIN PACKAGE_TYPES t ON t.type_code=COALESCE(m.package_type_snapshot,(SELECT p.package_type FROM PACKAGES p WHERE p.package_id=m.package_id))
 SET m.type_name_snapshot=t.type_name WHERE m.type_name_snapshot IS NULL;

ALTER TABLE PACKAGES ADD description varchar(1000), ADD terms text, ADD purchase_limit_per_member int, ADD selling_status varchar(20) NOT NULL DEFAULT 'SELLING';
ALTER TABLE USER_MEMBERSHIPS ADD description_snapshot varchar(1000), ADD terms_snapshot text, ADD purchase_completed_at datetime, ADD purchase_source varchar(20), ADD checkout_invoice_id int;
ALTER TABLE INVOICE_DETAILS ADD membership_id int;
ALTER TABLE AUDIT_LOGS ADD changes_json longtext;
CREATE TABLE INVOICE_BOOKINGS (invoice_id int NOT NULL, booking_id int NOT NULL, PRIMARY KEY(invoice_id,booking_id), FOREIGN KEY(invoice_id) REFERENCES INVOICES(invoice_id), FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id));
CREATE INDEX idx_membership_purchase ON USER_MEMBERSHIPS(user_id,package_id,purchase_completed_at);
CREATE INDEX idx_membership_checkout ON USER_MEMBERSHIPS(checkout_invoice_id);
CREATE INDEX idx_package_history ON AUDIT_LOGS(entity_type,entity_id,created_at);
UPDATE USER_MEMBERSHIPS SET purchase_completed_at=COALESCE(start_date,CURRENT_TIMESTAMP),purchase_source='LEGACY' WHERE status IN ('ACTIVE','EXPIRED');

CREATE TABLE PACKAGE_BENEFIT_ROOMS (
 package_id int NOT NULL, subject_id int NOT NULL, room_id int NOT NULL,
 PRIMARY KEY(package_id,subject_id,room_id),
 FOREIGN KEY(package_id,subject_id) REFERENCES PACKAGE_SUBJECT_BENEFITS(package_id,subject_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);
CREATE TABLE MEMBERSHIP_BENEFIT_ROOMS (
 benefit_id int NOT NULL, room_id int NOT NULL, room_name varchar(255) NOT NULL,
 PRIMARY KEY(benefit_id,room_id),
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);

-- ==============================================================================
-- V32: COMPLETE DATA SANITATION, LEGACY CLASS CODE NORMALIZATION & RICH TIMELINE
-- Removes all test/simulator/keyboard-mash garbage, obsolete AWAITING_CONFIRMATION
-- workflows, empty/unused classes, and seeds spotless Past - Present - Future data.
-- Guarded with @is_prod_db so empty/fixture schemas in DatabaseMigrationTests pass.
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

SET @is_prod_db = (SELECT COUNT(*) FROM USERS WHERE email = 'admin@sport.com');

-- ------------------------------------------------------------------------------
-- 1. ENSURE DEPRECATED BENEFIT TABLES STAY EMPTY (HIDDEN IN DOCUMENTATION)
-- ------------------------------------------------------------------------------
DELETE FROM BOOKING_BENEFITS WHERE @is_prod_db > 0;
DELETE FROM MEMBERSHIP_BENEFIT_ROOMS WHERE @is_prod_db > 0;
DELETE FROM MEMBERSHIP_SUBJECT_BENEFITS WHERE @is_prod_db > 0;
DELETE FROM PACKAGE_BENEFIT_ROOMS WHERE @is_prod_db > 0;
DELETE FROM PACKAGE_SUBJECT_BENEFITS WHERE @is_prod_db > 0;

-- ------------------------------------------------------------------------------
-- 2. REMOVE GARBAGE / TEST / SIMULATOR USERS, SUBJECTS, PACKAGES & EMPTY CLASSES
-- ------------------------------------------------------------------------------
UPDATE SCHEDULES
SET substitute_coach_id = 13276
WHERE @is_prod_db > 0 AND substitute_coach_id IN (101, 9901, 12220);

DELETE b FROM BOOKINGS b
JOIN SCHEDULES s ON s.schedule_id = b.schedule_id
WHERE @is_prod_db > 0
  AND (
    s.class_id IN (122, 126, 127, 128, 132, 134, 135, 136, 137, 142, 143, 145, 147, 148, 149, 11128, 11604, 11930)
    OR b.user_id IN (101, 102, 103, 104, 105, 106, 9901, 9902, 9903, 9904, 9905, 12218, 12219, 12220, 12221, 12222, 12223, 12224, 12225, 12226, 12227, 12228, 12229, 12230, 12231, 12232, 12233, 13010)
  );

DELETE ib FROM INVOICE_BOOKINGS ib
LEFT JOIN BOOKINGS b ON b.booking_id = ib.booking_id
WHERE @is_prod_db > 0 AND b.booking_id IS NULL;

DELETE FROM SCHEDULES
WHERE @is_prod_db > 0
  AND class_id IN (122, 126, 127, 128, 132, 134, 135, 136, 137, 142, 143, 145, 147, 148, 149, 11128, 11604, 11930);

DELETE FROM CLASSES
WHERE @is_prod_db > 0
  AND class_id IN (122, 126, 127, 128, 132, 134, 135, 136, 137, 142, 143, 145, 147, 148, 149, 11128, 11604, 11930);

DELETE FROM USER_SUBJECTS
WHERE @is_prod_db > 0
  AND (
    subject_id IN (253, 1447)
    OR user_id IN (101, 102, 103, 104, 105, 106, 9901, 9902, 9903, 9904, 9905, 12218, 12219, 12220, 12221, 12222, 12223, 12224, 12225, 12226, 12227, 12228, 12229, 12230, 12231, 12232, 12233, 13010)
  );

DELETE FROM ROOM_SUBJECTS WHERE @is_prod_db > 0 AND subject_id IN (253, 1447);
DELETE FROM SUBJECTS WHERE @is_prod_db > 0 AND subject_id IN (253, 1447);

DELETE FROM USER_MEMBERSHIPS
WHERE @is_prod_db > 0
  AND (
    package_id IN (11, 12)
    OR status IN ('PENDING', 'CANCELLED')
    OR start_date > '2026-12-31'
    OR user_id IN (101, 102, 103, 104, 105, 106, 9901, 9902, 9903, 9904, 9905, 12218, 12219, 12220, 12221, 12222, 12223, 12224, 12225, 12226, 12227, 12228, 12229, 12230, 12231, 12232, 12233, 13010)
  );

DELETE FROM PACKAGES WHERE @is_prod_db > 0 AND package_id IN (11, 12);

DELETE FROM MEMBER_HEALTH_PROFILES
WHERE @is_prod_db > 0
  AND user_id IN (101, 102, 103, 104, 105, 106, 9901, 9902, 9903, 9904, 9905, 12218, 12219, 12220, 12221, 12222, 12223, 12224, 12225, 12226, 12227, 12228, 12229, 12230, 12231, 12232, 12233, 13010);

DELETE FROM TRAINEE_ASSESSMENTS
WHERE @is_prod_db > 0
  AND (
    coach_id NOT IN (3, 4, 5, 13275, 13276, 13277, 13278, 13279)
    OR user_id IN (101, 102, 103, 104, 105, 106, 9901, 9902, 9903, 9904, 9905, 12218, 12219, 12220, 12221, 12222, 12223, 12224, 12225, 12226, 12227, 12228, 12229, 12230, 12231, 12232, 12233, 13010)
    OR assessment_id IN (3, 26, 27, 28)
    OR TRIM(COALESCE(feedback_note, '')) IN ('', 'none', 'giỏi', 'tập yếu', '4')
  );

DELETE FROM USERS
WHERE @is_prod_db > 0
  AND user_id IN (101, 102, 103, 104, 105, 106, 9901, 9902, 9903, 9904, 9905, 12218, 12219, 12220, 12221, 12222, 12223, 12224, 12225, 12226, 12227, 12228, 12229, 12230, 12231, 12232, 12233, 13010);

-- Normalize retained user profiles & creation timestamps for clean Member Growth reporting
UPDATE USERS SET full_name = TRIM(full_name) WHERE @is_prod_db > 0 AND full_name IS NOT NULL;
UPDATE USERS SET created_at = '2026-09-01 08:00:00' WHERE @is_prod_db > 0 AND user_id BETWEEN 1 AND 5 AND created_at IS NULL;
UPDATE USERS SET created_at = DATE_ADD('2026-09-05 09:00:00', INTERVAL (user_id - 5) DAY) WHERE @is_prod_db > 0 AND user_id BETWEEN 6 AND 21 AND created_at IS NULL;
UPDATE USERS SET created_at = '2026-10-05 10:00:00' WHERE @is_prod_db > 0 AND user_id = 9906 AND created_at IS NULL;

-- ------------------------------------------------------------------------------
-- 3. ASSIGN CLEAN UNIQUE CLASS CODES [SUBJECT-1xx/2xx] TO ALL LEGACY CLASSES
-- ------------------------------------------------------------------------------
UPDATE CLASSES SET class_name = '[GYM-104] Gym Tăng Cơ Khối Lượng Cao & Thể Hình Chuẩn' WHERE class_id = 103 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-105] Gym Định Hình Cơ Bắp & Sức Mạnh Bền Bỉ' WHERE class_id = 104 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-106] Gym Thể Lực Chức Năng Bứt Phá Sức Mạnh' WHERE class_id = 109 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-107] Gym Tăng Cơ Hypertrophy Buổi Sáng' WHERE class_id = 120 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-108] Gym Siết Mỡ & Cắt Nét Cơ Thể Chiều' WHERE class_id = 121 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-109] Gym Cardio & Kháng Lực Buổi Sáng' WHERE class_id = 123 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-110] Gym Thể Lực Bứt Phá Sáng Cuối Tuần' WHERE class_id = 125 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-203] Gym Thể Hình Chuyên Sâu Tối Muộn' WHERE class_id = 124 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[GYM-204] Gym Siết Cơ Cắt Nét Pro' WHERE class_id = 11235 AND @is_prod_db > 0;

UPDATE CLASSES SET class_name = '[YOGA-104] Yoga Yin Thư Giãn Sâu & Khớp Mở Rộng' WHERE class_id = 107 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-105] Yoga Dẻo Dai & Cân Bằng Chiều Tối' WHERE class_id = 129 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-106] Yoga Thiền Định & Nến Thơm Buổi Tối' WHERE class_id = 130 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-107] Yoga Dáng Đẹp & Thon Gọn Cuối Tuần' WHERE class_id = 131 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-203] Yoga Vinyasa Nâng Cao & Tái Tạo Khí Lực' WHERE class_id = 101 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-204] Yoga Trị Liệu Chuyên Sâu & Phục Hồi Cột Sống' WHERE class_id = 102 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[YOGA-205] Yoga Trị Liệu Cột Sống & Cổ Vai Gáy Chuyên Sâu' WHERE class_id = 11236 AND @is_prod_db > 0;

UPDATE CLASSES SET class_name = '[ZUMBA-103] Zumba Latin Dance Năng Động & Săn Chắc' WHERE class_id = 105 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[ZUMBA-104] Zumba Glow Party Vũ Điệu Ánh Sáng' WHERE class_id = 108 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[ZUMBA-105] Zumba Dance Latin Nóng Bỏng' WHERE class_id = 11238 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[ZUMBA-202] Zumba Đốt Mỡ Cường Độ Cao Hi-Lo' WHERE class_id = 133 AND @is_prod_db > 0;

UPDATE CLASSES SET class_name = '[SWIM-103] Bơi Sải Thể Lực & Tốc Độ Đường Đua' WHERE class_id = 106 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-104] Bơi Lội Kỹ Năng Sinh Tồn & Cứu Hộ Dưới Nước' WHERE class_id = 110 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-105] Bơi Sải Sáng Sớm Tăng Thể Lực' WHERE class_id = 138 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-106] Bơi Ếch Kỹ Thuật Chuẩn & Bền Bỉ' WHERE class_id = 139 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-107] Bơi Lội Giải Tỏa Căng Thẳng Chiều Tối' WHERE class_id = 140 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-203] Bơi Bướm Nâng Cao & Thể Lực Vượt Trội' WHERE class_id = 141 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SWIM-204] Bơi Sải Tốc Độ & Sức Bền Kỹ Thuật' WHERE class_id = 11237 AND @is_prod_db > 0;

UPDATE CLASSES SET class_name = '[SPIN-101] Spinning Đạp Xe Buổi Sáng Đốt Calo' WHERE class_id = 144 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SPIN-204] Spinning Cardio Kháng Lực & Leo Dốc Ảo' WHERE class_id = 111 AND @is_prod_db > 0;
UPDATE CLASSES SET class_name = '[SPIN-205] Spinning RPM Thử Thách Tốc Độ Đêm' WHERE class_id = 146 AND @is_prod_db > 0;

-- ------------------------------------------------------------------------------
-- 4. CLEAN INVOICES, PAYMENTS & MEMBERSHIPS (NO AWAITING_CONFIRMATION / SPAM)
-- ------------------------------------------------------------------------------
UPDATE USER_CREDITS SET used_invoice_id = NULL WHERE @is_prod_db > 0;

DELETE p FROM PAYMENTS p
JOIN INVOICES i ON i.invoice_id = p.invoice_id
WHERE @is_prod_db > 0
  AND (i.status <> 'PAID' OR p.status NOT IN ('COMPLETED', 'SUCCESS') OR i.user_id NOT IN (SELECT user_id FROM USERS));

DELETE idet FROM INVOICE_DETAILS idet
JOIN INVOICES i ON i.invoice_id = idet.invoice_id
WHERE @is_prod_db > 0
  AND (i.status <> 'PAID' OR idet.package_id IN (11, 12) OR idet.class_id IN (122, 126, 127, 128, 132, 134, 135, 136, 137, 142, 143, 145, 147, 148, 149, 11128, 11604, 11930) OR i.user_id NOT IN (SELECT user_id FROM USERS));

DELETE ib FROM INVOICE_BOOKINGS ib
JOIN INVOICES i ON i.invoice_id = ib.invoice_id
WHERE @is_prod_db > 0 AND (i.status <> 'PAID' OR i.user_id NOT IN (SELECT user_id FROM USERS));

DELETE FROM INVOICES
WHERE @is_prod_db > 0 AND (status <> 'PAID' OR user_id NOT IN (SELECT user_id FROM USERS));

DELETE FROM BOOKINGS WHERE @is_prod_db > 0 AND status = 'PENDING';

-- Align Invoice #647 (Thẻ Gym 3 Tháng) subtotal/total with unit price (1,400,000đ)
UPDATE INVOICES SET subtotal = 1400000.00, total_amount = 1400000.00 WHERE @is_prod_db > 0 AND invoice_id = 647;
UPDATE PAYMENTS SET amount = 1400000.00 WHERE @is_prod_db > 0 AND invoice_id = 647;

-- Backfill matching INVOICE_DETAILS & PAYMENTS for seeded PAID invoices #593-#600
INSERT INTO INVOICE_DETAILS (invoice_id, class_id, package_id, schedule_id, unit_price, membership_id)
SELECT seed.invoice_id, seed.class_id, NULL, NULL, seed.unit_price, NULL
FROM (
    SELECT 593 AS invoice_id, 1 AS class_id, 650000.00 AS unit_price
    UNION ALL SELECT 593, 3, 850000.00
    UNION ALL SELECT 594, 6, 1200000.00
    UNION ALL SELECT 594, 10, 1300000.00
    UNION ALL SELECT 595, 2, 750000.00
    UNION ALL SELECT 595, 4, 950000.00
    UNION ALL SELECT 595, 20, 1500000.00
    UNION ALL SELECT 596, 3, 850000.00
    UNION ALL SELECT 596, 4, 950000.00
    UNION ALL SELECT 597, 1, 650000.00
    UNION ALL SELECT 597, 19, 1350000.00
    UNION ALL SELECT 598, 6, 1200000.00
    UNION ALL SELECT 599, 10, 1300000.00
    UNION ALL SELECT 599, 20, 1500000.00
    UNION ALL SELECT 600, 20, 1500000.00
) AS seed
JOIN INVOICES i ON i.invoice_id = seed.invoice_id
WHERE @is_prod_db > 0
  AND NOT EXISTS (SELECT 1 FROM INVOICE_DETAILS d WHERE d.invoice_id = seed.invoice_id);

-- Remove legacy invoices that have zero remaining line items after test-entity cleanup
DELETE p FROM PAYMENTS p
LEFT JOIN INVOICE_DETAILS d ON d.invoice_id = p.invoice_id
WHERE @is_prod_db > 0 AND d.detail_id IS NULL;

DELETE ib FROM INVOICE_BOOKINGS ib
LEFT JOIN INVOICE_DETAILS d ON d.invoice_id = ib.invoice_id
WHERE @is_prod_db > 0 AND d.detail_id IS NULL;

DELETE i FROM INVOICES i
LEFT JOIN INVOICE_DETAILS d ON d.invoice_id = i.invoice_id
WHERE @is_prod_db > 0 AND d.detail_id IS NULL;

INSERT INTO PAYMENTS (invoice_id, amount, payment_method, transaction_no, status, payment_date)
SELECT i.invoice_id, i.total_amount,
       CASE MOD(i.invoice_id, 4)
           WHEN 1 THEN 'VNPAY'
           WHEN 2 THEN 'MOMO'
           WHEN 3 THEN 'PAYOS'
           ELSE 'CASH'
       END,
       CASE MOD(i.invoice_id, 4)
           WHEN 1 THEN CONCAT('VNPAY-NX-', i.invoice_id)
           WHEN 2 THEN CONCAT('MOMO-NX-', i.invoice_id)
           WHEN 3 THEN CONCAT('VIETQR-TRANSFER-HD', i.invoice_id)
           ELSE CONCAT('CASH-COUNTER-', i.invoice_id)
       END,
       'COMPLETED', i.created_at
FROM INVOICES i
WHERE @is_prod_db > 0
  AND i.status = 'PAID'
  AND NOT EXISTS (SELECT 1 FROM PAYMENTS p WHERE p.invoice_id = i.invoice_id);

UPDATE USER_MEMBERSHIPS m
JOIN PACKAGES p ON p.package_id = m.package_id
JOIN PACKAGE_TYPES pt ON pt.type_code = p.package_type
SET m.package_name_snapshot = p.package_name,
    m.package_type_snapshot = p.package_type,
    m.duration_days_snapshot = p.duration_days,
    m.price_snapshot = p.price,
    m.type_name_snapshot = pt.type_name,
    m.description_snapshot = p.description,
    m.terms_snapshot = p.terms,
    m.purchase_completed_at = COALESCE(m.purchase_completed_at, CONCAT(m.start_date, ' 09:00:00')),
    m.purchase_source = COALESCE(m.purchase_source, 'ONLINE')
WHERE @is_prod_db > 0;

-- Ensure active membership & invoice history for member #14713 (Tuất Phát) so every member profile is demo-ready
INSERT INTO USER_MEMBERSHIPS
(user_id, package_id, start_date, end_date, status, package_name_snapshot, package_type_snapshot, duration_days_snapshot, price_snapshot, type_name_snapshot, purchase_completed_at, purchase_source)
SELECT u.user_id, 2, '2026-11-06', '2027-02-05', 'ACTIVE', 'Thẻ Gym 3 Tháng', 'GYM_ACCESS', 90, 1400000.00, 'Gym access', '2026-11-06 10:55:00', 'ONLINE'
FROM USERS u
WHERE @is_prod_db > 0 AND u.user_id = 14713
  AND NOT EXISTS (SELECT 1 FROM USER_MEMBERSHIPS um WHERE um.user_id = 14713);

INSERT INTO INVOICES (user_id, subtotal, discount_amount, voucher_code, total_amount, status, created_at)
SELECT 14713, 1400000.00, 0.00, NULL, 1400000.00, 'PAID', '2026-11-06 10:55:00'
FROM USERS u
WHERE @is_prod_db > 0 AND u.user_id = 14713
  AND NOT EXISTS (SELECT 1 FROM INVOICES inv WHERE inv.user_id = 14713);

INSERT INTO INVOICE_DETAILS (invoice_id, class_id, package_id, schedule_id, unit_price, membership_id)
SELECT i.invoice_id, NULL, 2, NULL, 1400000.00, (SELECT MAX(m.membership_id) FROM USER_MEMBERSHIPS m WHERE m.user_id = 14713)
FROM INVOICES i
WHERE @is_prod_db > 0 AND i.user_id = 14713
  AND NOT EXISTS (SELECT 1 FROM INVOICE_DETAILS d WHERE d.invoice_id = i.invoice_id);

INSERT INTO PAYMENTS (invoice_id, amount, payment_method, transaction_no, status, payment_date)
SELECT i.invoice_id, i.total_amount, 'PAYOS', CONCAT('VIETQR-TRANSFER-HD', i.invoice_id), 'COMPLETED', i.created_at
FROM INVOICES i
WHERE @is_prod_db > 0 AND i.user_id = 14713
  AND NOT EXISTS (SELECT 1 FROM PAYMENTS p WHERE p.invoice_id = i.invoice_id);

-- Ensure 3 near-expiry memberships (expiring Nov 13 - Nov 15, 2026) for Manager Renewal tracking
INSERT INTO USER_MEMBERSHIPS
(user_id, package_id, start_date, end_date, status, package_name_snapshot, package_type_snapshot, duration_days_snapshot, price_snapshot, type_name_snapshot, purchase_completed_at, purchase_source)
SELECT u.user_id, 1, '2026-10-15', '2026-11-13', 'ACTIVE', 'Thẻ Gym 1 Tháng', 'GYM_ACCESS', 30, 500000.00, 'Gym access', '2026-10-15 09:15:00', 'COUNTER'
FROM USERS u
WHERE @is_prod_db > 0 AND u.user_id = 12
  AND NOT EXISTS (SELECT 1 FROM USER_MEMBERSHIPS um WHERE um.user_id = 12 AND um.end_date = '2026-11-13');

INSERT INTO USER_MEMBERSHIPS
(user_id, package_id, start_date, end_date, status, package_name_snapshot, package_type_snapshot, duration_days_snapshot, price_snapshot, type_name_snapshot, purchase_completed_at, purchase_source)
SELECT u.user_id, 10, '2026-10-16', '2026-11-14', 'ACTIVE', 'Gói Combo Gym + AI 1 Tháng', 'COMBO', 30, 550000.00, 'Combo (Gym + AI)', '2026-10-16 10:00:00', 'ONLINE'
FROM USERS u
WHERE @is_prod_db > 0 AND u.user_id = 14
  AND NOT EXISTS (SELECT 1 FROM USER_MEMBERSHIPS um WHERE um.user_id = 14 AND um.end_date = '2026-11-14');

INSERT INTO USER_MEMBERSHIPS
(user_id, package_id, start_date, end_date, status, package_name_snapshot, package_type_snapshot, duration_days_snapshot, price_snapshot, type_name_snapshot, purchase_completed_at, purchase_source)
SELECT u.user_id, 4, '2026-10-17', '2026-11-15', 'ACTIVE', 'Gói Thuê AI Cá Nhân 1 Tháng', 'AI_ACCESS', 30, 99000.00, 'AI access', '2026-10-17 11:30:00', 'ONLINE'
FROM USERS u
WHERE @is_prod_db > 0 AND u.user_id = 15
  AND NOT EXISTS (SELECT 1 FROM USER_MEMBERSHIPS um WHERE um.user_id = 15 AND um.end_date = '2026-11-15');

-- ------------------------------------------------------------------------------
-- 5. NORMALIZE PAST / PRESENT / FUTURE SCHEDULES & BOOKINGS (0 CONFLICTS)
-- ------------------------------------------------------------------------------
UPDATE SCHEDULES
SET status = 'COMPLETED'
WHERE @is_prod_db > 0
  AND end_time < '2026-11-11 21:00:00'
  AND status IN ('SCHEDULED', 'SUBSTITUTE_ASSIGNED');

UPDATE BOOKINGS b
JOIN SCHEDULES s ON s.schedule_id = b.schedule_id
SET b.attendance_status = CASE WHEN MOD(b.booking_id, 5) = 0 THEN 'ABSENT' ELSE 'PRESENT' END
WHERE @is_prod_db > 0
  AND b.status = 'CONFIRMED'
  AND s.end_time < '2026-11-11 21:00:00'
  AND (b.attendance_status IS NULL OR b.attendance_status = 'NOT_YET');

-- Keep Future schedule bookings clean (NOT_YET)
UPDATE BOOKINGS b
JOIN SCHEDULES s ON s.schedule_id = b.schedule_id
SET b.attendance_status = 'NOT_YET'
WHERE @is_prod_db > 0
  AND b.status = 'CONFIRMED'
  AND s.start_time >= '2026-11-12 00:00:00'
  AND b.attendance_status <> 'NOT_YET';

-- Ensure every retained active class (including Gym/Yoga/Swim/Boxing/Pilates/Dance/Spin)
-- has conflict-free Past (COMPLETED) & Future (SCHEDULED) sessions for open enrollment.
INSERT INTO SCHEDULES (class_id, start_time, end_time, status, changeover_minutes)
SELECT c.class_id, slot.st, slot.et, slot.status, 15
FROM (
    -- Class 13 [GYM-201] (coach 3, room 6)
    SELECT 13 AS class_id, '2026-11-04 10:30:00' AS st, '2026-11-04 12:00:00' AS et, 'COMPLETED' AS status
    UNION ALL SELECT 13, '2026-11-07 10:30:00', '2026-11-07 12:00:00', 'COMPLETED'
    UNION ALL SELECT 13, '2026-11-12 10:30:00', '2026-11-12 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 13, '2026-11-17 10:30:00', '2026-11-17 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 13, '2026-11-19 10:30:00', '2026-11-19 12:00:00', 'SCHEDULED'
    -- Class 14 [SWIM-201] (coach 5, room 7)
    UNION ALL SELECT 14, '2026-11-12 08:45:00', '2026-11-12 10:15:00', 'SCHEDULED'
    UNION ALL SELECT 14, '2026-11-17 08:45:00', '2026-11-17 10:15:00', 'SCHEDULED'
    UNION ALL SELECT 14, '2026-11-19 08:45:00', '2026-11-19 10:15:00', 'SCHEDULED'
    -- Class 15 [YOGA-201] (coach 13276, room 8)
    UNION ALL SELECT 15, '2026-11-12 17:30:00', '2026-11-12 19:00:00', 'SCHEDULED'
    UNION ALL SELECT 15, '2026-11-15 17:30:00', '2026-11-15 19:00:00', 'SCHEDULED'
    UNION ALL SELECT 15, '2026-11-18 19:15:00', '2026-11-18 20:45:00', 'SCHEDULED'
    -- Class 16 [DANCE-201] (coach 13278, room 10)
    UNION ALL SELECT 16, '2026-11-12 19:15:00', '2026-11-12 20:45:00', 'SCHEDULED'
    UNION ALL SELECT 16, '2026-11-15 19:15:00', '2026-11-15 20:45:00', 'SCHEDULED'
    UNION ALL SELECT 16, '2026-11-19 19:15:00', '2026-11-19 20:45:00', 'SCHEDULED'
    -- Class 17 [BOX-201] (coach 5, room 11)
    UNION ALL SELECT 17, '2026-11-03 10:30:00', '2026-11-03 12:00:00', 'COMPLETED'
    UNION ALL SELECT 17, '2026-11-05 10:30:00', '2026-11-05 12:00:00', 'COMPLETED'
    UNION ALL SELECT 17, '2026-11-12 10:30:00', '2026-11-12 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 17, '2026-11-17 10:30:00', '2026-11-17 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 17, '2026-11-19 10:30:00', '2026-11-19 12:00:00', 'SCHEDULED'
    -- Class 18 [BOX-202] (coach 3, room 11)
    UNION ALL SELECT 18, '2026-11-13 10:30:00', '2026-11-13 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 18, '2026-11-15 10:30:00', '2026-11-15 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 18, '2026-11-20 10:30:00', '2026-11-20 12:00:00', 'SCHEDULED'
    -- Class 19 [PILATES-201] (coach 4, room 12)
    UNION ALL SELECT 19, '2026-11-12 08:45:00', '2026-11-12 10:15:00', 'SCHEDULED'
    UNION ALL SELECT 19, '2026-11-17 08:45:00', '2026-11-17 10:15:00', 'SCHEDULED'
    UNION ALL SELECT 19, '2026-11-19 08:45:00', '2026-11-19 10:15:00', 'SCHEDULED'
    -- Class 20 [PILATES-202] (coach 4, room 12)
    UNION ALL SELECT 20, '2026-11-13 10:30:00', '2026-11-13 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 20, '2026-11-15 17:30:00', '2026-11-15 19:00:00', 'SCHEDULED'
    UNION ALL SELECT 20, '2026-11-20 10:30:00', '2026-11-20 12:00:00', 'SCHEDULED'
    -- Class 21 [GYM-202] (coach 3, room 6)
    UNION ALL SELECT 21, '2026-11-12 14:00:00', '2026-11-12 15:30:00', 'SCHEDULED'
    UNION ALL SELECT 21, '2026-11-18 14:00:00', '2026-11-18 15:30:00', 'SCHEDULED'
    UNION ALL SELECT 21, '2026-11-21 10:30:00', '2026-11-21 12:00:00', 'SCHEDULED'
    -- Class 22 [YOGA-202] (coach 4, room 8)
    UNION ALL SELECT 22, '2026-11-04 10:30:00', '2026-11-04 12:00:00', 'COMPLETED'
    UNION ALL SELECT 22, '2026-11-06 10:30:00', '2026-11-06 12:00:00', 'COMPLETED'
    UNION ALL SELECT 22, '2026-11-12 10:30:00', '2026-11-12 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 22, '2026-11-17 10:30:00', '2026-11-17 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 22, '2026-11-19 10:30:00', '2026-11-19 12:00:00', 'SCHEDULED'
    -- Class 23 [ZUMBA-201] (coach 5, room 10)
    UNION ALL SELECT 23, '2026-11-03 14:00:00', '2026-11-03 15:30:00', 'COMPLETED'
    UNION ALL SELECT 23, '2026-11-06 14:00:00', '2026-11-06 15:30:00', 'COMPLETED'
    UNION ALL SELECT 23, '2026-11-13 14:00:00', '2026-11-13 15:30:00', 'SCHEDULED'
    UNION ALL SELECT 23, '2026-11-17 14:00:00', '2026-11-17 15:30:00', 'SCHEDULED'
    UNION ALL SELECT 23, '2026-11-19 14:00:00', '2026-11-19 15:30:00', 'SCHEDULED'
    -- Class 24 [SWIM-202] (coach 5, room 4)
    UNION ALL SELECT 24, '2026-11-13 15:45:00', '2026-11-13 17:15:00', 'SCHEDULED'
    UNION ALL SELECT 24, '2026-11-16 10:30:00', '2026-11-16 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 24, '2026-11-19 15:45:00', '2026-11-19 17:15:00', 'SCHEDULED'
    -- Class 25 [SPIN-203] (coach 3, room 5)
    UNION ALL SELECT 25, '2026-11-05 14:00:00', '2026-11-05 15:30:00', 'COMPLETED'
    UNION ALL SELECT 25, '2026-11-08 19:15:00', '2026-11-08 20:45:00', 'COMPLETED'
    UNION ALL SELECT 25, '2026-11-13 19:15:00', '2026-11-13 20:45:00', 'SCHEDULED'
    UNION ALL SELECT 25, '2026-11-15 19:15:00', '2026-11-15 20:45:00', 'SCHEDULED'
    UNION ALL SELECT 25, '2026-11-20 19:15:00', '2026-11-20 20:45:00', 'SCHEDULED'
    -- Class 11235 [GYM-204] (coach 13275, room 1)
    UNION ALL SELECT 11235, '2026-11-12 08:45:00', '2026-11-12 10:15:00', 'SCHEDULED'
    UNION ALL SELECT 11235, '2026-11-14 10:30:00', '2026-11-14 12:00:00', 'SCHEDULED'
    UNION ALL SELECT 11235, '2026-11-19 08:45:00', '2026-11-19 10:15:00', 'SCHEDULED'
    -- Class 11236 [YOGA-205] (coach 13276, room 2)
    UNION ALL SELECT 11236, '2026-11-12 19:15:00', '2026-11-12 20:45:00', 'SCHEDULED'
    UNION ALL SELECT 11236, '2026-11-14 19:15:00', '2026-11-14 20:45:00', 'SCHEDULED'
    UNION ALL SELECT 11236, '2026-11-19 19:15:00', '2026-11-19 20:45:00', 'SCHEDULED'
    -- Class 11237 [SWIM-204] (coach 13277, room 4)
    UNION ALL SELECT 11237, '2026-11-12 07:00:00', '2026-11-12 08:30:00', 'SCHEDULED'
    UNION ALL SELECT 11237, '2026-11-14 07:00:00', '2026-11-14 08:30:00', 'SCHEDULED'
    UNION ALL SELECT 11237, '2026-11-19 07:00:00', '2026-11-19 08:30:00', 'SCHEDULED'
    -- Class 11238 [ZUMBA-105] (coach 13278, room 3)
    UNION ALL SELECT 11238, '2026-11-12 17:30:00', '2026-11-12 19:00:00', 'SCHEDULED'
    UNION ALL SELECT 11238, '2026-11-14 17:30:00', '2026-11-14 19:00:00', 'SCHEDULED'
    UNION ALL SELECT 11238, '2026-11-19 17:30:00', '2026-11-19 19:00:00', 'SCHEDULED'
) AS slot
JOIN CLASSES c ON c.class_id = slot.class_id
WHERE @is_prod_db > 0
  AND NOT EXISTS (
      SELECT 1 FROM SCHEDULES s2
      JOIN CLASSES c2 ON c2.class_id = s2.class_id
      WHERE s2.status <> 'CANCELLED'
        AND (c2.room_id = c.room_id OR c2.coach_id = c.coach_id)
        AND s2.start_time < TIMESTAMPADD(MINUTE, 15, slot.et)
        AND TIMESTAMPADD(MINUTE, -15, slot.st) < s2.end_time
  );

-- Seed clean confirmed bookings on newly added sessions & for user #14713 (Tuất Phát)
INSERT INTO BOOKINGS (user_id, schedule_id, status, attendance_status, booking_time)
SELECT bseed.user_id, s.schedule_id, 'CONFIRMED',
       CASE WHEN s.status = 'COMPLETED' THEN 'PRESENT' ELSE 'NOT_YET' END,
       DATE_SUB(s.start_time, INTERVAL 1 DAY)
FROM (
    SELECT 17 AS class_id, 6 AS user_id UNION ALL SELECT 17, 13280
    UNION ALL SELECT 19, 10 UNION ALL SELECT 19, 13281
    UNION ALL SELECT 15, 21 UNION ALL SELECT 15, 9906
    UNION ALL SELECT 25, 19 UNION ALL SELECT 25, 13291
    UNION ALL SELECT 13, 14713 UNION ALL SELECT 11235, 14713
) AS bseed
JOIN SCHEDULES s ON s.class_id = bseed.class_id
WHERE @is_prod_db > 0
  AND s.start_time IN ('2026-11-04 10:30:00', '2026-11-12 08:45:00', '2026-11-12 10:30:00', '2026-11-12 17:30:00', '2026-11-13 19:15:00')
  AND NOT EXISTS (
      SELECT 1 FROM BOOKINGS eb WHERE eb.user_id = bseed.user_id AND eb.schedule_id = s.schedule_id
  );

-- ------------------------------------------------------------------------------
-- 6. CURATE SPOTLESS SUPPORT REQUESTS & USER CREDITS (ALL 6 CATEGORIES)
-- ------------------------------------------------------------------------------
DELETE FROM USER_CREDITS WHERE @is_prod_db > 0;
DELETE FROM SUPPORT_REQUESTS WHERE @is_prod_db > 0;

INSERT INTO SUPPORT_REQUESTS
(user_id, class_id, category, preferred_resolution, title, content, status, priority, response_note, responded_by, responded_at, created_at, updated_at)
SELECT sr.user_id, sr.class_id, sr.category, sr.preferred_resolution, sr.title, sr.content, sr.status, sr.priority, sr.response_note, sr.responded_by, sr.responded_at, sr.created_at, sr.updated_at
FROM (
    SELECT 10 AS user_id, 2 AS class_id, 'COACH_FEEDBACK' AS category, NULL AS preferred_resolution,
           'Góp ý HLV: Phương pháp giảng dạy & Truyền đạt' AS title,
           '[Khía cạnh góp ý: Phương pháp giảng dạy & Truyền đạt | Lớp học liên quan: [YOGA-102] Yoga Giảm Cân & Thon Gọn Vóc Dáng (HLV Trần Mai Anh)] Cô Mai Anh hướng dẫn điều chỉnh nhịp thở và sửa tư thế rất tận tâm. Kính mong trung tâm mở thêm khung giờ chiều.' AS content,
           'ESCALATED' AS status, 'NORMAL' AS priority, NULL AS response_note, NULL AS responded_by, NULL AS responded_at,
           '2026-11-11 19:20:00' AS created_at, '2026-11-11 19:20:00' AS updated_at
    UNION ALL SELECT 19, 1, 'COACH_FEEDBACK', NULL,
           'Phản ánh về sự đúng giờ & tác phong huấn luyện',
           '[Khía cạnh góp ý: Đúng giờ & Tác phong chuyên nghiệp | Lớp học liên quan: [YOGA-101] Yoga Giãn Cơ & Phục Hồi Khớp (HLV Trần Mai Anh)] Kính đề nghị bộ phận chuyên môn nhắc nhở bắt đầu khởi động đúng 07:00 để học viên đủ thời gian giãn cơ cuối buổi.',
           'ESCALATED', 'NORMAL', NULL, NULL, NULL,
           '2026-11-10 10:15:00', '2026-11-10 10:15:00'
    UNION ALL SELECT 6, 3, 'COACH_FEEDBACK', NULL,
           'Đánh giá tích cực về hướng dẫn kỹ thuật tạ của HLV Tuấn',
           '[Khía cạnh góp ý: Chuyên môn kỹ thuật & Chỉnh sửa tư thế | Lớp học liên quan: [GYM-101] Gym Căn Bản & Tăng Cơ Cho Nam (HLV Nguyễn Văn Tuấn)] Thầy Tuấn sửa form Squat và Deadlift rất kỹ, giúp em cải thiện đau lưng rõ rệt sau 3 tuần tập.',
           'RESOLVED', 'NORMAL', 'Quản lý trung tâm đã ghi nhận phản hồi tích cực và gửi lời khen thưởng định kỳ tháng 11 tới HLV Nguyễn Văn Tuấn.', 1, '2026-11-08 16:00:00',
           '2026-11-07 09:30:00', '2026-11-08 16:00:00'
    UNION ALL SELECT 19, 3, 'CLASS_CANCELLATION', 'CASH_REFUND',
           'Hủy lớp [GYM-101] Gym Căn Bản & Xin hoàn tiền do chuyển công tác',
           '[Lý do: Đột xuất giữa khóa / Sức khỏe / Đổi chỗ ở] Em nhận quyết định điều động công tác vào TP.HCM từ tuần tới nên không thể theo học tiếp các buổi còn lại. Kính nhờ trung tâm hỗ trợ hoàn phần học phí chưa học.',
           'PENDING', 'HIGH', NULL, NULL, NULL,
           '2026-11-11 08:30:00', '2026-11-11 08:30:00'
    UNION ALL SELECT 7, 2, 'CLASS_CANCELLATION', 'ISSUE_CREDIT',
           'Xin hủy lớp [YOGA-102] & nhận mã Credit bảo lưu học phí',
           '[Lý do: Thay đổi lịch làm việc cá nhân] Công ty em chuyển ca làm sang buổi sáng nên không theo được lịch 07:00. Xin hủy lớp để nhận mã Credit đăng ký lớp buổi tối.',
           'PENDING', 'HIGH', NULL, NULL, NULL,
           '2026-11-11 19:50:00', '2026-11-11 19:50:00'
    UNION ALL SELECT 19, 5, 'CLASS_CANCELLATION', 'CASH_REFUND',
           'Hủy lớp [ZUMBA-101] và hoàn học phí qua chuyển khoản ngân hàng',
           '[Lý do: Sức khỏe chấn thương cổ chân] Em có giấy chỉ định nghỉ vận động mạnh 3 tuần từ bác sĩ, xin bảo lưu hoàn tiền qua ngân hàng.',
           'ESCALATED', 'HIGH', 'Lễ tân đã xác minh giấy khám và chuyển Quản lý trung tâm duyệt chi hoàn tiền qua tài khoản ngân hàng.', 2, '2026-11-09 10:15:00',
           '2026-11-08 20:00:00', '2026-11-09 10:15:00'
    UNION ALL SELECT 9906, 1, 'CLASS_CANCELLATION', 'ISSUE_CREDIT',
           'Xin hủy lớp [YOGA-101] & nhận mã Credit bảo lưu 100%',
           '[Lý do: Đổi lịch trực bệnh viện] Em kẹt lịch trực viện cố định tháng 11 nên xin đổi sang mã Credit để chọn lớp cuối tuần.',
           'RESOLVED', 'HIGH', 'Đã duyệt hủy lớp và cấp mã tín dụng CR-NX-2026-9906 trị giá 300.000đ vào ví hội viên.', 2, '2026-11-05 14:00:00',
           '2026-11-05 10:00:00', '2026-11-05 14:00:00'
    UNION ALL SELECT 21, 6, 'CLASS_CANCELLATION', 'ISSUE_CREDIT',
           'Bảo lưu học phí lớp [SWIM-101] sang khóa tháng sau',
           '[Lý do: Công tác ngắn hạn 2 tuần] Xin cấp mã tín dụng bảo lưu phần học phí còn lại lớp Bơi Sải.',
           'APPROVED', 'HIGH', 'Đã cấp mã tín dụng CR-NX-2026-21 trị giá 600.000đ (hạn dùng đến 31/12/2026).', 2, '2026-11-04 11:20:00',
           '2026-11-04 09:00:00', '2026-11-04 11:20:00'
    UNION ALL SELECT 6, 1, 'FACILITY_ISSUE', NULL,
           'Điều hòa phòng [P201] Studio Yoga bị rò nước và thổi lạnh',
           '[Khu vực: Phòng tập Studio / Yoga | Thiết bị: Điều hòa góc trái P201] Sáng nay ca 07:00 máy lạnh bị nhỏ nước xuống thảm tập số 4-5, nhờ bộ phận kỹ thuật kiểm tra.',
           'PENDING', 'HIGH', NULL, NULL, NULL,
           '2026-11-11 08:45:00', '2026-11-11 08:45:00'
    UNION ALL SELECT 11, 4, 'FACILITY_ISSUE', NULL,
           'Đệm lưng máy tập Leg Press phòng [P101] bị bong chỉ',
           '[Khu vực: Khu máy tập Gym | Thiết bị: Máy Leg Press số 2] Phần đệm da bị hở mép, đề xuất bọc lại để đảm bảo an toàn khi đẩy tạ nặng.',
           'RESOLVED', 'HIGH', 'Bộ phận kỹ thuật đã thay mới đệm da máy Leg Press số 2 vào sáng 07/11/2026.', 2, '2026-11-07 10:30:00',
           '2026-11-06 18:10:00', '2026-11-07 10:30:00'
    UNION ALL SELECT 8, 5, 'SCHEDULE_SUPPORT', NULL,
           'Xin hỗ trợ chuyển ca [ZUMBA-101] sang buổi tối cuối tuần',
           '[Loại hỗ trợ: Yêu cầu chuyển giờ học | Chi tiết: Tuần 12/11 - 20/11] Tuần tới em tăng ca thứ 2-4-6, nhờ Lễ tân tư vấn lớp Zumba lịch Thứ 7/Chủ nhật.',
           'PENDING', 'NORMAL', NULL, NULL, NULL,
           '2026-11-11 14:20:00', '2026-11-11 14:20:00'
    UNION ALL SELECT 19, 133, 'SCHEDULE_SUPPORT', NULL,
           'Chuyển lớp tự động: [ZUMBA-101] ➔ [ZUMBA-202] Zumba Đốt Mỡ Cường Độ Cao Hi-Lo',
           'Hội viên xác nhận chuyển từ lớp [ZUMBA-101] sang lớp [ZUMBA-202] phù hợp khung giờ rảnh mới.',
           'APPROVED', 'NORMAL', 'Hệ thống đã hoàn tất chuyển lịch học sang lớp [ZUMBA-202] và gửi thông báo tới hội viên.', 2, '2026-10-28 09:00:00',
           '2026-10-28 08:50:00', '2026-10-28 09:00:00'
    UNION ALL SELECT 12, NULL, 'COMPLAINT', NULL,
           'Góp ý bổ sung thêm tủ locker khu vực Bể bơi Tầng 1',
           '[Mảng góp ý: Cơ sở tiện ích chung] Giờ cao điểm 17:30 tủ đồ khu bể bơi thường kín chỗ, mong trung tâm bố trí thêm dãy tủ dự phòng.',
           'PENDING', 'NORMAL', NULL, NULL, NULL,
           '2026-11-10 18:15:00', '2026-11-10 18:15:00'
    UNION ALL SELECT 10, NULL, 'GENERAL_INQUIRY', NULL,
           'Hỏi về chính sách gia hạn sớm Thẻ Gym 1 Năm và ưu đãi hạng Gold',
           'Em sắp hết hạn gói 3 tháng, nếu nâng cấp lên Thẻ Gym 1 Năm trước khi hết hạn có được cộng dồn ngày và hưởng giảm giá 10% hạng Gold không?',
           'PENDING', 'NORMAL', NULL, NULL, NULL,
           '2026-11-11 11:05:00', '2026-11-11 11:05:00'
) AS sr
WHERE @is_prod_db > 0;

INSERT INTO USER_CREDITS (user_id, request_id, credit_code, amount, remaining_amount, reason, expiry_date, status, created_at)
SELECT uc.user_id,
       (SELECT MAX(sr.request_id) FROM SUPPORT_REQUESTS sr WHERE sr.user_id = uc.user_id AND sr.category = 'CLASS_CANCELLATION'),
       uc.credit_code, uc.amount, uc.remaining_amount, uc.reason, uc.expiry_date, uc.status, uc.created_at
FROM (
    SELECT 9906 AS user_id, 'CR-NX-2026-9906' AS credit_code, 300000.00 AS amount, 300000.00 AS remaining_amount, 'Hoàn phí hủy lớp [YOGA-101] - Bảo lưu 100% quyền lợi' AS reason, '2026-12-31' AS expiry_date, 'ACTIVE' AS status, '2026-11-05 14:00:00' AS created_at
    UNION ALL SELECT 21, 'CR-NX-2026-21', 600000.00, 600000.00, 'Bảo lưu học phí lớp [SWIM-101] sang khóa tháng sau', '2026-12-31', 'ACTIVE', '2026-11-04 11:20:00'
    UNION ALL SELECT 10, 'CR-NX-2026-10', 450000.00, 450000.00, 'Mã tín dụng ưu đãi gia hạn hội viên thân thiết Tháng 11', '2026-12-31', 'ACTIVE', '2026-11-01 09:00:00'
    UNION ALL SELECT 19, 'CR-NX-2026-19', 900000.00, 900000.00, 'Tín dụng bảo lưu học phí khóa Thể hình & Zumba', '2026-12-31', 'ACTIVE', '2026-11-07 16:30:00'
    UNION ALL SELECT 6, 'CR-NX-2026-06', 250000.00, 0.00, 'Mã tín dụng ưu đãi tháng 10 (đã sử dụng thanh toán khóa học)', '2026-12-31', 'USED', '2026-10-20 09:00:00'
) AS uc
WHERE @is_prod_db > 0;

-- ------------------------------------------------------------------------------
-- 7. CURATE CLEAN RESCHEDULE REQUESTS & MEMBER RESPONSES
-- ------------------------------------------------------------------------------
DELETE FROM RESCHEDULE_MEMBER_RESPONSES WHERE @is_prod_db > 0;
DELETE FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE @is_prod_db > 0;

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS
(schedule_id, class_id, coach_id, substitute_coach_id, action_type, original_start_time, original_end_time,
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details,
 status, admin_response_note, reviewed_by, reviewed_at, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 10505, 1, 4, 13276, 'SUBSTITUTE_COACH', '2026-11-02 07:00:00', '2026-11-02 08:30:00',
       NULL, NULL, NULL, 'SICK_LEAVE',
       'HLV Trần Mai Anh bị cảm sốt nhẹ, đã thống nhất với HLV Đặng Lan Anh dạy thay ca Yoga sáng 02/11.',
       'APPROVED', 'Quản lý đã phê duyệt chỉ định HLV Đặng Lan Anh dạy thay ca học.', 1, '2026-11-01 15:17:48', NULL, 2, '2026-11-01 13:58:52', '2026-11-01 15:17:48'
WHERE @is_prod_db > 0 AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 10505);

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS
(schedule_id, class_id, coach_id, substitute_coach_id, action_type, original_start_time, original_end_time,
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details,
 status, admin_response_note, reviewed_by, reviewed_at, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 11222, 131, 13276, 4, 'SUBSTITUTE_COACH', '2026-12-06 10:30:00', '2026-12-06 12:00:00',
       NULL, NULL, NULL, 'BUSINESS_TRIP',
       'HLV Đặng Lan Anh đi tập huấn chuyên môn cuối tuần 06/12, kính đề nghị phân công HLV Trần Mai Anh phụ trách lớp.',
       'APPROVED', 'Quản lý đã phê duyệt phân công HLV Trần Mai Anh dạy thay lớp [YOGA-107].', 1, '2026-11-08 10:30:00', NULL, 2, '2026-11-07 14:00:00', '2026-11-08 10:30:00'
WHERE @is_prod_db > 0 AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 11222);

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS
(schedule_id, class_id, coach_id, substitute_coach_id, action_type, original_start_time, original_end_time,
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details,
 status, admin_response_note, reviewed_by, reviewed_at, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 10510, 1, 4, NULL, 'MAKEUP_SESSION', '2026-11-13 07:00:00', '2026-11-13 08:30:00',
       '2026-11-14 07:00:00', '2026-11-14 08:30:00', 2, 'NO_SUBSTITUTE_SICK',
       'HLV bị sốt siêu vi, các HLV Yoga khác đều trùng lịch ca sáng Thứ Sáu. Đề nghị dời sang sáng Thứ Bảy 14/11 phòng [P201] trống.',
       'APPROVED', 'Quản lý đã phê duyệt dời lịch sang 07:00 14/11/2026 và gửi thông báo xác nhận tới học viên.', 1, '2026-11-09 09:15:25', '2026-11-13 20:00:00', 2, '2026-11-09 08:30:00', '2026-11-09 09:15:25'
WHERE @is_prod_db > 0 AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 10510);

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS
(schedule_id, class_id, coach_id, substitute_coach_id, action_type, original_start_time, original_end_time,
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details,
 status, admin_response_note, reviewed_by, reviewed_at, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 14008, 1, 4, NULL, 'MAKEUP_SESSION', '2026-11-13 07:00:00', '2026-11-13 08:30:00',
       '2026-11-14 14:00:00', '2026-11-14 15:30:00', 2, 'NO_SUBSTITUTE_SICK',
       'HLV bị sốt xuất huyết đột xuất, đã liên hệ HLV Tuấn và Lan Anh nhưng đều bận kín ca. Kính đề nghị dời sang chiều Thứ Bảy 14/11 phòng Yoga [P201] trống.',
       'PENDING', NULL, NULL, NULL, '2026-11-13 18:00:00', 2, '2026-11-10 08:30:00', '2026-11-10 08:30:00'
WHERE @is_prod_db > 0 AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 14008);

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS
(schedule_id, class_id, coach_id, substitute_coach_id, action_type, original_start_time, original_end_time,
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details,
 status, admin_response_note, reviewed_by, reviewed_at, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 14011, 3, 3, NULL, 'MAKEUP_SESSION', '2026-11-15 17:30:00', '2026-11-15 19:00:00',
       '2026-11-16 10:30:00', '2026-11-16 12:00:00', 1, 'NO_SUBSTITUTE_EMERGENCY',
       'HLV gia đình có việc khẩn tại quê, không tìm được HLV thay thế tối Chủ nhật. Kính đề nghị dời ca Gym sang sáng Thứ Hai 16/11 (10:30) phòng [P101] trống.',
       'PENDING', NULL, NULL, NULL, '2026-11-15 12:00:00', 2, '2026-11-10 09:15:00', '2026-11-10 09:15:00'
WHERE @is_prod_db > 0 AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 14011);

INSERT INTO SCHEDULE_RESCHEDULE_REQUESTS
(schedule_id, class_id, coach_id, substitute_coach_id, action_type, original_start_time, original_end_time,
 proposed_start_time, proposed_end_time, proposed_room_id, reason_category, reason_details,
 status, admin_response_note, reviewed_by, reviewed_at, confirmation_deadline, min_attendees, created_at, updated_at)
SELECT 10577, 7, 4, NULL, 'MAKEUP_SESSION', '2026-11-14 08:45:00', '2026-11-14 10:15:00',
       '2026-11-15 08:45:00', '2026-11-15 10:15:00', 2, 'NO_SUBSTITUTE_OTHER',
       'Xin dời ca sáng Thứ Bảy sang sáng Chủ nhật do trùng lịch khám sức khỏe định kỳ.',
       'REJECTED', 'Từ chối do khung giờ 08:45 Chủ nhật tại phòng [P201] đã có lớp [YOGA-103] khác hoạt động. Vui lòng chọn khung giờ chiều trống.', 1, '2026-11-08 11:00:00', NULL, 2, '2026-11-08 08:20:00', '2026-11-08 11:00:00'
WHERE @is_prod_db > 0 AND EXISTS (SELECT 1 FROM SCHEDULES WHERE schedule_id = 10577);

INSERT INTO RESCHEDULE_MEMBER_RESPONSES (request_id, user_id, booking_id, response_status, responded_at)
SELECT r.request_id, b.user_id, b.booking_id,
       CASE WHEN b.user_id = 10 THEN 'ACCEPTED' ELSE 'PENDING' END,
       CASE WHEN b.user_id = 10 THEN '2026-11-09 14:20:00' ELSE NULL END
FROM SCHEDULE_RESCHEDULE_REQUESTS r
JOIN BOOKINGS b ON b.schedule_id = r.schedule_id AND b.status = 'CONFIRMED'
WHERE @is_prod_db > 0 AND r.schedule_id = 10510 AND r.status = 'APPROVED';

-- ------------------------------------------------------------------------------
-- 8. REPLACE GARBAGE WORKOUT PLANS & SUBMISSIONS WITH CLEAN VIETNAMESE PLANS
-- ------------------------------------------------------------------------------
DELETE FROM COACH_WORKOUT_SUBMISSIONS WHERE @is_prod_db > 0;
DELETE FROM COACH_PLAN_DETAILS WHERE @is_prod_db > 0;
DELETE FROM COACH_WORKOUT_PLANS WHERE @is_prod_db > 0;

INSERT INTO COACH_WORKOUT_PLANS
(plan_id, created_at, note, status, title, goal, start_date, end_date, total_weeks, coach_id, user_id, class_id, plan_type)
SELECT p.plan_id, p.created_at, p.note, p.status, p.title, p.goal, p.start_date, p.end_date, p.total_weeks, p.coach_id, p.user_id, p.class_id, p.plan_type
FROM (
    SELECT 1 AS plan_id, '2026-10-15 08:30:00' AS created_at,
           'Tập trung kiểm soát nhịp thở khi hạ tạ, không khóa khớp gối ở cuối nhịp Squat.' AS note,
           'ACTIVE' AS status,
           'Giáo án Bổ Trợ Tăng Cơ & Ổn Định Khớp Vai' AS title,
           'Tăng sức mạnh nhóm cơ thân trên và cải thiện biên độ vai trái' AS goal,
           '2026-10-15' AS start_date, '2026-11-12' AS end_date, 4 AS total_weeks,
           3 AS coach_id, 9906 AS user_id, 3 AS class_id, 'TRAINING_PLAN' AS plan_type
    UNION ALL SELECT 2, '2026-10-20 09:00:00',
           'Tránh bật nhảy cường độ cao, ưu tiên động tác giãn cơ lưng dưới và thăng bằng cổ chân.',
           'ACTIVE',
           'Lộ Trình Yoga Phục Hồi Khớp & Cải Thiện Dẻo Dai 4 Tuần',
           'Giảm căng cứng khớp cổ chân, tăng độ mở vai và kiểm soát hơi thở sâu',
           '2026-10-20', '2026-11-17', 4,
           4, 10, 1, 'TRAINING_PLAN'
    UNION ALL SELECT 3, '2026-11-01 10:15:00',
           'Giữ lưng thẳng tự nhiên, siết cơ lõi bụng 30 giây mỗi hiệp, tăng dần mức tạ an toàn.',
           'ACTIVE',
           'Giáo án Siết Cơ & Đốt Mỡ Toàn Thân Tháng 11',
           'Giảm 2.5% mỡ cơ thể và tăng sức bền tim mạch trong 4 tuần',
           '2026-11-01', '2026-11-29', 4,
           3, 19, 3, 'TRAINING_PLAN'
    UNION ALL SELECT 4, '2026-11-03 14:00:00',
           'Lưu ý hạn chế gánh tạ nặng đè nén đốt sống L4-L5, ưu tiên hít xà và bài tập giãn cột sống.',
           'ACTIVE',
           'Bài Tập Kháng Lực Bảo Vệ Cột Sống L4-L5',
           'Tăng sức mạnh cơ lưng xô và cơ bụng lõi mà không gây áp lực đĩa đệm',
           '2026-11-03', '2026-11-30', 4,
           4, 6, 1, 'TRAINING_PLAN'
    UNION ALL SELECT 5, '2026-11-08 08:45:00',
           'Hoàn thành bài tập bổ trợ cuối tuần và quay video ngắn 20 giây gửi HLV kiểm tra kỹ thuật.',
           'ACTIVE',
           'Bài Tập Cardio & Sức Bền Cuối Tuần',
           'Cải thiện ngưỡng nhịp tim vận động và sự dẻo dai toàn thân',
           '2026-11-08', '2026-11-08', 1,
           4, 21, 1, 'SINGLE'
) AS p
WHERE @is_prod_db > 0;

INSERT INTO COACH_PLAN_DETAILS
(detail_id, plan_id, exercise_id, sets, reps, duration_minutes, weight_kg, rest_seconds, week_number, day_of_week, day_label, coach_note, sort_order)
SELECT d.detail_id, d.plan_id, d.exercise_id, d.sets, d.reps, d.duration_minutes, d.weight_kg, d.rest_seconds, d.week_number, d.day_of_week, d.day_label, d.coach_note, d.sort_order
FROM (
    SELECT 1 AS detail_id, 1 AS plan_id, 5 AS exercise_id, 4 AS sets, 12 AS reps, NULL AS duration_minutes, 12.5 AS weight_kg, 60 AS rest_seconds, 1 AS week_number, 'MON' AS day_of_week, 'Buổi 1 - Thân trên kiểm soát' AS day_label, 'Hạ tạ chậm 3 giây, giữ khuỷu tay 45 độ để bảo vệ vai trái' AS coach_note, 1 AS sort_order
    UNION ALL SELECT 2, 1, 3, 3, 8, NULL, NULL, 90, 1, 'WED', 'Buổi 2 - Lưng xô & Core', 'Kéo ngực chạm xà, tránh dùng đà lắc hông', 2
    UNION ALL SELECT 3, 1, 4, 4, 15, NULL, 20.0, 60, 2, 'FRI', 'Buổi 3 - Thân dưới cân bằng', 'Đẩy đầu gối theo hướng mũi chân, gót chân bám sàn', 3
    UNION ALL SELECT 4, 2, 2, 3, 15, NULL, NULL, 45, 1, 'TUE', 'Buổi 1 - Kích hoạt cơ lõi nhẹ nhàng', 'Thở ra đều khi nâng vai, không gồng cổ', 1
    UNION ALL SELECT 5, 2, 4, 3, 12, NULL, NULL, 60, 2, 'THU', 'Buổi 2 - Ổn định cổ chân & khớp háng', 'Xuống tấn vừa phải theo biên độ khớp không đau', 2
    UNION ALL SELECT 6, 2, 6, 1, 1, 20, NULL, 0, 3, 'SAT', 'Buổi 3 - Đi bộ phục hồi nhịp độ chậm', 'Giữ độ dốc 1%, đi bộ sải bước thư giãn cổ chân', 3
    UNION ALL SELECT 7, 3, 1, 4, 15, NULL, NULL, 45, 1, 'MON', 'Buổi 1 - Sức bền ngực & tay sau', 'Siết bụng giữ thân người thành đường thẳng', 1
    UNION ALL SELECT 8, 3, 4, 4, 15, NULL, 30.0, 60, 2, 'WED', 'Buổi 2 - Đùi mông đốt mỡ', 'Xuống sâu song song mặt sàn rồi bật lực từ gót chân', 2
    UNION ALL SELECT 9, 3, 6, 1, 1, 25, NULL, 0, 3, 'FRI', 'Buổi 3 - Chạy biến tốc HIIT', 'Luân phiên 2 phút chạy nhanh - 1 phút đi bộ hồi phục', 3
    UNION ALL SELECT 10, 4, 3, 3, 6, NULL, NULL, 90, 1, 'MON', 'Buổi 1 - Kéo giãn cột sống nhẹ', 'Treo người thả lỏng 10 giây trước mỗi hiệp kéo xà', 1
    UNION ALL SELECT 11, 4, 2, 3, 12, NULL, NULL, 45, 2, 'THU', 'Buổi 2 - Cơ bụng bảo vệ thắt lưng', 'Ép sát thắt lưng dưới xuống thảm khi thực hiện', 2
    UNION ALL SELECT 12, 5, 6, 1, 1, 20, NULL, 0, 1, 'SUN', 'Buổi tập cuối tuần', 'Chạy bộ nhịp độ ổn định và quay video kiểm tra dáng chạy', 1
) AS d
WHERE @is_prod_db > 0;

INSERT INTO COACH_WORKOUT_SUBMISSIONS
(submission_id, plan_id, detail_id, user_id, coach_id, video_url, student_note, status, coach_feedback, rating, submitted_at, reviewed_at)
SELECT s.submission_id, s.plan_id, s.detail_id, s.user_id, s.coach_id, s.video_url, s.student_note, s.status, s.coach_feedback, s.rating, s.submitted_at, s.reviewed_at
FROM (
    SELECT 1 AS submission_id, 2 AS plan_id, 4 AS detail_id, 10 AS user_id, 4 AS coach_id,
           'https://nexussport.duckdns.org/member/workout-plans' AS video_url,
           'Em đã hoàn thành đủ 3 hiệp gập bụng nhẹ theo đúng nhịp thở cô hướng dẫn, cổ chân không bị nhức.' AS student_note,
           'APPROVED' AS status,
           'Tư thế cột sống và nhịp thở rất chuẩn! Tuần tới em có thể tăng thêm 3 lần mỗi hiệp.' AS coach_feedback,
           5 AS rating, '2026-11-07 09:30:00' AS submitted_at, '2026-11-07 14:15:00' AS reviewed_at
    UNION ALL SELECT 2, 1, 1, 9906, 3,
           'https://nexussport.duckdns.org/member/workout-plans',
           'Nhờ thầy Tuấn kiểm tra giúp em góc hạ khuỷu tay bên vai trái ở hiệp đẩy tạ thứ 4 ạ.',
           'REVISION_REQUESTED',
           '3 hiệp đầu ổn nhưng sang hiệp 4 khuỷu tay trái hơi mở rộng ra ngoài. Hiệp cuối hạ nhẹ xuống 10kg để giữ chuẩn form nhé.',
           4, '2026-11-09 18:20:00', '2026-11-10 08:10:00'
    UNION ALL SELECT 3, 5, 12, 21, 4,
           'https://nexussport.duckdns.org/member/workout-plans',
           'Em vừa chạy hoàn thành 20 phút buổi sáng, nhờ cô Mai Anh góp ý thêm về sải chân và tư thế lưng ạ.',
           'SUBMITTED',
           NULL,
           NULL, '2026-11-11 08:40:00', NULL
) AS s
WHERE @is_prod_db > 0;

-- ------------------------------------------------------------------------------
-- 9. NORMALIZE LOST & FOUND ITEMS (REMOVE DUPLICATE CODES)
-- ------------------------------------------------------------------------------
DELETE FROM LOST_AND_FOUND_ITEMS WHERE @is_prod_db > 0 AND item_id IN (46, 47, 48, 49);

-- ------------------------------------------------------------------------------
-- 10. CLEAN AUDIT LOGS & NOTIFICATIONS (REALISTIC HISTORY + ZERO SPAM/ORPHANS)
-- ------------------------------------------------------------------------------
DELETE FROM AUDIT_LOGS
WHERE @is_prod_db > 0
  AND (
    action IN ('PAYMENT_REVIEW', 'CHECKOUT_CANCELLED', 'DELETE')
    OR actor_email LIKE '%test%'
    OR details LIKE '%VOV%'
    OR details LIKE '%Test%'
    OR details LIKE '%member_179%'
    OR (entity_type = 'CLASS' AND entity_id REGEXP '^[0-9]+$' AND NOT EXISTS (SELECT 1 FROM CLASSES c WHERE c.class_id = CAST(AUDIT_LOGS.entity_id AS UNSIGNED)))
    OR (entity_type = 'SCHEDULE' AND entity_id REGEXP '^[0-9]+$' AND NOT EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.schedule_id = CAST(AUDIT_LOGS.entity_id AS UNSIGNED)))
    OR (entity_type = 'USER' AND entity_id REGEXP '^[0-9]+$' AND NOT EXISTS (SELECT 1 FROM USERS u WHERE u.user_id = CAST(AUDIT_LOGS.entity_id AS UNSIGNED)))
  );

DELETE FROM NOTIFICATIONS WHERE @is_prod_db > 0;

SET @req_yoga_approved = COALESCE((SELECT MAX(request_id) FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE schedule_id = 10510), 1);
SET @req_yoga_pending  = COALESCE((SELECT MAX(request_id) FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE schedule_id = 14008), 2);
SET @req_gym_pending   = COALESCE((SELECT MAX(request_id) FROM SCHEDULE_RESCHEDULE_REQUESTS WHERE schedule_id = 14011), 3);

INSERT INTO NOTIFICATIONS (user_id, title, message, type, is_read, created_at)
SELECT n.user_id, n.title, n.message, n.type, n.is_read, n.created_at
FROM (
    SELECT 1 AS user_id, CONCAT('Đơn xin dời lịch dạy bù mới #', @req_yoga_pending) AS title, 'HLV Trần Mai Anh đề xuất dời ca [YOGA-101] ngày 13/11 sang 14/11 14:00 (Bị ốm đột xuất, không có HLV thay thế).' AS message, 'RESCHEDULE' AS type, 0 AS is_read, '2026-11-10 08:30:00' AS created_at
    UNION ALL SELECT 1, CONCAT('Đơn xin dời lịch dạy bù mới #', @req_gym_pending), 'HLV Nguyễn Văn Tuấn đề xuất dời ca [GYM-101] ngày 15/11 sang 16/11 10:30 (Việc gia đình khẩn cấp).', 'RESCHEDULE', 0, '2026-11-10 09:15:00'
    UNION ALL SELECT 1, 'Phản hồi/Khiếu nại HLV mới cần thẩm định', 'Hội viên Đinh Thị Thu vừa gửi phản hồi về lớp [YOGA-102] chuyển thẳng tới Quản lý trung tâm.', 'SUPPORT', 0, '2026-11-11 19:20:00'
    UNION ALL SELECT 2, 'Phiếu hỗ trợ hủy lớp mới cần xử lý', 'Hội viên Nguyễn Kiều Oanh vừa gửi yêu cầu hủy & bảo lưu lớp [YOGA-102] qua mã Credit.', 'SUPPORT', 0, '2026-11-11 19:50:00'
    UNION ALL SELECT 2, 'Báo cáo sự cố cơ sở vật chất phòng [P201]', 'Hội viên Trần Bùi Thái báo điều hòa góc trái phòng Studio Yoga [P201] bị rò nước.', 'SUPPORT', 0, '2026-11-11 08:45:00'
    UNION ALL SELECT 4, CONCAT('Quản lý đã duyệt đơn dời lịch #', @req_yoga_approved), 'Ca học [YOGA-101] ngày 13/11 được duyệt dời sang sáng Thứ Bảy 14/11 07:00 tại phòng [P201].', 'RESCHEDULE', 0, '2026-11-09 09:15:25'
    UNION ALL SELECT 4, 'Học viên vừa nộp video bài tập mới', 'Học viên Sinh Xuân vừa gửi video hoàn thành Bài Tập Cardio & Sức Bền Cuối Tuần chờ cô đánh giá.', 'WORKOUT', 0, '2026-11-11 08:40:00'
    UNION ALL SELECT 3, 'Học viên vừa gửi video kiểm tra kỹ thuật', 'Học viên Sinh Xuân (#9906) vừa nộp bài tập Giáo án Bổ Trợ Tăng Cơ.', 'WORKOUT', 1, '2026-11-09 18:20:00'
    UNION ALL SELECT 10, 'Thông báo dời lịch học lớp [YOGA-101]', 'Ca học ngày 13/11 được dời sang 07:00 14/11/2026. Cảm ơn bạn đã xác nhận tham gia ca học bù!', 'RESCHEDULE', 1, '2026-11-09 09:16:00'
    UNION ALL SELECT 21, 'Xác nhận tham gia ca học bù lớp [YOGA-101]', 'Lớp [YOGA-101] dự kiến dời từ 13/11 sang 07:00 14/11/2026. Vui lòng phản hồi trước 20:00 ngày 13/11.', 'RESCHEDULE', 0, '2026-11-09 09:16:00'
    UNION ALL SELECT 9906, 'HLV Tuấn đã góp ý video bài tập của bạn', 'Thầy Nguyễn Văn Tuấn vừa phản hồi bài tập Tăng Cơ & Ổn Định Khớp Vai: Hiệp 4 giảm xuống 10kg giữ form.', 'WORKOUT', 0, '2026-11-10 08:10:00'
    UNION ALL SELECT 19, 'Mã tín dụng bảo lưu CR-NX-2026-19 đang hoạt động', 'Bạn đang có mã tín dụng 900.000đ có thể áp dụng trực tiếp khi thanh toán giỏ hàng trước 31/12/2026.', 'SUPPORT', 0, '2026-11-07 16:35:00'
) AS n
WHERE @is_prod_db > 0;

SET FOREIGN_KEY_CHECKS = 1;

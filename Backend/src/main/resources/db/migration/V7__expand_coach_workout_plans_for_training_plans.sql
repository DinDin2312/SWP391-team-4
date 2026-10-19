-- V7: Expand COACH_WORKOUT_PLANS and COACH_PLAN_DETAILS for Training Plans (Milestones/Weeks/Days)

-- ========================================================
-- 1. Thêm các cột cho bảng COACH_WORKOUT_PLANS
-- ========================================================

-- Phân loại: 'SINGLE' (giao bài tập 1 lần cũ) | 'TRAINING_PLAN' (kế hoạch tập luyện theo mốc/tuần)
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_WORKOUT_PLANS' AND COLUMN_NAME = 'plan_type'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_WORKOUT_PLANS` ADD COLUMN `plan_type` VARCHAR(30) NOT NULL DEFAULT \'SINGLE\' AFTER `class_id`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mục tiêu tập luyện: "Giảm 3kg trong 4 tuần", "Tăng sức bền",...
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_WORKOUT_PLANS' AND COLUMN_NAME = 'goal'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_WORKOUT_PLANS` ADD COLUMN `goal` VARCHAR(255) NULL AFTER `title`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ngày bắt đầu kế hoạch
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_WORKOUT_PLANS' AND COLUMN_NAME = 'start_date'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_WORKOUT_PLANS` ADD COLUMN `start_date` DATE NULL AFTER `goal`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ngày kết thúc kế hoạch
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_WORKOUT_PLANS' AND COLUMN_NAME = 'end_date'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_WORKOUT_PLANS` ADD COLUMN `end_date` DATE NULL AFTER `start_date`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tổng số tuần (số mốc tuần của kế hoạch)
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_WORKOUT_PLANS' AND COLUMN_NAME = 'total_weeks'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_WORKOUT_PLANS` ADD COLUMN `total_weeks` INT NOT NULL DEFAULT 1 AFTER `end_date`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index để query nhanh theo loại plan
SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_WORKOUT_PLANS' AND INDEX_NAME = 'idx_plan_type'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `COACH_WORKOUT_PLANS` ADD INDEX `idx_plan_type` (`plan_type`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ========================================================
-- 2. Thêm các cột cho bảng COACH_PLAN_DETAILS (Chi tiết bài tập theo mốc)
-- ========================================================

-- Mốc tuần: Tuần 1, Tuần 2, Tuần 3, Tuần 4,...
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND COLUMN_NAME = 'week_number'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD COLUMN `week_number` INT NOT NULL DEFAULT 1 AFTER `exercise_id`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Thứ trong tuần: 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND COLUMN_NAME = 'day_of_week'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD COLUMN `day_of_week` VARCHAR(20) NULL AFTER `week_number`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Nhãn mốc / Tên buổi tập: "Thứ 2 - Ngực & Tay sau", "Mốc 1: Thích ứng", "Cardio Day",...
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND COLUMN_NAME = 'day_label'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD COLUMN `day_label` VARCHAR(150) NULL AFTER `day_of_week`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Thời lượng ước tính (phút)
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND COLUMN_NAME = 'duration_minutes'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD COLUMN `duration_minutes` INT NULL AFTER `rest_seconds`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mức tạ đề xuất (kg) cho từng mốc tuần
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND COLUMN_NAME = 'weight_kg'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD COLUMN `weight_kg` DECIMAL(5,1) NULL AFTER `duration_minutes`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ghi chú riêng cho từng bài tập trong mốc
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND COLUMN_NAME = 'coach_note'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD COLUMN `coach_note` VARCHAR(255) NULL AFTER `weight_kg`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Thứ tự sắp xếp các bài tập trong buổi
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND COLUMN_NAME = 'sort_order'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0 AFTER `coach_note`',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index để truy vấn chi tiết bài tập theo kế hoạch và mốc tuần
SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'COACH_PLAN_DETAILS' AND INDEX_NAME = 'idx_plan_detail_week'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `COACH_PLAN_DETAILS` ADD INDEX `idx_plan_detail_week` (`plan_id`, `week_number`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

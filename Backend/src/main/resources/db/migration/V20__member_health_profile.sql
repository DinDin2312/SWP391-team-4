-- V20: Add gender and date_of_birth to USERS, and create MEMBER_HEALTH_PROFILES table

SET @col_gender_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'USERS' 
      AND COLUMN_NAME = 'gender'
);

SET @sql_gender = IF(@col_gender_exists = 0,
    'ALTER TABLE `USERS` ADD COLUMN `gender` VARCHAR(10) NULL AFTER `loyalty_points`',
    'SELECT 1'
);

PREPARE stmt_gender FROM @sql_gender;
EXECUTE stmt_gender;
DEALLOCATE PREPARE stmt_gender;

SET @col_dob_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'USERS' 
      AND COLUMN_NAME = 'date_of_birth'
);

SET @sql_dob = IF(@col_dob_exists = 0,
    'ALTER TABLE `USERS` ADD COLUMN `date_of_birth` DATE NULL AFTER `gender`',
    'SELECT 1'
);

PREPARE stmt_dob FROM @sql_dob;
EXECUTE stmt_dob;
DEALLOCATE PREPARE stmt_dob;

CREATE TABLE IF NOT EXISTS `MEMBER_HEALTH_PROFILES` (
    `user_id` INT PRIMARY KEY,
    `parq_answers` CHAR(7) NULL,
    `conditions` VARCHAR(255) NULL,
    `notes` VARCHAR(500) NULL,
    `consent_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    CONSTRAINT `fk_health_user` FOREIGN KEY (`user_id`) REFERENCES `USERS`(`user_id`) ON DELETE CASCADE
);

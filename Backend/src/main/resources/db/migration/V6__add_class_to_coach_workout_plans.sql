-- V6: Add class_id to COACH_WORKOUT_PLANS to link assigned workout plans to specific classes
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'COACH_WORKOUT_PLANS' 
      AND COLUMN_NAME = 'class_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `COACH_WORKOUT_PLANS` ADD COLUMN `class_id` INT NULL AFTER `user_id`, ADD CONSTRAINT `fk_coach_workout_class` FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`) ON DELETE SET NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

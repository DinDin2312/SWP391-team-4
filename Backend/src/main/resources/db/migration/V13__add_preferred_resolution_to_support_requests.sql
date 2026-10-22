-- V13: Add preferred_resolution column to SUPPORT_REQUESTS table for member compensation choice

SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'SUPPORT_REQUESTS' 
      AND COLUMN_NAME = 'preferred_resolution'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `SUPPORT_REQUESTS` ADD COLUMN `preferred_resolution` VARCHAR(50) NULL DEFAULT \'ISSUE_CREDIT\' AFTER `category`',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

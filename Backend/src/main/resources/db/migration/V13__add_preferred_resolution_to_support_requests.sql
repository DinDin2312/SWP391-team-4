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

-- Ensure used_invoice_id column and foreign key exist on USER_CREDITS
SET @credit_col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'USER_CREDITS' 
      AND COLUMN_NAME = 'used_invoice_id'
);

SET @credit_sql = IF(@credit_col_exists = 0,
    'ALTER TABLE `USER_CREDITS` ADD COLUMN `used_invoice_id` INT NULL AFTER `status`, ADD CONSTRAINT `fk_credit_invoice` FOREIGN KEY (`used_invoice_id`) REFERENCES `INVOICES` (`invoice_id`) ON DELETE SET NULL',
    'SELECT 1'
);

PREPARE stmt_credit FROM @credit_sql;
EXECUTE stmt_credit;
DEALLOCATE PREPARE stmt_credit;


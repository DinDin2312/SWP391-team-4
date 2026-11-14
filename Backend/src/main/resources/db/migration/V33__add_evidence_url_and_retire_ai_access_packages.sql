-- V33: Add evidence_url column to SUPPORT_REQUESTS for late class cancellation proof and retire AI_ACCESS packages

SET @evidence_col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'SUPPORT_REQUESTS'
      AND COLUMN_NAME = 'evidence_url'
);

SET @sql_evidence = IF(
    @evidence_col_exists = 0,
    'ALTER TABLE `SUPPORT_REQUESTS` ADD COLUMN `evidence_url` LONGTEXT NULL AFTER `content`',
    'SELECT 1'
);

PREPARE stmt_evidence FROM @sql_evidence;
EXECUTE stmt_evidence;
DEALLOCATE PREPARE stmt_evidence;

-- NEXUS AI is now free for all members; stop selling standalone AI_ACCESS packages
UPDATE `PACKAGES`
SET `selling_status` = 'STOPPED'
WHERE `package_type` = 'AI_ACCESS'
  AND `selling_status` <> 'STOPPED';

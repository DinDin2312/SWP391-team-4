-- New courses must be scheduled this many days ahead so members have time to register.
-- Make-up, supplementary and rescheduled sessions are not affected.
SET @lead_col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CENTER_SCHEDULE_POLICY' AND COLUMN_NAME = 'course_lead_days');
SET @sql_lead = IF(@lead_col = 0, 'ALTER TABLE CENTER_SCHEDULE_POLICY ADD COLUMN course_lead_days INT NOT NULL DEFAULT 30', 'SELECT 1');
PREPARE stmt_lead FROM @sql_lead;
EXECUTE stmt_lead;
DEALLOCATE PREPARE stmt_lead;

-- One session length for the whole center, so every subject shares the same time slots.
SET @session_col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CENTER_SCHEDULE_POLICY' AND COLUMN_NAME = 'session_minutes');
SET @sql_session = IF(@session_col = 0, 'ALTER TABLE CENTER_SCHEDULE_POLICY ADD COLUMN session_minutes INT NOT NULL DEFAULT 90', 'SELECT 1');
PREPARE stmt_session FROM @sql_session;
EXECUTE stmt_session;
DEALLOCATE PREPARE stmt_session;
UPDATE SUBJECTS SET duration_minutes = (SELECT session_minutes FROM CENTER_SCHEDULE_POLICY WHERE policy_id = 1), slot_starts = NULL;

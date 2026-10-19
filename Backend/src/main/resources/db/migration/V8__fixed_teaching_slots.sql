CREATE TABLE IF NOT EXISTS CENTER_SCHEDULE_POLICY (
    policy_id INT PRIMARY KEY,
    opens_at TIME NOT NULL,
    closes_at TIME NOT NULL,
    break_minutes INT NOT NULL
);
INSERT IGNORE INTO CENTER_SCHEDULE_POLICY VALUES (1, '06:00:00', '22:00:00', 15);
-- Legacy sessions retain their original reservation interval.
SET @slot_column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='SCHEDULES' AND COLUMN_NAME='changeover_minutes');
SET @slot_ddl = IF(@slot_column_exists=0, 'ALTER TABLE SCHEDULES ADD COLUMN changeover_minutes INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE slot_stmt FROM @slot_ddl;
EXECUTE slot_stmt;
DEALLOCATE PREPARE slot_stmt;

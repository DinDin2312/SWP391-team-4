-- Rooms can be under maintenance or retired; subjects can be retired. Inactive ones are not offered for new classes.
-- Guarded so it is safe on databases that already received these columns.
SET @room_status = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ROOMS' AND COLUMN_NAME = 'status');
SET @sql_room = IF(@room_status = 0, 'ALTER TABLE ROOMS ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''ACTIVE''', 'SELECT 1');
PREPARE stmt_room FROM @sql_room;
EXECUTE stmt_room;
DEALLOCATE PREPARE stmt_room;

SET @subject_status = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SUBJECTS' AND COLUMN_NAME = 'status');
SET @sql_subject = IF(@subject_status = 0, 'ALTER TABLE SUBJECTS ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''ACTIVE''', 'SELECT 1');
PREPARE stmt_subject FROM @sql_subject;
EXECUTE stmt_subject;
DEALLOCATE PREPARE stmt_subject;

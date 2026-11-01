-- V21__create_schedule_reschedule_tables.sql
-- Add substitute_coach_id to SCHEDULES and create Coach Reschedule & Make-up Tables

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Add substitute_coach_id column to SCHEDULES if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'SCHEDULES' 
      AND COLUMN_NAME = 'substitute_coach_id'
);

SET @sql_add_col = IF(
    @col_exists = 0,
    'ALTER TABLE SCHEDULES ADD COLUMN substitute_coach_id INT NULL',
    'SELECT "Column substitute_coach_id already exists in SCHEDULES"'
);
PREPARE stmt_add_col FROM @sql_add_col;
EXECUTE stmt_add_col;
DEALLOCATE PREPARE stmt_add_col;

-- 2. Create SCHEDULE_RESCHEDULE_REQUESTS
CREATE TABLE IF NOT EXISTS SCHEDULE_RESCHEDULE_REQUESTS (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    class_id INT NOT NULL,
    coach_id INT NOT NULL,
    substitute_coach_id INT NULL,
    action_type VARCHAR(30) NOT NULL DEFAULT 'MAKEUP_SESSION',
    original_start_time DATETIME NOT NULL,
    original_end_time DATETIME NOT NULL,
    proposed_start_time DATETIME NULL,
    proposed_end_time DATETIME NULL,
    proposed_room_id INT NULL,
    reason_category VARCHAR(50) NOT NULL DEFAULT 'NO_SUBSTITUTE_SICK',
    reason_details TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_response_note TEXT NULL,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    confirmation_deadline DATETIME NULL,
    min_attendees INT NOT NULL DEFAULT 2,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_srr_schedule FOREIGN KEY (schedule_id) REFERENCES SCHEDULES(schedule_id) ON DELETE CASCADE,
    CONSTRAINT fk_srr_class FOREIGN KEY (class_id) REFERENCES CLASSES(class_id) ON DELETE CASCADE,
    CONSTRAINT fk_srr_coach FOREIGN KEY (coach_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_srr_substitute_coach FOREIGN KEY (substitute_coach_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_srr_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_srr_proposed_room FOREIGN KEY (proposed_room_id) REFERENCES ROOMS(room_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create RESCHEDULE_MEMBER_RESPONSES
CREATE TABLE IF NOT EXISTS RESCHEDULE_MEMBER_RESPONSES (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_id INT NOT NULL,
    response_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    responded_at DATETIME NULL,
    credit_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rmr_request FOREIGN KEY (request_id) REFERENCES SCHEDULE_RESCHEDULE_REQUESTS(request_id) ON DELETE CASCADE,
    CONSTRAINT fk_rmr_user FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_rmr_booking FOREIGN KEY (booking_id) REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_rmr_credit FOREIGN KEY (credit_id) REFERENCES USER_CREDITS(credit_id) ON DELETE SET NULL,
    CONSTRAINT uq_request_user UNIQUE (request_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

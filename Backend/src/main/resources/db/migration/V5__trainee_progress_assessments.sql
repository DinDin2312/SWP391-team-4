-- V5: Add TRAINEE_ASSESSMENTS table for coaches to evaluate trainees and track progress

CREATE TABLE IF NOT EXISTS `TRAINEE_ASSESSMENTS` (
    `assessment_id` INT PRIMARY KEY AUTO_INCREMENT,
    `coach_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `schedule_id` INT NULL,
    `booking_id` INT NULL,
    `plan_id` INT NULL,
    `assessment_title` VARCHAR(255) NULL,
    `weight` DECIMAL(5,2) NULL,
    `height` DECIMAL(5,2) NULL,
    `body_fat_percentage` DECIMAL(4,1) NULL,
    `muscle_mass` DECIMAL(5,2) NULL,
    `performance_rating` INT NULL,
    `attendance_rating` INT NULL,
    `feedback_note` TEXT NOT NULL,
    `recommendation` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_assessment_user` (`user_id`, `created_at`),
    KEY `idx_assessment_coach` (`coach_id`, `created_at`),
    CONSTRAINT `fk_assessment_coach` FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`),
    CONSTRAINT `fk_assessment_user` FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`),
    CONSTRAINT `fk_assessment_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `SCHEDULES` (`schedule_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_assessment_booking` FOREIGN KEY (`booking_id`) REFERENCES `BOOKINGS` (`booking_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_assessment_plan` FOREIGN KEY (`plan_id`) REFERENCES `COACH_WORKOUT_PLANS` (`plan_id`) ON DELETE SET NULL
);

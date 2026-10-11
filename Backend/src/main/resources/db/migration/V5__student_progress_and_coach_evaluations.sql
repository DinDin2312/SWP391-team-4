-- Migration V5: Student progress tracking and coach student evaluations

CREATE TABLE IF NOT EXISTS `STUDENT_PROGRESS` (
  `progress_id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `coach_id` int,
  `weight_kg` decimal(5,2),
  `height_cm` decimal(5,2),
  `body_fat_pct` decimal(4,2),
  `muscle_mass_kg` decimal(4,2),
  `notes` text,
  `recorded_date` date NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `COACH_STUDENT_EVALUATIONS` (
  `evaluation_id` int PRIMARY KEY AUTO_INCREMENT,
  `coach_id` int NOT NULL,
  `user_id` int NOT NULL,
  `class_id` int,
  `evaluation_type` varchar(50) DEFAULT 'MONTHLY',
  `attendance_score` int,
  `effort_score` int,
  `technique_score` int,
  `coach_comment` text NOT NULL,
  `recommendations` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `COACH_REVIEWS` (
  `review_id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `coach_id` int NOT NULL,
  `class_id` int,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  CHECK (`rating` BETWEEN 1 AND 5)
);

ALTER TABLE `STUDENT_PROGRESS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `STUDENT_PROGRESS` ADD FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `COACH_STUDENT_EVALUATIONS` ADD FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `COACH_STUDENT_EVALUATIONS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `COACH_STUDENT_EVALUATIONS` ADD FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`);

ALTER TABLE `COACH_REVIEWS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `COACH_REVIEWS` ADD FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`);
ALTER TABLE `COACH_REVIEWS` ADD FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`);

CREATE INDEX `idx_student_progress_user` ON `STUDENT_PROGRESS` (`user_id`, `recorded_date`);
CREATE INDEX `idx_eval_coach_user` ON `COACH_STUDENT_EVALUATIONS` (`coach_id`, `user_id`);
CREATE INDEX `idx_coach_reviews_coach` ON `COACH_REVIEWS` (`coach_id`);

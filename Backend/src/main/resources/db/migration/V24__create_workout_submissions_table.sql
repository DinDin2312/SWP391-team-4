-- V24: Bảng lưu trữ bài nộp của học viên cho các bài tập được Coach giao (Đa bộ môn thể thao)
CREATE TABLE IF NOT EXISTS `COACH_WORKOUT_SUBMISSIONS` (
    `submission_id` INT AUTO_INCREMENT PRIMARY KEY,
    `plan_id` INT NOT NULL COMMENT 'Kế hoạch/Giáo án bài tập',
    `detail_id` INT NULL COMMENT 'Chi tiết bài tập cụ thể trong mốc tuần/buổi (nếu có)',
    `user_id` INT NOT NULL COMMENT 'Học viên nộp bài',
    `coach_id` INT NOT NULL COMMENT 'Huấn luyện viên phụ trách nhận bài',
    `video_url` VARCHAR(500) NOT NULL COMMENT 'Link video thực hành (YouTube, Google Drive, TikTok, Loom, link trực tiếp...)',
    `student_note` TEXT NULL COMMENT 'Mô tả quá trình tập, cảm nhận, thời lượng hoặc câu hỏi của học viên',
    `status` VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' COMMENT 'SUBMITTED | REVIEWED | APPROVED | REVISION_REQUESTED',
    `coach_feedback` TEXT NULL COMMENT 'Nhận xét, đánh giá chuyên môn và góp ý kỹ thuật của HLV',
    `rating` INT NULL COMMENT 'Điểm đánh giá từ HLV (1 - 5 sao)',
    `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` DATETIME NULL,
    CONSTRAINT `fk_submission_plan` FOREIGN KEY (`plan_id`) REFERENCES `COACH_WORKOUT_PLANS` (`plan_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_submission_detail` FOREIGN KEY (`detail_id`) REFERENCES `COACH_PLAN_DETAILS` (`detail_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_submission_user` FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_submission_coach` FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`) ON DELETE CASCADE,
    INDEX `idx_submission_plan_user` (`plan_id`, `user_id`),
    INDEX `idx_submission_coach_status` (`coach_id`, `status`),
    INDEX `idx_submission_detail` (`detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- V6: Add class_id to COACH_WORKOUT_PLANS to link assigned workout plans to specific classes
ALTER TABLE `COACH_WORKOUT_PLANS`
ADD COLUMN `class_id` INT NULL AFTER `user_id`,
ADD CONSTRAINT `fk_coach_workout_class` FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`) ON DELETE SET NULL;

-- Fresh schemas only. Existing recognized schemas are baselined at V1.
CREATE TABLE `ROLES` (`role_id` int PRIMARY KEY AUTO_INCREMENT, `role_name` varchar(255));

CREATE TABLE `USERS` (`user_id` int PRIMARY KEY AUTO_INCREMENT, `role_id` int, `full_name` varchar(255), `email` varchar(255), `phone` varchar(255), `password_hash` varchar(255), `status` varchar(255), `bio` text, `avatar_path` varchar(255), `force_password_change` boolean NOT NULL DEFAULT false, `loyalty_points` int DEFAULT 0);

CREATE TABLE `SUBJECTS` (`subject_id` int PRIMARY KEY AUTO_INCREMENT, `subject_name` varchar(255), `description` text, `image_path` varchar(255));

CREATE TABLE `USER_SUBJECTS` (`user_id` int, `subject_id` int, PRIMARY KEY (`user_id`, `subject_id`));

CREATE TABLE `ROOMS` (`room_id` int PRIMARY KEY AUTO_INCREMENT, `room_name` varchar(255), `capacity` int, `image_path` varchar(255));

CREATE TABLE `PACKAGES` (`package_id` int PRIMARY KEY AUTO_INCREMENT, `package_name` varchar(255), `package_type` varchar(255), `duration_days` int, `price` decimal(10,2), `image_path` varchar(255));

CREATE TABLE `USER_MEMBERSHIPS` (`membership_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `package_id` int, `start_date` date, `end_date` date, `remaining_sessions` int, `status` varchar(255));

CREATE TABLE `CLASSES` (`class_id` int PRIMARY KEY AUTO_INCREMENT, `subject_id` int, `coach_id` int, `room_id` int, `class_name` varchar(255), `price` decimal(10,2), `max_slots` int, `status` varchar(255), `image_path` varchar(255));

CREATE TABLE `SCHEDULES` (`schedule_id` int PRIMARY KEY AUTO_INCREMENT, `class_id` int, `start_time` datetime, `end_time` datetime, `status` varchar(255));

CREATE TABLE `BOOKINGS` (`booking_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `schedule_id` int, `status` varchar(255), `attendance_status` varchar(255), `booking_time` datetime);

CREATE TABLE `INVOICES` (`invoice_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `total_amount` decimal(10,2), `status` varchar(255), `created_at` datetime);

CREATE TABLE `INVOICE_DETAILS` (`detail_id` int PRIMARY KEY AUTO_INCREMENT, `invoice_id` int, `class_id` int, `package_id` int, `schedule_id` int, `unit_price` decimal(10,2));

CREATE TABLE `PAYMENTS` (`payment_id` int PRIMARY KEY AUTO_INCREMENT, `invoice_id` int, `amount` decimal(10,2), `payment_method` varchar(255), `transaction_no` varchar(255), `status` varchar(255), `payment_date` datetime);

CREATE TABLE `NOTIFICATIONS` (`notification_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `title` varchar(255), `message` text, `type` varchar(50) NOT NULL DEFAULT 'SYSTEM', `is_read` boolean NOT NULL DEFAULT false, `created_at` datetime);

CREATE TABLE `AI_WORKOUT_PLANS` (`plan_id` int PRIMARY KEY AUTO_INCREMENT, `user_id` int, `goal` varchar(255), `fitness_level` varchar(255), `created_at` datetime);

CREATE TABLE `EXERCISES` (`exercise_id` int PRIMARY KEY AUTO_INCREMENT, `exercise_name` varchar(255), `muscle_group` varchar(255), `video_url` varchar(255));

CREATE TABLE `AI_PLAN_DETAILS` (`detail_id` int PRIMARY KEY AUTO_INCREMENT, `plan_id` int, `exercise_id` int, `sets` int, `reps` int, `rest_seconds` int);

CREATE TABLE `COACH_WORKOUT_PLANS` (`plan_id` int PRIMARY KEY AUTO_INCREMENT, `coach_id` int, `user_id` int, `title` varchar(255), `note` text, `status` varchar(50) DEFAULT 'ACTIVE', `created_at` datetime);

CREATE TABLE `COACH_PLAN_DETAILS` (`detail_id` int PRIMARY KEY AUTO_INCREMENT, `plan_id` int, `exercise_id` int, `sets` int, `reps` int, `rest_seconds` int);

CREATE TABLE `AUDIT_LOGS` (`audit_id` bigint PRIMARY KEY AUTO_INCREMENT, `actor_email` varchar(255) NOT NULL, `action` varchar(50) NOT NULL, `entity_type` varchar(100) NOT NULL, `entity_id` varchar(100), `details` text, `created_at` datetime NOT NULL);

ALTER TABLE `USERS` ADD FOREIGN KEY (`role_id`) REFERENCES `ROLES` (`role_id`);

ALTER TABLE `USER_SUBJECTS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `USER_SUBJECTS` ADD FOREIGN KEY (`subject_id`) REFERENCES `SUBJECTS` (`subject_id`);

ALTER TABLE `CLASSES` ADD FOREIGN KEY (`subject_id`) REFERENCES `SUBJECTS` (`subject_id`);

ALTER TABLE `CLASSES` ADD FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `CLASSES` ADD FOREIGN KEY (`room_id`) REFERENCES `ROOMS` (`room_id`);

ALTER TABLE `USER_MEMBERSHIPS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `USER_MEMBERSHIPS` ADD FOREIGN KEY (`package_id`) REFERENCES `PACKAGES` (`package_id`);

ALTER TABLE `BOOKINGS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `INVOICES` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `NOTIFICATIONS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `SCHEDULES` ADD FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`);

ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`);

ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`package_id`) REFERENCES `PACKAGES` (`package_id`);

ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`schedule_id`) REFERENCES `SCHEDULES` (`schedule_id`);

ALTER TABLE `BOOKINGS` ADD FOREIGN KEY (`schedule_id`) REFERENCES `SCHEDULES` (`schedule_id`);

ALTER TABLE `INVOICE_DETAILS` ADD FOREIGN KEY (`invoice_id`) REFERENCES `INVOICES` (`invoice_id`);

ALTER TABLE `PAYMENTS` ADD FOREIGN KEY (`invoice_id`) REFERENCES `INVOICES` (`invoice_id`);

ALTER TABLE `AI_WORKOUT_PLANS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `AI_PLAN_DETAILS` ADD FOREIGN KEY (`plan_id`) REFERENCES `AI_WORKOUT_PLANS` (`plan_id`);

ALTER TABLE `AI_PLAN_DETAILS` ADD FOREIGN KEY (`exercise_id`) REFERENCES `EXERCISES` (`exercise_id`);

ALTER TABLE `COACH_WORKOUT_PLANS` ADD FOREIGN KEY (`coach_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `COACH_WORKOUT_PLANS` ADD FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`);

ALTER TABLE `COACH_PLAN_DETAILS` ADD FOREIGN KEY (`plan_id`) REFERENCES `COACH_WORKOUT_PLANS` (`plan_id`) ON DELETE CASCADE;

ALTER TABLE `COACH_PLAN_DETAILS` ADD FOREIGN KEY (`exercise_id`) REFERENCES `EXERCISES` (`exercise_id`);

ALTER TABLE USER_MEMBERSHIPS
 ADD COLUMN package_name_snapshot varchar(255),
 ADD COLUMN package_type_snapshot varchar(255),
 ADD COLUMN duration_days_snapshot int,
 ADD COLUMN price_snapshot decimal(10,2);

CREATE TABLE PACKAGE_SUBJECT_BENEFITS (
 package_id int NOT NULL, subject_id int NOT NULL, session_limit int NOT NULL,
 PRIMARY KEY(package_id,subject_id),
 FOREIGN KEY(package_id) REFERENCES PACKAGES(package_id),
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id),
 CHECK(session_limit BETWEEN 1 AND 10000)
);

CREATE TABLE MEMBERSHIP_SUBJECT_BENEFITS (
 benefit_id int PRIMARY KEY AUTO_INCREMENT, membership_id int NOT NULL,
 subject_id int NOT NULL, subject_name varchar(255) NOT NULL, session_limit int NOT NULL,
 UNIQUE(membership_id,subject_id),
 FOREIGN KEY(membership_id) REFERENCES USER_MEMBERSHIPS(membership_id) ON DELETE CASCADE,
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id)
);

CREATE TABLE BOOKING_BENEFITS (
 booking_id int PRIMARY KEY, benefit_id int NOT NULL,
 FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE,
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id)
);

CREATE TABLE PACKAGE_TYPES (
 type_code varchar(100) PRIMARY KEY,
 type_name varchar(255) NOT NULL UNIQUE,
 requires_subjects boolean NOT NULL DEFAULT FALSE
);

ALTER TABLE USER_MEMBERSHIPS ADD COLUMN type_name_snapshot varchar(255);

ALTER TABLE PACKAGES ADD description varchar(1000), ADD terms text, ADD purchase_limit_per_member int, ADD selling_status varchar(20) NOT NULL DEFAULT 'SELLING';

ALTER TABLE USER_MEMBERSHIPS ADD description_snapshot varchar(1000), ADD terms_snapshot text, ADD purchase_completed_at datetime, ADD purchase_source varchar(20), ADD checkout_invoice_id int;

ALTER TABLE INVOICE_DETAILS ADD membership_id int;

ALTER TABLE AUDIT_LOGS ADD changes_json longtext;

CREATE TABLE INVOICE_BOOKINGS (invoice_id int NOT NULL, booking_id int NOT NULL, PRIMARY KEY(invoice_id,booking_id), FOREIGN KEY(invoice_id) REFERENCES INVOICES(invoice_id), FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id));

CREATE INDEX idx_membership_purchase ON USER_MEMBERSHIPS(user_id,package_id,purchase_completed_at);

CREATE INDEX idx_membership_checkout ON USER_MEMBERSHIPS(checkout_invoice_id);

CREATE INDEX idx_package_history ON AUDIT_LOGS(entity_type,entity_id,created_at);

CREATE TABLE PACKAGE_BENEFIT_ROOMS (
 package_id int NOT NULL, subject_id int NOT NULL, room_id int NOT NULL,
 PRIMARY KEY(package_id,subject_id,room_id),
 FOREIGN KEY(package_id,subject_id) REFERENCES PACKAGE_SUBJECT_BENEFITS(package_id,subject_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);

CREATE TABLE MEMBERSHIP_BENEFIT_ROOMS (
 benefit_id int NOT NULL, room_id int NOT NULL, room_name varchar(255) NOT NULL,
 PRIMARY KEY(benefit_id,room_id),
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);

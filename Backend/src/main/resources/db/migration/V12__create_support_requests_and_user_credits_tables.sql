-- V12: Add SUPPORT_REQUESTS and USER_CREDITS tables for member cancellation support and receptionist support desk

CREATE TABLE IF NOT EXISTS `SUPPORT_REQUESTS` (
    `request_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `class_id` INT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    `response_note` TEXT NULL,
    `responded_by` INT NULL,
    `responded_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_support_user` (`user_id`, `created_at`),
    KEY `idx_support_status` (`status`),
    KEY `idx_support_category` (`category`),
    CONSTRAINT `fk_support_user` FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_support_class` FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_support_responder` FOREIGN KEY (`responded_by`) REFERENCES `USERS` (`user_id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `USER_CREDITS` (
    `credit_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `request_id` INT NULL,
    `class_id` INT NULL,
    `credit_code` VARCHAR(50) NOT NULL UNIQUE,
    `amount` DECIMAL(10,2) NOT NULL,
    `remaining_amount` DECIMAL(10,2) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `expiry_date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `used_invoice_id` INT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_credit_user` (`user_id`, `status`),
    KEY `idx_credit_code` (`credit_code`),
    CONSTRAINT `fk_credit_user` FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_credit_request` FOREIGN KEY (`request_id`) REFERENCES `SUPPORT_REQUESTS` (`request_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_credit_class` FOREIGN KEY (`class_id`) REFERENCES `CLASSES` (`class_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_credit_invoice` FOREIGN KEY (`used_invoice_id`) REFERENCES `INVOICES` (`invoice_id`) ON DELETE SET NULL
);

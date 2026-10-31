-- Migration V16: Create LOST_AND_FOUND_ITEMS table for receptionist lost and found management

CREATE TABLE IF NOT EXISTS `LOST_AND_FOUND_ITEMS` (
    `item_id` INT PRIMARY KEY AUTO_INCREMENT,
    `item_code` VARCHAR(50) NOT NULL UNIQUE,
    `item_name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    `valuation_type` VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
    `color` VARCHAR(50) NULL,
    `found_location` VARCHAR(255) NOT NULL,
    `found_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `found_by_name` VARCHAR(100) NULL,
    `storage_location` VARCHAR(100) NOT NULL,
    `public_description` TEXT NULL,
    `secret_details` TEXT NULL,
    `image_url` LONGTEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'STORED',
    `expiry_date` DATE NOT NULL,
    `created_by` INT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Claiming information
    `claimed_at` DATETIME NULL,
    `claimed_by_staff_id` INT NULL,
    `claimed_by_user_id` INT NULL,
    `claimant_name` VARCHAR(100) NULL,
    `claimant_phone` VARCHAR(20) NULL,
    `claimant_id_card` VARCHAR(50) NULL,
    `claim_notes` TEXT NULL,

    -- Disposal information
    `disposed_at` DATETIME NULL,
    `disposed_by_staff_id` INT NULL,
    `disposal_reason` VARCHAR(255) NULL,
    `disposal_notes` TEXT NULL,

    KEY `idx_lf_status` (`status`),
    KEY `idx_lf_category` (`category`),
    KEY `idx_lf_valuation` (`valuation_type`),
    KEY `idx_lf_created_at` (`created_at`),
    CONSTRAINT `fk_lf_created_by` FOREIGN KEY (`created_by`) REFERENCES `USERS` (`user_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_lf_claimed_staff` FOREIGN KEY (`claimed_by_staff_id`) REFERENCES `USERS` (`user_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_lf_claimed_user` FOREIGN KEY (`claimed_by_user_id`) REFERENCES `USERS` (`user_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_lf_disposed_staff` FOREIGN KEY (`disposed_by_staff_id`) REFERENCES `USERS` (`user_id`) ON DELETE SET NULL
);


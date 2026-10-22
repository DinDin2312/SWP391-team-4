-- V13: Add preferred_resolution column to SUPPORT_REQUESTS table for member compensation choice

ALTER TABLE `SUPPORT_REQUESTS`
ADD COLUMN `preferred_resolution` VARCHAR(50) NULL DEFAULT 'ISSUE_CREDIT' AFTER `category`;

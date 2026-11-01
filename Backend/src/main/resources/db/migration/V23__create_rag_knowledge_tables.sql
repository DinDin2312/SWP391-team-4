-- V23: Tạo bảng lưu trữ tài liệu tri thức RAG và các đoạn văn bản (chunks) vector embedding

CREATE TABLE IF NOT EXISTS `KNOWLEDGE_DOCUMENTS` (
    `document_id` INT PRIMARY KEY AUTO_INCREMENT,
    `source_key` VARCHAR(150) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `category` VARCHAR(40) NOT NULL,
    `audience` ENUM('MEMBER', 'COACH', 'ALL') NOT NULL,
    `content_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_kd_audience` (`audience`),
    KEY `idx_kd_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DOCUMENT_CHUNKS` (
    `chunk_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `document_id` INT NOT NULL,
    `chunk_index` INT NOT NULL,
    `content_text` TEXT NOT NULL,
    `embedding` JSON NOT NULL,
    KEY `idx_dc_document_id` (`document_id`),
    CONSTRAINT `fk_dc_document` FOREIGN KEY (`document_id`) REFERENCES `KNOWLEDGE_DOCUMENTS` (`document_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V34: Retire Combo Gym + AI / paid AI packages (NEXUS AI is free for all members)
--      and add Pool Access & Sauna Access membership packages.

UPDATE `PACKAGES`
SET `selling_status` = 'STOPPED'
WHERE `selling_status` <> 'STOPPED'
  AND (
    `package_type` = 'AI_ACCESS'
    OR LOWER(`package_name`) LIKE '%gym + ai%'
    OR LOWER(`package_name`) LIKE '%gym+ai%'
  );

UPDATE `PACKAGE_TYPES`
SET `type_name` = 'Combo (Gym & Amenities)'
WHERE `type_code` = 'COMBO'
  AND NOT EXISTS (
    SELECT 1
    FROM (
      SELECT `type_code`
      FROM `PACKAGE_TYPES`
      WHERE `type_name` = 'Combo (Gym & Amenities)'
        AND `type_code` <> 'COMBO'
    ) AS existing_combo_name
  );

INSERT INTO `PACKAGE_TYPES` (`type_code`, `type_name`, `requires_subjects`)
VALUES
  ('POOL_ACCESS', 'Pool access', FALSE),
  ('SAUNA_ACCESS', 'Sauna access', FALSE)
ON DUPLICATE KEY UPDATE
  `type_name` = VALUES(`type_name`),
  `requires_subjects` = FALSE;

INSERT INTO `PACKAGES` (
  `package_name`,
  `package_type`,
  `duration_days`,
  `price`,
  `image_path`,
  `description`,
  `terms`,
  `purchase_limit_per_member`,
  `selling_status`
)
SELECT
  'Gói Bể Bơi Bốn Mùa 1 Tháng',
  'POOL_ACCESS',
  30,
  450000.00,
  '/images/swimming-poster.jpg',
  'Toàn quyền sử dụng bể bơi bốn mùa nước ấm 25m điện phân muối khoáng trong 30 ngày.',
  'Áp dụng cho khu vực Bể Bơi Bốn Mùa, tủ đồ RFID và khu tắm tráng nước nóng. Không bao gồm khóa học bơi có HLV.',
  NULL,
  'SELLING'
WHERE NOT EXISTS (
  SELECT 1 FROM `PACKAGES` WHERE `package_name` = 'Gói Bể Bơi Bốn Mùa 1 Tháng'
);

INSERT INTO `PACKAGES` (
  `package_name`,
  `package_type`,
  `duration_days`,
  `price`,
  `image_path`,
  `description`,
  `terms`,
  `purchase_limit_per_member`,
  `selling_status`
)
SELECT
  'Gói Bể Bơi Bốn Mùa 3 Tháng',
  'POOL_ACCESS',
  90,
  1200000.00,
  '/images/swimming-poster.jpg',
  'Tiết kiệm hơn với quyền bơi tự do tại bể bơi bốn mùa nước ấm 25m suốt 90 ngày.',
  'Áp dụng cho khu vực Bể Bơi Bốn Mùa, tủ đồ RFID và khu tắm tráng nước nóng. Không bao gồm khóa học bơi có HLV.',
  NULL,
  'SELLING'
WHERE NOT EXISTS (
  SELECT 1 FROM `PACKAGES` WHERE `package_name` = 'Gói Bể Bơi Bốn Mùa 3 Tháng'
);

INSERT INTO `PACKAGES` (
  `package_name`,
  `package_type`,
  `duration_days`,
  `price`,
  `image_path`,
  `description`,
  `terms`,
  `purchase_limit_per_member`,
  `selling_status`
)
SELECT
  'Gói Phòng Xông Hơi Sauna 1 Tháng',
  'SAUNA_ACCESS',
  30,
  350000.00,
  '/images/studio-poster.jpg',
  'Thư giãn và phục hồi cơ bắp với phòng xông hơi khô đá muối & xông hơi ướt trong 30 ngày.',
  'Bao gồm khu vực Phòng Xông Hơi Sauna, tắm nóng lạnh và tủ đồ thông minh RFID. Không bao gồm phòng tập Gym tự do hay lớp học có HLV.',
  NULL,
  'SELLING'
WHERE NOT EXISTS (
  SELECT 1 FROM `PACKAGES` WHERE `package_name` = 'Gói Phòng Xông Hơi Sauna 1 Tháng'
);

INSERT INTO `PACKAGES` (
  `package_name`,
  `package_type`,
  `duration_days`,
  `price`,
  `image_path`,
  `description`,
  `terms`,
  `purchase_limit_per_member`,
  `selling_status`
)
SELECT
  'Gói Phòng Xông Hơi VIP 3 Tháng',
  'SAUNA_ACCESS',
  90,
  950000.00,
  '/images/studio-poster.jpg',
  'Gói phục hồi chuyên sâu 90 ngày không giới hạn lượt vào khu vực Sauna đá muối Himalaya.',
  'Bao gồm khu vực Phòng Xông Hơi Sauna, tắm nóng lạnh, khăn sạch mỗi buổi và tủ đồ thông minh RFID.',
  NULL,
  'SELLING'
WHERE NOT EXISTS (
  SELECT 1 FROM `PACKAGES` WHERE `package_name` = 'Gói Phòng Xông Hơi VIP 3 Tháng'
);

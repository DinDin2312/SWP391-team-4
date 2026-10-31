-- V18: Seed realistic sample data for Receptionist Lost & Found Management
-- Covers all statuses: STORED (Safe box & Regular shelves), OVERDUE, CLAIMED, DISPOSED
-- Covers all valuation types: HIGH_VALUE, STANDARD, PERISHABLE
-- Covers all categories: ELECTRONICS, DOCUMENTS_WALLET, ACCESSORIES, CLOTHING_SHOES, PERISHABLE, OTHER

SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO `LOST_AND_FOUND_ITEMS` (
    `item_code`, `item_name`, `category`, `valuation_type`, `color`,
    `found_location`, `found_date`, `found_by_name`, `storage_location`,
    `public_description`, `secret_details`, `image_url`, `status`, `expiry_date`,
    `created_by`, `created_at`, `updated_at`,
    `claimed_at`, `claimed_by_staff_id`, `claimed_by_user_id`, `claimant_name`, `claimant_phone`, `claimant_id_card`, `claim_notes`,
    `disposed_at`, `disposed_by_staff_id`, `disposal_reason`, `disposal_notes`
) VALUES
-- 1. iPhone 15 Pro Max (HIGH_VALUE - STORED - Két sắt)
(
    'LF-20261028-001',
    'iPhone 15 Pro Max Titan tự nhiên 256GB',
    'ELECTRONICS',
    'HIGH_VALUE',
    'Titan Tự Nhiên (Xám)',
    'Máy chạy bộ số 05 (Tầng 2)',
    '2026-10-28 17:45:00',
    'Lao công Cô Mai',
    'Két sắt an toàn #1 (Safe Box)',
    'Điện thoại iPhone 15 Pro Max màu titan tự nhiên, có ốp lưng chống sốc màu đen.',
    'Màn hình khóa có ảnh chú chó Corgi. Ốp lưng UAG đen có kẹp thẻ ngân hàng Vietcombank mang tên TRẦN BÙI THÁI.',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2027-01-26',
    2, '2026-10-28 18:00:00', '2026-10-28 18:00:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 2. Ví da nam Montblanc (HIGH_VALUE - STORED - Két sắt)
(
    'LF-20261029-002',
    'Ví da nam Montblanc gập đôi màu nâu cafe',
    'DOCUMENTS_WALLET',
    'HIGH_VALUE',
    'Nâu Cafe',
    'Khu vực tủ Locker Nam (Tầng 1)',
    '2026-10-29 20:15:00',
    'HLV Nguyễn Văn Tuấn',
    'Két sắt an toàn #1 (Safe Box)',
    'Ví nam da thật hiệu Montblanc màu nâu, logo hoa tuyết nhỏ góc dưới.',
    'Bên trong có 1.850.000 VNĐ tiền mặt (2 tờ 500k, 8 tờ 100k, 1 tờ 50k), 1 thẻ CCCD số 001201008899 mang tên Bùi Tấn Trường và 1 vé gửi xe số 48.',
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2027-01-27',
    2, '2026-10-29 20:30:00', '2026-10-29 20:30:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 3. Apple Watch Ultra 2 (HIGH_VALUE - STORED - Két sắt)
(
    'LF-20261031-003',
    'Đồng hồ Apple Watch Ultra 2 dây Alpine cam',
    'ELECTRONICS',
    'HIGH_VALUE',
    'Bạc Titan / Cam',
    'Thành hồ bơi bốn mùa (Tầng 1)',
    '2026-10-31 09:30:00',
    'Cứu hộ hồ bơi Anh Cường',
    'Két sắt an toàn #1 (Safe Box)',
    'Đồng hồ thể thao thông minh khung vỏ titan, dây dù dệt màu cam nổi bật.',
    'Mặt đồng hồ cài đặt giao diện Wayfinder ban đêm màu đỏ. Đáy đồng hồ có khắc laser kỷ niệm chữ: MINH HOANG - FPTU 2024.',
    'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2027-01-29',
    2, '2026-10-31 10:00:00', '2026-10-31 10:00:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 4. Tai nghe Sony WH-1000XM5 (STANDARD - STORED - Ngăn tủ)
(
    'LF-20261025-004',
    'Tai nghe chụp tai chống ồn Sony WH-1000XM5',
    'ELECTRONICS',
    'STANDARD',
    'Bạc Ánh Kim (Silver)',
    'Ghế nghỉ quầy nước sảnh chính',
    '2026-10-25 14:10:00',
    'Lễ Tân Thúy Kiều',
    'Ngăn tủ A-01 (Khu vực Lễ tân)',
    'Tai nghe Bluetooth over-ear màu bạc, có túi đựng cứng nguyên bản dạng zip.',
    'Bên trong túi đựng có kèm 1 sợi dây cắm 3.5mm màu xám và 1 củ sạc nhanh Anker 20W màu trắng. Đệm tai trái có vết xước nhẹ 2mm.',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2026-11-24',
    2, '2026-10-25 14:30:00', '2026-10-25 14:30:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 5. Bình giữ nhiệt Yeti Rambler (STANDARD - STORED - Ngăn tủ)
(
    'LF-20261027-005',
    'Bình giữ nhiệt Yeti Rambler 750ml nắp Chug',
    'ACCESSORIES',
    'STANDARD',
    'Xanh Rêu (Olive Green)',
    'Sàn tập Yoga Vinyasa (Tầng 2)',
    '2026-10-27 18:30:00',
    'HLV Trần Mai Anh',
    'Ngăn tủ A-02 (Khu vực Lễ tân)',
    'Bình inox giữ nhiệt Yeti dung tích 750ml sơn nhám màu xanh rêu, quai cầm nắp đen.',
    'Dưới đáy bình có dán decal sticker hình hoa sen Mandala và chữ viết tay MAI ANH bằng mực kháng nước.',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2026-11-26',
    2, '2026-10-27 19:00:00', '2026-10-27 19:00:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 6. Kính thể thao Oakley Jawbreaker (STANDARD - STORED - Ngăn tủ)
(
    'LF-20261030-006',
    'Kính mắt thể thao đạp xe Oakley Jawbreaker',
    'ACCESSORIES',
    'STANDARD',
    'Đỏ Đen / Tròng Prizm',
    'Phòng đạp xe Spinning (Tầng 3)',
    '2026-10-30 20:00:00',
    'HLV Phạm Minh Hoàng',
    'Ngăn tủ A-01 (Khu vực Lễ tân)',
    'Kính thể thao gọng đen đỏ, mắt kính tráng gương ánh cầu vồng Prizm Road.',
    'Bên trong hộp có kèm 1 miếng đệm mũi dự phòng cỡ lớn và khăn lau kính in logo Oakley màu đen.',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2026-11-29',
    2, '2026-10-30 20:30:00', '2026-10-30 20:30:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 7. Áo khoác gió Nike Windrunner (STANDARD - STORED - Kệ đồ)
(
    'LF-20261030-007',
    'Áo khoác gió thể thao Nike Windrunner size L',
    'CLOTHING_SHOES',
    'STANDARD',
    'Xám Phối Đen',
    'Móc treo đồ khu tạ tự do (Tầng 1)',
    '2026-10-30 11:15:00',
    'Hội viên Bùi Tấn Trường',
    'Kệ đồ thất lạc B (Tầng 1)',
    'Áo khoác dù 2 lớp Nike phối màu xám đen, logo thêu ngực trái.',
    'Trong túi áo có một chùm chìa khóa xe máy Honda Smartkey có móc khóa hình gấu Bearbrick màu xanh lam.',
    'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2026-11-29',
    2, '2026-10-30 11:30:00', '2026-10-30 11:30:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 8. Giày nâng tạ Nike Metcon 9 (STANDARD - STORED - Kệ đồ)
(
    'LF-20261031-008',
    'Giày tập thể hình Nike Metcon 9 size 42.5',
    'CLOTHING_SHOES',
    'STANDARD',
    'Trắng / Cam Neon',
    'Khu vực giá Squat Rack Tầng 1',
    '2026-10-31 16:30:00',
    'Lao công Cô Mai',
    'Kệ đồ thất lạc B (Tầng 1)',
    'Đôi giày tập Gym chuyên dụng Nike Metcon 9 màu trắng cam, đế cao su bám sàn rộng.',
    'Mặt trong lưỡi gà giày phải có ký hiệu viết tắt TT bằng bút dạ chống phai màu xanh.',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2026-11-30',
    2, '2026-10-31 17:00:00', '2026-10-31 17:00:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 9. Bình lắc Whey Protein (PERISHABLE - STORED - Tủ lạnh)
(
    'LF-20261031-009',
    'Bình lắc Whey Protein Shaker Mutant 800ml',
    'PERISHABLE',
    'PERISHABLE',
    'Đen / Đỏ',
    'Quầy Bar nước giải khát Tầng 1',
    '2026-10-31 19:00:00',
    'Nhân viên Pha chế Nam',
    'Tủ bảo quản lạnh (Đồ dễ hỏng)',
    'Bình lắc chuyên dụng tập gym dung tích 800ml in logo MUTANT màu vàng đỏ.',
    'Trong bình còn khoảng 300ml sinh tố Whey chuối hạnh nhân tươi. Có lò xo inox đánh bọt bên trong.',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    'STORED',
    '2026-11-02',
    2, '2026-10-31 19:15:00', '2026-10-31 19:15:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 10. Đai lưng Valeo (STANDARD - OVERDUE - Quá hạn lưu)
(
    'LF-20260901-010',
    'Đai lưng cứng nâng tạ Valeo bản 15cm size M',
    'ACCESSORIES',
    'STANDARD',
    'Đen Nhám',
    'Khu vực tập Deadlift Tầng 1',
    '2026-09-01 18:00:00',
    'HLV Nguyễn Văn Tuấn',
    'Kệ đồ thất lạc B (Tầng 1)',
    'Đai lưng tập tạ nặng khóa thép trợ lực hai chấu, chất liệu da nhân tạo màu đen.',
    'Khóa kim loại có vết xước sâu ở góc trên bên trái, đai có dán miếng dán gai Velcro phụ trợ.',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80',
    'OVERDUE',
    '2026-10-01',
    2, '2026-09-01 18:30:00', '2026-10-02 00:05:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 11. Băng gối và quấn cổ tay Aolikes (STANDARD - OVERDUE - Quá hạn lưu)
(
    'LF-20260915-011',
    'Bộ băng gối và quấn cổ tay thể hình Aolikes',
    'ACCESSORIES',
    'STANDARD',
    'Rằn Ri Quân Đội (Camo)',
    'Phòng thay đồ Nam (Tầng 1)',
    '2026-09-15 21:00:00',
    'Lao công Cô Mai',
    'Kệ đồ thất lạc B (Tầng 1)',
    'Bộ phụ kiện gồm 2 băng gối đàn hồi cao và 2 quấn cổ tay xỏ ngón tay cái họa tiết rằn ri.',
    'Đựng trong túi lưới dây rút màu đen in chữ AOLIKES FITNESS.',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80',
    'OVERDUE',
    '2026-10-15',
    2, '2026-09-15 21:30:00', '2026-10-16 00:05:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL
),

-- 12. MacBook Air M2 (HIGH_VALUE - CLAIMED - Đã trả cho hội viên Đinh Thị Thu)
(
    'LF-20261015-012',
    'Máy tính Apple MacBook Air M2 13.6 inch Midnight',
    'ELECTRONICS',
    'HIGH_VALUE',
    'Xanh Đen (Midnight)',
    'Bàn làm việc khu Co-working Tầng 2',
    '2026-10-15 16:00:00',
    'Lễ Tân Thúy Kiều',
    'Két sắt an toàn #1 (Safe Box)',
    'Laptop MacBook Air màu xanh đen kèm củ sạc nhanh MagSafe 35W hai cổng Type-C.',
    'Mặt ngoài nắp máy dán sticker hình logo FPT Software và mèo máy Doraemon. Đăng nhập tài khoản Apple ID dtt_thu@gmail.com.',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    'CLAIMED',
    '2027-01-13',
    2, '2026-10-15 16:30:00', '2026-10-16 10:15:00',
    '2026-10-16 10:15:00', 2, 10, 'Đinh Thị Thu', '0912345678', '001202005544',
    'Học viên cung cấp đúng ảnh nền desktop, mở khóa Touch ID bằng vân tay trỏ phải và trùng khớp tài khoản Apple ID cá nhân.',
    NULL, NULL, NULL, NULL
),

-- 13. Chìa khóa xe Mercedes & Thẻ cư dân (DOCUMENTS_WALLET - CLAIMED - Đã trả khách vãng lai)
(
    'LF-20261020-013',
    'Chìa khóa thông minh Mercedes-Benz & Thẻ cư dân',
    'DOCUMENTS_WALLET',
    'HIGH_VALUE',
    'Đen Bóng / Mạ Chrome',
    'Khu vực Bãi đỗ xe ô tô ngoài trời',
    '2026-10-20 08:30:00',
    'Bảo vệ Anh Hùng',
    'Két sắt an toàn #1 (Safe Box)',
    'Chìa khóa smartkey xe Mercedes bọc bao da màu đen chỉ đỏ, móc kèm 1 thẻ từ cư dân thang máy.',
    'Mặt sau thẻ từ thang máy in chữ CƯ DÂN VINHOMES OCEAN PARK S2.01. Móc khóa kim loại có khắc chữ LÊ HOÀNG LONG.',
    'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    'CLAIMED',
    '2027-01-18',
    2, '2026-10-20 08:45:00', '2026-10-20 11:30:00',
    '2026-10-20 11:30:00', 2, 8, 'Lê Hoàng Long', '0977665544', '001200007788',
    'Khách mang theo giấy tờ đăng ký xe ô tô BKS 30K-888.99 trùng khớp số khung máy và bấm khóa xe kêu còi xác nhận ngay trước cửa trung tâm.',
    NULL, NULL, NULL, NULL
),

-- 14. Túi đồ tập cũ ẩm mốc (CLOTHING_SHOES - DISPOSED - Đã tiêu hủy)
(
    'LF-20260810-014',
    'Túi vải dù thể thao cũ đựng đồ tập ướt ẩm mốc',
    'CLOTHING_SHOES',
    'STANDARD',
    'Đỏ Đô',
    'Góc tủ Locker số 34 Phòng Nữ Tầng 1',
    '2026-08-10 22:00:00',
    'Lao công Cô Mai',
    'Kệ đồ thất lạc B (Tầng 1)',
    'Túi vải thể thao chứa 2 khăn bông và 1 áo thun ướt mồ hôi bị bỏ quên lâu ngày.',
    'Quần áo bên trong đã lên mốc xanh đen nặng và bốc mùi hôi khó chịu, tiềm ẩn nguy cơ nấm mốc lây lan phòng lưu kho.',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    'DISPOSED',
    '2026-09-09',
    2, '2026-08-10 22:30:00', '2026-09-12 15:00:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-09-12 15:00:00', 1, 'Tiêu hủy vệ sinh (Đồ dùng cũ, đồ dễ hỏng)',
    'Món đồ quá hạn 30 ngày theo quy chế. Đồ ẩm mốc nặng không thể bảo quản tiếp, đã lập biên bản tiêu hủy rác y tế đảm bảo vệ sinh môi trường kho.'
),

-- 15. Áo hoodie nỉ Uniqlo (CLOTHING_SHOES - DISPOSED - Quyên góp từ thiện)
(
    'LF-20260715-015',
    'Áo khoác nỉ hoodie kéo khóa Uniqlo trơn size XL',
    'CLOTHING_SHOES',
    'STANDARD',
    'Đen Trơn',
    'Hàng ghế chờ sảnh chính Tầng 1',
    '2026-07-15 17:30:00',
    'Lễ Tân Thúy Kiều',
    'Kệ đồ thất lạc B (Tầng 1)',
    'Áo nỉ có mũ khóa kéo màu đen Uniqlo chất liệu cotton pha polyester dày dặn, áo còn rất mới và sạch sẽ.',
    'Áo không có thông tin nhận dạng đặc biệt, không có đồ đạc trong túi.',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    'DISPOSED',
    '2026-08-14',
    2, '2026-07-15 18:00:00', '2026-08-20 09:30:00',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-08-20 09:30:00', 1, 'Quyên góp từ thiện (Hội chữ thập đỏ / Quỹ từ thiện)',
    'Món đồ lưu kho quá 35 ngày không có người liên hệ nhận lại. Đã bàn giao cho đại diện Hội Chữ Thập Đỏ TP. Hà Nội trong đợt quyên góp Áo Ấm Mùa Đông 2026.'
);

SET FOREIGN_KEY_CHECKS = 1;


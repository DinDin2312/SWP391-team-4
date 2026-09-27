USE SportCenter;
SET NAMES utf8mb4;
START TRANSACTION;

-- Repair only the fixed demo rows that were previously imported through a legacy console code page.
UPDATE USERS SET full_name = CASE user_id
    WHEN 1 THEN 'Quản Lý Trung Tâm'
    WHEN 2 THEN 'Lễ Tân Thúy Kiều'
    WHEN 3 THEN 'HLV Nguyễn Văn Tuấn'
    WHEN 4 THEN 'HLV Trần Mai Anh'
    WHEN 5 THEN 'HLV Phạm Minh Hoàng'
    WHEN 6 THEN 'Trần Bùi Thái'
    WHEN 7 THEN 'Nguyễn Kiều Oanh'
    WHEN 8 THEN 'Lê Hoàng Long'
    WHEN 9 THEN 'Vũ Đức Mạnh'
    WHEN 10 THEN 'Đinh Thị Thu'
    WHEN 11 THEN 'Phạm Tuấn Ngọc'
    WHEN 12 THEN 'Bùi Tấn Trường'
    WHEN 13 THEN 'Hoàng Văn Thụ'
    WHEN 14 THEN 'Đặng Thái Sơn'
    WHEN 15 THEN 'Ngô Thanh Vân'
    WHEN 16 THEN 'Lý Nhã Kỳ'
    WHEN 17 THEN 'Trương Thế Vinh'
    WHEN 18 THEN 'Hồ Ngọc Hà'
    WHEN 19 THEN 'Mai Tiến Dũng'
    WHEN 20 THEN 'Nguyễn Tóc Tiên'
END
WHERE user_id BETWEEN 1 AND 20;

UPDATE ROOMS SET room_name = CASE room_id
    WHEN 1 THEN 'Phòng Gym Tầng 1'
    WHEN 2 THEN 'Phòng Yoga Tầng 2'
    WHEN 3 THEN 'Phòng Zumba Tầng 3'
    WHEN 4 THEN 'Bể Bơi Bốn Mùa'
    WHEN 5 THEN 'Phòng Đạp Xe'
END
WHERE room_id BETWEEN 1 AND 5;

UPDATE SUBJECTS SET
    subject_name = CASE subject_id
        WHEN 1 THEN 'Thể Hình (Gym)'
        WHEN 2 THEN 'Yoga Căn Bản'
        WHEN 3 THEN 'Zumba Dance'
        WHEN 4 THEN 'Bơi Lội'
        WHEN 5 THEN 'Đạp Xe (Spinning)'
    END,
    description = CASE subject_id
        WHEN 1 THEN 'Tập tạ tự do và máy móc hiện đại'
        WHEN 2 THEN 'Yoga thư giãn và giãn cơ buổi sáng'
        WHEN 3 THEN 'Nhảy theo nhạc Latin sôi động giảm mỡ'
        WHEN 4 THEN 'Kỹ thuật bơi ếch, bơi sải chuyên nghiệp'
        WHEN 5 THEN 'Đạp xe cường độ cao trên nền nhạc'
    END
WHERE subject_id BETWEEN 1 AND 5;

UPDATE PACKAGES SET package_name = CASE package_id
    WHEN 1 THEN 'Thẻ Gym 1 Tháng'
    WHEN 2 THEN 'Thẻ Gym 3 Tháng'
    WHEN 3 THEN 'Thẻ Gym 1 Năm'
    WHEN 4 THEN 'Gói Thuê AI Cá Nhân 1 Tháng'
    WHEN 5 THEN 'Thẻ Tập Thử VIP (1 Ngày)'
END
WHERE package_id BETWEEN 1 AND 5;

UPDATE CLASSES SET class_name = CASE class_id
    WHEN 1 THEN 'Yoga Giãn Cơ Thứ 2-4-6'
    WHEN 2 THEN 'Yoga Giảm Cân Thứ 3-5-7'
    WHEN 3 THEN 'Gym Căn Bản Cho Nam'
    WHEN 4 THEN 'Siết Cơ Cấp Tốc'
    WHEN 5 THEN 'Zumba Đốt Mỡ Buổi Tối'
    WHEN 6 THEN 'Lớp Học Bơi Sải'
    WHEN 7 THEN 'Yoga Trị Liệu Cột Sống'
    WHEN 8 THEN 'Zumba Dance Chuyên Nghiệp'
    WHEN 9 THEN 'Lớp Luyện Cử Tạ'
    WHEN 10 THEN 'Bơi Lội Trẻ Em'
END
WHERE class_id BETWEEN 1 AND 10;

COMMIT;

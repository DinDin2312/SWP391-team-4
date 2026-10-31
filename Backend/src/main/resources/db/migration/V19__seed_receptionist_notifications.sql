-- V19: Seed Realistic Operational Notifications for Receptionist (user_id = 2)

INSERT INTO `NOTIFICATIONS` (user_id, title, message, type, is_read, created_at)
VALUES 
(
  2,
  'Yêu cầu hủy lớp & hoàn lượt tập',
  'Hội viên Nguyễn Kiều Oanh (#7) vừa gửi yêu cầu hủy lớp Yoga Vinyasa và xin hoàn 1 lượt tập do lý do sức khỏe. Vui lòng đối soát và duyệt yêu cầu tại Bàn hỗ trợ.',
  'SUPPORT',
  0,
  DATE_SUB(NOW(), INTERVAL 12 MINUTE)
),
(
  2,
  'Cảnh báo: Check-in bổ sung tại phòng tập',
  'Hội viên Bùi Tấn Trường (#12) vào lớp Yoga Hatha Tầng 2 nhưng chưa check-in tại quầy lễ tân (HLV Trần Mai Anh xác nhận có mặt trực tiếp).',
  'CHECKIN',
  0,
  DATE_SUB(NOW(), INTERVAL 35 MINUTE)
),
(
  2,
  'Cảnh báo: Đồ thất lạc sắp quá hạn lưu trữ',
  'Món đồ LF-20261031-009 (Bình lắc Whey Protein Mutant) đang lưu tại Tủ mát lễ tân sắp chạm mốc quá hạn 48 giờ đối với đồ thực phẩm tươi.',
  'LOST_FOUND',
  0,
  DATE_SUB(NOW(), INTERVAL 2 HOUR)
),
(
  2,
  'Gia hạn thẻ tập thành công qua VietQR',
  'Hội viên Đinh Thị Thu (#10) đã thanh toán thành công 4.800.000đ gia hạn gói Gym 1 Năm (Mã hóa đơn: INV-20261031-088).',
  'PAYMENT',
  1,
  DATE_SUB(NOW(), INTERVAL 5 HOUR)
),
(
  2,
  'Thông báo bảo trì hệ thống gia nhiệt hồ bơi',
  'Ban Quản Lý thông báo: Kỹ thuật viên sẽ tiến hành bảo dưỡng định kỳ hệ thống máy gia nhiệt Bể bơi bốn mùa từ 22:00 hôm nay. Vui lòng hướng dẫn hội viên trước giờ đóng cửa.',
  'SYSTEM',
  1,
  DATE_SUB(NOW(), INTERVAL 1 DAY)
);

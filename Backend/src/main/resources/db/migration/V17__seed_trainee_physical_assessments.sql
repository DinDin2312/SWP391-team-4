-- V17: Seed realistic multi-milestone physical progress & InBody transformation assessment data
-- Serves the Body Transformation Visualizer, Fitness Progress Score (FPS), and Coach Assessment History.

INSERT INTO `TRAINEE_ASSESSMENTS` 
    (`coach_id`, `user_id`, `schedule_id`, `booking_id`, `plan_id`, `assessment_title`, `weight`, `height`, `body_fat_percentage`, `muscle_mass`, `performance_rating`, `attendance_rating`, `feedback_note`, `recommendation`, `created_at`)
VALUES
-- =========================================================================
-- Trainee 1: Đinh Thị Thu (user_id = 10) | HLV Trần Mai Anh (coach_id = 4)
-- Lộ trình 5 cột mốc: Giảm mỡ - Tăng cơ - Định hình vóc dáng Yoga Vinyasa
-- =========================================================================
(4, 10, NULL, NULL, NULL, 
 'Đánh giá InBody & Thể lực ban đầu (Baseline)', 
 58.50, 165.00, 26.5, 21.80, 4, 4, 
 'Học viên bắt đầu tham gia lớp Yoga Vinyasa. Thể lực nền tương đối tốt, độ dẻo dai cơ bản nhưng các nhóm cơ lõi (core) và lưng dưới còn yếu. Khớp vai hơi cứng khi thực hiện tư thế Chó úp mặt (Downward Dog).', 
 'Tập trung vào hơi thở Ujjayi, thực hiện các chuỗi Chào mặt trời tốc độ vừa phải để giãn cơ. Bổ sung thêm protein lành mạnh và uống đủ 2L nước mỗi ngày.', 
 '2026-09-15 08:30:00'),

(4, 10, NULL, NULL, NULL, 
 'Đánh giá tiến độ Tuần 2 - Thích nghi giáo án', 
 57.60, 165.00, 25.1, 22.20, 4, 5, 
 'Tiến bộ rõ rệt về khả năng giữ thăng bằng trong tư thế Cây (Tree Pose) và Chiến binh II (Warrior II). Khả năng duy trì tư thế Planks tăng từ 30s lên 55s. Cơ bắp bắt đầu săn chắc.', 
 'Duy trì tần suất 3 buổi/tuần. Bắt đầu tăng dần độ sâu ở các động tác uốn lưng nhẹ để giải phóng lồng ngực.', 
 '2026-09-29 08:30:00'),

(4, 10, NULL, NULL, NULL, 
 'Kiểm tra chỉ số thể chất giữa kỳ (Mid-term InBody)', 
 56.40, 165.00, 23.6, 22.90, 5, 5, 
 'Tỷ lệ mỡ giảm -2.9%, cơ bắp tăng +1.1kg! Vùng bụng và eo săn gọn rõ rệt. Nhịp tim phục hồi nhanh sau các chuỗi Vinyasa liên hoàn. Tinh thần buổi tập rất tích cực.', 
 'Giữ vững thói quen dinh dưỡng hiện tại. Thử sức với tư thế Con quạ (Bakasana) để thử thách sức mạnh cổ tay và cơ trung tâm.', 
 '2026-10-10 08:30:00'),

(4, 10, NULL, NULL, NULL, 
 'Đánh giá tuần 5 - Bứt phá sức bền & độ dẻo', 
 55.50, 165.00, 22.2, 23.40, 5, 5, 
 'Học viên hoàn thành trọn vẹn 100% giáo án không cần nghỉ giữa chừng. Sức bền và độ linh hoạt cột sống cải thiện vượt bậc. Tư thế Chim bồ câu (Pigeon Pose) đạt biên độ chuẩn xác.', 
 'Tập trung vào kỹ thuật thở sâu và thiền định cuối buổi để tối ưu hóa phục hồi hệ thần kinh và cơ bắp.', 
 '2026-10-22 08:30:00'),

(4, 10, NULL, NULL, NULL, 
 'Tổng kết chuyển hóa hình thể (Body Transformation Milestone)', 
 54.80, 165.00, 21.0, 23.90, 5, 5, 
 'Chúc mừng Thu! Chuyển hóa hình thể thành công rực rỡ sau 6 tuần kiên trì: Giảm -3.7kg tổng thể, giảm -5.5% tỷ lệ mỡ cơ thể và tăng +2.1kg cơ nạc. Thể hình thon gọn, săn chắc chuẩn vóc dáng thể thao!', 
 'Chuyển sang giai đoạn duy trì vóc dáng và nâng cao sức mạnh toàn thân. Đạt chuẩn đánh giá Hạng Kim Cương (Diamond Tier)!', 
 '2026-10-30 08:30:00'),

-- =========================================================================
-- Trainee 2: Trần Bùi Thái (user_id = 6) | HLV Nguyễn Văn Tuấn (coach_id = 3)
-- Lộ trình 5 cột mốc: Gym Thể Hình - Tăng cơ giảm mỡ (Body Recomposition)
-- =========================================================================
(3, 6, NULL, NULL, NULL, 
 'Đo lường thể chất & Khảo sát ban đầu', 
 76.50, 175.00, 24.8, 31.00, 3, 4, 
 'Hội viên bắt đầu lộ trình tăng cơ giảm mỡ. Thể lực nền trung bình, hơi hụt hơi ở hiệp thứ 3 các bài Compound (Squat, Deadlift). Tỷ lệ mỡ nội tạng mức 6.', 
 'Tập trung chỉnh form chuyển động chuẩn xác trước khi nâng tạ nặng. Cắt giảm đồ ngọt và tinh bột hấp thu nhanh sau 19h.', 
 '2026-09-10 17:30:00'),

(3, 6, NULL, NULL, NULL, 
 'Đánh giá tiến độ Tuần 2 - Ổn định form kỹ thuật', 
 75.20, 175.00, 23.2, 31.80, 4, 5, 
 'Kỹ thuật gánh tạ Squat đã chuẩn form, lưng thẳng, không bị trượt khớp gối. Khối lượng tạ tăng 10kg so với tuần đầu. Sức chịu đựng cơ đùi trước tăng.', 
 'Tăng mức tạ Bench Press thêm 5kg ở hiệp cuối. Khởi động khớp cổ tay và vai kỹ càng trước buổi tập.', 
 '2026-09-24 17:30:00'),

(3, 6, NULL, NULL, NULL, 
 'Kiểm tra InBody định kỳ 1 tháng', 
 73.80, 175.00, 21.0, 32.70, 5, 5, 
 'Chỉ số tiến triển vượt mong đợi: Giảm -3.8% mỡ và tăng +1.7kg cơ nạc! Giảm mỡ bụng rõ rệt, cơ ngực và vai nổi nét. Khả năng phục hồi giữa các hiệp tập rất tốt.', 
 'Áp dụng kỹ thuật Drop-set ở hiệp cuối các bài cô lập cơ bắp để tối ưu hóa sự phì đại sợi cơ (Hypertrophy).', 
 '2026-10-08 17:30:00'),

(3, 6, NULL, NULL, NULL, 
 'Đánh giá tuần 6 - Bứt phá giới hạn sức mạnh', 
 72.30, 175.00, 19.2, 33.50, 5, 5, 
 'Tỷ lệ mỡ chính thức xuống dưới mốc 20%! Tăng +2.5kg cơ nạc. Thể lực vượt trội, mức tạ Deadlift đạt 1.5 lần trọng lượng cơ thể (110kg).', 
 'Tăng lượng đạm nạp vào khoảng 1.8g - 2.0g/kg thể trọng. Bổ sung điện giải trong suốt buổi tập.', 
 '2026-10-22 17:30:00'),

(3, 6, NULL, NULL, NULL, 
 'Chốt chỉ số chuyển hóa hình thể Quý IV', 
 71.00, 175.00, 17.8, 34.20, 5, 5, 
 'Xuất sắc! Mục tiêu Body Transformation hoàn thành 100%. Giảm -5.5kg mỡ thừa, cơ bắp tăng +3.2kg săn chắc, cơ bụng 6 múi bắt đầu hiện rõ nét. Xếp hạng Vượt Bậc!', 
 'Bắt đầu bước vào chu kỳ siết nét (Cutting) nhẹ và tập trung vào sức bền sợi cơ. Tiếp tục duy trì phong độ!', 
 '2026-10-31 10:00:00'),

-- =========================================================================
-- Trainee 3: Phạm Tuấn Ngọc (user_id = 11) | HLV Trần Mai Anh (coach_id = 4)
-- Lộ trình 4 cột mốc: Spinning Đạp xe & Cardio đốt mỡ thần tốc
-- =========================================================================
(4, 11, NULL, NULL, NULL, 
 'Khảo sát nhịp tim & Thể lực Cardio đầu vào', 
 69.00, 170.00, 22.5, 28.50, 3, 4, 
 'Đo InBody đầu vào lớp Spinning Đạp xe & Cardio. Sức bền hiếu khí cần rèn luyện thêm, nhịp thở chưa đồng đều khi leo dốc kháng lực cao.', 
 'Tập hít thở sâu bằng cơ hoành, giữ nhịp đạp nhẹ nhàng ở 5 phút đầu để làm nóng cơ tim.', 
 '2026-09-18 19:00:00'),

(4, 11, NULL, NULL, NULL, 
 'Đánh giá tiến độ Tuần 2 - Tăng tốc nhịp đạp', 
 67.80, 170.00, 20.8, 29.20, 4, 5, 
 'Duy trì nhịp đạp RPM ổn định ở các đoạn nước rút âm nhạc sôi động. Khả năng kiểm soát nhịp tim cải thiện rõ rệt, không còn hiện tượng hụt hơi.', 
 'Thử tăng núm kháng lực thêm 1 nấc trong các bài tập mô phỏng leo đèo dốc.', 
 '2026-10-02 19:00:00'),

(4, 11, NULL, NULL, NULL, 
 'Đánh giá tiến độ Tuần 4 - Đốt mỡ tối đa', 
 66.50, 170.00, 19.0, 29.90, 5, 5, 
 'Thể lực rất dẻo dai. Hoàn thành 45 phút Spinning cường độ cao (HIIT) với lượng tiêu hao ước tính ~550 kcal/buổi mà không bị chuột rút hay đuối sức.', 
 'Duy trì chế độ bù nước Isotonic sau mỗi buổi đạp xe để ngăn ngừa mất khoáng.', 
 '2026-10-16 19:00:00'),

(4, 11, NULL, NULL, NULL, 
 'Đánh giá thể chất toàn diện Tuần 6', 
 65.20, 170.00, 17.5, 30.60, 5, 5, 
 'Chỉ số mỡ giảm đều đặn -5.0%, cơ bắp chân và đùi tăng +2.1kg săn chắc. Sức bền tim mạch đạt mức Tối ưu (Excellent). Vóc dáng gọn gàng, linh hoạt.', 
 'Sẵn sàng tham gia sự kiện thử thách Spinning Tour 90 phút sắp tới của trung tâm!', 
 '2026-10-28 19:00:00'),

-- =========================================================================
-- Trainee 4: Mai Tiến Dũng (user_id = 19) | HLV Phạm Minh Hoàng (coach_id = 5)
-- Lộ trình 4 cột mốc: Bơi lội thể lực & Sức bền toàn diện
-- =========================================================================
(5, 19, NULL, NULL, NULL, 
 'Đo chỉ số thể chất & Khảo sát bơi lội', 
 74.00, 172.00, 23.5, 30.00, 4, 4, 
 'Bắt đầu khóa Bơi lội tăng cường thể lực. Kỹ thuật quạt tay và đạp chân cần điều chỉnh góc nghiêng để tiết kiệm sức khi bơi đường dài.', 
 'Tập trung các bài tập drill bổ trợ chân ếch và tay sải trước khi bơi cự ly dài.', 
 '2026-09-12 07:00:00'),

(5, 19, NULL, NULL, NULL, 
 'Đánh giá Tuần 2 - Nâng cao hiệu suất quạt nước', 
 72.80, 172.00, 21.8, 30.70, 4, 5, 
 'Kỹ thuật thở dưới nước nhịp nhàng, bơi liên tục 200m sải không dừng. Cơ vai và lưng xô phát triển tốt, dáng người mở rộng.', 
 'Tăng dần khối lượng bơi lên 500m mỗi buổi. Chú ý động tác cuộn người quay đầu (Flip turn).', 
 '2026-09-26 07:00:00'),

(5, 19, NULL, NULL, NULL, 
 'Đánh giá tiến độ Tuần 4 - Bứt phá cự ly', 
 71.50, 172.00, 20.2, 31.40, 5, 5, 
 'Khả năng lướt nước tăng 25%, tốc độ bơi 50m bứt phá đạt dưới 38 giây. Tỷ lệ mỡ giảm rõ rệt, thân hình vạm vỡ hình chữ V thể thao.', 
 'Bổ sung thêm các bài bơi phối hợp 4 kiểu (Medley) để kích hoạt đều tất cả các nhóm cơ.', 
 '2026-10-12 07:00:00'),

(5, 19, NULL, NULL, NULL, 
 'Đánh giá thể lực đỉnh cao Tuần 6', 
 70.20, 172.00, 18.5, 32.20, 5, 5, 
 'Phong độ đỉnh cao! Hoàn thành xuất sắc mục tiêu bơi đường dài 1000m không nghỉ và phát triển toàn diện nhóm cơ thân trên. Sức khỏe tim mạch và phổi rất khỏe mạnh.', 
 'Duy trì lịch tập đều 3 buổi/tuần để giữ vững phong độ đỉnh cao hiện tại!', 
 '2026-10-29 07:00:00'),

-- =========================================================================
-- Trainee 5: Sinh Xuân (user_id = 21) | HLV Trần Mai Anh (coach_id = 4)
-- Lộ trình 3 cột mốc: Cardio kết hợp Yoga thon gọn vóc dáng
-- =========================================================================
(4, 21, NULL, NULL, NULL, 
 'Đo InBody khởi động lộ trình', 
 62.00, 168.00, 20.5, 26.00, 4, 4, 
 'Đo InBody khởi động. Mục tiêu giảm mỡ eo và tăng cường độ dẻo dai cơ bắp. Thể lực tốt, tiếp thu động tác nhanh.', 
 'Kết hợp 2 buổi Yoga và 2 buổi Cardio nhẹ mỗi tuần để đạt hiệu quả đốt mỡ tốt nhất.', 
 '2026-09-20 09:00:00'),

(4, 21, NULL, NULL, NULL, 
 'Đánh giá tiến độ Tuần 2 - Siết nét cơ bụng', 
 60.80, 168.00, 18.8, 26.70, 5, 5, 
 'Tập luyện rất chăm chỉ và đúng giờ. Cơ bụng săn gọn, sức bật tốt hơn trong các bài cardio, tinh thần luôn tươi vui đầy năng lượng.', 
 'Nâng cao thời gian giữ các tư thế thăng bằng tay trong Yoga.', 
 '2026-10-05 09:00:00'),

(4, 21, NULL, NULL, NULL, 
 'Tổng kết chỉ số thể chất tháng 10', 
 59.50, 168.00, 17.2, 27.50, 5, 5, 
 'Chuyển biến thể chất xuất sắc! Vóc dáng cân đối, năng lượng dồi dào trong mọi buổi tập. Mỡ giảm -3.3%, cơ tăng +1.5kg!', 
 'Tiếp tục duy trì lối sống lành mạnh và thực đơn dinh dưỡng khoa học.', 
 '2026-10-25 09:00:00');

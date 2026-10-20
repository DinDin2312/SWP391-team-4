const fs = require('fs');

const classes = [
  // --- SUBJECT 1: Gym (room 1) ---
  { id: 120, name: "Gym Tăng Cơ Hypertrophy Buổi Sáng", subjectId: 1, coachId: 3, roomId: 1, price: 850000, maxSlots: 15, pattern: "MWF", start: "07:00", end: "08:30" },
  { id: 121, name: "Gym Siết Mỡ & Cắt Nét Cơ Thể Chiều", subjectId: 1, coachId: 5, roomId: 1, price: 900000, maxSlots: 12, pattern: "MWF", start: "14:00", end: "15:30" },
  { id: 122, name: "Gym Tạ Nặng Sức Mạnh Toàn Thân", subjectId: 1, coachId: 3, roomId: 1, price: 850000, maxSlots: 15, pattern: "MWF", start: "17:30", end: "19:00" },
  { id: 123, name: "Gym Cardio & Kháng Lực Buổi Sáng", subjectId: 1, coachId: 4, roomId: 1, price: 800000, maxSlots: 15, pattern: "TTS", start: "07:00", end: "08:30" },
  { id: 124, name: "Gym Thể Hình Chuyên Sâu Tối Muộn", subjectId: 1, coachId: 3, roomId: 1, price: 850000, maxSlots: 15, pattern: "TTS", start: "19:15", end: "20:45" },
  { id: 125, name: "Gym Thể Lực Bứt Phá Sáng Cuối Tuần", subjectId: 1, coachId: 3, roomId: 1, price: 700000, maxSlots: 15, pattern: "SS", start: "08:45", end: "10:15" },

  // --- SUBJECT 2: Yoga (room 2) ---
  { id: 126, name: "Yoga Chào Mặt Trời Đón Năng Lượng", subjectId: 2, coachId: 4, roomId: 2, price: 650000, maxSlots: 15, pattern: "MWF", start: "07:00", end: "08:30" },
  { id: 127, name: "Yoga Dòng Chảy Thư Giãn Chiều Đầu Tuần", subjectId: 2, coachId: 5, roomId: 2, price: 650000, maxSlots: 15, pattern: "MWF", start: "14:00", end: "15:30" },
  { id: 128, name: "Yoga Trị Liệu Thoát Vị & Cổ Vai Gáy", subjectId: 2, coachId: 4, roomId: 2, price: 750000, maxSlots: 15, pattern: "MWF", start: "19:15", end: "20:45" },
  { id: 129, name: "Yoga Dẻo Dai & Cân Bằng Chiều Tối", subjectId: 2, coachId: 3, roomId: 2, price: 700000, maxSlots: 15, pattern: "TTS", start: "17:30", end: "19:00" },
  { id: 130, name: "Yoga Thiền Định & Nến Thơm Buổi Tối", subjectId: 2, coachId: 4, roomId: 2, price: 700000, maxSlots: 15, pattern: "TTS", start: "19:15", end: "20:45" },
  { id: 131, name: "Yoga Dáng Đẹp & Thon Gọn Cuối Tuần", subjectId: 2, coachId: 4, roomId: 2, price: 600000, maxSlots: 15, pattern: "SS", start: "10:30", end: "12:00" },

  // --- SUBJECT 3: Zumba (room 3) ---
  { id: 132, name: "Zumba Sôi Động Khởi Đầu Ngày Mới", subjectId: 3, coachId: 5, roomId: 3, price: 550000, maxSlots: 20, pattern: "MWF", start: "07:00", end: "08:30" },
  { id: 133, name: "Zumba Đốt Mỡ Cường Độ Cao Hi-Lo", subjectId: 3, coachId: 3, roomId: 3, price: 550000, maxSlots: 20, pattern: "MWF", start: "17:30", end: "19:00" },
  { id: 134, name: "Zumba Latin Nhịp Điệu Cuồng Nhiệt", subjectId: 3, coachId: 5, roomId: 3, price: 550000, maxSlots: 20, pattern: "MWF", start: "19:15", end: "20:45" },
  { id: 135, name: "Zumba Nhạc Trẻ Trendy & Săn Chắc", subjectId: 3, coachId: 4, roomId: 3, price: 550000, maxSlots: 20, pattern: "TTS", start: "17:30", end: "19:00" },
  { id: 136, name: "Zumba Fitness Vũ Điệu Vui Nhộn Tối", subjectId: 3, coachId: 5, roomId: 3, price: 550000, maxSlots: 20, pattern: "TTS", start: "19:15", end: "20:45" },
  { id: 137, name: "Zumba Party Chiều Cuối Tuần Năng Động", subjectId: 3, coachId: 3, roomId: 3, price: 500000, maxSlots: 25, pattern: "SS", start: "14:00", end: "15:30" },

  // --- SUBJECT 4: Bơi Lội (room 4) ---
  { id: 138, name: "Bơi Sải Sáng Sớm Tăng Thể Lực", subjectId: 4, coachId: 5, roomId: 4, price: 1200000, maxSlots: 12, pattern: "MWF", start: "07:00", end: "08:30" },
  { id: 139, name: "Bơi Ếch Kỹ Thuật Chuẩn & Bền Bỉ", subjectId: 4, coachId: 3, roomId: 4, price: 1200000, maxSlots: 12, pattern: "MWF", start: "15:45", end: "17:15" },
  { id: 140, name: "Bơi Lội Giải Tỏa Căng Thẳng Chiều Tối", subjectId: 4, coachId: 4, roomId: 4, price: 1250000, maxSlots: 12, pattern: "MWF", start: "17:30", end: "19:00" },
  { id: 141, name: "Bơi Bướm Nâng Cao & Thể Lực Vượt Trội", subjectId: 4, coachId: 5, roomId: 4, price: 1300000, maxSlots: 12, pattern: "TTS", start: "07:00", end: "08:30" },
  { id: 142, name: "Bơi Kỹ Thuật Đẹp & Chống Đuối Nước", subjectId: 4, coachId: 4, roomId: 4, price: 1200000, maxSlots: 12, pattern: "TTS", start: "17:30", end: "19:00" },
  { id: 143, name: "Bơi Lội Nước Ấm Thư Giãn Cuối Tuần", subjectId: 4, coachId: 5, roomId: 4, price: 1100000, maxSlots: 12, pattern: "SS", start: "08:45", end: "10:15" },

  // --- SUBJECT 5: Đạp Xe Spinning (room 5) ---
  { id: 144, name: "Spinning Đạp Xe Buổi Sáng Đốt Calo", subjectId: 5, coachId: 3, roomId: 5, price: 650000, maxSlots: 15, pattern: "MWF", start: "07:00", end: "08:30" },
  { id: 145, name: "Spinning Nhịp Điệu Âm Nhạc Bùng Nổ", subjectId: 5, coachId: 4, roomId: 5, price: 650000, maxSlots: 15, pattern: "MWF", start: "17:30", end: "19:00" },
  { id: 146, name: "Spinning RPM Thử Thách Tốc Độ Đêm", subjectId: 5, coachId: 3, roomId: 5, price: 650000, maxSlots: 15, pattern: "MWF", start: "19:15", end: "20:45" },
  { id: 147, name: "Spinning Leo Dốc Kháng Lực Sáng Sớm", subjectId: 5, coachId: 5, roomId: 5, price: 650000, maxSlots: 15, pattern: "TTS", start: "07:00", end: "08:30" },
  { id: 148, name: "Spinning Cardio Bền Bỉ Chiều Tối", subjectId: 5, coachId: 4, roomId: 5, price: 650000, maxSlots: 15, pattern: "TTS", start: "17:30", end: "19:00" },
  { id: 149, name: "Spinning Bứt Phá Giới Hạn Sáng Cuối Tuần", subjectId: 5, coachId: 5, roomId: 5, price: 600000, maxSlots: 15, pattern: "SS", start: "08:45", end: "10:15" }
];

const mwfDates = [
  "2026-11-16", "2026-11-18", "2026-11-20",
  "2026-11-23", "2026-11-25", "2026-11-27",
  "2026-11-30", "2026-12-02", "2026-12-04",
  "2026-12-07", "2026-12-09", "2026-12-11"
];

const ttsDates = [
  "2026-11-17", "2026-11-19", "2026-11-21",
  "2026-11-24", "2026-11-26", "2026-11-28",
  "2026-12-01", "2026-12-03", "2026-12-05",
  "2026-12-08", "2026-12-10", "2026-12-12"
];

const ssDates = [
  "2026-11-21", "2026-11-22",
  "2026-11-28", "2026-11-29",
  "2026-12-05", "2026-12-06",
  "2026-12-12", "2026-12-13"
];

let sql = "USE SportCenter;\n\n";

// Delete existing next-term classes in this ID range if re-run
sql += "-- Clean up any previous seed in ID range 120-149\n";
sql += "DELETE FROM schedules WHERE class_id BETWEEN 120 AND 149;\n";
sql += "DELETE FROM classes WHERE class_id BETWEEN 120 AND 149;\n\n";

sql += "-- 1. Insert 30 Next-Term Classes across 5 Subjects\n";
classes.forEach(c => {
  sql += `INSERT INTO classes (class_id, class_name, subject_id, coach_id, room_id, status, price, max_slots) VALUES (${c.id}, '${c.name}', ${c.subjectId}, ${c.coachId}, ${c.roomId}, 'ACTIVE', ${c.price}, ${c.maxSlots});\n`;
});

sql += "\n-- 2. Insert Full Schedules for each Next-Term Class\n";
classes.forEach(c => {
  const dates = c.pattern === 'MWF' ? mwfDates : (c.pattern === 'TTS' ? ttsDates : ssDates);
  dates.forEach(d => {
    const startDt = `${d} ${c.start}:00`;
    const endDt = `${d} ${c.end}:00`;
    sql += `INSERT INTO schedules (class_id, start_time, end_time, status, changeover_minutes) VALUES (${c.id}, '${startDt}', '${endDt}', 'SCHEDULED', 0);\n`;
  });
});

fs.writeFileSync('SWP391_Code/Backend/seed_next_term_classes.sql', sql, 'utf8');
console.log(`Generated seed_next_term_classes.sql with ${classes.length} classes and their schedules.`);

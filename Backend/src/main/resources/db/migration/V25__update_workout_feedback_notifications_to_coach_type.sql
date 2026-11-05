-- Migration V25: Update workout feedback notifications to COACH type
UPDATE NOTIFICATIONS 
SET type = 'COACH' 
WHERE type = 'WORKOUT_FEEDBACK' 
   OR title LIKE '[Nhận xét bài tập]%';


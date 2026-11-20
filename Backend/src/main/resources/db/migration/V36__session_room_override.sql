-- ==============================================================================
-- V36: A SESSION CAN USE ANOTHER ROOM THAN ITS CLASS
-- A room can break or be booked for maintenance on one day only. SCHEDULES.room_id
-- holds the room of that one session; NULL keeps the class room. Every query that
-- needs the room of a session reads COALESCE(SCHEDULES.room_id, CLASSES.room_id).
-- ==============================================================================
ALTER TABLE SCHEDULES ADD COLUMN room_id INT NULL AFTER class_id;
ALTER TABLE SCHEDULES ADD CONSTRAINT FK_SCHEDULES_ROOM FOREIGN KEY (room_id) REFERENCES ROOMS(room_id);
CREATE INDEX IDX_SCHEDULES_ROOM_TIME ON SCHEDULES (room_id, start_time);

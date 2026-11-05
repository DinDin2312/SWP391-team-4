-- Which subjects each room is set up for. Used to suggest rooms when creating a class.
CREATE TABLE IF NOT EXISTS ROOM_SUBJECTS (
    room_id INT NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (room_id, subject_id),
    KEY idx_room_subjects_subject (subject_id),
    CONSTRAINT fk_room_subjects_room FOREIGN KEY (room_id) REFERENCES ROOMS(room_id) ON DELETE CASCADE,
    CONSTRAINT fk_room_subjects_subject FOREIGN KEY (subject_id) REFERENCES SUBJECTS(subject_id) ON DELETE CASCADE
);

-- Seed from the rooms each subject already uses.
INSERT IGNORE INTO ROOM_SUBJECTS (room_id, subject_id)
SELECT DISTINCT c.room_id, c.subject_id FROM CLASSES c
JOIN ROOMS r ON r.room_id = c.room_id JOIN SUBJECTS s ON s.subject_id = c.subject_id;

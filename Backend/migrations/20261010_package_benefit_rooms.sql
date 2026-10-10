CREATE TABLE PACKAGE_BENEFIT_ROOMS (
 package_id int NOT NULL, subject_id int NOT NULL, room_id int NOT NULL,
 PRIMARY KEY(package_id,subject_id,room_id),
 FOREIGN KEY(package_id,subject_id) REFERENCES PACKAGE_SUBJECT_BENEFITS(package_id,subject_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);
CREATE TABLE MEMBERSHIP_BENEFIT_ROOMS (
 benefit_id int NOT NULL, room_id int NOT NULL, room_name varchar(255) NOT NULL,
 PRIMARY KEY(benefit_id,room_id),
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);

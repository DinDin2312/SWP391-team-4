-- Run once on existing databases before deploying. New installs use database_init.sql.
ALTER TABLE USER_MEMBERSHIPS
 ADD COLUMN package_name_snapshot varchar(255),
 ADD COLUMN package_type_snapshot varchar(255),
 ADD COLUMN duration_days_snapshot int,
 ADD COLUMN price_snapshot decimal(10,2);

CREATE TABLE PACKAGE_SUBJECT_BENEFITS (
 package_id int NOT NULL, subject_id int NOT NULL, session_limit int NOT NULL,
 PRIMARY KEY(package_id,subject_id),
 FOREIGN KEY(package_id) REFERENCES PACKAGES(package_id),
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id),
 CHECK(session_limit BETWEEN 1 AND 10000)
);
CREATE TABLE MEMBERSHIP_SUBJECT_BENEFITS (
 benefit_id int PRIMARY KEY AUTO_INCREMENT, membership_id int NOT NULL,
 subject_id int NOT NULL, subject_name varchar(255) NOT NULL, session_limit int NOT NULL,
 UNIQUE(membership_id,subject_id),
 FOREIGN KEY(membership_id) REFERENCES USER_MEMBERSHIPS(membership_id) ON DELETE CASCADE,
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id)
);
CREATE TABLE BOOKING_BENEFITS (
 booking_id int PRIMARY KEY, benefit_id int NOT NULL,
 FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE,
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id)
);
UPDATE USER_MEMBERSHIPS m JOIN PACKAGES p ON p.package_id=m.package_id
 SET m.package_name_snapshot=p.package_name,m.package_type_snapshot=p.package_type,
 m.duration_days_snapshot=p.duration_days,m.price_snapshot=p.price;

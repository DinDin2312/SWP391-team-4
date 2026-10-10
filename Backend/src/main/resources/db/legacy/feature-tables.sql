CREATE TABLE IF NOT EXISTS PACKAGE_SUBJECT_BENEFITS (
 package_id int NOT NULL, subject_id int NOT NULL, session_limit int NOT NULL,
 PRIMARY KEY(package_id,subject_id),
 FOREIGN KEY(package_id) REFERENCES PACKAGES(package_id),
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id),
 CHECK(session_limit BETWEEN 1 AND 10000)
);

CREATE TABLE IF NOT EXISTS MEMBERSHIP_SUBJECT_BENEFITS (
 benefit_id int PRIMARY KEY AUTO_INCREMENT, membership_id int NOT NULL,
 subject_id int NOT NULL, subject_name varchar(255) NOT NULL, session_limit int NOT NULL,
 UNIQUE(membership_id,subject_id),
 FOREIGN KEY(membership_id) REFERENCES USER_MEMBERSHIPS(membership_id) ON DELETE CASCADE,
 FOREIGN KEY(subject_id) REFERENCES SUBJECTS(subject_id)
);

CREATE TABLE IF NOT EXISTS BOOKING_BENEFITS (
 booking_id int PRIMARY KEY, benefit_id int NOT NULL,
 FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id) ON DELETE CASCADE,
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id)
);

CREATE TABLE IF NOT EXISTS PACKAGE_TYPES (
 type_code varchar(100) PRIMARY KEY,
 type_name varchar(255) NOT NULL UNIQUE,
 requires_subjects boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS INVOICE_BOOKINGS (invoice_id int NOT NULL, booking_id int NOT NULL, PRIMARY KEY(invoice_id,booking_id), FOREIGN KEY(invoice_id) REFERENCES INVOICES(invoice_id), FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id));

CREATE TABLE IF NOT EXISTS PACKAGE_BENEFIT_ROOMS (
 package_id int NOT NULL, subject_id int NOT NULL, room_id int NOT NULL,
 PRIMARY KEY(package_id,subject_id,room_id),
 FOREIGN KEY(package_id,subject_id) REFERENCES PACKAGE_SUBJECT_BENEFITS(package_id,subject_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);

CREATE TABLE IF NOT EXISTS MEMBERSHIP_BENEFIT_ROOMS (
 benefit_id int NOT NULL, room_id int NOT NULL, room_name varchar(255) NOT NULL,
 PRIMARY KEY(benefit_id,room_id),
 FOREIGN KEY(benefit_id) REFERENCES MEMBERSHIP_SUBJECT_BENEFITS(benefit_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id) REFERENCES ROOMS(room_id)
);

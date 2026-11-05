-- Rooms can be under maintenance or retired; subjects can be retired. Inactive ones are not offered for new classes.
ALTER TABLE ROOMS ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE SUBJECTS ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

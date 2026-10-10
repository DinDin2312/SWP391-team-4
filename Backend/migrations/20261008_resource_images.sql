-- Apply once to an existing database if Hibernate ddl-auto=update is disabled.
-- Existing rows keep NULL; there is no change to prices, memberships or bookings.
ALTER TABLE ROOMS ADD COLUMN image_path VARCHAR(255) NULL;
ALTER TABLE CLASSES ADD COLUMN image_path VARCHAR(255) NULL;
ALTER TABLE PACKAGES ADD COLUMN image_path VARCHAR(255) NULL;

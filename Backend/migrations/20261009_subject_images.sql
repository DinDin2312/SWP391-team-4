-- Apply to existing databases; preserves all subject data.
ALTER TABLE SUBJECTS ADD COLUMN image_path VARCHAR(255) NULL;

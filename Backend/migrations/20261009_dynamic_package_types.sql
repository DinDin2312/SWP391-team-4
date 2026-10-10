CREATE TABLE PACKAGE_TYPES (
 type_code varchar(100) PRIMARY KEY,
 type_name varchar(255) NOT NULL UNIQUE,
 requires_subjects boolean NOT NULL DEFAULT FALSE
);
INSERT INTO PACKAGE_TYPES VALUES
 ('GYM_ACCESS','Gym access',FALSE),('AI_ACCESS','AI access',FALSE),
 ('PREMIUM','Premium',FALSE),('COMBO','Combo (Gym + AI)',FALSE),
 ('SUBJECT_ACCESS','Subject package',TRUE);
INSERT IGNORE INTO PACKAGE_TYPES(type_code,type_name,requires_subjects)
 SELECT DISTINCT package_type,package_type,FALSE FROM PACKAGES WHERE package_type IS NOT NULL;
ALTER TABLE USER_MEMBERSHIPS ADD COLUMN type_name_snapshot varchar(255);
UPDATE USER_MEMBERSHIPS m JOIN PACKAGE_TYPES t ON t.type_code=COALESCE(m.package_type_snapshot,(SELECT p.package_type FROM PACKAGES p WHERE p.package_id=m.package_id))
 SET m.type_name_snapshot=t.type_name WHERE m.type_name_snapshot IS NULL;

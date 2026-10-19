-- Preserve existing teaching assignments while enabling subject eligibility checks.
INSERT INTO USER_SUBJECTS(user_id,subject_id)
SELECT DISTINCT c.coach_id,c.subject_id FROM CLASSES c
JOIN USERS u ON u.user_id=c.coach_id JOIN ROLES r ON r.role_id=u.role_id
JOIN SUBJECTS s ON s.subject_id=c.subject_id
WHERE r.role_name='Coach' AND NOT EXISTS (
 SELECT 1 FROM USER_SUBJECTS us WHERE us.user_id=c.coach_id AND us.subject_id=c.subject_id
);

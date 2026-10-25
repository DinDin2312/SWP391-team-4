-- Cleanup legacy subject benefits mistakenly assigned to general facility access packages
DELETE b FROM PACKAGE_SUBJECT_BENEFITS b
JOIN PACKAGES p ON p.package_id = b.package_id
LEFT JOIN PACKAGE_TYPES t ON t.type_code = p.package_type
WHERE t.requires_subjects = FALSE OR p.package_type IN ('GYM_ACCESS', 'AI_ACCESS', 'PREMIUM', 'COMBO');

DELETE mb FROM MEMBERSHIP_SUBJECT_BENEFITS mb
JOIN USER_MEMBERSHIPS m ON m.membership_id = mb.membership_id
LEFT JOIN PACKAGE_TYPES t ON t.type_code = m.package_type_snapshot
WHERE t.requires_subjects = FALSE OR m.package_type_snapshot IN ('GYM_ACCESS', 'AI_ACCESS', 'PREMIUM', 'COMBO');

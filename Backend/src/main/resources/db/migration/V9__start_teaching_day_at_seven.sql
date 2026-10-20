-- Upgrade the original default without changing existing session times.
UPDATE CENTER_SCHEDULE_POLICY SET opens_at = '07:00:00'
WHERE policy_id = 1 AND opens_at = '06:00:00';

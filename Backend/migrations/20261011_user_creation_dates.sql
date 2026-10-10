-- Existing accounts remain unknown; adding a current timestamp to old rows
-- would falsely count every account as newly registered.
ALTER TABLE USERS ADD COLUMN created_at DATETIME NULL DEFAULT NULL;
ALTER TABLE USERS MODIFY COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX idx_users_created_at ON USERS(created_at);

ALTER TABLE PACKAGES ADD description varchar(1000), ADD terms text, ADD purchase_limit_per_member int, ADD selling_status varchar(20) NOT NULL DEFAULT 'SELLING';
ALTER TABLE USER_MEMBERSHIPS ADD description_snapshot varchar(1000), ADD terms_snapshot text, ADD purchase_completed_at datetime, ADD purchase_source varchar(20), ADD checkout_invoice_id int;
ALTER TABLE INVOICE_DETAILS ADD membership_id int;
ALTER TABLE AUDIT_LOGS ADD changes_json longtext;
CREATE TABLE INVOICE_BOOKINGS (invoice_id int NOT NULL, booking_id int NOT NULL, PRIMARY KEY(invoice_id,booking_id), FOREIGN KEY(invoice_id) REFERENCES INVOICES(invoice_id), FOREIGN KEY(booking_id) REFERENCES BOOKINGS(booking_id));
CREATE INDEX idx_membership_purchase ON USER_MEMBERSHIPS(user_id,package_id,purchase_completed_at);
CREATE INDEX idx_membership_checkout ON USER_MEMBERSHIPS(checkout_invoice_id);
CREATE INDEX idx_package_history ON AUDIT_LOGS(entity_type,entity_id,created_at);
UPDATE USER_MEMBERSHIPS SET purchase_completed_at=COALESCE(start_date,CURRENT_TIMESTAMP),purchase_source='LEGACY' WHERE status IN ('ACTIVE','EXPIRED');

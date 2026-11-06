DROP PROCEDURE IF EXISTS add_invoice_columns;
DELIMITER //
CREATE PROCEDURE add_invoice_columns()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'INVOICES' 
        AND COLUMN_NAME = 'subtotal'
    ) THEN
        ALTER TABLE INVOICES ADD COLUMN subtotal DECIMAL(10,2) NULL AFTER user_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'INVOICES' 
        AND COLUMN_NAME = 'discount_amount'
    ) THEN
        ALTER TABLE INVOICES ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER subtotal;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'INVOICES' 
        AND COLUMN_NAME = 'voucher_code'
    ) THEN
        ALTER TABLE INVOICES ADD COLUMN voucher_code VARCHAR(255) NULL AFTER discount_amount;
    END IF;
END //
DELIMITER ;
CALL add_invoice_columns();
DROP PROCEDURE IF EXISTS add_invoice_columns;

-- Backfill legacy records: compute subtotal from invoice details if items sum is higher
UPDATE INVOICES i
JOIN (
    SELECT invoice_id, SUM(unit_price) AS sum_price 
    FROM INVOICE_DETAILS 
    GROUP BY invoice_id
) d ON i.invoice_id = d.invoice_id
SET i.subtotal = d.sum_price,
    i.discount_amount = CASE 
        WHEN d.sum_price > i.total_amount THEN (d.sum_price - i.total_amount)
        ELSE 0.00 
    END,
    i.voucher_code = CASE
        WHEN i.voucher_code IS NOT NULL THEN i.voucher_code
        WHEN d.sum_price > i.total_amount THEN 'VIP / Voucher'
        ELSE NULL
    END
WHERE i.subtotal IS NULL OR i.discount_amount = 0.00;

UPDATE INVOICES SET subtotal = total_amount WHERE subtotal IS NULL;

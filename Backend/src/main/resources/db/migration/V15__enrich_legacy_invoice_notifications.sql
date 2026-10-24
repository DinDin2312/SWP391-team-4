-- Migration V15: Enrich legacy invoice notifications with service details, price, and method
UPDATE NOTIFICATIONS n
JOIN (
    SELECT 
        i.invoice_id,
        i.total_amount,
        COALESCE(MAX(p.payment_method), 'ONLINE') AS payment_method,
        COALESCE(
            NULLIF(GROUP_CONCAT(DISTINCT COALESCE(c.class_name, pkg.package_name) SEPARATOR ', '), ''),
            'Dịch vụ trung tâm thể thao'
        ) AS item_names
    FROM INVOICES i
    LEFT JOIN PAYMENTS p ON p.invoice_id = i.invoice_id
    LEFT JOIN INVOICE_DETAILS idt ON idt.invoice_id = i.invoice_id
    LEFT JOIN CLASSES c ON idt.class_id = c.class_id
    LEFT JOIN PACKAGES pkg ON idt.package_id = pkg.package_id
    GROUP BY i.invoice_id, i.total_amount
) inv_summary ON n.message LIKE CONCAT('Your invoice ', inv_summary.invoice_id, ' is complete.')
SET n.title = CONCAT('Thanh toán thành công / Payment Successful #', inv_summary.invoice_id),
    n.message = CONCAT(
        'Hóa đơn #', inv_summary.invoice_id, ' đã thanh toán thành công.\n',
        '• Dịch vụ: ', inv_summary.item_names, '\n',
        '• Số tiền: ', FORMAT(COALESCE(inv_summary.total_amount, 0), 0), ' đ (', inv_summary.payment_method, ')\n',
        'Vui lòng nhấn vào "Xem hóa đơn" để kiểm tra chi tiết giao dịch.'
    )
WHERE n.message LIKE 'Your invoice % is complete.';

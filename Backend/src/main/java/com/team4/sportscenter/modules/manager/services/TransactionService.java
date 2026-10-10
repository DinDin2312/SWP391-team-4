package com.team4.sportscenter.modules.manager.services;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.sql.Timestamp;
import java.util.*;

/** Read-only ledger: payment attempts and invoices retain their own status and date semantics. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionService {
    private final JdbcTemplate jdbc;
    private static final String PAYMENT_STATE = "CASE WHEN i.status='REVIEW' AND p.status IN ('SUCCESS','COMPLETED') THEN 'REVIEW' WHEN p.status='COMPLETED' THEN 'SUCCESS' ELSE p.status END";

    public Map<String,Object> list(String mode, LocalDate from, LocalDate to, String status, String method, String keyword, int page, int size) {
        boolean payments = "payments".equals(mode);
        if (!payments && !"invoices".equals(mode)) throw new IllegalArgumentException("Invalid transaction view.");
        if (from == null || to == null || from.isAfter(to) || page < 0 || size < 1 || size > 100)
            throw new IllegalArgumentException("Invalid date range or pagination.");
        Set<String> statuses = payments ? Set.of("ALL","SUCCESS","PENDING","FAILED","CANCELLED","REVIEW") : Set.of("ALL","PAID","PENDING","FAILED","CANCELLED","REVIEW");
        if (!statuses.contains(status) || !Set.of("ALL","VNPAY","MOMO","CASH","FREE").contains(method)) throw new IllegalArgumentException("Invalid transaction filter.");
        String source = payments ? " FROM PAYMENTS p JOIN INVOICES i ON i.invoice_id=p.invoice_id LEFT JOIN USERS u ON u.user_id=i.user_id " : " FROM INVOICES i LEFT JOIN USERS u ON u.user_id=i.user_id ";
        String date = payments ? "p.payment_date" : "i.created_at";
        String state = payments ? PAYMENT_STATE : "i.status";
        StringBuilder where = new StringBuilder(" WHERE " + date + ">=? AND " + date + "<? ");
        List<Object> args = new ArrayList<>(List.of(from.atStartOfDay(),to.plusDays(1).atStartOfDay()));
        if (!"ALL".equals(status)) { where.append(" AND ").append(state).append("=?"); args.add(status); }
        if (!"ALL".equals(method)) {
            where.append(payments ? " AND UPPER(p.payment_method)=?" : " AND EXISTS(SELECT 1 FROM PAYMENTS pm WHERE pm.invoice_id=i.invoice_id AND UPPER(pm.payment_method)=?)"); args.add(method);
        }
        if (keyword != null && !keyword.isBlank()) {
            if (keyword.length()>200) throw new IllegalArgumentException("Search text is too long.");
            // LOCATE treats wildcard characters literally and every value is bound.
            where.append(" AND (LOCATE(LOWER(?),LOWER(COALESCE(u.full_name,'')))>0 OR LOCATE(LOWER(?),LOWER(COALESCE(u.email,'')))>0 OR CAST(i.invoice_id AS CHAR)=?");
            String search=keyword.trim(); args.add(search);args.add(search);args.add(search);
            if(payments){where.append(" OR LOCATE(LOWER(?),LOWER(COALESCE(p.transaction_no,'')))>0 OR CAST(p.payment_id AS CHAR)=?");args.add(search);args.add(search);}
            else {where.append(" OR EXISTS(SELECT 1 FROM PAYMENTS ps WHERE ps.invoice_id=i.invoice_id AND LOCATE(LOWER(?),LOWER(COALESCE(ps.transaction_no,'')))>0)");args.add(search);}
            where.append(")");
        }
        long total=jdbc.queryForObject("SELECT COUNT(*)"+source+where,Long.class,args.toArray());
        String columns="i.invoice_id invoiceId,i.status invoiceStatus,i.total_amount totalAmount,i.created_at createdAt,u.full_name memberName,u.email memberEmail";
        columns += payments ? ",p.payment_id paymentId,p.amount,p.payment_method paymentMethod,p.transaction_no transactionNo,p.status rawPaymentStatus,"+PAYMENT_STATE+" paymentStatus,p.payment_date paymentDate" : ",(SELECT COUNT(*) FROM PAYMENTS pc WHERE pc.invoice_id=i.invoice_id) paymentCount";
        List<Object> paged=new ArrayList<>(args);paged.add(size);paged.add((long)page*size);
        var rows=jdbc.queryForList("SELECT "+columns+source+where+" ORDER BY "+date+" DESC,"+(payments?"p.payment_id":"i.invoice_id")+" DESC LIMIT ? OFFSET ?",paged.toArray()).stream().map(this::times).toList();
        return Map.of("items",rows,"total",total,"page",page,"size",size,"mode",mode);
    }

    public Map<String,Object> detail(int id) {
        var invoice=times(jdbc.queryForMap("SELECT i.invoice_id invoiceId,i.status invoiceStatus,i.total_amount totalAmount,i.created_at createdAt,u.full_name memberName,u.email memberEmail FROM INVOICES i LEFT JOIN USERS u ON u.user_id=i.user_id WHERE i.invoice_id=?",id));
        invoice.put("items",jdbc.queryForList("SELECT d.detail_id detailId,d.unit_price unitPrice,COALESCE(pk.package_name,c.class_name,sc.class_name,'Unknown item') itemName,CASE WHEN d.package_id IS NOT NULL THEN 'PACKAGE' ELSE 'CLASS' END itemType FROM INVOICE_DETAILS d LEFT JOIN PACKAGES pk ON pk.package_id=d.package_id LEFT JOIN CLASSES c ON c.class_id=d.class_id LEFT JOIN SCHEDULES s ON s.schedule_id=d.schedule_id LEFT JOIN CLASSES sc ON sc.class_id=s.class_id WHERE d.invoice_id=? ORDER BY d.detail_id",id));
        invoice.put("payments",jdbc.queryForList("SELECT p.payment_id paymentId,p.amount,p.payment_method paymentMethod,p.transaction_no transactionNo,p.status rawPaymentStatus,"+PAYMENT_STATE+" paymentStatus,p.payment_date paymentDate FROM PAYMENTS p JOIN INVOICES i ON i.invoice_id=p.invoice_id WHERE p.invoice_id=? ORDER BY p.payment_date DESC,p.payment_id DESC",id).stream().map(this::times).toList());
        return invoice;
    }
    private Map<String,Object> times(Map<String,Object> row) {
        row.replaceAll((key,value)->value instanceof Timestamp timestamp?timestamp.toLocalDateTime():value); return row;
    }
}

package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.zip.CRC32;

/** Immutable bridge from manual/Hibernate-managed installations to Flyway. */
public class V2__adopt_existing_package_schema extends BaseJavaMigration {
    private static final String TABLES = "/db/legacy/feature-tables.sql";
    private static final String[][] COLUMNS = {
        {"USERS", "avatar_path", "varchar(255)"},
        {"USERS", "force_password_change", "boolean NOT NULL DEFAULT false"},
        {"USERS", "loyalty_points", "int DEFAULT 0"},
        {"NOTIFICATIONS", "type", "varchar(255) NOT NULL DEFAULT 'SYSTEM'"},
        {"NOTIFICATIONS", "is_read", "boolean NOT NULL DEFAULT false"},
        {"ROOMS", "image_path", "varchar(255)"},
        {"CLASSES", "image_path", "varchar(255)"},
        {"SUBJECTS", "image_path", "varchar(255)"},
        {"PACKAGES", "image_path", "varchar(255)"},
        {"PACKAGES", "description", "varchar(1000)"},
        {"PACKAGES", "terms", "text"},
        {"PACKAGES", "purchase_limit_per_member", "int"},
        {"PACKAGES", "selling_status", "varchar(20) NOT NULL DEFAULT 'SELLING'"},
        {"USER_MEMBERSHIPS", "package_name_snapshot", "varchar(255)"},
        {"USER_MEMBERSHIPS", "package_type_snapshot", "varchar(255)"},
        {"USER_MEMBERSHIPS", "duration_days_snapshot", "int"},
        {"USER_MEMBERSHIPS", "price_snapshot", "decimal(10,2)"},
        {"USER_MEMBERSHIPS", "type_name_snapshot", "varchar(255)"},
        {"USER_MEMBERSHIPS", "description_snapshot", "varchar(1000)"},
        {"USER_MEMBERSHIPS", "terms_snapshot", "text"},
        {"USER_MEMBERSHIPS", "purchase_completed_at", "datetime"},
        {"USER_MEMBERSHIPS", "purchase_source", "varchar(20)"},
        {"USER_MEMBERSHIPS", "checkout_invoice_id", "int"},
        {"INVOICE_DETAILS", "membership_id", "int"},
        {"AUDIT_LOGS", "changes_json", "longtext"}
    };

    @Override public Integer getChecksum() {
        try {
            var crc = new CRC32();
            crc.update("immutable-bridge-revision-1".getBytes(StandardCharsets.UTF_8));
            for (var column : COLUMNS) crc.update(String.join("|", column).getBytes(StandardCharsets.UTF_8));
            crc.update(resource());
            return (int)crc.getValue();
        } catch (Exception error) { throw new IllegalStateException(error); }
    }
    private byte[] resource() throws Exception {
        try (var input = getClass().getResourceAsStream(TABLES)) {
            if (input == null) throw new IllegalStateException("Missing migration resource " + TABLES);
            return input.readAllBytes();
        }
    }
    @Override public void migrate(Context context) throws Exception {
        var connection = context.getConnection();
        for (var column : COLUMNS) {
            if (!hasColumn(connection, column[0], column[1])) execute(connection,
                "ALTER TABLE `"+column[0]+"` ADD COLUMN `"+column[1]+"` "+column[2]);
        }
        for (var statement : new String(resource(), StandardCharsets.UTF_8).split(";")) {
            if (!statement.isBlank()) execute(connection, statement);
        }
        for (String role : new String[]{"Center Manager", "Receptionist", "Coach", "Member"}) {
            try (var statement = connection.prepareStatement("INSERT INTO ROLES(role_name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM ROLES WHERE role_name=?)")) {
                statement.setString(1, role); statement.setString(2, role); statement.executeUpdate();
            }
        }
        String[][] types = {{"GYM_ACCESS","Gym access","0"},{"AI_ACCESS","AI access","0"},
            {"PREMIUM","Premium","0"},{"COMBO","Combo (Gym + AI)","0"},{"SUBJECT_ACCESS","Subject package","1"}};
        for (var type : types) {
            try (var statement = connection.prepareStatement("INSERT INTO PACKAGE_TYPES(type_code,type_name,requires_subjects) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM PACKAGE_TYPES WHERE type_code=? OR type_name=?)")) {
                statement.setString(1,type[0]); statement.setString(2,type[1]); statement.setBoolean(3,type[2].equals("1"));
                statement.setString(4,type[0]); statement.setString(5,type[1]); statement.executeUpdate();
            }
        }
        execute(connection,"INSERT IGNORE INTO PACKAGE_TYPES(type_code,type_name,requires_subjects) SELECT DISTINCT package_type,package_type,FALSE FROM PACKAGES WHERE package_type IS NOT NULL");
        execute(connection,"""
            UPDATE USER_MEMBERSHIPS m JOIN PACKAGES p ON p.package_id=m.package_id
            SET m.package_name_snapshot=COALESCE(m.package_name_snapshot,p.package_name),
                m.package_type_snapshot=COALESCE(m.package_type_snapshot,p.package_type),
                m.duration_days_snapshot=COALESCE(m.duration_days_snapshot,p.duration_days),
                m.price_snapshot=COALESCE(m.price_snapshot,p.price)
            WHERE m.package_name_snapshot IS NULL OR m.package_type_snapshot IS NULL
               OR m.duration_days_snapshot IS NULL OR m.price_snapshot IS NULL
            """);
        execute(connection,"""
            UPDATE USER_MEMBERSHIPS m JOIN PACKAGE_TYPES t ON t.type_code=m.package_type_snapshot
            SET m.type_name_snapshot=t.type_name WHERE m.type_name_snapshot IS NULL
            """);
        execute(connection,"""
            UPDATE USER_MEMBERSHIPS SET purchase_completed_at=start_date,purchase_source='LEGACY'
            WHERE purchase_completed_at IS NULL AND purchase_source IS NULL
              AND start_date IS NOT NULL AND status IN ('ACTIVE','EXPIRED')
            """);
        index(connection,"USER_MEMBERSHIPS","idx_membership_purchase","user_id,package_id,purchase_completed_at");
        index(connection,"USER_MEMBERSHIPS","idx_membership_checkout","checkout_invoice_id");
        index(connection,"AUDIT_LOGS","idx_package_history","entity_type,entity_id,created_at");
    }
    static boolean hasColumn(Connection connection, String table, String column) throws SQLException {
        try (var statement = connection.prepareStatement("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?")) {
            statement.setString(1,table); statement.setString(2,column);
            try (var result=statement.executeQuery()) { result.next(); return result.getInt(1)>0; }
        }
    }
    static void execute(Connection connection, String sql) throws SQLException {
        try (var statement=connection.createStatement()) { statement.execute(sql); }
    }
    static void index(Connection connection, String table, String name, String columns) throws SQLException {
        try (var statement=connection.prepareStatement("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND index_name=?")) {
            statement.setString(1,table); statement.setString(2,name);
            try (var result=statement.executeQuery()) {
                result.next(); if (result.getInt(1)>0) return;
            }
        }
        execute(connection,"CREATE INDEX `"+name+"` ON `"+table+"` ("+columns+")");
    }
}

package com.team4.sportscenter.config;

import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.sql.*;
import java.util.*;

@Configuration
public class DatabaseMigrationConfig {
    @Bean
    public FlywayMigrationStrategy recognizedLegacyDatabase() {
        return flyway -> {
            try (var connection = flyway.getConfiguration().getDataSource().getConnection()) {
                var tables = new HashSet<String>();
                try (var result = connection.getMetaData().getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"})) {
                    while (result.next()) tables.add(result.getString("TABLE_NAME").toUpperCase(Locale.ROOT));
                }
                if (!tables.isEmpty() && !tables.contains("FLYWAY_SCHEMA_HISTORY")) {
                    var required = Set.of("ROLES", "USERS", "SUBJECTS", "ROOMS", "PACKAGES", "USER_MEMBERSHIPS",
                            "CLASSES", "SCHEDULES", "BOOKINGS", "INVOICES", "INVOICE_DETAILS", "PAYMENTS", "AUDIT_LOGS",
                            "USER_SUBJECTS", "NOTIFICATIONS", "AI_WORKOUT_PLANS", "AI_PLAN_DETAILS", "EXERCISES",
                            "COACH_WORKOUT_PLANS", "COACH_PLAN_DETAILS");
                    if (!tables.containsAll(required)) {
                        throw new IllegalStateException("Refusing to baseline an unrecognized or incomplete database. Check DB_URL and restore the Sports Center schema before startup.");
                    }
                    // V1 is a fresh-schema script. V2/V3 reconcile supported manual installations.
                    flyway.baseline();
                }
            } catch (SQLException error) {
                throw new IllegalStateException("Cannot inspect database before Flyway migration", error);
            }
            flyway.migrate();
        };
    }
}

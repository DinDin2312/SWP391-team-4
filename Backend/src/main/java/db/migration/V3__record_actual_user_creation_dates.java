package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V3__record_actual_user_creation_dates extends BaseJavaMigration {
    @Override public Integer getChecksum() { return 2026101101; }
    @Override public void migrate(Context context) throws Exception {
        var connection=context.getConnection();
        if (!V2__adopt_existing_package_schema.hasColumn(connection,"USERS","created_at")) {
            // Two operations keep old rows unknown instead of assigning migration time.
            V2__adopt_existing_package_schema.execute(connection,"ALTER TABLE USERS ADD COLUMN created_at DATETIME NULL DEFAULT NULL");
        }
        V2__adopt_existing_package_schema.execute(connection,"ALTER TABLE USERS MODIFY COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
        V2__adopt_existing_package_schema.index(connection,"USERS","idx_users_created_at","created_at");
    }
}

package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Retains the unique-email contract formerly created by Hibernate update. */
public class V4__preserve_user_email_uniqueness extends BaseJavaMigration {
    @Override public Integer getChecksum() { return 2026101102; }
    @Override public void migrate(Context context) throws Exception {
        var connection=context.getConnection();
        try(var statement=connection.createStatement();var indexes=statement.executeQuery("""
            SELECT index_name FROM information_schema.statistics
            WHERE table_schema=DATABASE() AND table_name='USERS' AND non_unique=0
            GROUP BY index_name HAVING COUNT(*)=1 AND MAX(column_name)='email'
            """)) {
            if(indexes.next())return;
        }
        // Duplicate legacy emails fail explicitly; never remove or merge accounts automatically.
        V2__adopt_existing_package_schema.execute(connection,"CREATE UNIQUE INDEX uq_users_email ON USERS(email)");
    }
}

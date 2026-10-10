# Automatic database migrations

Flyway applies pending migrations during backend startup, before Hibernate validates the schema. Pulling code downloads migrations; starting backend executes them once.

Existing installations keep their database. Back up before first upgrade, configure `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and start normally. A recognized Sports Center schema is baselined at V1; V2 reconciles missing historical package/image fields and tables; V3 keeps existing account dates and leaves unknown old dates NULL. Unrelated/incomplete databases are rejected. The connection needs schema DDL privileges on MySQL 8.

For new installations, create an empty MySQL database first, then start backend. V1 creates schema, V2 initializes required roles/package types, and V3 records future creation dates. No demo accounts, payments, or bookings are inserted automatically. `database_init.sql` is only an optional reset for disposable demo databases.

```sql
CREATE DATABASE SportCenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

V4 preserves the unique-email constraint previously created by Hibernate. Existing equivalent indexes are kept. Duplicate legacy emails stop migration instead of merging/deleting accounts; resolve duplicates before repairing a failed migration.

Add future migrations as `V5__description.sql`, then V6, under `src/main/resources/db/migration`. Java migrations are under `src/main/java/db/migration` and provide stable checksums. Applied versions are immutable. Hibernate now uses `ddl-auto=validate`; entity schema changes need migrations. Flyway tracks versions/checksums in `flyway_schema_history`; completed migrations do not execute again.

MySQL DDL is not transactional. Inspect and correct partial schema changes before using Flyway repair tooling after a failed migration. Startup never repairs history automatically, clean is disabled, and checksum mismatches stop startup.

Migration tests create/remove only unique `sportcenter_flyway_test_*` schemas. Configure `MIGRATION_TEST_URL`, `MIGRATION_TEST_USERNAME`, `MIGRATION_TEST_PASSWORD` on a test server permitting disposable schemas, then run `./mvnw -Dtest=DatabaseMigrationTests test`. Without these variables, migration tests explicitly skip. Other integration tests require a populated disposable fixture database.

References: [Spring Boot](https://docs.spring.io/spring-boot/4.1/how-to/data-initialization.html), [Flyway Java migrations](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/java-based-migrations).

## Historical manual migration scripts

The following scripts are superseded by Flyway. Do not run them again after automatic migration adoption. The original sequence is retained for reference only.

These historical scripts are not idempotent. The package-type migration requires snapshot columns from the subject-benefit migration.

Historical execution order:

1. `20261008_resource_images.sql`
2. `20261009_subject_images.sql`
3. `20261009_package_subject_benefits.sql`
4. `20261009_dynamic_package_types.sql`
5. `20261009_package_commerce.sql`
6. `20261010_package_benefit_rooms.sql`
7. `20261011_user_creation_dates.sql`: records creation dates for future accounts. Existing accounts remain NULL; never backfill them with migration time.

Before Flyway adoption, new installations used `Backend/database_init.sql`. Current installations should use automatic startup migration as described above.

No room restriction rows means all locations, preserving existing package behavior. Purchased memberships retain benefit, price and location snapshots when package definitions change. Restrict resource-image storage to application-managed files and back up that directory with the database.

Verify the schema and exercise package creation, purchase, course booking and schedule preview on a staging database before rollout. Database initialization replaces data and must never be used to migrate a populated database.

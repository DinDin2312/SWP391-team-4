# Center management database migrations

For an existing database, back up the database and apply only migrations that have not already been applied. These scripts are one-time migrations and are not idempotent. Do not infer execution order from filenames: the package-type migration requires snapshot columns from the subject-benefit migration.

Apply in this order:

1. `20261008_resource_images.sql`
2. `20261009_subject_images.sql`
3. `20261009_package_subject_benefits.sql`
4. `20261009_dynamic_package_types.sql`
5. `20261009_package_commerce.sql`
6. `20261010_package_benefit_rooms.sql`

New installations use the updated `Backend/database_init.sql` instead; do not apply these migrations again after initialization.

No room restriction rows means all locations, preserving existing package behavior. Purchased memberships retain benefit, price and location snapshots when package definitions change. Restrict resource-image storage to application-managed files and back up that directory with the database.

Verify the schema and exercise package creation, purchase, course booking and schedule preview on a staging database before rollout. Database initialization replaces data and must never be used to migrate a populated database.

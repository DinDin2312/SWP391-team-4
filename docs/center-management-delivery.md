# Center management delivery

## Review branches

All branches start from main commit `98f6399` and use Conventional Commits with the configured repository author. The repository currently has no develop branch, so main is the integration baseline for this delivery.

| Branch | Review base | Scope |
| --- | --- | --- |
| `feature/role-language-header` | `main` | Responsive EN/VI controls in role headers; mocked layout preview |
| `feature/package-commerce-and-scheduling` | `main` | Database migrations, package commerce and purchased snapshots, subject/room allowances, payment validation, resource images, automatic scheduling and backend tests |
| `feature/admin-package-operations` | `feature/package-commerce-and-scheduling` | Package administration, member benefits and booking, resource photos, dedicated subject/room tabs, automatic scheduling review, EN/VI header controls and frontend tests |

These are stacked branches. Compare each against its review base to avoid reviewing inherited commits again. Merge in the order shown. After merging a parent, update its dependent branch against the integration branch and retarget its pull request before merging. The frontend branch depends on the API branch; EN/VI header changes are included in the frontend branch.

Backend functionality shares manager controllers, request objects and integration tests, so it remains together in one API branch. The frontend branch contains separate commits for packages and operations. No changes have been pushed and no pull requests have been created.

## Functional behavior

Package types are editable catalogue entries. Each package can grant subject allowances shared across selected rooms; no explicit room restriction means all locations. Memberships retain purchased names, price, description, terms, benefits and room scopes. Course booking validates available sessions, package validity and location on the server. Existing registered courses cannot move outside a purchased room scope.

Package creation/editing includes photo selection, descriptions, terms, purchase limits and selling status. Details and audit history load on demand. Member views show purchased benefit balances. Active registration counts are labelled separately from action menus.

Resource images accept valid PNG/JPEG files up to 2 MB and are optimized before storage. Scheduling previews search eligible times, respect unavailable dates and existing coach/room schedules, and recheck the entire batch before confirmation. A conflict rejects the batch.

Checkouts bind invoice items to purchased memberships/course bookings and validate gateway signatures and amounts. Late or invalid eligibility after payment routes the invoice to manual REVIEW rather than incorrectly activating benefits.

## Installation and validation

Follow `Backend/migrations/README.md` for existing databases. New installations use `Backend/database_init.sql`. Configure `RESOURCE_IMAGE_UPLOAD_DIR` for persistent resource-image storage.

Verified after integration with main:

- Backend: 47 tests passed using an isolated MySQL database; `mvnw clean test` succeeded.
- Frontend: 44 tests passed across manager, i18n, image, benefit and member suites; production build succeeded.
- Frontend lint completed without errors; existing warnings remain. Vite reports the existing large-bundle warning.
- Git diff has no whitespace errors or unresolved conflicts.

Run frontend regressions with `npm test` from `Frontend`, and build with `npm run build`. Backend integration tests require an initialized, disposable MySQL database configured through the Spring datasource environment variables. Never point those tests at production data. Files in `Frontend/tests` provide development-only mocked visual previews and disable writes.

## Current limits

Package-list filtering and pagination remain client-side. Room scopes are enforced for course booking; standalone gym/pool entry is not added here. Subjects are not explicitly mapped to rooms, so managers choose applicable rooms from the center catalogue. Payment REVIEW reconciliation is manual, and real gateway settlement has not been tested. Automatic planning requires managers to confirm availability and approve a preview; it is not a background scheduler. Freeze, upgrade/downgrade, promotional pricing and recurring visit quotas are outside this delivery.

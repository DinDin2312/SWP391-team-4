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
# System-wide transaction history

Managers can open `view=transactions` from the sidebar. Payments and invoices are separate views: payment dates filter recorded payment attempts; invoice dates filter invoice creation. Filters and pagination run on the server (20 rows in the UI, at most 100 per request). Search matches invoice/payment IDs, provider references, member names and emails. Invoice detail is fetched on demand and includes line items and every recorded payment attempt.

`GET /api/manager/transactions` accepts `mode`, `from`, `to`, `status`, `method`, `keyword`, zero-based `page`, and `size`. `GET /api/manager/transactions/{invoiceId}` returns invoice detail. Both endpoints inherit manager-only authorization. This screen is read-only; it does not settle, refund or change payment statuses.

For display/filtering, legacy `SUCCESS` and newer `COMPLETED` payments are treated as successful. Captured payments attached to `REVIEW` invoices are shown as needing reconciliation and excluded from successful revenue/counts. Original payment status is preserved in `rawPaymentStatus`; no stored status is rewritten. Report links carry the applied date range and matching invoice/payment status into the ledger.

## Member creation dates and role access

Backend startup now applies the account creation-date change automatically through Flyway V3. Do not rerun the historical manual SQL after Flyway adoption. Older accounts retain unknown creation dates and are excluded from new-member totals. New accounts receive the actual creation timestamp. Reports count Member-role accounts by creation date and booking statuses by booking creation date; booking statuses reflect their current values. Account editors explain existing role permissions without introducing configurable ACLs. See `Backend/migrations/README.md` for database setup and future migration rules.

## Fixed teaching slots

All newly created or rescheduled sessions use a 90-minute teaching slot. Managers configure opening/closing hours and changeover (0–120 minutes) under Center Operations > Schedules > Teaching slot settings. Defaults: 07:00–22:00, 15-minute changeover. The final teaching slot plus its changeover must fit before closing. Manual, recurring and automatic creation are validated on the server, including direct API requests.

Flyway V8 stores the centre policy and a changeover snapshot per session. Existing sessions are not moved or resized (legacy snapshot: zero additional changeover). Cancelling/completing unchanged legacy sessions remains supported. Changing policy affects new/rescheduled sessions, never the reserved changeover of existing sessions. Room and coach conflicts, including class reassignment, use reserved intervals. Automatic previews are revalidated atomically at commit.

Members still register for published classes, rather than booking rooms or inventing custom times. Partitioned rooms/areas are outside this change.

### Course scheduling by weekly slot

The primary action is Schedule course: choose the first date, total lessons and one fixed slot for each selected weekday. The preview computes dates and the final lesson, excluding holidays. Conflicts count as missing lessons and never silently move a lesson or extend the weekly course. The manager may explicitly select a suggested alternative slot/date for that lesson; other weekly lessons remain unchanged. Suggestions cover up to seven following days. Up to 52 lessons are planned within a 366-day horizon.

Weekly requests carry weekdaySlots and optional original-date-to-new-start overrides. Commit regenerates the expected schedule under the operations lock, rejects missing/conflicting/tampered sessions, rechecks class assignment and registration eligibility, and saves atomically. Existing planner API clients remain compatible. New bulk course planning is still limited to classes without registrations; supplementary lessons and individual rescheduling are separate operations in the class/session detail screens.

The read-only POST `/api/manager/schedules/plan/availability` checks every configured slot across all intended course dates, including exclusions and reserved changeover. The weekday selectors show conflict counts and dates. Conflicting slots are disabled by default; an explicit make-up option permits partial conflicts, while fully occupied slots remain disabled. Changing class, dates, lesson count, weekdays or exclusions invalidates availability and preview; stale responses are ignored. Preview and commit remain blocked until the current selection is eligible, and commit still rechecks current bookings under the operations lock.


## Coach teaching subjects

Staff & Roles > create/edit Coach now supports multiple teaching subjects. User listings return subjectIds; class editors filter active coaches by the selected subject and clear the coach selection when the subject changes. Backend class creation/update rejects ineligible coaches. Removing a subject while its coach still has active classes is rejected transactionally. Coach self-service profile edits cannot add or replace manager-assigned teaching subjects.

Flyway V10 adds missing USER_SUBJECTS relationships from existing class assignments (without deleting existing specialties). Managers should review these inherited assignments. New installations and existing databases run the migration automatically at startup. Existing account API callers that omit subjectIds retain coach assignments; an explicit empty list removes them only when no active class depends on them.


## Subject-specific teaching slots

Flyway V11 adds duration_minutes (default 90) and optional slot_starts to SUBJECTS. Edit a subject to set 15–240 minutes (shortcuts 60/90/120/135), generate starts from centre hours, or enter explicit starts. Empty starts means automatic slots based on duration plus changeover. Classes inherit their subject's current policy for new/rescheduled lessons; persisted start/end and reserved changeover are unchanged. Class policy is fetched from GET /api/manager/classes/{id}/schedule-policy. Manual, recurring, course previews, availability and commits all use the subject policy and check shared room/coach reservations across durations. Centre hour/changeover changes reject incompatible subject timetables. No automatic resizing of sold/published course sessions occurs.

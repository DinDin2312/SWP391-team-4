# Coach Notification Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Coach Notification Inbox system allowing coaches to receive real-time schedule alerts, trainee registration/cancellation updates, and system notices via an Apple-style notification popover with unread counter badges.

**Architecture:** 
- Backend leverages the existing `User`-linked `com.team4.sportscenter.modules.notification` module. Triggers are wired into `MemberServiceImpl` when trainees book or cancel classes to notify the assigned coach.
- Frontend introduces a frosted glassmorphism Apple macOS-style `CoachNotificationDropdown` in `CoachLayout.jsx` with unread badge counter, category filters, mark-as-read, and quick actions.

**Tech Stack:** Java 17, Spring Boot 3, Spring Data JPA, Mockito, React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Vitest.

**Spec:** Requirement from user to enable real-time notifications for coaches in `SWP391_Code`.

---

## Global Constraints

- **Workspace:** `c:\Users\xuan sinh\OneDrive\Desktop\SWP391\SWP391_Code` (branch `feature/upgrade-ui`).
- **Sandbox Boundary:** DO NOT touch or call `sports-center-simulator`.
- **Git Safety:** DO NOT commit or push to Git.
- **Quality Standard:** 100% line coverage for tested frontend utils and passing backend unit tests.
- **Design Aesthetic:** Apple Human Interface Guidelines (HIG) with glassmorphism, subtle hairlines, and smooth transitions.
- **I18n:** Bilingual English & Vietnamese support across all UI text.

---

## Review Focus

1. **Null Coach Safety:** When a class or schedule has no assigned coach (coach is null), booking and cancellation must not throw `NullPointerException`.
2. **Ghost Badge Sync:** After marking notifications as read or deleting notifications, the unread counter badge in `CoachLayout` must update immediately via `window.dispatchEvent(new Event('notificationUpdated'))`.
3. **Double Booking Notification:** Batch booking multiple sessions of the same course must send exactly ONE aggregated notification to the coach, not N separate notifications.
4. **Self-action suppression:** If an action is taken by the coach themselves (e.g. self-profile change), message copy must clearly indicate self-update.
5. **Empty State & Accessibility:** The dropdown must have an accessible keyboard trap/escape handler and an elegant Apple empty state when there are 0 notifications.

---

### Task 1: Backend Booking & Cancellation Notification Triggers for Coach

**Files:**
- Modify: `SWP391_Code/Backend/src/main/java/com/team4/sportscenter/modules/member/services/impl/MemberServiceImpl.java`
- Create: `SWP391_Code/Backend/src/test/java/com/team4/sportscenter/MemberBookingCoachNotificationTests.java`

**Interfaces:**
- Consumes: `NotificationService.createNotification(String email, String title, String message, String type)`
- Produces:
  - On course booking: Sends notification to `gymClass.getCoach().getEmail()` with title "Học viên mới đăng ký lớp / New Trainee Enrolled" and details of trainee and class.
  - On course cancellation: Sends notification to `gymClass.getCoach().getEmail()` with title "Học viên hủy đăng ký lớp / Trainee Dropped Class".

- [ ] **Step 1: Write failing unit test in `MemberBookingCoachNotificationTests.java`**
  Write tests verifying that when `bookCourse` and `cancelClass` execute, `notificationService.createNotification` is invoked with the coach's email, and that no error occurs if coach is null.

- [ ] **Step 2: Run test to verify it fails**
  Run: `mvn test -Dtest=MemberBookingCoachNotificationTests`
  Expected: FAIL (notification not yet sent to coach).

- [ ] **Step 3: Implement coach notifications in `MemberServiceImpl.java`**
  - Inject `NotificationService notificationService` if not already injected.
  - In `bookCourse(...)`: After confirming bookings, extract `gymClass.getCoach()`. If coach != null, invoke `notificationService.createNotification(coach.getEmail(), "Học viên mới đăng ký lớp / New Trainee Enrolled", ..., "BOOKING")`.
  - In `cancelClass(...)`: After marking bookings cancelled, extract `gymClass.getCoach()`. If coach != null, invoke `notificationService.createNotification(coach.getEmail(), "Học viên hủy đăng ký lớp / Trainee Dropped Class", ..., "BOOKING")`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `mvn test -Dtest=MemberBookingCoachNotificationTests`
  Expected: PASS.

---

### Task 2: Apple-style `CoachNotificationDropdown.jsx` Component

**Files:**
- Create: `SWP391_Code/Frontend/src/features/coach/components/CoachNotificationDropdown.jsx`
- Create: `SWP391_Code/Frontend/src/features/coach/components/CoachNotificationDropdown.test.jsx`

**Interfaces:**
- Props:
  - `isOpen`: boolean
  - `onClose`: () => void
  - `onUnreadChange`: (count: number) => void
- Endpoints consumed:
  - `GET /api/v1/notifications`
  - `PUT /api/v1/notifications/{id}/read`
  - `PUT /api/v1/notifications/read-all`
  - `DELETE /api/v1/notifications/{id}`
  - `DELETE /api/v1/notifications`

- [ ] **Step 1: Write unit tests in `CoachNotificationDropdown.test.jsx`**
  Test rendering, category filtering (All vs Booking vs System), marking single item as read, marking all as read, and empty state.

- [ ] **Step 2: Implement `CoachNotificationDropdown.jsx`**
  - Frosted glassmorphism container (`backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl rounded-2xl`).
  - Header: Cupertino style title, unread count pill, "Mark all read" (`CheckCheck`), and close button.
  - Filter segmented control: `All` | `Bookings` | `System`.
  - Notification items: Type icon (Calendar/Dumbbell for `BOOKING`, Shield/Sparkles for `SYSTEM`), formatted relative time, unread blue dot, click to mark read, trash icon to remove.
  - Empty state with Apple SF-style icon and polite message.

- [ ] **Step 3: Run Vitest to verify component tests pass**
  Run: `cd SWP391_Code/Frontend; npx vitest run CoachNotificationDropdown.test.jsx`
  Expected: PASS with 100% assertions met.

---

### Task 3: Integrate Notification Bell & Unread Badge into `CoachLayout.jsx`

**Files:**
- Modify: `SWP391_Code/Frontend/src/layouts/CoachLayout.jsx`
- Modify: `SWP391_Code/Frontend/src/i18n/messages.js`

**Interfaces:**
- Consumes: `CoachNotificationDropdown`, `notificationUpdated` window event.
- Displays: Apple Bell icon button with red notification badge showing unread count.

- [ ] **Step 1: Update `CoachLayout.jsx`**
  - Add state `[unreadCount, setUnreadCount]` and `[isNotifDropdownOpen, setIsNotifDropdownOpen]`.
  - Add polling / event fetcher for `GET /api/v1/notifications` on mount and on `notificationUpdated` event.
  - In topbar action buttons: Render the Bell button with an unread badge (`{unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">{unreadCount > 9 ? '9+' : unreadCount}</span>}`).
  - Mount `CoachNotificationDropdown` tethered to the bell button with click-outside listener.

- [ ] **Step 2: Add bilingual strings to `messages.js`**
  Ensure terms such as "Notifications", "Mark all as read", "No notifications yet", "New Trainee Enrolled", "Trainee Dropped Class" are mapped in `managerSettingsTranslations` (EN & VI).

---

### Task 4: Full System Verification & Regression Testing

**Files:**
- None (verification only).

- [ ] **Step 1: Run frontend test suite**
  Run: `cd SWP391_Code/Frontend; npm test`
  Expected: All 70+ tests pass with 100% line coverage on tested utilities.

- [ ] **Step 2: Run frontend production build**
  Run: `cd SWP391_Code/Frontend; npx vite build --emptyOutDir false`
  Expected: Builds cleanly without syntax or bundling errors.

- [ ] **Step 3: Run backend test suite**
  Run: `cd SWP391_Code/Backend; mvn test -Dtest=MemberBookingCoachNotificationTests`
  Expected: Clean build and 0 failures.

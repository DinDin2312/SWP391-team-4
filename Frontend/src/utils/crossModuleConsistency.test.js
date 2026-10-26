import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createServer } from 'vite';

import { formatMoney, formatDate, formatTime, formatDateTime } from './displayFormat.js';
import { ROLE_ROUTES, ROLE_LABELS } from '../config/roles.js';
import { cn } from '../lib/utils.js';
import { rolePermissions } from '../features/manager/staff/rolePermissions.js';
import { roleLabel, roleTone } from '../features/manager/staff/roleUtils.js';
import { courseWeeks } from '../features/manager/operations/courseReviewUtils.js';
import { TYPE_META, typeMeta } from '../features/manager/packages/packageTypes.js';
import { auditValue } from '../components/resource-images/packageAudit.js';
import { setLanguage } from '../i18n/languageStore.js';

test('displayFormat formats currency, SQL wall-clock dates, Date instances, and invalid inputs across EN/VI', () => {
  setLanguage('en');
  assert.match(formatMoney(1500000), /1\.500\.000/);
  assert.match(formatMoney(0), /0/);
  assert.match(formatMoney(null), /0/);

  assert.equal(formatDate(null), '—');
  assert.equal(formatDate('not-a-date'), '—');
  assert.equal(formatTime(null), '—');
  assert.equal(formatDateTime('invalid'), '—');

  assert.match(formatDate('2026-04-20'), /20.*04.*2026|04.*20.*2026/);
  assert.match(formatDate(new Date(2026, 3, 20, 9, 30)), /2026/);
  assert.equal(formatTime('2026-04-20 14:35:00'), '14:35');
  assert.match(formatDateTime('2026-04-20T08:15:00'), /08:15/);

  setLanguage('vi');
  assert.equal(formatDate('2026-04-20'), '20/04/2026');
  assert.equal(formatDateTime('2026-04-20 18:45:00'), '20/04/2026 · 18:45');
  setLanguage('en');
});

test('roles, permissions, className merge, package types, and package audit helpers stay consistent across modules', () => {
  assert.equal(ROLE_ROUTES.admin, '/admin/dashboard');
  assert.equal(ROLE_ROUTES.trainer, '/trainer/dashboard');
  assert.equal(ROLE_ROUTES.staff, '/staff/dashboard');
  assert.equal(ROLE_ROUTES.customer, '/customer/dashboard');
  assert.equal(ROLE_LABELS.admin, 'Admin');

  assert.equal(cn('px-2 py-1', false && 'hidden', 'px-4'), 'py-1 px-4');

  assert.ok(rolePermissions['Center Manager'].includes('Audit logs'));
  assert.ok(rolePermissions.Receptionist.includes('Reception check-in'));
  assert.ok(rolePermissions.Coach.includes('Attendance'));
  assert.ok(rolePermissions.Member.includes('Book classes'));

  assert.equal(roleLabel('Center Manager'), 'Manager');
  assert.equal(roleLabel('CustomRole'), 'CustomRole');
  assert.equal(roleTone('Administrator'), 'admin');
  assert.equal(roleTone('Center Manager'), 'manager');
  assert.equal(roleTone('Receptionist'), 'staff');
  assert.equal(roleTone('Coach'), 'trainer');
  assert.equal(roleTone('Member'), 'member');
  assert.equal(roleTone('Unknown'), 'member');

  assert.equal(typeMeta('GYM_ACCESS').tone, 'gym');
  assert.equal(typeMeta('PREMIUM').label, TYPE_META.PREMIUM.label);
  assert.equal(typeMeta('NON_EXISTENT').tone, 'unknown');

  assert.equal(auditValue('name', null), '—');
  assert.match(auditValue('price', 500000), /500\.000/);
  assert.equal(auditValue('benefits', []), '—');
  assert.equal(
    auditValue('benefits', [
      { subjectName: 'Yoga', sessionLimit: 12, rooms: [{ roomName: 'Studio A' }] },
      { subjectId: 9, sessionLimit: 8, rooms: [] },
    ]),
    'Yoga: 12 (Studio A); 9: 8 (All locations)'
  );
  assert.equal(auditValue('status', 'ACTIVE'), 'ACTIVE');
});

test('courseWeeks groups schedule plan sessions by Monday week and marks conflicts and excluded dates', () => {
  assert.deepEqual(courseWeeks({ sessions: [] }), []);

  const weeks = courseWeeks(
    {
      requestedSessions: [
        { startTime: '2026-04-20T08:00:00', roomId: 1 },
        { startTime: '2026-04-24T08:00:00', roomId: 1 },
      ],
      conflicts: [{ startTime: '2026-04-24T08:00:00' }],
    },
    ['2026-04-22', '2026-05-10']
  );

  assert.equal(weeks.length, 1);
  assert.equal(weeks[0].start, '2026-04-20');
  assert.equal(weeks[0].end, '2026-04-26');
  assert.equal(weeks[0].sessions.length, 3);
  assert.equal(weeks[0].sessions[0].conflict, false);
  assert.equal(weeks[0].sessions[1].excluded, true);
  assert.equal(weeks[0].sessions[2].conflict, true);
});

test('Cross-module UI/UX consistency: Support badges, ProtectedRoute RBAC, and Role Layouts render in EN and VI', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  globalThis.document = { documentElement: { lang: 'en' } };

  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const supportUtils = await server.ssrLoadModule('/src/utils/supportDisplayUtils.jsx');
    const { default: LanguageProvider } = await server.ssrLoadModule('/src/i18n/LanguageContext.jsx');
    const { AuthContext, AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.jsx');
    const { default: ProtectedRoute } = await server.ssrLoadModule('/src/components/ProtectedRoute.jsx');
    const { default: CoachLayout } = await server.ssrLoadModule('/src/layouts/CoachLayout.jsx');
    const { default: ReceptionistLayout } = await server.ssrLoadModule('/src/layouts/ReceptionistLayout.jsx');
    const { slotEnd, slotLabel } = await server.ssrLoadModule('/src/features/manager/operations/teachingSlots.js');

    // Teaching slots helper verification
    assert.equal(slotEnd(''), '');
    assert.equal(slotEnd('2026-04-20T07:00', 90), '2026-04-20T08:30');
    assert.equal(slotLabel('07:00', 0, 90), 'Slot 1 (7h–8h30)');

    // Support display utils: days left, labels, badges, and priority escalation
    assert.equal(supportUtils.getDaysLeft('2099-12-31', 14), 14);
    assert.equal(supportUtils.getDaysLeft(null), 0);
    assert.ok(supportUtils.getDaysLeft('2099-12-31') > 0);
    assert.equal(supportUtils.getDaysLeft('bad-date'), 0);

    for (const val of ['CLASS_CANCELLATION', 'GENERAL_INQUIRY', 'COMPLAINT', 'OTHER']) {
      assert.ok(supportUtils.getReasonLabel(val));
    }
    for (const val of ['TEACHING_METHOD', 'ATTITUDE', 'PUNCTUALITY', 'TECHNICAL_GUIDANCE', 'OTHER']) {
      assert.ok(supportUtils.getCoachAspectLabel(val));
    }
    for (const val of ['GYM_FLOOR', 'CARDIO_ZONE', 'STUDIO_ROOM', 'SWIMMING_POOL', 'LOCKER_SAUNA', 'LOBBY_RECEPTION', 'OTHER']) {
      assert.ok(supportUtils.getFacilityAreaLabel(val));
    }
    for (const val of ['SINGLE_ABSENCE', 'MAKEUP_CLASS', 'CLASS_TRANSFER', 'SCHEDULE_INQUIRY', 'OTHER']) {
      assert.ok(supportUtils.getScheduleTypeLabel(val));
    }
    for (const val of ['STAFF_BEHAVIOR', 'CLEANLINESS', 'BILLING_POLICY', 'OTHER']) {
      assert.ok(supportUtils.getComplaintTypeLabel(val));
    }
    for (const cat of ['CLASS_CANCELLATION', 'FACILITY_ISSUE', 'COACH_FEEDBACK', 'SCHEDULE_SUPPORT', 'COMPLAINT', 'GENERAL']) {
      assert.ok(supportUtils.getCategoryLabel(cat));
      const badgeHtml = renderToStaticMarkup(supportUtils.getCategoryBadge(cat));
      assert.match(badgeHtml, /<span/);
    }
    for (const prio of ['URGENT', 'HIGH', 'LOW', 'NORMAL']) {
      assert.ok(supportUtils.getPriorityLabel(prio));
      const prioHtml = renderToStaticMarkup(supportUtils.getPriorityBadge(prio));
      assert.match(prioHtml, /<span/);
    }
    // CASH_REFUND automatically escalates NORMAL priority badge to HIGH
    const escalatedHtml = renderToStaticMarkup(supportUtils.getPriorityBadge('NORMAL', 'CASH_REFUND', 'custom-cls'));
    assert.match(escalatedHtml, /High|Cao/);

    for (const pref of ['ISSUE_CREDIT', 'GYM_PASS', 'CASH_REFUND']) {
      const prefHtml = renderToStaticMarkup(supportUtils.getPreferredResolutionBadge(pref));
      assert.match(prefHtml, /<span/);
    }
    assert.equal(supportUtils.getPreferredResolutionBadge('NONE'), null);

    // Status badges differentiate Member view vs Receptionist view consistently
    for (const st of ['PENDING', 'IN_PROGRESS', 'APPROVED', 'RESOLVED', 'ESCALATED', 'REJECTED', 'CUSTOM']) {
      const memberBadge = renderToStaticMarkup(supportUtils.getStatusBadge(st, { isMember: true }));
      const staffBadge = renderToStaticMarkup(supportUtils.getStatusBadge(st, false));
      assert.match(memberBadge, /<span/);
      assert.match(staffBadge, /<span/);
    }

    assert.equal(supportUtils.getDisplayTitle(''), '');
    assert.match(
      supportUtils.getDisplayTitle('Cancellation & Retention Request for Yoga 101'),
      /Yoga 101/
    );
    assert.equal(supportUtils.formatRespondedAt(''), '');
    assert.match(supportUtils.formatRespondedAt('2026-04-20T10:30:00'), /2026/);

    // RBAC ProtectedRoute consistency: unauthenticated -> /login, wrong role -> /login, allowed role -> content
    const renderProtected = (userRole, allowedRoles) =>
      renderToStaticMarkup(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(
            AuthContext.Provider,
            { value: { userRole, userInfo: { fullName: 'Test User' }, login: () => {}, logout: () => {} } },
            React.createElement(
              MemoryRouter,
              { initialEntries: ['/protected'] },
              React.createElement(
                Routes,
                null,
                React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'LOGIN_PAGE') }),
                React.createElement(Route, {
                  path: '/protected',
                  element: React.createElement(
                    ProtectedRoute,
                    { allowedRoles },
                    React.createElement('div', null, 'PROTECTED_CONTENT')
                  ),
                })
              )
            )
          )
        )
      );

    assert.equal(renderProtected(null, ['admin']), '');
    assert.equal(renderProtected('customer', ['admin', 'staff']), '');
    assert.match(renderProtected('admin', ['admin', 'staff']), /PROTECTED_CONTENT/);

    // AuthProvider + CoachLayout & ReceptionistLayout SSR rendering in EN & VI
    store.set('userRole', 'trainer');
    store.set('userInfo', JSON.stringify({ email: 'coach@gym.vn', fullName: 'HLV Tuấn', role: 'trainer' }));

    for (const lang of ['en', 'vi']) {
      setLanguage(lang);
      const coachHtml = renderToStaticMarkup(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(
            AuthProvider,
            null,
            React.createElement(
              MemoryRouter,
              { initialEntries: ['/trainer/dashboard'] },
              React.createElement(CoachLayout)
            )
          )
        )
      );
      assert.ok(coachHtml.length > 100);

      const receptionistHtml = renderToStaticMarkup(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(
            AuthProvider,
            null,
            React.createElement(
              MemoryRouter,
              { initialEntries: ['/staff/dashboard'] },
              React.createElement(ReceptionistLayout)
            )
          )
        )
      );
      assert.ok(receptionistHtml.length > 100);
    }
    setLanguage('en');
  } finally {
    await server.close();
  }
});

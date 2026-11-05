import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('overview renders the decision queue, pulse and schedule with deep links', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../../../../', import.meta.url)),
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error',
  });
  try {
    const { default: Overview } = await server.ssrLoadModule('/src/features/manager/components/OperationalOverview.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    setLanguage('en');
    const render = data => renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(Overview, { page: { title: 'Overview' }, data, loading: false }))).replaceAll('&amp;', '&');
    const base = { centerDate: '2026-10-08', todaySessions: [], pulse: { onSiteNow: 4, checkInsToday: 11, bookedSeatsToday: 9, totalSeatsToday: 36, roomsInUse: 1, totalRooms: 5 } };
    const empty = render({ ...base, decisions: [] });
    assert.ok(empty.includes('Nothing needs your decision'));
    assert.ok(empty.includes('25%') && empty.includes('1/5') && empty.includes('11 check-ins today'));
    assert.ok(empty.includes('href="/admin/dashboard?view=operations&tab=schedules&from=2026-10-08&to=2026-10-08&excludeCancelled=true"'));
    assert.ok(empty.includes('No sessions scheduled today.'));
    const busy = render({ ...base, decisions: [
      { type: 'RESCHEDULE', id: 1, actionType: 'SUBSTITUTE_COACH', className: 'Swim A', coachName: 'Coach B', dueAt: '2026-10-09T08:00:00' },
      { type: 'ESCALATION', id: 2, className: 'Refund appeal', coachName: 'Member C', createdAt: '2026-10-07T08:00:00', dueAt: '2026-10-07T08:00:00' },
      { type: 'PAYMENT_REVIEW', id: 3, amount: 500000, createdAt: '2026-10-07T09:00:00', dueAt: '2026-10-07T09:00:00' },
      { type: 'LOW_FILL', id: 4, className: 'Yoga', coachName: 'Coach D', booked: 1, maxSlots: 20, startTime: '2026-10-09T06:00:00', dueAt: '2026-10-09T06:00:00' },
    ] });
    assert.ok(busy.includes('Needs your decision') && busy.includes('>4<'));
    for (const href of ['view=reschedule', 'view=support', 'status=REVIEW', 'from=2026-10-09&to=2026-10-09&lowRegistration=true']) assert.ok(busy.includes(href), href);
    assert.ok(busy.includes('Substitute coach: Swim A') && busy.includes('Walk-in') && busy.includes('1/20 seats booked'));
    assert.ok(render(null).length >= 0);
  } finally {
    await server.close();
  }
});

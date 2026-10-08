import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('overview links use complete totals and open the intended schedule filters', async () => {
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
    const data = {
      centerDate: '2026-10-08', sessionsToday: 10, lowRegistrationSessions: 12,
      expiringMemberships: 0, todaySessions: [], urgentSessions: [],
      attentionPage: { total: 12, items: [] }, renewalPage: { total: 0, items: [] },
      recentActivity: [],
    };
    const render = props => renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(Overview, { page: { title: 'Overview' }, ...props }))).replaceAll('&amp;', '&');
    const html = render({ data, loading: false });
    assert.ok(html.includes('href="/admin/dashboard?view=operations&tab=schedules&from=2026-10-08&to=2026-10-08&excludeCancelled=true"'));
    assert.ok(html.includes('href="/admin/dashboard?view=operations&tab=schedules&from=2026-10-08&to=2026-10-15&lowRegistration=true&status=SCHEDULED"'));
    assert.ok(html.includes('href="/admin/dashboard?view=operations&tab=schedules&from=2026-10-09&to=2026-10-15&lowRegistration=true&status=SCHEDULED&excludeUrgent=true"'));
    assert.ok(html.includes('View all (12)'));
    assert.ok(html.includes('No plans expiring within the next 7 days.'));
    assert.ok(render({ data: null, loading: true }).includes('Loading overview'));
    assert.ok(render({ data: null, loading: false, loadError: 'Unavailable' }).includes('Overview is unavailable.'));
  } finally {
    await server.close();
  }
});

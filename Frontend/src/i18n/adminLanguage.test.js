import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('staff filters retain API values and status styling when their labels change language', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../../', import.meta.url)),
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error',
  });
  try {
    const { default: StaffPage } = await server.ssrLoadModule('/src/features/manager/staff/StaffPage.jsx');
    const { LanguageContext } = await server.ssrLoadModule('/src/i18n/useLanguage.js');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    const noop = () => {};
    const props = {
      data: {
        roles: [{ roleId: 3, roleName: 'Coach' }],
        users: [{ userId: 3, fullName: 'Member', email: 'coach@example.com', roleName: 'Coach', status: 'ACTIVE' }],
      },
      filters: { keyword: 'Member', role: 'Coach', status: 'ACTIVE' },
      page: { title: 'Staff & Permissions', description: 'Manage staff accounts.' },
      currentUser: { email: 'manager@example.com' },
      setFilters: noop, reload: noop, openModal: noop, selectPage: noop, notify: noop,
    };
    for (const [language, roleLabel, statusLabel] of [['en', 'Coach', 'Active'], ['vi', 'Huấn luyện viên', 'Đang hoạt động']]) {
      setLanguage(language);
      const html = renderToStaticMarkup(createElement(LanguageContext.Provider, { value: language }, createElement(StaffPage, props)));
      const selectedOptions = [...html.matchAll(/<option value="([^"]+)" selected="">([^<]+)<\/option>/g)]
        .map(([, value, label]) => ({ value, label }));
      assert.deepEqual(selectedOptions.slice(0, 2), [
        { value: 'Coach', label: roleLabel },
        { value: 'ACTIVE', label: statusLabel },
      ]);
      assert.match(html, /manager-status-badge is-active/);
      assert.match(html, /<strong>Member<\/strong>/);
      assert.match(html, /value="Member"/);
    }
  } finally {
    await server.close();
  }
});

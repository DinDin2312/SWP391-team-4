import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('HealthProfileSection renders cleanly without runtime reference errors', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: HealthProfileSection } = await server.ssrLoadModule('/src/features/member/components/HealthProfileSection.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    setLanguage('vi');

    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(HealthProfileSection, {
          initialProfile: {
            gender: 'FEMALE',
            dateOfBirth: '1995-05-15',
            age: 31,
            parq: [false, false, false, false, false, false, false],
            conditions: ['KNEE'],
            notes: 'Đau nhẹ khi gập sâu',
            consent: true,
            clearanceRecommended: false,
            completed: true
          }
        })
      );
      assert.ok(html.includes('Hồ sơ Sức khỏe') || html.includes('PAR-Q') || html.includes('Giới tính'));
    });
  } finally {
    await server.close();
  }
});

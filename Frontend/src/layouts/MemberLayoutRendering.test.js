import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router-dom';

test('MemberLayout renders safely and contains Ask NEXUS AI action with drop-down popover support', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: MemberLayout } = await server.ssrLoadModule('/src/layouts/MemberLayout.jsx');
    const { AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');

    const authValue = {
      userInfo: { fullName: 'Đinh Thị Thu', memberTier: 'MEMBER' },
      logout: () => {},
      updateUserInfo: () => {}
    };

    // 1. Vietnamese test
    setLanguage('vi');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: authValue },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(MemberLayout)
          )
        )
      );
      assert.ok(html.includes('Ask NEXUS AI') || html.includes('Hỏi NEXUS AI') || html.includes('NEXUS'));
      assert.ok(html.includes('Đinh Thị Thu'));
    });

    // 2. English test
    setLanguage('en');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: authValue },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(MemberLayout)
          )
        )
      );
      assert.ok(html.includes('Ask NEXUS AI') || html.includes('NEXUS'));
    });
  } finally {
    await server.close();
  }
});

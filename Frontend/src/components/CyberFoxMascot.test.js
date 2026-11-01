import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('resolveFoxDirection maps cursor coordinates across the 9-frame gaze system accurately', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const {
      FOX_DIRECTIONS,
      resolveFoxDirection,
      CyberFoxAvatar,
      default: CyberFoxMascot
    } = await server.ssrLoadModule('/src/components/CyberFoxMascot.jsx');

    const foxX = 1400;
    const foxY = 850;

    // Frame 0: Direct hover or within 38px radius
    assert.equal(resolveFoxDirection(500, 400, foxX, foxY, true), 'DIRECT_HOVER');
    assert.equal(resolveFoxDirection(foxX - 10, foxY - 10, foxX, foxY, false), 'DIRECT_HOVER');

    // Close range (< 180px)
    assert.equal(resolveFoxDirection(foxX - 100, foxY - 20, foxX, foxY, false), 'NEAR_LEFT');
    assert.equal(resolveFoxDirection(foxX - 20, foxY - 100, foxX, foxY, false), 'NEAR_UP');

    // Mid/Far range (>= 180px) across 6 fan sectors (0°..90°)
    // 1. FAR_LEFT (theta < 15 deg) -> bottom bar left
    assert.equal(resolveFoxDirection(200, foxY - 20, foxX, foxY, false), 'FAR_LEFT');
    // 2. LOW_LEFT (15..30 deg)
    assert.equal(resolveFoxDirection(foxX - 500, foxY - 180, foxX, foxY, false), 'LOW_LEFT');
    // 3. MID_LEFT (30..45 deg)
    assert.equal(resolveFoxDirection(foxX - 500, foxY - 360, foxX, foxY, false), 'MID_LEFT');
    // 4. DIAG_CENTER (45..60 deg)
    assert.equal(resolveFoxDirection(foxX - 400, foxY - 500, foxX, foxY, false), 'DIAG_CENTER');
    // 5. HIGH_LEFT (60..75 deg)
    assert.equal(resolveFoxDirection(foxX - 220, foxY - 550, foxX, foxY, false), 'HIGH_LEFT');
    // 6. STRAIGHT_UP (75..90 deg) -> topbar right ("Ask NEXUS AI")
    assert.equal(resolveFoxDirection(foxX - 20, 60, foxX, foxY, false), 'STRAIGHT_UP');

    // Render all 9 frames without error
    assert.equal(FOX_DIRECTIONS.length, 9);
    for (const dir of FOX_DIRECTIONS) {
      const svgMarkup = renderToStaticMarkup(React.createElement(CyberFoxAvatar, { direction: dir }));
      assert.ok(svgMarkup.includes('<svg'));
    }

    const mascotMarkup = renderToStaticMarkup(
      React.createElement(CyberFoxMascot, {
        isVisible: true,
        onActivate: () => {},
        label: 'Ask NEXUS AI'
      })
    );
    assert.ok(mascotMarkup.includes('Have a question') || mascotMarkup.includes('Có câu hỏi'));
  } finally {
    await server.close();
  }
});

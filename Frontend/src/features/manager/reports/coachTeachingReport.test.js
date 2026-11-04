import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('coach teaching excel generator produces valid XML spreadsheet format', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { generateCoachTeachingXml } = await server.ssrLoadModule('/src/features/manager/reports/coachTeachingExport.js');
    const mockData = {
      overview: {
        completedSessions: 15,
        totalTeachingHours: 22.5,
        substituteSessions: 3,
        totalStudents: 45,
        avgOccupancyRate: 75.0,
      },
      coachStats: [
        {
          coachId: 10,
          coachName: 'Coach Nguyen Van A',
          coachEmail: 'nguyenvana@gmail.com',
          completedSessions: 12,
          scheduledSessions: 2,
          cancelledSessions: 1,
          totalHours: 18.0,
          substituteSessionsCount: 2,
          transferredSessionsCount: 0,
          totalBookings: 36,
          totalAttendance: 34,
          uniqueStudents: 15,
          totalCapacity: 48,
          avgOccupancyRate: 75.0,
        }
      ],
      sessions: [
        {
          scheduleId: 101,
          startTime: '2026-10-05T08:00:00',
          endTime: '2026-10-05T09:30:00',
          className: 'Yoga Basic',
          subjectName: 'Yoga',
          roomName: 'Studio 1',
          actualCoachName: 'Coach Nguyen Van A',
          durationHours: 1.5,
          bookedStudents: 10,
          maxSlots: 12,
          occupancyRate: 83.3,
          status: 'COMPLETED',
          isSubstitute: false,
          substituteNote: '',
        }
      ]
    };

    const xml = generateCoachTeachingXml(mockData, '2026-10-01', '2026-10-31');
    assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('Tong_hop_HLV'));
    assert.ok(xml.includes('Chi_tiet_ca_day'));
    assert.ok(xml.includes('Coach Nguyen Van A'));
    assert.ok(xml.includes('nguyenvana@gmail.com'));
    assert.ok(xml.includes('Yoga Basic'));
    assert.ok(xml.includes('Studio 1'));
  } finally {
    await server.close();
  }
});

test('CoachTeachingReport renders safely without crashing in EN and VI', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { default: CoachReport } = await server.ssrLoadModule('/src/features/manager/reports/CoachTeachingReport.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    const { LanguageContext } = await server.ssrLoadModule('/src/i18n/useLanguage.js');

    for (const lang of ['en', 'vi']) {
      setLanguage(lang);
      const html = renderToStaticMarkup(
        React.createElement(
          LanguageContext.Provider,
          { value: lang },
          React.createElement(CoachReport, { initialFrom: '2026-10-01', initialTo: '2026-10-31' })
        )
      );

      assert.ok(html.includes('coach-teaching-report'));
      assert.ok(html.includes('reports-filter'));
      assert.ok(html.includes('coach-filter-select'));
      assert.ok(html.includes('coach-table-card'));
      assert.ok(html.includes('coach-sessions-card'));
    }
  } finally {
    await server.close();
  }
});

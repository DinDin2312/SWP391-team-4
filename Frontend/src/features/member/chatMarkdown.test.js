import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('chatMarkdown tests', async (t) => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  const { renderChatMarkdown, ChatMarkdown } = await server.ssrLoadModule('/src/features/member/chatMarkdown.jsx');

  await t.test('renders bold text as <strong>', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('Đây là **chữ đậm**')));
    assert.ok(html.includes('<strong') && html.includes('chữ đậm</strong>'), `Expected <strong> in: ${html}`);
  });

  await t.test('renders italic text as <em>', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('Đây là *chữ nghiêng*')));
    assert.ok(html.includes('<em') && html.includes('chữ nghiêng</em>'), `Expected <em> in: ${html}`);
  });

  await t.test('renders unclosed bold tags during streaming as strong without raw asterisks', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('• **Bơi Lội Giải Tỏa Căng Th')));
    assert.ok(html.includes('<strong') && html.includes('Bơi Lội Giải Tỏa Căng Th</strong>'), `Expected auto-closed <strong> in: ${html}`);
    assert.ok(!html.includes('**'), `Should not leak raw asterisks: ${html}`);
  });

  await t.test('renders unicode bullet • as <ul> and <li>', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('• Lớp bơi ếch\n• Lớp bơi sải')));
    assert.ok(html.includes('<ul') && html.includes('<li') && html.includes('Lớp bơi ếch'), `Expected <ul> and <li> in: ${html}`);
  });

  await t.test('renders unordered list with <ul> and <li>', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('- Mục 1\n- Mục 2')));
    assert.ok(html.includes('<ul') && html.includes('</ul>'), `Expected <ul> in: ${html}`);
    assert.ok(html.includes('Mục 1'), `Expected list item 1 in: ${html}`);
    assert.ok(html.includes('Mục 2'), `Expected list item 2 in: ${html}`);
  });

  await t.test('renders ordered list with <ol> and <li>', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('1. Bước 1\n2. Bước 2')));
    assert.ok(html.includes('<ol') && html.includes('</ol>'), `Expected <ol> in: ${html}`);
    assert.ok(html.includes('Bước 1'), `Expected item 1 in: ${html}`);
    assert.ok(html.includes('Bước 2'), `Expected item 2 in: ${html}`);
  });

  await t.test('renders headings h1, h2, h3', () => {
    const htmlH1 = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('# Tiêu đề 1')));
    assert.ok(htmlH1.includes('<h1') && htmlH1.includes('Tiêu đề 1'), `Expected <h1> in: ${htmlH1}`);

    const htmlH2 = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('## Tiêu đề 2')));
    assert.ok(htmlH2.includes('<h2') && htmlH2.includes('Tiêu đề 2'), `Expected <h2> in: ${htmlH2}`);

    const htmlH3 = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('### Tiêu đề 3')));
    assert.ok(htmlH3.includes('<h3') && htmlH3.includes('Tiêu đề 3'), `Expected <h3> in: ${htmlH3}`);
  });

  await t.test('escapes malicious HTML <script>alert(1)</script>', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('<script>alert(1)</script>')));
    assert.ok(!html.includes('<script>'), `Malicious script tag must not be rendered raw in: ${html}`);
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), `Expected escaped script tag in: ${html}`);
  });

  await t.test('blocks javascript: links and renders without executable href', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('[Click me](javascript:alert(1))')));
    assert.ok(!html.includes('href="javascript:'), `javascript: href must not exist in: ${html}`);
    assert.ok(html.includes('Click me'), `Expected link text in: ${html}`);
  });

  await t.test('renders safe https links with rel="noopener noreferrer"', () => {
    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('[Google](https://google.com)')));
    assert.ok(html.includes('href="https://google.com"'), `Expected href in: ${html}`);
    assert.ok(html.includes('rel="noopener noreferrer"'), `Expected rel in: ${html}`);
  });

  await t.test('renders empty or null gracefully', () => {
    const htmlNull = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown(null)));
    assert.equal(htmlNull, '<div></div>');
    const htmlEmpty = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown('')));
    assert.equal(htmlEmpty, '<div></div>');
  });

  await t.test('renders markdown table with thead, tbody, th, td and internal link button', () => {
    const tableMd = `| Lớp học & HLV | Số buổi | Lịch học (Thứ) | Học phí | Đăng ký |
| :--- | :---: | :--- | :---: | :---: |
| **Bơi Ếch**<br>HLV: Tuấn | 6 buổi | T2, T4, T6 (15:45) | 1.200.000 đ | [Đăng ký](/member/book-class?classId=139) |`;

    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown(tableMd)));
    assert.ok(html.includes('<table'), `Expected <table> in: ${html}`);
    assert.ok(html.includes('<thead') && html.includes('Lớp học &amp; HLV'), `Expected <thead> with title in: ${html}`);
    assert.ok(html.includes('<tbody'), `Expected <tbody> in: ${html}`);
    assert.ok(html.includes('Bơi Ếch'), `Expected class name in: ${html}`);
    assert.ok(html.includes('<br/>') || html.includes('<br />') || html.includes('<br>'), `Expected <br> in: ${html}`);
    assert.ok(html.includes('href="/member/book-class?classId=139"'), `Expected deep-link href in: ${html}`);
    assert.ok(html.includes('cursor-pointer'), `Expected cursor-pointer for interactive row in: ${html}`);
  });

  await t.test('renders package-store markdown table rows as interactive links', () => {
    const pkgMd = `| Gói hội viên | Phân loại | Thời hạn | Giá | Chi tiết |
| :--- | :--- | :---: | :---: | :---: |
| **Gói Bể Bơi Bốn Mùa 1 Tháng** | Pool access | 30 ngày | 450,000 đ | [Xem gói](/member/package-store?packageId=10) |`;

    const html = renderToStaticMarkup(React.createElement('div', null, renderChatMarkdown(pkgMd)));
    assert.ok(html.includes('href="/member/package-store?packageId=10"'));
    assert.ok(html.includes('cursor-pointer'));
    assert.ok(html.includes('bg-blue-600'));
  });

  await t.test('ChatMarkdown component wrapper works', () => {
    const html = renderToStaticMarkup(React.createElement(ChatMarkdown, { content: 'Xin chào **bạn**' }));
    assert.ok(html.includes('<strong') && html.includes('bạn</strong>'));
  });

  await server.close();
});

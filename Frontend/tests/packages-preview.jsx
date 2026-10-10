// Dev-only QA entry: generated load data, simulated errors, no API/database writes.
import { Profiler, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import LanguageProvider from '../src/i18n/LanguageContext';
import LanguageSwitcher from '../src/i18n/LanguageSwitcher';
import PackagesPage from '../src/features/manager/packages/PackagesPage';
import { setLanguage } from '../src/i18n/languageStore';
import '../src/index.css';
import '../src/features/manager/pages/manager.css';
import '../src/features/manager/pages/manager-polish.css';

const types = ['GYM_ACCESS', 'AI_ACCESS', 'PREMIUM', 'COMBO'];
function fixture(count) {
  return Array.from({ length: count }, (_, index) => ({ packageId: index + 1, packageName: index === 4 ? 'Gói hội viên với tên rất dài để kiểm thử khả năng xuống dòng trên màn hình nhỏ và hiển thị đầy đủ thông tin' : `${index % 2 ? 'AI' : 'Thẻ Gym Đặc Biệt'} ${String(index + 1).padStart(4, '0')}`, packageType: types[index % 4], durationDays: [7, 30, 90, 180, 365][index % 5], price: index === 0 ? 0 : (index % 100 + 1) * 50000, subscribers: 10000 + index, activeSubscribers: index === 0 ? 1240 : index % 3000 }));
}
const pageStarted = performance.now();
export default function Preview() {
  const [count, setCount] = useState(5), [mode, setMode] = useState('normal'), [failure, setFailure] = useState('409');
  const [data, setData] = useState(() => fixture(5)), [message, setMessage] = useState(''), [metrics, setMetrics] = useState({}), [lastPayload, setLastPayload] = useState(null);
  const started = useRef(pageStarted), action = useRef(null), commit = useRef(0), region = useRef(null);
  const measure = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (action.current?.expectedSearch !== undefined && (new URLSearchParams(location.search).get('pkgSearch') || '') !== action.current.expectedSearch) return;
      setMetrics({ count, mode, payloadBytes: new TextEncoder().encode(JSON.stringify(data)).byteLength,
        query: location.search, view: new URLSearchParams(location.search).get('pkgView'), language: document.documentElement.lang, width: window.innerWidth,
        domNodes: region.current?.querySelectorAll('*').length, rows: region.current?.querySelectorAll('tbody tr, .pkg-card').length,
        reactCommitMs: Number(commit.current.toFixed(2)), ...(action.current ? { lastAction: action.current.name, interactionMs: Number((performance.now() - action.current.start).toFixed(2)) } : { renderToPaintMs: Number((performance.now() - started.current).toFixed(2)) }) });
      action.current = null;
    }));
  }, [count, data, mode]);
  useEffect(() => {
    const observer = new MutationObserver(measure);
    observer.observe(region.current, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [measure]);
  useEffect(measure, [measure]);
  const selectCount = next => { started.current = performance.now(); action.current = null; setCount(next); setData(fixture(next)); };
  const save = async payload => {
    setLastPayload(payload);
    if (failure === '409') throw { response: { status: 409, data: { message: 'Package name already exists.' } } };
    if (failure === 'field') throw { response: { status: 400, data: { message: 'Please check the entered data.', errors: { packageName: 'Package name already exists.' } } } };
    setData(current => payload.packageId ? current.map(item => item.packageId === payload.packageId ? { ...item, ...payload } : item) : [...current, { ...payload, packageId: current.length + 1, activeSubscribers: 0 }]);
  };
  return <>
    <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}><strong>QA fixtures · no API writes</strong><label>Fixture size <select value={count} onChange={event => selectCount(Number(event.target.value))}>{[0, 5, 500, 1500, 5000].map(n => <option key={n}>{n}</option>)}</select></label><label>Scenario <select value={mode} onChange={event => setMode(event.target.value)}>{['normal', 'loading', 'error'].map(value => <option key={value}>{value}</option>)}</select></label><label>Save result <select value={failure} onChange={event => setFailure(event.target.value)}>{['409', 'field', 'success'].map(value => <option key={value}>{value}</option>)}</select></label><LanguageSwitcher /><button onClick={() => setLanguage('en')}>QA English</button><button onClick={() => setLanguage('vi')}>QA Vietnamese</button></div>
    <pre data-testid="package-metrics" style={{ padding: '0 16px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12 }}>{JSON.stringify(metrics)}</pre><pre data-testid="last-payload" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(lastPayload)}</pre><div role="status">{message}</div>
    <div className="manager-app" style={{ display: 'block', minHeight: 'auto' }}><main className="manager-content" style={{ margin: 0 }} ref={region} onInputCapture={event => { action.current = { start: performance.now(), ...(event.target.type === 'search' ? { expectedSearch: event.target.value } : {}), name: event.target.type === 'search' ? 'search (includes 300ms debounce)' : event.target.tagName === 'SELECT' ? 'filter/sort/size' : 'form input' }; }} onClickCapture={event => { if (event.target.closest('button')) action.current = { start: performance.now(), name: 'button interaction' }; }}><Profiler id="packages" onRender={(_id, _phase, duration) => { commit.current = duration; }}><PackagesPage data={mode === 'loading' ? null : data} loading={mode === 'loading'} loadError={mode === 'error' ? 'Unable to load data.' : ''} refresh={() => setMode('normal')} notify={setMessage} savePackage={save} /></Profiler></main></div>
  </>;
}
createRoot(document.getElementById('root')).render(<LanguageProvider><BrowserRouter><Preview /></BrowserRouter></LanguageProvider>);

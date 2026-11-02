import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { highlightParts, searchClasses, splitCode, subjectOptions } from './classSearch';
import './class-picker.css';

const LIMIT = 50;

function Highlight({ text, query }) {
  return highlightParts(text, query).map((part, index) => part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>);
}

/**
 * Searchable class combobox. Handles hundreds/thousands of classes: diacritic-insensitive search across
 * code, name, subject, coach and room, a subject filter, and at most LIMIT rendered options.
 */
export default function ClassPicker({ classes = [], value, onChange, label = 'Class', required = false, disabled = false }) {
  useLanguage();
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [active, setActive] = useState(0);
  const selected = classes.find(row => String(row.classId) === String(value));
  const subjects = useMemo(() => subjectOptions(classes), [classes]);
  const { items, total } = useMemo(() => searchClasses(classes, query, { subjectId, limit: LIMIT }), [classes, query, subjectId]);

  useEffect(() => {
    if (!open) return undefined;
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => { listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' }); }, [active, open]);

  const openList = () => { if (disabled) return; setOpen(true); setActive(Math.max(0, items.findIndex(row => String(row.classId) === String(value)))); };
  const choose = row => { onChange(String(row.classId)); setOpen(false); setQuery(''); inputRef.current?.focus(); };
  const onKeyDown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { openList(); return; }
      setActive(current => Math.max(0, Math.min(items.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (items[active]) choose(items[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); setOpen(false);
    } else if (event.key === 'Home' && open) { setActive(0); } else if (event.key === 'End' && open) { setActive(Math.max(0, items.length - 1)); }
  };

  const { code: selectedCode, name: selectedName } = splitCode(selected?.className);
  return <div className={`class-picker${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`} ref={rootRef}>
    <label className="class-picker-label" htmlFor={`${id}-input`}>{`${t(label)}${required ? ' *' : ''}`}</label>
    <div className="class-picker-control" onClick={() => { inputRef.current?.focus(); openList(); }}>
      <Search size={16} aria-hidden="true" />
      <input id={`${id}-input`} ref={inputRef} type="text" role="combobox" autoComplete="off" disabled={disabled}
        aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-required={required || undefined}
        aria-activedescendant={open && items[active] ? `${id}-opt-${items[active].classId}` : undefined}
        placeholder={selected ? '' : t('Search by class code, name, subject, coach or room')}
        value={open ? query : ''} onChange={event => { setQuery(event.target.value); setActive(0); if (!open) setOpen(true); }}
        onFocus={openList} onKeyDown={onKeyDown} />
      {!open && selected && <span className="class-picker-value" aria-hidden="true">{selectedCode && <b>{selectedCode}</b>}{selectedName}</span>}
      {selected && !disabled && <button type="button" className="class-picker-clear" aria-label={t('Clear selected class')} onClick={event => { event.stopPropagation(); onChange(''); setQuery(''); inputRef.current?.focus(); setOpen(true); }}><X size={14} /></button>}
      <ChevronDown size={16} className="class-picker-caret" aria-hidden="true" />
      {required && <input className="class-picker-required" tabIndex={-1} aria-hidden="true" required value={value || ''} onChange={() => {}} onFocus={() => inputRef.current?.focus()} />}
    </div>
    {selected && !open && <p className="class-picker-summary">{[selected.subjectName, selected.coachName, selected.roomName].filter(Boolean).join(' · ')}</p>}

    {open && <div className="class-picker-panel">
      {subjects.length > 1 && <div className="class-picker-filters" role="group" aria-label={t('Filter by subject')}>
        <button type="button" aria-pressed={!subjectId} onClick={() => { setSubjectId(''); setActive(0); inputRef.current?.focus(); }}>{t('All subjects')}<span>{classes.length}</span></button>
        {subjects.map(subject => <button type="button" key={subject.subjectId} aria-pressed={String(subjectId) === String(subject.subjectId)}
          onClick={() => { setSubjectId(String(subjectId) === String(subject.subjectId) ? '' : String(subject.subjectId)); setActive(0); inputRef.current?.focus(); }}>{subject.subjectName}<span>{subject.count}</span></button>)}
      </div>}
      <ul id={listId} role="listbox" ref={listRef} aria-label={t(label)} className="class-picker-list">
        {items.map((row, index) => {
          const { code, name } = splitCode(row.className);
          const isSelected = String(row.classId) === String(value);
          const seats = row.maxSlots != null ? `${row.enrolled ?? 0}/${row.maxSlots}` : null;
          return <li key={row.classId} id={`${id}-opt-${row.classId}`} data-index={index} role="option" aria-selected={isSelected}
            className={index === active ? 'is-active' : undefined} onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => choose(row)}>
            {code ? <span className="class-picker-code"><Highlight text={code} query={query} /></span> : <span className="class-picker-code is-empty">—</span>}
            <span className="class-picker-main">
              <strong><Highlight text={name} query={query} /></strong>
              <small><Highlight text={[row.subjectName, row.coachName, row.roomName].filter(Boolean).join(' · ')} query={query} /></small>
            </span>
            {seats && <span className="class-picker-seats" title={t('Students per session / capacity')}>{seats}</span>}
            {isSelected && <Check size={16} className="class-picker-check" aria-hidden="true" />}
          </li>;
        })}
        {!items.length && <li className="class-picker-empty" role="presentation">{t('No class matches "{0}".', [query || '…'])}</li>}
      </ul>
      <div className="class-picker-footer" role="status">
        <span>{total > items.length ? t('Showing {0} of {1} classes. Keep typing to narrow down.', [items.length, total]) : t('{0} classes', [total])}</span>
        <span className="class-picker-keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> {t('move')} · <kbd>Enter</kbd> {t('select')} · <kbd>Esc</kbd> {t('close')}</span>
      </div>
    </div>}
  </div>;
}

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { highlightParts, searchOptions } from './classSearch';
import './class-picker.css';

const Highlight = ({ text, query }) => highlightParts(text, query).map((part, i) => part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>);

/**
 * Searchable single-select for long lists (subjects, coaches, rooms, classes).
 * options: [{ value, label, hint?, group? }]; groupLabels names each group (e.g. suggested vs other rooms).
 * allLabel adds a first "All" choice with value '' (used by filters).
 */
export default function SearchSelect({ label, options = [], value, onChange, placeholder, required = false, disabled = false, groupLabels = [], collapseGroup, allLabel, error, help, name, limit = 50 }) {
  useLanguage();
  const id = useId();
  const rootRef = useRef(null), inputRef = useRef(null), listRef = useRef(null);
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [active, setActive] = useState(0), [expanded, setExpanded] = useState(false);
  const all = useMemo(() => allLabel ? [{ value: '', label: t(allLabel) }, ...options] : options, [options, allLabel]);
  const selected = all.find(option => String(option.value) === String(value ?? '')) || null;
  const found = useMemo(() => searchOptions(all, query, limit), [all, query, limit]);
  // Unrelated options (e.g. rooms of other subjects) stay hidden until searched for or asked for.
  const hidden = collapseGroup !== undefined && !query && !expanded ? found.items.filter(o => o.group === collapseGroup && String(o.value) !== String(value ?? '')).length : 0;
  const items = hidden ? found.items.filter(o => o.group !== collapseGroup || String(o.value) === String(value ?? '')) : found.items;
  const total = found.total;

  useEffect(() => {
    if (!open) return undefined;
    const close = event => { if (!rootRef.current?.contains(event.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => { listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' }); }, [active, open]);

  const openList = () => { if (disabled) return; setOpen(true); setActive(Math.max(0, items.findIndex(o => String(o.value) === String(value ?? '')))); };
  const choose = option => { onChange(String(option.value)); setOpen(false); setQuery(''); inputRef.current?.focus(); };
  const onKeyDown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { openList(); return; }
      setActive(c => Math.max(0, Math.min(items.length - 1, c + (event.key === 'ArrowDown' ? 1 : -1))));
    } else if (event.key === 'Enter' && open) { event.preventDefault(); if (items[active]) choose(items[active]); }
    else if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setQuery(''); }
  };
  const describedBy = error || help ? `${id}-help` : undefined;

  return <div className={`class-picker search-select${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`} ref={rootRef}>
    <label className="class-picker-label" htmlFor={`${id}-input`}>{`${t(label)}${required ? ' *' : ''}`}</label>
    <div className="class-picker-control" onClick={() => { inputRef.current?.focus(); openList(); }}>
      <Search size={16} aria-hidden="true" />
      <input id={`${id}-input`} ref={inputRef} name={name} type="text" role="combobox" autoComplete="off" disabled={disabled}
        aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy}
        aria-activedescendant={open && items[active] ? `${id}-opt-${active}` : undefined}
        placeholder={selected ? '' : t(placeholder || 'Type to search')}
        value={open ? query : ''} onChange={event => { setQuery(event.target.value); setActive(0); if (!open) setOpen(true); }}
        onFocus={openList} onKeyDown={onKeyDown} />
      {!open && selected && <span className="class-picker-value" aria-hidden="true">{selected.label}</span>}
      {selected && selected.value !== '' && !disabled && !required && allLabel === undefined && <button type="button" className="class-picker-clear" aria-label={t('Clear selection')} onClick={event => { event.stopPropagation(); onChange(''); }}><X size={14} /></button>}
      <ChevronDown size={16} className="class-picker-caret" aria-hidden="true" />
    </div>
    {(error || help) && <small id={describedBy} className={error ? 'manager-field-error' : 'ops-field-help'}>{t(error || help)}</small>}
    {open && <div className="class-picker-panel">
      <ul id={`${id}-list`} role="listbox" ref={listRef} aria-label={t(label)} className="class-picker-list">
        {items.map((option, index) => {
          const isSelected = String(option.value) === String(value ?? '');
          const header = groupLabels[option.group] && (index === 0 || items[index - 1].group !== option.group);
          return [header && <li key={`g-${option.group}`} role="presentation" className="search-select-group">{t(groupLabels[option.group])}</li>,
            <li key={`o-${option.value}`} id={`${id}-opt-${index}`} data-index={index} role="option" aria-selected={isSelected}
              className={index === active ? 'is-active' : undefined} onPointerMove={() => setActive(index)} onPointerDown={e => e.preventDefault()} onClick={() => choose(option)}>
              <span className="class-picker-main"><strong><Highlight text={option.label} query={query} /></strong>{option.hint && <small><Highlight text={option.hint} query={query} /></small>}</span>
              {isSelected && <Check size={16} className="class-picker-check" aria-hidden="true" />}
            </li>];
        })}
        {!items.length && !hidden && <li className="class-picker-empty" role="presentation">{t('No match for "{0}".', [query])}</li>}
        {hidden > 0 && <li role="presentation" className="search-select-more"><button type="button" onPointerDown={e => e.preventDefault()} onClick={() => { setExpanded(true); inputRef.current?.focus(); }}>{t('Show {0} other options', [hidden])}</button></li>}
      </ul>
      {total > found.items.length && <div className="class-picker-footer" role="status"><span>{t('Showing {0} of {1}. Keep typing to narrow down.', [items.length, total])}</span></div>}
    </div>}
  </div>;
}

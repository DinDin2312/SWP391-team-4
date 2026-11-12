import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { t } from '../../../i18n/useLanguage';
import { searchClasses, splitCode } from '../../manager/components/classSearch';

const SupportClassPicker = ({
  id,
  classes = [],
  value = '',
  onChange,
  placeholder = '-- Select Enrolled Class --',
  allowEmpty = false,
  emptyLabel = '-- None / Not related to a specific class --',
  pendingClassIds,
  required = false
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  const selected = useMemo(
    () => classes.find((cls) => String(cls.classId) === String(value)) || null,
    [classes, value]
  );

  const filtered = useMemo(
    () => searchClasses(classes, query, { limit: 100 }).items,
    [classes, query]
  );

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => searchRef.current?.focus(), 0);
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pick = (nextId) => {
    onChange(nextId);
    setOpen(false);
    setQuery('');
  };

  const selectedParts = selected ? splitCode(selected.className) : null;
  const selectedPending = selected && pendingClassIds?.has(String(selected.classId));

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border text-left transition-all cursor-pointer ${
            open
              ? 'border-[#0071E3] ring-4 ring-[#0071E3]/15'
              : 'border-[var(--border)] hover:border-[#0071E3]/50'
          }`}
        >
          {selected && selectedParts ? (
            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-2 min-w-0">
                {selectedParts.code && (
                  <span className="shrink-0 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/12 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 border border-blue-500/20">
                    {selectedParts.code}
                  </span>
                )}
                <span className="text-sm font-semibold text-[var(--text)] truncate">
                  {selectedParts.name || selected.className}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] truncate">
                <span className="truncate">{selected.coachName || t('Coach')}</span>
                {selected.subjectName && <span className="truncate">· {selected.subjectName}</span>}
                {selectedPending && (
                  <span className="shrink-0 px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">
                    {t('Pending Review')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-sm text-[var(--text-muted)] truncate flex-1">
              {allowEmpty ? emptyLabel : placeholder}
            </span>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {allowEmpty && selected && (
              <span
                role="button"
                tabIndex={-1}
                aria-label={t('Clear filter')}
                onClick={(event) => {
                  event.stopPropagation();
                  pick('');
                }}
                className="w-6 h-6 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.1] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
                open ? 'rotate-180 text-[#0071E3]' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute top-full left-0 right-0 mt-1.5 z-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.12] shadow-2xl overflow-hidden animate-fade-in"
        >
          <div className="p-2.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('Search by class code, class name or coach...')}
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
              />
              {query && (
                <button
                  type="button"
                  aria-label={t('Clear filter')}
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {allowEmpty && !query.trim() && (
              <button
                type="button"
                role="option"
                aria-selected={!selected}
                onClick={() => pick('')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                  !selected
                    ? 'bg-blue-500/10 text-[#0071E3] dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <span className="truncate">{emptyLabel}</span>
                {!selected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="py-5 px-3 text-center text-xs text-slate-400">
                {t('No matching classes found.')}
              </div>
            ) : (
              filtered.map((cls) => {
                const { code, name } = splitCode(cls.className);
                const isSelected = String(cls.classId) === String(value);
                const isPending = pendingClassIds?.has(String(cls.classId));
                return (
                  <button
                    key={cls.classId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => pick(String(cls.classId))}
                    className={`w-full flex items-start justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'hover:bg-slate-100/90 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {code && (
                          <span className="shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/12 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300">
                            {code}
                          </span>
                        )}
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[#0071E3] dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                          {name || cls.className}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{cls.coachName || t('Coach')}</span>
                        {cls.subjectName && <span>· {cls.subjectName}</span>}
                        {cls.totalBookedSessions > 0 && <span>· {cls.totalBookedSessions} {t('sessions')}</span>}
                        {isPending && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                            {t('Pending Review')}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0071E3] shrink-0 mt-0.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportClassPicker;

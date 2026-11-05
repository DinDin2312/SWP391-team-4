import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { formatVnInput, maskVnInput, parseVnInput } from '../utils/vnTime';
import './vn-date-input.css';

const PLACEHOLDER = { date: 'dd/mm/yyyy', 'datetime-local': 'dd/mm/yyyy hh:mm', time: 'hh:mm' };
const outOfRange = (value, min, max) => Boolean(value && ((min && value < min) || (max && value > max)));

// Drop-in replacement for <input type="date|datetime-local|time">: same ISO value and onChange,
// but always shows day/month/year and 24-hour time, whatever language the browser uses.
export default function VnDateInput({ type = 'date', value, onChange, onInput, min, max, className = '', style, disabled, name, id, required, placeholder, ...rest }) {
  const [text, setText] = useState(() => formatVnInput(value, type));
  const textRef = useRef(null), pickerRef = useRef(null), last = useRef(value);
  useEffect(() => { if (value !== last.current) { last.current = value; setText(formatVnInput(value, type)); } }, [value, type]);

  const emit = next => {
    last.current = next;
    const event = { target: { value: next, name, id, type }, currentTarget: { value: next, name, id, type }, preventDefault() {}, stopPropagation() {} };
    onInput?.(event); onChange?.(event);
  };
  const check = (raw, parsed) => {
    const el = textRef.current; if (!el) return;
    el.setCustomValidity(parsed === null && raw ? `Nhập theo dạng ${PLACEHOLDER[type]}` : outOfRange(parsed, min, max) ? 'Ngày giờ nằm ngoài khoảng cho phép' : '');
  };
  const typed = event => {
    const raw = maskVnInput(event.target.value, type), parsed = parseVnInput(raw, type);
    setText(raw); check(raw, parsed);
    if (parsed !== null && parsed !== value) emit(parsed);
  };
  const picked = event => { const next = event.target.value; setText(formatVnInput(next, type)); check(next, next); emit(next); };
  const openPicker = () => { const el = pickerRef.current; if (!el || disabled) return; try { el.showPicker(); } catch { el.focus(); el.click(); } };
  const Icon = type === 'time' ? Clock : CalendarDays;

  return <span className="vn-date" style={style}>
    <input {...rest} ref={textRef} id={id} name={name} type="text" inputMode="numeric" autoComplete="off" className={`${className} vn-date-text`.trim()} data-type={type}
      placeholder={placeholder || PLACEHOLDER[type]} value={text} onChange={typed} onBlur={e => { check(text, parseVnInput(text, type)); rest.onBlur?.(e); }} disabled={disabled} required={required} />
    <button type="button" className="vn-date-picker" onClick={openPicker} disabled={disabled} tabIndex={-1} aria-hidden="true"><Icon size={16} /></button>
    <input ref={pickerRef} type={type} className="vn-date-native" value={value || ''} min={min} max={max} onChange={picked} tabIndex={-1} aria-hidden="true" disabled={disabled} />
  </span>;
}

import { t, useLanguage } from '../../../i18n/useLanguage';
import { Check, Copy, Eye, EyeOff, WandSparkles } from 'lucide-react';
import { useState } from 'react';

const generatePassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(12);
  crypto.getRandomValues(values);
  return [...values].map((value) => alphabet[value % alphabet.length]).join('');
};

function PasswordInput({ value, onChange, onBlur, invalid, describedBy, autoFocus }) {
  useLanguage();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return <div className={`manager-password-input ${invalid ? 'is-invalid' : ''}`}>
    <input type={visible ? 'text' : 'password'} value={value} onChange={onChange} onBlur={onBlur} aria-invalid={invalid} aria-describedby={describedBy} autoComplete="new-password" autoFocus={autoFocus} />
    <button type="button" onClick={() => setVisible((current) => !current)} title={t(visible ? 'Hide password' : 'Show password')} aria-label={t(visible ? 'Hide password' : 'Show password')}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    <button className="manager-generate-password" type="button" onClick={() => onChange({ target: { value: generatePassword() } })} title={t("Generate 12-character password")}><WandSparkles size={15} /><span>{t("Generate")}</span></button>
    <button type="button" disabled={!value} onClick={copy} title={t("Copy password")} aria-label={t("Copy password")}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
  </div>;
}

export default PasswordInput;

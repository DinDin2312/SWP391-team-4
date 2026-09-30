import { Check, Copy, Eye, EyeOff, WandSparkles } from 'lucide-react';
import { useState } from 'react';

const generatePassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(12);
  crypto.getRandomValues(values);
  return [...values].map((value) => alphabet[value % alphabet.length]).join('');
};

function PasswordInput({ value, onChange, onBlur, invalid, describedBy, autoFocus }) {
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
    <button type="button" onClick={() => setVisible((current) => !current)} title={visible ? 'Hide password' : 'Show password'} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    <button className="manager-generate-password" type="button" onClick={() => onChange({ target: { value: generatePassword() } })} title="Generate 12-character password"><WandSparkles size={15} /><span>Generate</span></button>
    <button type="button" disabled={!value} onClick={copy} title="Copy password" aria-label="Copy password">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
  </div>;
}

export default PasswordInput;

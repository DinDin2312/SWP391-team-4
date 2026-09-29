import { CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';
import managerEn from '../i18n/en';

function ManagerToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return <div className="manager-toast" role="status"><CheckCircle2 size={18} /><span>{message}</span><button type="button" title={managerEn.staff.feedback.dismiss} aria-label={managerEn.staff.feedback.dismiss} onClick={onClose}><X size={15} /></button></div>;
}

export default ManagerToast;

import { useLanguage } from '../../../i18n/useLanguage';
import { ChevronDown } from 'lucide-react';

function ManagerSelect({ className = '', ...props }) {
  useLanguage();
  return <div className={`manager-select ${className}`.trim()}>
    <select {...props} />
    <ChevronDown size={15} aria-hidden="true" />
  </div>;
}

export default ManagerSelect;

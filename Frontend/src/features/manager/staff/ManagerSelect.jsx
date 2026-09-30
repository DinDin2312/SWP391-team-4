import { ChevronDown } from 'lucide-react';

function ManagerSelect({ className = '', ...props }) {
  return <div className={`manager-select ${className}`.trim()}>
    <select {...props} />
    <ChevronDown size={15} aria-hidden="true" />
  </div>;
}

export default ManagerSelect;

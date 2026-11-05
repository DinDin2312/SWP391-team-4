import { useEffect, useState } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import managerService from '../services/managerService';
import './coach-subjects.css';

// Which subjects a coach may teach; class and substitute pickers only offer coaches who teach the subject.
export default function CoachSubjectsField({ value = [], onChange }) {
  useLanguage();
  const [subjects, setSubjects] = useState(null), [error, setError] = useState('');
  useEffect(() => { managerService.subjects().then(rows => setSubjects((rows || []).filter(s => s.status !== 'INACTIVE' || value.map(Number).includes(Number(s.subjectId))))).catch(() => setError(t('Could not load subjects.'))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const ids = value.map(Number);
  const toggle = id => onChange(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  return <fieldset className="coach-subjects wide">
    <legend>{t('Subjects this coach teaches')}</legend>
    <p>{t('Only these subjects can be assigned to the coach’s classes and substitute sessions.')}</p>
    {error ? <p role="alert" className="manager-field-error">{error}</p> : !subjects ? <p>{t('Loading…')}</p> : !subjects.length ? <p>{t('No subjects yet. Add one in Center operations first.')}</p> :
      <div>{subjects.map(s => <label key={s.subjectId}><input type="checkbox" checked={ids.includes(Number(s.subjectId))} onChange={() => toggle(Number(s.subjectId))} /><span>{s.subjectName}</span></label>)}</div>}
    {subjects?.length > 0 && !ids.length && <p className="coach-subjects-warn">{t('With no subjects, this coach cannot be assigned to any class.')}</p>}
  </fieldset>;
}

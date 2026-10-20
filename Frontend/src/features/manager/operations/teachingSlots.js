import { useEffect, useState } from 'react';
import managerService from '../services/managerService';
export function useTeachingSlots(classId) {
  const [policy,setPolicy]=useState(null),[error,setError]=useState('');
  useEffect(()=>{let active=true;managerService.schedulePolicy(classId).then(p=>{if(active){setPolicy({...p,forClassId:classId});setError('');}}).catch(()=>{if(active)setError('Unable to load teaching slots. Reload this page.');});return()=>{active=false;};},[classId]);
  return {policy:policy?.forClassId===classId?policy:null,error};
}
export function slotEnd(start,duration=90) {
  if(!start)return '';
  const [date,time]=start.split('T');const [hour,minute]=time.split(':').map(Number);
  const end=hour*60+minute+duration;
  return date+'T'+String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0');
}

export function slotLabel(time, index, duration=90) {
  const hourText = value => {
    const [hours, minutes] = value.split(':');
    return Number(hours) + 'h' + (Number(minutes) ? minutes : '');
  };
  return 'Slot ' + (index + 1) + ' (' + hourText(time) + '–' + hourText(slotEnd('2000-01-01T' + time,duration).slice(11)) + ')';
}

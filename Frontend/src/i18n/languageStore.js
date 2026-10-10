import { translations } from './messages.js';
let language = 'en';
try { language = globalThis.localStorage?.getItem('nexusLanguage') === 'vi' ? 'vi' : 'en'; } catch { /* Storage is optional. */ }
const listeners = new Set();
const reverse = new Map(Object.values(translations).map(pair => [pair[1],pair]));
const patterns = Object.values(translations).filter(pair => pair[0].includes('{0}')).flatMap(pair => pair.map(source => ({
  pair, indexes:[...source.matchAll(/\{(\d+)\}/g)].map(match=>Number(match[1])),
  regex: new RegExp(`^${source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\{\d+\\\}/g,'(.+?)')}$`),
})));
export const getLanguage = () => language;
export function setLanguage(value) {
  if (!['en','vi'].includes(value) || value === language) return;
  language = value;
  try { globalThis.localStorage?.setItem('nexusLanguage',value); } catch { /* Keep the session preference. */ }
  listeners.forEach(listener => listener(value));
}
export function subscribeLanguage(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function t(value, params = []) {
  if (typeof value !== 'string') return value;
  let pair = Object.hasOwn(translations,value) ? translations[value] : reverse.get(value);
  if (!pair && params.length === 0) {
    for (const candidate of patterns) {
      const match = value.match(candidate.regex);
      if (match) { pair=candidate.pair; params=[];candidate.indexes.forEach((index,i)=>{params[index]=match[i+1];}); break; }
    }
  }
  const text = pair ? pair[language === 'vi' ? 1 : 0] : value;
  return text.replace(/\{(\d+)\}/g, (match,index) => params[index] === undefined ? match : String(params[index]))
    .replace(/&(bull|nbsp|rarr|middot|amp|quot|apos);/g, (_,name)=>({bull:'•',nbsp:' ',rarr:'→',middot:'·',amp:'&',quot:'"',apos:"'"})[name]);
}
export const locale = () => language === 'vi' ? 'vi-VN' : 'en-GB';
export const codeLabel = value => t(({ ACTIVE:'Active', INACTIVE:'Inactive', SCHEDULED:'Scheduled', COMPLETED:'Completed', CANCELLED:'Cancelled', CONFIRMED:'Confirmed', PENDING:'Pending', EXPIRED:'Expired', SUCCESS:'Success!', FAILED:'Payment Failed', PRESENT:'Present', ABSENT:'Absent', NOT_YET:'Not yet', GYM_ACCESS:'Gym access', AI_ACCESS:'AI access', COMBO:'Combo (Gym + AI)', PREMIUM:'Premium', SUBJECT_ACCESS:'Subject package' })[value] || value);
export function localizedCopy(object) {
  return new Proxy(object, { get(target,key) {
    const value = target[key];
    if (typeof value === 'function') return (...args) => t(value(...args));
    if (value && typeof value === 'object') return localizedCopy(value);
    return typeof value === 'string' ? t(value) : value;
  } });
}

// Development-only reports preview. Fixture data only; no API calls or database writes.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import LanguageProvider from '../src/i18n/LanguageContext';
import LanguageSwitcher from '../src/i18n/LanguageSwitcher';
import { setLanguage } from '../src/i18n/languageStore';
import ReportsPage from '../src/features/manager/reports/ReportsPage';
import '../src/index.css';
import '../src/features/manager/pages/manager.css';
import '../src/features/manager/pages/manager-polish.css';
const query = new URLSearchParams(location.search);
setLanguage(query.get('lang') || 'vi');
const initialRange={from:'2026-10-01',to:'2026-10-11'};
const amounts=[450000,720000,580000,920000,1350000,1100000,680000,1580000,1260000,1940000,1430000];
const fixture={summary:{revenue:amounts.reduce((sum,n)=>sum+n,0),successfulPayments:42,pendingInvoices:6,confirmedBookings:128},revenueByDay:amounts.map((value,index)=>({label:`2026-10-${String(index+1).padStart(2,'0')}`,value})),classOccupancy:[{classId:1,label:'Yoga Giãn Cơ Buổi Sáng',value:48,capacity:60},{classId:2,label:'Bơi Lội Căn Bản',value:35,capacity:50},{classId:3,label:'Zumba Dance',value:28,capacity:40},{classId:4,label:'Gym Sức Bền',value:17,capacity:30}],memberships:[{label:'Gói Gym 3 Tháng',value:18},{label:'Gói Bơi & Yoga',value:12},{label:'Thẻ Gym 1 Tháng',value:9},{label:'Gói AI Cá Nhân',value:5},{label:'Thẻ Tập Thử',value:3}]};
export default function Preview(){
 const [filters,setFilters]=useState(initialRange),[applied,setApplied]=useState(initialRange),[mode,setMode]=useState(query.get('mode')||'normal');
 const data=mode==='empty'?{summary:{revenue:0,successfulPayments:0,pendingInvoices:0,confirmedBookings:0},revenueByDay:[],classOccupancy:[],memberships:[]}:fixture;
 return <div className="manager-app" style={{display:'block',minHeight:'100vh'}}><div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:12,padding:'16px 24px'}}><span style={{fontSize:12,color:'var(--text-muted)'}}>QA · dữ liệu minh họa, không gọi API</span><label style={{fontSize:12}}>Scenario <select value={mode} onChange={event=>setMode(event.target.value)}>{['normal','empty','loading','error'].map(item=><option key={item}>{item}</option>)}</select></label><LanguageSwitcher/></div><main className="manager-content" style={{margin:0,padding:'24px clamp(16px,4vw,56px)',maxWidth:1600}}><ReportsPage page={{title:'Reports',description:'Review financial and operational performance by date range.'}} data={data} filters={filters} appliedFilters={applied} setFilters={setFilters} reload={()=>setApplied(filters)} loading={mode==='loading'} loadError={mode==='error'?'Unable to load data.':''}/></main></div>;
}
createRoot(document.getElementById('root')).render(<LanguageProvider><Preview/></LanguageProvider>);

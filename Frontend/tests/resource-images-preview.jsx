// Dev-only fixture. All application requests are mocked; no database or upload writes.
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import LanguageProvider from '../src/i18n/LanguageContext';
import { setLanguage } from '../src/i18n/languageStore';
import OperationsPage from '../src/features/manager/operations/OperationsPage';
import PackagesPage from '../src/features/manager/packages/PackagesPage';
import PackageStore from '../src/features/member/pages/PackageStore';
import BookClass from '../src/features/member/pages/BookClass';
import Memberships from '../src/features/member/pages/Memberships';
import managerService from '../src/features/manager/services/managerService';
import '../src/index.css';
import '../src/features/manager/pages/manager.css';
import '../src/features/manager/pages/manager-polish.css';
const imagePath = new URLSearchParams(location.search).get('photo');
const benefitsQa=new URLSearchParams(location.search).has('benefits');
const packages = [{packageId:1,packageName:'Gym Flex',packageType:'GYM_ACCESS',durationDays:30,price:500000,imagePath,activeSubscribers:23},{packageId:2,packageName:'Premium 90',packageType:'PREMIUM',durationDays:90,price:2400000,imagePath:null,activeSubscribers:7}];
const initial = {subjects:[{subjectId:1,subjectName:'Yoga',description:'QA',imagePath}],coaches:[{userId:1,fullName:'Minh Anh'}],rooms:[{roomId:1,roomName:'Studio Yoga',capacity:20,classCount:1,imagePath},{roomId:2,roomName:'Phòng tập thể lực',capacity:40,classCount:0,imagePath:null}],classes:[{classId:1,className:'Yoga buổi sáng',subjectId:1,subjectName:'Yoga',coachId:1,coachName:'Minh Anh',roomId:1,roomName:'Studio Yoga',maxSlots:20,price:120000,status:'ACTIVE',scheduleCount:0,imagePath}],schedules:[]};
if(benefitsQa) {
  initial.subjects=Array.from({length:20},(_,i)=>({subjectId:i+1,subjectName:i===0?'Yoga':i===1?'Bơi lội':`Bộ môn ${i+1}`,description:'QA',imagePath:null}));
  packages.push(...Array.from({length:16},(_,i)=>({packageId:i+3,packageName:`Gói Yoga + Bơi ${i+1}`,packageType:'SUBJECT_ACCESS',durationDays:60,price:1200000,activeSubscribers:2,benefits:[{subjectId:1,subjectName:'Yoga',sessionLimit:8},{subjectId:2,subjectName:'Bơi lội',sessionLimit:4}]})));
}
let updatePhoto, updatePackage, updateSelling, failing = false;
for (const key of Object.keys(managerService)) {
  managerService[key] = async () => { throw new Error('This operation is disabled in the photo QA fixture'); };
}
managerService.uploadResourceImage = async (resource,id) => { if(failing) throw {response:{data:{message:'Unable to save the image.'}}}; updatePhoto(resource,id,imagePath); return {data:{imagePath}}; };
managerService.removeResourceImage = async (resource,id) => { if(failing) throw {response:{data:{message:'Unable to save the image.'}}}; updatePhoto(resource,id,null); };
managerService.scheduleBookings = async () => ({data:[]});
managerService.subjects=async()=>initial.subjects;
managerService.rooms=async()=>initial.rooms;
const qaTypes=[{typeCode:'GYM_ACCESS',typeName:'Gym access',requiresSubjects:false},{typeCode:'AI_ACCESS',typeName:'AI access',requiresSubjects:false},{typeCode:'PREMIUM',typeName:'Premium',requiresSubjects:false},{typeCode:'COMBO',typeName:'Combo (Gym + AI)',requiresSubjects:false},{typeCode:'SUBJECT_ACCESS',typeName:'Subject package',requiresSubjects:true}];
managerService.packageDetail=async id=>{if(failing)throw Error('QA detail failure');const pkg=packages.find(p=>p.packageId===id);return {data:{description:'Gói tập thử, dành cho hội viên muốn trải nghiệm trung tâm.',terms:'Chỉ mua một lần mỗi hội viên.\nBuổi đã học không được hoàn lại.',purchaseLimitPerMember:1,sellingStatus:'SELLING',...pkg,packageTypeName:qaTypes.find(t=>t.typeCode===pkg.packageType)?.typeName}};};
managerService.packageHistory=async()=>{if(failing)throw Error('QA history failure');return {data:{page:1,total:1,items:[{actor:'admin@example.test',createdAt:'2026-10-09T08:30:00',changes:{fields:{price:{before:1000000,after:1200000},purchaseLimitPerMember:{before:null,after:1},terms:{before:null,after:'Chỉ mua một lần mỗi hội viên.'}}}}]}};};
managerService.packageSelling=async(id,status)=>{if(failing)throw {response:{data:{message:'Unable to save changes.'}}};updateSelling(id,status);};
managerService.packageTypes=async()=>({data:[...qaTypes]});
managerService.savePackageType=async type=>{
 if(qaTypes.some(row=>row.typeName.toLowerCase()===type.typeName.trim().toLowerCase()&&row.typeCode!==type.typeCode))throw {response:{data:{message:'A package type with this name already exists.'}}};
 const code=type.typeCode||`CUSTOM_QA_${qaTypes.length}`;
 const existing=qaTypes.find(row=>row.typeCode===code);if(existing)existing.typeName=type.typeName;else qaTypes.push({...type,typeCode:code});
 return {data:{typeCode:code}};
};
// UI-only scheduling responses. The planner itself is covered by Java + MySQL tests.
managerService.previewSchedulePlan = async rules => ({data:{coachId:1,roomId:1,missing:failing?1:0,sessions:Array.from({length:rules.sessions-(failing?1:0)},(_,i)=>({startTime:`2040-06-${String(1+i*2).padStart(2,'0')}T10:15:00`,endTime:`2040-06-${String(1+i*2).padStart(2,'0')}T11:15:00`})),skipped:[{date:'2040-06-02',reason:'Excluded date'}]}});
managerService.commitSchedulePlan = async () => {if(failing)throw {response:{data:{message:'The preview conflicts with a coach or room booking. Generate a new preview.'}}};return {data:{ids:[101,102,103]}};};
managerService.savePackage = async (payload,photo={}) => {if(failing)throw {response:{data:{message:'Unable to save changes.'}}};updatePackage?.(payload);if(photo.file || photo.remove)updatePhoto('packages',payload.packageId,photo.remove?null:imagePath);return {data:{id:payload.packageId || 3}};};
const qaOwned=[{membershipId:101,packageName:'Gói Yoga + Bơi',packageType:'SUBJECT_ACCESS',status:'ACTIVE',startDate:'2026-10-01',endDate:'2026-11-30',durationDays:60,price:1200000,benefits:[{subjectId:1,subjectName:'Yoga',sessionLimit:8,remainingSessions:6},{subjectId:2,subjectName:'Bơi lội',sessionLimit:4,remainingSessions:4}]}];
const qaCourses=[{classId:201,className:'Yoga buổi sáng QA',subjectId:1,coachName:'QA Coach',roomName:'QA Studio',totalSessions:4,nextSessionTime:'2026-10-15T09:00:00',lastSessionTime:'2026-10-22T10:00:00',maxSlots:20,bookedSlots:0,price:600000,durationMinutes:60,schedulePattern:'Mon, Thu',upcomingDates:['Oct 15, 09:00','Oct 17, 09:00','Oct 20, 09:00','Oct 22, 09:00']}];
axios.get = async url => {if(/\/member\/packages\/\d+$/.test(url))return managerService.packageDetail(Number(url.split('/').pop()));if(/\/my-packages\/\d+$/.test(url))return {data:{...qaOwned[0],description:'Mô tả đã chụp lúc mua.',terms:'Điều khoản lúc mua.'}};return ({data:url.endsWith('/member/packages')?packages.filter(row=>row.sellingStatus!=='STOPPED').map(row=>({...row,packageTypeName:qaTypes.find(type=>type.typeCode===row.packageType)?.typeName})):url.endsWith('/my-packages')?qaOwned:url.endsWith('/available-classes')?qaCourses:{items:[],totalPrice:0}});};
axios.post = async url => {if(benefitsQa&&url.endsWith('/with-package/101')){qaCourses[0].isBookedByMe=true;qaOwned[0].benefits[0].remainingSessions=2;return {data:'QA package booking'};}throw new Error('Purchases are disabled in the QA fixture');};
axios.delete=async()=>{throw new Error('Purchases are disabled in the QA fixture');};
export default function Preview(){
  const [view,setView]=useState(new URLSearchParams(location.search).get('view')==='packages'?'packages':'operations'),[data,setData]=useState(initial),[items,setItems]=useState(packages),[message,setMessage]=useState(''),[filters,setFilters]=useState({from:'2026-10-05',to:'2026-10-11'});
  const update = useCallback((resource,id,path) => resource==='packages'?setItems(rows=>rows.map(row=>row.packageId===id?{...row,imagePath:path}:row)):setData(current=>({...current,[resource]:current[resource].map(row=>row[resource==='rooms'?'roomId':resource==='subjects'?'subjectId':'classId']===id?{...row,imagePath:path}:row)})),[]);
  useEffect(()=>{updatePhoto=update;return()=>{updatePhoto=undefined;};},[update]);
  useEffect(()=>{updateSelling=(id,status)=>setItems(rows=>{const next=rows.map(row=>row.packageId===id?{...row,sellingStatus:status}:row);packages.splice(0,packages.length,...next);return next;});return()=>{updateSelling=undefined;};},[]);
  useEffect(()=>{updatePackage=payload=>setItems(rows=>{const found=rows.some(row=>row.packageId===payload.packageId);const row={...payload,packageTypeName:qaTypes.find(type=>type.typeCode===payload.packageType)?.typeName,packageId:payload.packageId||Math.max(...rows.map(item=>item.packageId))+1,benefits:payload.benefits.map(b=>({...b,subjectName:initial.subjects.find(s=>s.subjectId===b.subjectId)?.subjectName}))};const next=found?rows.map(item=>item.packageId===payload.packageId?{...item,...row}:item):[...rows,row];packages.splice(0,packages.length,...next);return next;});return()=>{updatePackage=undefined;};},[]);
  return <><div style={{display:'flex',flexWrap:'wrap',gap:12,padding:16}}><strong>QA · requests mocked</strong><button onClick={()=>setView('operations')}>QA operations</button><button onClick={()=>setView('packages')}>QA admin packages</button><button onClick={()=>setView('store')}>QA member store</button><button onClick={()=>setView('booking')}>QA package booking</button><button onClick={()=>setView('owned')}>QA owned packages</button><button onClick={()=>setLanguage('en')}>QA English</button><button onClick={()=>setLanguage('vi')}>QA Vietnamese</button><label>Upload result <select onChange={event=>{failing=event.target.value==='error';}}><option value="success">success</option><option value="error">error</option></select></label></div><div role="status">{message}</div><div className="manager-app" style={{display:'block'}}><main className="manager-content">{view==='operations'?<OperationsPage data={data} page={{title:'Center Operations'}} filters={filters} appliedFilters={filters} setFilters={setFilters} reload={()=>{}} refresh={()=>Promise.resolve()} notify={setMessage}/>:view==='packages'?<PackagesPage data={items} refresh={()=>Promise.resolve()} notify={setMessage}/>:view==='booking'?<BookClass/>:view==='owned'?<Memberships/>:<PackageStore/>}</main></div></>;
}
createRoot(document.getElementById('root')).render(<LanguageProvider><BrowserRouter><Preview/></BrowserRouter></LanguageProvider>);

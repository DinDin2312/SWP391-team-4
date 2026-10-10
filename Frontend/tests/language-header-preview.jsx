// Dev-only role layout QA. All HTTP requests are mocked; authentication storage is untouched.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import axiosClient from '../src/services/axiosClient';
import { AuthContext } from '../src/context/AuthContext';
import LanguageProvider from '../src/i18n/LanguageContext';
import AppRoutes from '../src/routes/AppRoutes';
import managerService from '../src/features/manager/services/managerService';
import '../src/index.css';
import '../src/styles/role-theme.css';
const roles={member:['Member','/member/memberships'],coach:['Coach','/coach/dashboard'],receptionist:['Receptionist','/staff/dashboard'],admin:['Center Manager','/admin/dashboard']};
const fixture = url => url.includes('/cart')?{items:[],totalPrice:0}:url.includes('/stats')?{}:[];
axios.get = async url => ({data:fixture(url)});
axios.post = axios.put = axios.patch = axios.delete = async () => {throw new Error('Writes disabled in role layout QA');};
axiosClient.defaults.adapter = async config => {
  if(config.method!=='get') throw new Error('Writes disabled in role layout QA');
  return {data:fixture(config.url),status:200,statusText:'OK',headers:{},config};
};
for(const key of Object.keys(managerService)) managerService[key]=async()=>[];
managerService.dashboard=async()=>({attentionList:[],lowRegistrationList:[],expiringMembershipList:[],recentActivity:[]});
managerService.overviewPage=async()=>({items:[],total:0,page:0,size:6});
export default function Preview(){
  const [role,setRole]=useState('member');
  return <LanguageProvider><div style={{padding:12,display:'flex',flexWrap:'wrap',gap:12}}><strong>QA · role headers · mocked HTTP</strong>{Object.keys(roles).map(name=><button key={name} onClick={()=>setRole(name)}>{`QA ${name}`}</button>)}</div><AuthContext.Provider value={{userRole:roles[role][0],userInfo:{fullName:'QA Demo',email:'qa@example.test',role:roles[role][0]},logout(){}}}><MemoryRouter key={role} initialEntries={[roles[role][1]]}><AppRoutes/></MemoryRouter></AuthContext.Provider></LanguageProvider>;
}
createRoot(document.getElementById('root')).render(<Preview/>);

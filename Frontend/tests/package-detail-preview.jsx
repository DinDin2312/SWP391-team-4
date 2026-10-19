// Development-only detail preview. Uses local fixtures and never calls APIs or writes data.
import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LanguageProvider from '../src/i18n/LanguageContext';
import { setLanguage } from '../src/i18n/languageStore';
import PackageDetailDialog from '../src/components/resource-images/PackageDetailDialog';
import '../src/index.css';
import '../src/features/manager/pages/manager.css';
const query = new URLSearchParams(location.search);
setLanguage(query.get('lang') || 'vi');
const mode = query.get('mode') || 'normal';
const detail = {
  packageId: 1, packageName: 'Gói Bơi & Yoga 3 Tháng', packageTypeName: 'Gói theo bộ môn', durationDays: 90, price: 1800000, sellingStatus: 'SELLING', purchaseLimitPerMember: null, activeSubscribers: 24,
  description: 'Kết hợp bơi lội và yoga để cải thiện sức bền, thư giãn và duy trì thói quen vận động. Số buổi được sử dụng linh hoạt trong thời hạn gói.',
  terms: 'Đặt lịch trước mỗi buổi học.\nQuyền lợi chỉ áp dụng tại địa điểm đã chọn.\nGói không được chuyển nhượng cho người khác.',
  benefits: [
    {subjectId:1,subjectName:'Bơi Lội',sessionLimit:24,remainingSessions:16,rooms:[{roomId:1,roomName:'Hồ Bơi Bốn Mùa'}]},
    {subjectId:2,subjectName:'Yoga',sessionLimit:12,remainingSessions:8,rooms:[{roomId:2,roomName:'Phòng Yoga Tầng 2'},{roomId:3,roomName:'Studio Tầng 3'}]},
  ],
  ...(mode === 'member' ? {membershipId:1,endDate:'2027-01-09',activeSubscribers:undefined,sellingStatus:undefined} : {}),
  ...(mode === 'empty' ? {description:'',terms:'',benefits:[],packageName:'Gói Tập Thử',price:0,purchaseLimitPerMember:1,activeSubscribers:0} : {}),
};
export default function Preview() {
  const [open,setOpen]=useState(true);
  const load = useCallback(async () => {
    if(mode==='error')throw Error('Fixture error');
    if(mode==='loading')return new Promise(()=>{});
    return {data:detail};
  },[]);
  const history = useCallback(async () => ({data:{total:1,items:[{actor:'manager@example.test',createdAt:'2026-10-11T09:30:00',changes:{fields:{price:{before:2000000,after:1800000}}}}]}}),[]);
  return <div className="manager-app" style={{display:'block',padding:40,minHeight:'100vh'}}><h1>Chi tiết gói · QA preview</h1><p>Dữ liệu minh họa, không gọi API.</p><button onClick={()=>setOpen(true)}>Mở chi tiết</button>{open&&<PackageDetailDialog id={1} load={load} loadHistory={mode==='member'?undefined:history} onClose={()=>setOpen(false)} onEdit={mode==='member'?undefined:()=>setOpen(false)}/>}</div>;
}
createRoot(document.getElementById('root')).render(<LanguageProvider><Preview/></LanguageProvider>);

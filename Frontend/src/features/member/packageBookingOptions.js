export function packageBookingOptions(packages,course,today) {
  const first=String(course.nextSessionTime||'').slice(0,10),last=String(course.lastSessionTime||'').slice(0,10);
  if(!first||!last||!course.totalSessions)return [];
  return packages.filter(pkg=>pkg.status==='ACTIVE' && pkg.startDate<=today && pkg.endDate>=today && pkg.startDate<=first && pkg.endDate>=last)
    .flatMap(pkg=>(pkg.benefits||[]).filter(benefit=>Number(benefit.subjectId)===Number(course.subjectId) && Number(benefit.remainingSessions)>=Number(course.totalSessions) && (!benefit.roomIds?.length || benefit.roomIds.map(Number).includes(Number(course.roomId))))
      .map(benefit=>({membershipId:pkg.membershipId,packageName:pkg.packageName,remainingSessions:benefit.remainingSessions})));
}

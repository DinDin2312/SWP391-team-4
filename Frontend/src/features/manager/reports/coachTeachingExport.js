import { formatDate } from '../../../utils/displayFormat';

const escapeXml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export function generateCoachTeachingXml(reportData, from, to) {
  if (!reportData) return '';

  const coachStats = reportData.coachStats || [];
  const sessions = reportData.sessions || [];
  const overview = reportData.overview || {};

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#1E3A8A"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="KpiLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#334155"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="KpiVal">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#2563EB"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Cell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="CellDecimal">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="#,##0.0"/>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>

 <!-- SHEET 1: TỔNG HỢP CÔNG DẠY HLV -->
 <Worksheet ss:Name="Tong_hop_HLV">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="50"/>
   <Column ss:Width="160"/>
   <Column ss:Width="180"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>

   <Row ss:Height="28">
    <Cell ss:MergeAcross="12" ss:StyleID="Title"><Data ss:Type="String">BÁO CÁO THỐNG KÊ LỚP DẠY CỦA HUẤN LUYỆN VIÊN</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="12" ss:StyleID="SubTitle"><Data ss:Type="String">Kỳ báo cáo: Từ ${escapeXml(formatDate(from))} đến ${escapeXml(formatDate(to))} | Xuất ngày: ${escapeXml(new Date().toLocaleString('vi-VN'))}</Data></Cell>
   </Row>
   <Row/>

   <!-- Summary KPI Block -->
   <Row>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Tổng số HLV:</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${overview.totalCoaches || 0}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Tổng ca hoàn thành:</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${overview.completedSessions || 0}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Tổng giờ đã dạy:</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${overview.totalTeachingHours || 0}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Số ca dạy thay:</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${overview.substituteSessions || 0}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Lấp đầy TB:</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="String">${overview.avgOccupancyRate || 0}%</Data></Cell>
   </Row>
   <Row/>

   <!-- Table Headers -->
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mã HLV</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Huấn luyện viên</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Email</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ca hoàn thành</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ca sắp tới</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ca bị hủy</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tổng số ca</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Giờ dạy (h)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ca đi dạy thay</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ca nhờ dạy thay</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Lượt học viên</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">HV duy nhất</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Lấp đầy TB (%)</Data></Cell>
   </Row>

   <!-- Rows -->
   ${coachStats.map(stat => `
   <Row>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${stat.coachId}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(stat.coachName)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(stat.coachEmail)}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.completedSessions || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.scheduledSessions || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.cancelledSessions || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.totalSessions || 0}</Data></Cell>
    <Cell ss:StyleID="CellDecimal"><Data ss:Type="Number">${stat.totalHours || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.substituteSessionsCount || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.transferredSessionsCount || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.totalStudents || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${stat.uniqueStudents || 0}</Data></Cell>
    <Cell ss:StyleID="CellDecimal"><Data ss:Type="Number">${stat.avgOccupancyRate || 0}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 2: CHI TIẾT CÁC CA DẠY -->
 <Worksheet ss:Name="Chi_tiet_ca_day">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="50"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="180"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="190"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>

   <Row ss:Height="28">
    <Cell ss:MergeAcross="13" ss:StyleID="Title"><Data ss:Type="String">DANH SÁCH CHI TIẾT CÁC CA DẠY</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="13" ss:StyleID="SubTitle"><Data ss:Type="String">Kỳ báo cáo: Từ ${escapeXml(formatDate(from))} đến ${escapeXml(formatDate(to))}</Data></Cell>
   </Row>
   <Row/>

   <!-- Table Headers -->
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mã ca</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ngày học</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Khung giờ</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Lớp học</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Bộ môn</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Phòng học</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">HLV thực tế</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Hình thức</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ghi chú dạy thay</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Thời lượng (h)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Số HV đăng ký</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Sức chứa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tỷ lệ lấp đầy (%)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Trạng thái</Data></Cell>
   </Row>

   <!-- Rows -->
   ${sessions.map(s => {
     const startTimeStr = s.startTime ? s.startTime.replace('T', ' ').slice(0, 16) : '';
     const timeStr = s.startTime && s.endTime ? `${s.startTime.slice(11, 16)} - ${s.endTime.slice(11, 16)}` : '';
     const dateStr = startTimeStr ? startTimeStr.slice(0, 10) : '';
     const roleText = s.isSubstitute ? 'Dạy thay' : s.isTransferred ? 'Chuyển giao' : 'Chính thức';

     return `
   <Row>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${s.scheduleId}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(timeStr)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(s.className)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(s.subjectName || '—')}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(s.roomName || '—')}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(s.actualCoachName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(roleText)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(s.substituteNote || '—')}</Data></Cell>
    <Cell ss:StyleID="CellDecimal"><Data ss:Type="Number">${s.durationHours || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${s.bookedStudents || 0}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${s.maxSlots || 0}</Data></Cell>
    <Cell ss:StyleID="CellDecimal"><Data ss:Type="Number">${s.occupancyRate || 0}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(s.status || '')}</Data></Cell>
   </Row>`;
   }).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

export function exportCoachTeachingToExcel(reportData, from, to) {
  if (!reportData) return;
  const xml = generateCoachTeachingXml(reportData, from, to);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bao-cao-lop-day-HLV-${from}-${to}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

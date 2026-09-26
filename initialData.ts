import { 
  MonthlyHistoryRecord, 
  WeeklyHistoryRecord, 
  DailyDCBGRecord, 
  DailyDCRORecord, 
  ThresholdConfig, 
  User,
  UnitExecutiveSummary,
  WeeklyDCBGRecord,
  MonthlyNSLDDCBGRecord,
  DailyNSLDRMARecord,
  ExcelMatrixROColumn,
  ExcelMatrixBGColumn,
  Slide1NSLDData,
  Slide2QualityData,
  QualityDailyRecord,
  SlideDefectCostData,
  DamagedItemRecord,
  DefectCostBarItem,
  Slide4ProductionTargetData,
  Slide5ProductionPlanData,
  Slide6TaskPlanData
} from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Ngô Minh Nhật',
    role: 'manager_pxlr',
    roleTitle: 'Quản Đốc Phân Xưởng',
    department: 'Ban Quản Đốc PXLR - NMBD',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'usr-2',
    name: 'Nguyễn Quốc Thịnh',
    role: 'supervisor_dcbg',
    roleTitle: 'Tổ Trưởng DC Bếp Gas (DCBG)',
    department: 'Tổ Lắp Ráp Bếp Gas',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'usr-3',
    name: 'Nguyễn Minh Hoàng Khiêm',
    role: 'supervisor_dcro',
    roleTitle: 'Tổ Trưởng DC Lắp Ráp (DCLR)',
    department: 'Tổ Lắp Ráp DCLR (Máy Lọc Nước RO)',
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'usr-4',
    name: 'Nguyễn Thị Huỳnh Như',
    role: 'planner',
    roleTitle: 'Trợ Lý Phân Xưởng Lắp Ráp',
    department: 'Bộ Phận Trợ Lý & Điều Độ PXLR',
    avatarColor: 'bg-amber-600',
  },
];

export const MONTHLY_HISTORY: MonthlyHistoryRecord[] = [
  { month: 'Tháng 1', monthNum: 1, nsld2025: 96.18, nsld2026: 90.14, cong2025: 1473, cong2026: 1791, tiLeDiLam: 93.0, sanLuong2025: 12794, sanLuong2026: 14577, hangHong: 7819247, nsld: 90.14 },
  { month: 'Tháng 2', monthNum: 2, nsld2025: 94.56, nsld2026: 96.69, cong2025: 1686, cong2026: 1277, tiLeDiLam: 95.0, sanLuong2025: 13236, sanLuong2026: 11151, hangHong: 7064628, nsld: 96.69 },
  { month: 'Tháng 3', monthNum: 3, nsld2025: 91.99, nsld2026: 93.95, cong2025: 2198, cong2026: 2771, tiLeDiLam: 94.0, sanLuong2025: 18254, sanLuong2026: 23503, hangHong: 28391248, nsld: 93.95 },
  { month: 'Tháng 4', monthNum: 4, nsld2025: 109.89, nsld2026: 94.41, cong2025: 1936, cong2026: 2417, tiLeDiLam: 92.0, sanLuong2025: 19206, sanLuong2026: 20601, hangHong: 17490855, nsld: 94.41 },
  { month: 'Tháng 5', monthNum: 5, nsld2025: 98.61, nsld2026: 108.40, cong2025: 1491, cong2026: 2498, tiLeDiLam: 94.8, sanLuong2025: 13274, sanLuong2026: 24456, hangHong: 10099929, nsld: 108.40 },
  { month: 'Tháng 6', monthNum: 6, nsld2025: 96.20, nsld2026: 132.00, cong2025: 1700, cong2026: 2189, tiLeDiLam: 0.0, sanLuong2025: 20850, sanLuong2026: 21891, hangHong: 7517080, nsld: 132.00 },
  { month: 'Tháng 7', monthNum: 7, nsld2025: 103.04, nsld2026: 116.00, cong2025: 2224, cong2026: 558, tiLeDiLam: 0.0, sanLuong2025: 20698, sanLuong2026: 22400, hangHong: 8120000, nsld: 116.00 },
  { month: 'Tháng 8', monthNum: 8, nsld2025: 110.15, nsld2026: 132.00, cong2025: 1178, cong2026: 1260, tiLeDiLam: 0.0, sanLuong2025: 11718, sanLuong2026: 15000, hangHong: 6500000, nsld: 132.00 },
  { month: 'Tháng 9', monthNum: 9, nsld2025: 100.07, nsld2026: 117.00, cong2025: 1608, cong2026: 1431.6, tiLeDiLam: 97.7, sanLuong2025: 14534, sanLuong2026: 16680.1, hangHong: 5200000, nsld: 117.00 },
  { month: 'Tháng 10', monthNum: 10, nsld2025: 108.26, nsld2026: 132.00, cong2025: 1657, cong2026: 1260, tiLeDiLam: 0.0, sanLuong2025: 16194, sanLuong2026: 15000, hangHong: 6800000, nsld: 132.00 },
  { month: 'Tháng 11', monthNum: 11, nsld2025: 106.80, nsld2026: 132.00, cong2025: 1362, cong2026: 1260, tiLeDiLam: 0.0, sanLuong2025: 13130, sanLuong2026: 15000, hangHong: 5900000, nsld: 132.00 },
  { month: 'Tháng 12', monthNum: 12, nsld2025: 96.63, nsld2026: 132.00, cong2025: 1342, cong2026: 1260, tiLeDiLam: 0.0, sanLuong2025: 11713, sanLuong2026: 15000, hangHong: 5800000, nsld: 132.00 },
];


export const WEEKLY_HISTORY: WeeklyHistoryRecord[] = [
  { week: 'W21', weekNum: 21, tiLeDiLam: 93.8, hangHong: 2850000, tiLeLoiThaoTac: 1.4 },
  { week: 'W22', weekNum: 22, tiLeDiLam: 94.2, hangHong: 2410000, tiLeLoiThaoTac: 1.2 },
  { week: 'W23', weekNum: 23, tiLeDiLam: 94.2, hangHong: 3379354, tiLeLoiThaoTac: 1.5 },
  { week: 'W24', weekNum: 24, tiLeDiLam: 95.5, hangHong: 1705771, tiLeLoiThaoTac: 0.9 },
  { week: 'W25', weekNum: 25, tiLeDiLam: 93.8, hangHong: 2431955, tiLeLoiThaoTac: 1.1 },
  { week: 'W26', weekNum: 26, tiLeDiLam: 95.0, hangHong: 1920400, tiLeLoiThaoTac: 0.8 },
  { week: 'W27', weekNum: 27, tiLeDiLam: 96.1, hangHong: 1540000, tiLeLoiThaoTac: 0.7 },
  { week: 'W28', weekNum: 28, tiLeDiLam: 94.5, hangHong: 1890000, tiLeLoiThaoTac: 0.85 },
];

// Today's date default
const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_DCBG_RECORDS: DailyDCBGRecord[] = [];

export const INITIAL_DCRO_RECORDS: DailyDCRORecord[] = [];

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  minAttendanceRate: 95.0,      // % (Mục tiêu chuẩn theo Executive Summary: 95%)
  minProductivityRate: 100.0,    // % (BG/RMA: 100%, RO/PXLR: 120%)
  maxDefectCostPerDay: 1160000, // VNĐ/ngày (~7,000,000 VNĐ/tuần của PXLR)
  maxErrorRate: 7.38,           // % (Định mức tối đa PXLR: 7.38%, RO: 5.20%, BG: 7.74%)
  enableBrowserPush: true,
  autoExportPdfAtEndOfDay: true,
  autoExportTime: '17:30',
};

export const EXECUTIVE_SUMMARY_W37: UnitExecutiveSummary[] = [
  {
    id: 'exec-pxlr-w37',
    unitKey: 'PXLR',
    unitName: 'PXLR Toàn Xưởng (W37)',
    khsxLabel: 'SP',
    completionRate: 100.0,
    completionNote: 'Đạt 100% KHSX RO',
    nsldActual: 120.0,
    nsldTarget: 120.0,
    nsldDeltaNote: 'Đạt mục tiêu 120%',
    attendanceActual: 98.0,
    attendanceTarget: 95.0,
    errorRateActual: 4.97,
    errorRateQuota: 7.38,
    defectCostActual: 6649922,
    defectCostTarget: 7000000,
    actionItem: 'Toàn xưởng kiểm soát tốt NSLĐ (120%) và hư hỏng (6.65M / 7M). Cần tập trung hỗ trợ BG hạ lỗi thao tác.',
  },
  {
    id: 'exec-ro-w37',
    unitKey: 'RO',
    unitName: 'Line Máy Lọc Nước RO (W37)',
    khsxLabel: 'SP',
    completionRate: 99.6,
    completionNote: 'Đạt 99.6% KHSX RO',
    nsldActual: 125.0,
    nsldTarget: 120.0,
    nsldDeltaNote: 'Vượt mục tiêu 120%',
    attendanceActual: 98.0,
    attendanceTarget: 95.0,
    errorRateActual: 3.2,
    errorRateQuota: 5.2,
    defectCostActual: 3427997,
    defectCostTarget: 5000000,
    actionItem: 'NSLĐ vượt trội 125%, tỷ lệ lỗi 3.2% thấp hơn định mức 5.2%, hư hỏng 3.4M thấp hơn mục tiêu 5M.',
  },
  {
    id: 'exec-bg-w37',
    unitKey: 'BG',
    unitName: 'Line DC Bếp Gas (W37)',
    khsxLabel: 'SP',
    completionRate: 100.0,
    completionNote: 'Đạt 100% KHSX BG',
    nsldActual: 108.0,
    nsldTarget: 100.0,
    nsldDeltaNote: '↑ 8% so với mục tiêu 100%',
    attendanceActual: 98.0,
    attendanceTarget: 95.0,
    errorRateActual: 10.10,
    errorRateQuota: 7.74, // Vượt định mức!
    defectCostActual: 3221924,
    defectCostTarget: 2000000, // Vượt mục tiêu!
    actionItem: 'CẢNH BÁO ĐỎ: Tỉ lệ lỗi 10.10% (vượt định mức 7.74%), Hư hỏng 3.22M (vượt mức tiêu 2M). Cần rà soát công đoạn lắp ráp mâm chia lửa và van điều áp.',
  },
  {
    id: 'exec-rma-w37',
    unitKey: 'RMA',
    unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W37)',
    khsxLabel: 'SP',
    completionRate: 210.0,
    completionNote: 'Đạt 210% KHSX Trả nợ Tháng 7',
    nsldActual: 88.16,
    nsldTarget: 100.0,
    nsldDeltaNote: '↓ 12% so với mục tiêu 100%',
    attendanceActual: 98.0,
    attendanceTarget: 95.0,
    bomNote: 'Không phát sinh linh kiện ngoài BOM',
    actionItem: 'Sản lượng trả nợ vượt 210%, tuy nhiên NSLĐ hụt 11.84% so với mục tiêu 100%. Duy trì quản lý chặt không phát sinh linh kiện ngoài BOM.',
  },
];

// Exact Weekly data for DCBG from User Excel Images 3 & 4
export const INITIAL_WEEKLY_DCBG: WeeklyDCBGRecord[] = [
  { tuan: 'W23', nsldTuan: 79.06, tongCongTuan: 30.60, tongSanLuongQuyDoiTuan: 219.01, tiLeDiLamTuan: 100.0 },
  { tuan: 'W24', nsldTuan: 82.92, tongCongTuan: 90.08, tongSanLuongQuyDoiTuan: 664.00, tiLeDiLamTuan: 96.0 },
  { tuan: 'W25', nsldTuan: 93.87, tongCongTuan: 74.45, tongSanLuongQuyDoiTuan: 624.53, tiLeDiLamTuan: 86.0 },
  { tuan: 'W26', nsldTuan: 66.00, tongCongTuan: 48.05, tongSanLuongQuyDoiTuan: 296.02, tiLeDiLamTuan: 91.0 },
  { tuan: 'W27', nsldTuan: 101.14, tongCongTuan: 31.65, tongSanLuongQuyDoiTuan: 289.00, tiLeDiLamTuan: 90.0 },
];

// Exact %NSLĐ THÁNG for DCBG from User Excel Images 3 & 4
export const INITIAL_MONTHLY_NSLD_DCBG: MonthlyNSLDDCBGRecord[] = [
  { thang: 'Tháng 5', nsld: 61.8 },
  { thang: 'Tháng 6', nsld: 84.3 },
  { thang: 'Tháng 7', nsld: 100.0 },
  { thang: 'Tháng 8', nsld: 103.0 },
  { thang: 'Tháng 9', nsld: 105.0 },
  { thang: 'Tháng 10', nsld: 107.0 },
  { thang: 'Tháng 11', nsld: 109.0 },
  { thang: 'Tháng 12', nsld: 110.0 },
];

// Exact % NSLĐ NGÀY BẾP GA - RMA from User Excel Image 4
export const INITIAL_DAILY_NSLD_RMA: DailyNSLDRMARecord[] = [
  { date: '26-Jun', nsld: 102.1 },
  { date: '27-Jun', nsld: 100.0 },
  { date: '29-Jun', nsld: 101.6 },
  { date: '30-Jun', nsld: 107.7 },
];

// Exact RO Daily Matrix Data (Tháng 6) from User Excel Image 1
export const INITIAL_MATRIX_RO: ExcelMatrixROColumn[] = [
  { id: 'ro-01', label: '01-Jun', congChinhThuc: 56.8, congThoiVu: 17.3, sanLuongLineChinh: 817, dinhMucSlTheoNs: 669.123, nsldTheoNgay: 122.1, khsxNgay: 697.5, tiLeHoanThanhKhsx: 117.1, tongNhanSuLine: 55, nhanSuNghi: 7, tiLeDiLam: 87.3 },
  { id: 'ro-02', label: '02-Jun', congChinhThuc: 57.3, congThoiVu: 17.8, sanLuongLineChinh: 748, dinhMucSlTheoNs: 678.153, nsldTheoNgay: 110.3, khsxNgay: 708.0, tiLeHoanThanhKhsx: 105.6, tongNhanSuLine: 55, nhanSuNghi: 3, tiLeDiLam: 94.5 },
  { id: 'ro-03', label: '03-Jun', congChinhThuc: 59.3, congThoiVu: 19.0, sanLuongLineChinh: 741, dinhMucSlTheoNs: 707.049, nsldTheoNgay: 104.8, khsxNgay: 672.0, tiLeHoanThanhKhsx: 110.3, tongNhanSuLine: 58, nhanSuNghi: 6, tiLeDiLam: 89.7 },
  { id: 'ro-04', label: '04-Jun', congChinhThuc: 60.6, congThoiVu: 16.5, sanLuongLineChinh: 419, dinhMucSlTheoNs: 696.213, nsldTheoNgay: 60.2, khsxNgay: 582.0, tiLeHoanThanhKhsx: 72.0, tongNhanSuLine: 56, nhanSuNghi: 3, tiLeDiLam: 94.6 },
  { id: 'ro-w22', label: 'W22/T6', isWeeklyTotal: true, congChinhThuc: 234.0, congThoiVu: 70.6, sanLuongLineChinh: 2725, dinhMucSlTheoNs: 2750.538, nsldTheoNgay: 99.1, khsxNgay: 2660, tiLeHoanThanhKhsx: 102.5, tongNhanSuLine: 224, nhanSuNghi: 19, tiLeDiLam: 91.5 },
  { id: 'ro-05', label: '05-Jun', congChinhThuc: 52.0, congThoiVu: 16.0, sanLuongLineChinh: 701, dinhMucSlTheoNs: 614.04, nsldTheoNgay: 114.2, khsxNgay: 603.0, tiLeHoanThanhKhsx: 116.3, tongNhanSuLine: 55, nhanSuNghi: 2, tiLeDiLam: 96.4 },
  { id: 'ro-06', label: '06-Jun', congChinhThuc: 54.0, congThoiVu: 16.0, sanLuongLineChinh: 657, dinhMucSlTheoNs: 632.1, nsldTheoNgay: 103.9, khsxNgay: 594.0, tiLeHoanThanhKhsx: 110.6, tongNhanSuLine: 55, nhanSuNghi: 1, tiLeDiLam: 98.2 },
  { id: 'ro-08', label: '08-Jun', congChinhThuc: 53.0, congThoiVu: 15.0, sanLuongLineChinh: 868, dinhMucSlTheoNs: 614.04, nsldTheoNgay: 141.4, khsxNgay: 744.0, tiLeHoanThanhKhsx: 116.7, tongNhanSuLine: 55, nhanSuNghi: 4, tiLeDiLam: 92.7 },
  { id: 'ro-09', label: '09-Jun', congChinhThuc: 54.0, congThoiVu: 16.0, sanLuongLineChinh: 820, dinhMucSlTheoNs: 632.1, nsldTheoNgay: 129.7, khsxNgay: 744.0, tiLeHoanThanhKhsx: 110.2, tongNhanSuLine: 55, nhanSuNghi: 2, tiLeDiLam: 96.4 },
  { id: 'ro-10', label: '10-Jun', congChinhThuc: 56.5, congThoiVu: 13.5, sanLuongLineChinh: 636, dinhMucSlTheoNs: 632.1, nsldTheoNgay: 100.6, khsxNgay: 744.0, tiLeHoanThanhKhsx: 85.5, tongNhanSuLine: 55, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'ro-11', label: '11-Jun', congChinhThuc: 56.6, congThoiVu: 13.0, sanLuongLineChinh: 748, dinhMucSlTheoNs: 628.488, nsldTheoNgay: 119.0, khsxNgay: 744.0, tiLeHoanThanhKhsx: 100.5, tongNhanSuLine: 55, nhanSuNghi: 3, tiLeDiLam: 94.5 },
  { id: 'ro-w23', label: 'W23/T6', isWeeklyTotal: true, congChinhThuc: 326.1, congThoiVu: 89.5, sanLuongLineChinh: 4430, dinhMucSlTheoNs: 3752.87, nsldTheoNgay: 118.0, khsxNgay: 4173, tiLeHoanThanhKhsx: 106.2, tongNhanSuLine: 330, nhanSuNghi: 12, tiLeDiLam: 96.4 },
  { id: 'ro-12', label: '12-Jun', congChinhThuc: 53.0, congThoiVu: 16.0, sanLuongLineChinh: 572, dinhMucSlTheoNs: 623.07, nsldTheoNgay: 91.8, khsxNgay: 738.0, tiLeHoanThanhKhsx: 77.5, tongNhanSuLine: 54, nhanSuNghi: 3, tiLeDiLam: 94.4 },
  { id: 'ro-13', label: '13-Jun', congChinhThuc: 53.0, congThoiVu: 14.0, sanLuongLineChinh: 697, dinhMucSlTheoNs: 605.01, nsldTheoNgay: 115.2, khsxNgay: 760.0, tiLeHoanThanhKhsx: 91.7, tongNhanSuLine: 55, nhanSuNghi: 2, tiLeDiLam: 96.4 },
  { id: 'ro-14', label: '14-Jun', congChinhThuc: 52.0, congThoiVu: 15.0, sanLuongLineChinh: 680, dinhMucSlTheoNs: 605.01, nsldTheoNgay: 112.4, khsxNgay: 650.0, tiLeHoanThanhKhsx: 104.6, tongNhanSuLine: 55, nhanSuNghi: 2, tiLeDiLam: 96.4 },
];

// Exact BG Daily Matrix Data (Tháng 6) from User Excel Image 2
export const INITIAL_MATRIX_BG: ExcelMatrixBGColumn[] = [
  { id: 'bg-01', label: '01-Jun', congBepGa: 4.1, congThoiVu: 3.0, congRma: 0, sanLuongBepGa: 47, sanLuongRma: 0, dinhMucSlTheoNs: 64.113, nsldTheoNgay: 73.3, khsxNgay: 720, tiLeHoanThanhKhsx: 100.0, tongNhanSuLine: 7, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-03', label: '03-Jun', congBepGa: 7.0, congThoiVu: 4.0, congRma: 0, sanLuongBepGa: 95, sanLuongRma: 0, dinhMucSlTheoNs: 99.33, nsldTheoNgay: 95.6, khsxNgay: 740, tiLeHoanThanhKhsx: 98.6, tongNhanSuLine: 6, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-04', label: '04-Jun', congBepGa: 5.5, congThoiVu: 7.0, congRma: 0, sanLuongBepGa: 77, sanLuongRma: 0, dinhMucSlTheoNs: 112.875, nsldTheoNgay: 68.2, khsxNgay: 760, tiLeHoanThanhKhsx: 99.3, tongNhanSuLine: 6, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-w1', label: 'W1', isWeeklyTotal: true, congBepGa: 16.6, congThoiVu: 14.0, congRma: 0, sanLuongBepGa: 219, sanLuongRma: 0, dinhMucSlTheoNs: 276.318, nsldTheoNgay: 79.1, khsxNgay: 2220, tiLeHoanThanhKhsx: 99.3, tongNhanSuLine: 19, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-05', label: '05-Jun', congBepGa: 7.5, congThoiVu: 8.8, congRma: 3.0, sanLuongBepGa: 111, sanLuongRma: 0, dinhMucSlTheoNs: 174.279, nsldTheoNgay: 63.7, khsxNgay: 780, tiLeHoanThanhKhsx: 100.0, tongNhanSuLine: 6, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-06', label: '06-Jun', congBepGa: 6.0, congThoiVu: 7.0, congRma: 3.0, sanLuongBepGa: 92, sanLuongRma: 0, dinhMucSlTheoNs: 144.48, nsldTheoNgay: 63.7, khsxNgay: 700, tiLeHoanThanhKhsx: 115.0, tongNhanSuLine: 6, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-07', label: '07-Jun', congBepGa: 4.5, congThoiVu: 3.5, congRma: 0, sanLuongBepGa: 63, sanLuongRma: 0, dinhMucSlTheoNs: 72.24, nsldTheoNgay: 87.2, khsxNgay: 720, tiLeHoanThanhKhsx: 115.3, tongNhanSuLine: 8, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-08', label: '08-Jun', congBepGa: 3.4, congThoiVu: 2.5, congRma: 9.375, sanLuongBepGa: 38, sanLuongRma: 90, dinhMucSlTheoNs: 137.933, nsldTheoNgay: 92.8, khsxNgay: 740, tiLeHoanThanhKhsx: 91.9, tongNhanSuLine: 8, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-09', label: '09-Jun', congBepGa: 9.1, congThoiVu: 5.0, congRma: 0, sanLuongBepGa: 126, sanLuongRma: 0, dinhMucSlTheoNs: 127.323, nsldTheoNgay: 99.0, khsxNgay: 760, tiLeHoanThanhKhsx: 92.8, tongNhanSuLine: 8, nhanSuNghi: 1, tiLeDiLam: 88.0 },
  { id: 'bg-10', label: '10-Jun', congBepGa: 3.0, congThoiVu: 4.0, congRma: 4.5, sanLuongBepGa: 81, sanLuongRma: 0, dinhMucSlTheoNs: 103.845, nsldTheoNgay: 78.0, khsxNgay: 780, tiLeHoanThanhKhsx: 93.6, tongNhanSuLine: 8, nhanSuNghi: 1, tiLeDiLam: 88.0 },
  { id: 'bg-11', label: '11-Jun', congBepGa: 2.9, congThoiVu: 2.5, congRma: 8.5, sanLuongBepGa: 126, sanLuongRma: 0, dinhMucSlTheoNs: 125.517, nsldTheoNgay: 100.0, khsxNgay: 700, tiLeHoanThanhKhsx: 107.9, tongNhanSuLine: 8, nhanSuNghi: 0, tiLeDiLam: 100.0 },
  { id: 'bg-w2', label: 'W2', isWeeklyTotal: true, congBepGa: 31.9, congThoiVu: 29.8, congRma: 28.375, sanLuongBepGa: 574, sanLuongRma: 90, dinhMucSlTheoNs: 813.377, nsldTheoNgay: 82.9, khsxNgay: 5180, tiLeHoanThanhKhsx: 101.4, tongNhanSuLine: 44, nhanSuNghi: 2, tiLeDiLam: 96.0 },
  { id: 'bg-12', label: '12-Jun', congBepGa: 4.0, congThoiVu: 3.0, congRma: 8.0, sanLuongBepGa: 56, sanLuongRma: 42, dinhMucSlTheoNs: 135.45, nsldTheoNgay: 72.4, khsxNgay: 720, tiLeHoanThanhKhsx: 98.5, tongNhanSuLine: 10, nhanSuNghi: 1, tiLeDiLam: 90.0 },
  { id: 'bg-13', label: '13-Jun', congBepGa: 3.5, congThoiVu: 2.5, congRma: 7.0, sanLuongBepGa: 64, sanLuongRma: 54, dinhMucSlTheoNs: 117.39, nsldTheoNgay: 100.5, khsxNgay: 740, tiLeHoanThanhKhsx: 101.2, tongNhanSuLine: 10, nhanSuNghi: 1, tiLeDiLam: 90.0 },
  { id: 'bg-14', label: '14-Jun', congBepGa: 4.0, congThoiVu: 3.0, congRma: 0, sanLuongBepGa: 56, sanLuongRma: 0, dinhMucSlTheoNs: 63.21, nsldTheoNgay: 88.6, khsxNgay: 760, tiLeHoanThanhKhsx: 99.0, tongNhanSuLine: 10, nhanSuNghi: 1, tiLeDiLam: 90.0 },
  { id: 'bg-15', label: '15-Jun', congBepGa: 1.3, congThoiVu: 6.25, congRma: 1.5, sanLuongBepGa: 22, sanLuongRma: 61, dinhMucSlTheoNs: 81.7215, nsldTheoNgay: 101.6, khsxNgay: 780, tiLeHoanThanhKhsx: 102.5, tongNhanSuLine: 10, nhanSuNghi: 2, tiLeDiLam: 80.0 },
  { id: 'bg-16', label: '16-Jun', congBepGa: 1.8, congThoiVu: 2.8, congRma: 9.75, sanLuongBepGa: 45, sanLuongRma: 85, dinhMucSlTheoNs: 129.58, nsldTheoNgay: 100.0, khsxNgay: 700, tiLeHoanThanhKhsx: 100.0, tongNhanSuLine: 10, nhanSuNghi: 1, tiLeDiLam: 90.0 },
  { id: 'bg-17', label: '17-Jun', congBepGa: 1.5, congThoiVu: 2.3, congRma: 7.25, sanLuongBepGa: 45, sanLuongRma: 55, dinhMucSlTheoNs: 99.7815, nsldTheoNgay: 100.2, khsxNgay: 720, tiLeHoanThanhKhsx: 101.5, tongNhanSuLine: 11, nhanSuNghi: 2, tiLeDiLam: 82.0 },
  { id: 'bg-18', label: '18-Jun', congBepGa: 2.5, congThoiVu: 3.0, congRma: 6.5, sanLuongBepGa: 48, sanLuongRma: 48, dinhMucSlTheoNs: 108.36, nsldTheoNgay: 88.6, khsxNgay: 740, tiLeHoanThanhKhsx: 98.0, tongNhanSuLine: 11, nhanSuNghi: 2, tiLeDiLam: 82.0 },
  { id: 'bg-w3', label: 'W3', isWeeklyTotal: true, congBepGa: 14.6, congThoiVu: 19.85, congRma: 40.0, sanLuongBepGa: 280.3, sanLuongRma: 344, dinhMucSlTheoNs: 672.284, nsldTheoNgay: 93.9, khsxNgay: 5160, tiLeHoanThanhKhsx: 100.1, tongNhanSuLine: 62, nhanSuNghi: 9, tiLeDiLam: 86.0 },
];

// Exact Data from PowerPoint Slide 1: "2 Năng Suất" - Báo Cáo Sản Xuất DCLR
// Dữ liệu cũ (Tháng 8 trở về trước & Tuần 35) được bảo lưu nguyên vẹn 100%.
// Dữ liệu mới (Tháng 9 và các tuần Tháng 9) khởi tạo bằng 0 và chạy tự động từ báo cáo nhập liệu.
export const INITIAL_SLIDE1_NSLD: Slide1NSLDData = {
  title: 'BÁO CÁO SẢN XUẤT DCLR',
  subTitle: 'Năng Suất',
  pxlr: {
    weekly: [
      { id: 'pxlr-w32', label: 'Tuần 32', value: 122.1 },
      { id: 'pxlr-w33', label: 'Tuần 33', value: 118.5 },
      { id: 'pxlr-w34', label: 'Tuần 34', value: 125.0 },
      { id: 'pxlr-w35', label: 'Tuần 35', value: 100.8 },
      { id: 'pxlr-w36', label: 'Tuần 36', value: 114.2 },
      { id: 'pxlr-w37', label: 'Tuần 37', value: 113.8 },
      { id: 'pxlr-w38', label: 'Tuần 38', value: 117.7 },
      { id: 'pxlr-w39', label: 'Tuần 39', value: 113.5 },
      { id: 'pxlr-w40', label: 'Tuần 40', value: 114.0 },
    ],
    monthly: [
      { id: 'pxlr-m06', label: 'Tháng 6', value: 131.6 },
      { id: 'pxlr-m07', label: 'Tháng 7', value: 135.5 },
      { id: 'pxlr-m08', label: 'Tháng 8', value: 133.6 },
      { id: 'pxlr-m09', label: 'Tháng 9', value: 117.0 },
    ],
  },
  ro: {
    weekly: [
      { id: 'ro-w32', label: 'Tuần 32', value: 115.2 },
      { id: 'ro-w33', label: 'Tuần 33', value: 110.0 },
      { id: 'ro-w34', label: 'Tuần 34', value: 118.4 },
      { id: 'ro-w35', label: 'Tuần 35', value: 104.2 },
      { id: 'ro-w36', label: 'Tuần 36', value: 114.7 },
      { id: 'ro-w37', label: 'Tuần 37', value: 115.5 },
      { id: 'ro-w38', label: 'Tuần 38', value: 118.2 },
      { id: 'ro-w39', label: 'Tuần 39', value: 115.5 },
      { id: 'ro-w40', label: 'Tuần 40', value: 116.0 },
    ],
    monthly: [
      { id: 'ro-m07', label: 'Tháng 7', value: 117.1 },
      { id: 'ro-m08', label: 'Tháng 8', value: 111.2 },
      { id: 'ro-m09', label: 'Tháng 9', value: 117.0 },
    ],
  },
  bg: {
    weekly: [
      { id: 'bg-w32', label: 'Tuần 32', value: 95.5 },
      { id: 'bg-w33', label: 'Tuần 33', value: 102.1 },
      { id: 'bg-w34', label: 'Tuần 34', value: 108.0 },
      { id: 'bg-w35', label: 'Tuần 35', value: 111.7 },
      { id: 'bg-w36', label: 'Tuần 36', value: 111.4 },
      { id: 'bg-w37', label: 'Tuần 37', value: 104.7 },
      { id: 'bg-w38', label: 'Tuần 38', value: 115.0 },
      { id: 'bg-w39', label: 'Tuần 39', value: 97.0 },
      { id: 'bg-w40', label: 'Tuần 40', value: 98.0 },
    ],
    monthly: [
      { id: 'bg-m07', label: 'Tháng 7', value: 87.1 },
      { id: 'bg-m08', label: 'Tháng 8', value: 108.2 },
      { id: 'bg-m09', label: 'Tháng 9', value: 97.0 },
    ],
  },
};

// Initial Daily Quality Records for Month 9 (Tháng 9 - từ 03/09 đến 17/09/2026 chốt W38)
export const INITIAL_QUALITY_DAILY_RECORDS: QualityDailyRecord[] = [
  {
    id: 'q-d-01',
    date: '2026-09-03',
    dayLabel: '03/09',
    week: 'W36',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.90, totalLoi4M: 2.90, sanLuong: 741 },
    bg: { dmVatTu: 4.03, vatTu: 0.00, totalLoi4M: 0.00, sanLuong: 0 },
    pxlr: { dmVatTu: 2.40, vatTu: 0.90, totalLoi4M: 2.90 },
  },
  {
    id: 'q-d-02',
    date: '2026-09-04',
    dayLabel: '04/09',
    week: 'W36',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.90, totalLoi4M: 2.60, sanLuong: 701 },
    bg: { dmVatTu: 4.03, vatTu: 3.75, totalLoi4M: 8.01, sanLuong: 111 },
    pxlr: { dmVatTu: 2.62, vatTu: 1.29, totalLoi4M: 3.34 },
  },
  {
    id: 'q-d-03',
    date: '2026-09-05',
    dayLabel: '05/09',
    week: 'W36',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 2.00, totalLoi4M: 3.00, sanLuong: 657 },
    bg: { dmVatTu: 4.03, vatTu: 0.00, totalLoi4M: 0.00, sanLuong: 0 },
    pxlr: { dmVatTu: 2.40, vatTu: 2.00, totalLoi4M: 3.00 },
  },
  {
    id: 'q-d-04',
    date: '2026-09-07',
    dayLabel: '07/09',
    week: 'W37',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.30, totalLoi4M: 3.10, sanLuong: 800 },
    bg: { dmVatTu: 4.03, vatTu: 1.60, totalLoi4M: 5.80, sanLuong: 60 },
    pxlr: { dmVatTu: 2.51, vatTu: 0.39, totalLoi4M: 3.29 },
  },
  {
    id: 'q-d-05',
    date: '2026-09-08',
    dayLabel: '08/09',
    week: 'W37',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 1.20, totalLoi4M: 3.50, sanLuong: 868 },
    bg: { dmVatTu: 4.03, vatTu: 1.43, totalLoi4M: 10.71, sanLuong: 63 },
    pxlr: { dmVatTu: 2.51, vatTu: 1.22, totalLoi4M: 3.99 },
  },
  {
    id: 'q-d-06',
    date: '2026-09-09',
    dayLabel: '09/09',
    week: 'W37',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.80, totalLoi4M: 3.30, sanLuong: 820 },
    bg: { dmVatTu: 4.03, vatTu: 3.61, totalLoi4M: 8.33, sanLuong: 38 },
    pxlr: { dmVatTu: 2.47, vatTu: 0.92, totalLoi4M: 3.52 },
  },
  {
    id: 'q-d-07',
    date: '2026-09-10',
    dayLabel: '10/09',
    week: 'W37',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.90, totalLoi4M: 2.10, sanLuong: 780 },
    bg: { dmVatTu: 4.03, vatTu: 1.39, totalLoi4M: 6.39, sanLuong: 72 },
    pxlr: { dmVatTu: 2.54, vatTu: 0.94, totalLoi4M: 2.46 },
  },
  {
    id: 'q-d-08',
    date: '2026-09-11',
    dayLabel: '11/09',
    week: 'W37',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 1.90, totalLoi4M: 3.50, sanLuong: 810 },
    bg: { dmVatTu: 4.03, vatTu: 2.78, totalLoi4M: 8.52, sanLuong: 54 },
    pxlr: { dmVatTu: 2.50, vatTu: 1.95, totalLoi4M: 3.81 },
  },
  {
    id: 'q-d-09',
    date: '2026-09-12',
    dayLabel: '12/09',
    week: 'W37',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.50, totalLoi4M: 1.80, sanLuong: 750 },
    bg: { dmVatTu: 4.03, vatTu: 0.00, totalLoi4M: 6.82, sanLuong: 44 },
    pxlr: { dmVatTu: 2.49, vatTu: 0.47, totalLoi4M: 2.08 },
  },
  {
    id: 'q-d-10',
    date: '2026-09-14',
    dayLabel: '14/09',
    week: 'W38',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.90, totalLoi4M: 2.20, sanLuong: 820 },
    bg: { dmVatTu: 4.03, vatTu: 0.00, totalLoi4M: 1.36, sanLuong: 74 },
    pxlr: { dmVatTu: 2.53, vatTu: 0.83, totalLoi4M: 2.13 },
  },
  {
    id: 'q-d-11',
    date: '2026-09-15',
    dayLabel: '15/09',
    week: 'W38',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.90, totalLoi4M: 3.30, sanLuong: 850 },
    bg: { dmVatTu: 4.03, vatTu: 6.19, totalLoi4M: 7.62, sanLuong: 50 },
    pxlr: { dmVatTu: 2.49, vatTu: 1.19, totalLoi4M: 3.54 },
  },
  {
    id: 'q-d-12',
    date: '2026-09-16',
    dayLabel: '16/09',
    week: 'W38',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 2.30, totalLoi4M: 4.10, sanLuong: 830 },
    bg: { dmVatTu: 4.03, vatTu: 0.30, totalLoi4M: 4.52, sanLuong: 45 },
    pxlr: { dmVatTu: 2.48, vatTu: 2.20, totalLoi4M: 4.12 },
  },
  {
    id: 'q-d-13',
    date: '2026-09-17',
    dayLabel: '17/09',
    week: 'W38',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 1.00, totalLoi4M: 5.40, sanLuong: 840 },
    bg: { dmVatTu: 4.03, vatTu: 3.53, totalLoi4M: 4.81, sanLuong: 48 },
    pxlr: { dmVatTu: 2.49, vatTu: 1.14, totalLoi4M: 5.37 },
  },
  {
    id: 'q-d-14',
    date: '2026-09-18',
    dayLabel: '18/09',
    week: 'W38',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 1.20, totalLoi4M: 4.20, sanLuong: 800 },
    bg: { dmVatTu: 4.03, vatTu: 2.10, totalLoi4M: 5.10, sanLuong: 50 },
    pxlr: { dmVatTu: 2.50, vatTu: 1.25, totalLoi4M: 4.25 },
  },
  {
    id: 'q-d-15',
    date: '2026-09-19',
    dayLabel: '19/09',
    week: 'W38',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.80, totalLoi4M: 3.80, sanLuong: 780 },
    bg: { dmVatTu: 4.03, vatTu: 1.50, totalLoi4M: 6.20, sanLuong: 40 },
    pxlr: { dmVatTu: 2.48, vatTu: 0.84, totalLoi4M: 3.92 },
  },
  {
    id: 'q-d-16',
    date: '2026-09-21',
    dayLabel: '21/09',
    week: 'W39',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.70, totalLoi4M: 2.50, sanLuong: 850 },
    bg: { dmVatTu: 4.03, vatTu: 1.20, totalLoi4M: 4.80, sanLuong: 55 },
    pxlr: { dmVatTu: 2.50, vatTu: 0.73, totalLoi4M: 2.64 },
  },
  {
    id: 'q-d-17',
    date: '2026-09-22',
    dayLabel: '22/09',
    week: 'W39',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 0.95, totalLoi4M: 3.10, sanLuong: 820 },
    bg: { dmVatTu: 4.03, vatTu: 2.40, totalLoi4M: 7.20, sanLuong: 52 },
    pxlr: { dmVatTu: 2.50, vatTu: 1.04, totalLoi4M: 3.35 },
  },
  {
    id: 'q-d-18',
    date: '2026-09-23',
    dayLabel: '23/09',
    week: 'W39',
    month: 'T9',
    ro: { dmVatTu: 2.4, vatTu: 1.05, totalLoi4M: 3.40, sanLuong: 830 },
    bg: { dmVatTu: 4.03, vatTu: 2.80, totalLoi4M: 8.10, sanLuong: 48 },
    pxlr: { dmVatTu: 2.49, vatTu: 1.15, totalLoi4M: 3.66 },
  },
];

// Exact Data from PowerPoint Slide 2: "3 Chất Lượng" - Báo Cáo Sản Xuất DCLR
export const INITIAL_SLIDE2_QUALITY: Slide2QualityData = {
  title: 'Chất Lượng',
  slideNumber: '3',
  headerBarText: 'Báo Cáo Sản Xuất DCLR',
  activeTimeFrame: 'day',
  autoRollup: true,
  dailyRecords: INITIAL_QUALITY_DAILY_RECORDS,
  pxlr: {
    title: 'TỶ LỆ LỖI PXLR',
    benchmarkDmLoi: 7.38,
    benchmarkLabel: 'ĐM % lỗi 4M',
    benchmarkColor: 'green',
    lineColor: 'blue',
    items: [
      { id: 'pxlr-q-t6', month: 'T6', dmVatTu: 3.69, vatTu: 1.59, totalLoi4M: 5.07 },
      { id: 'pxlr-q-t7', month: 'T7', dmVatTu: 3.69, vatTu: 1.48, totalLoi4M: 5.78 },
      { id: 'pxlr-q-t8', month: 'T8', dmVatTu: 3.69, vatTu: 1.61, totalLoi4M: 4.97 },
      { id: 'pxlr-q-t9', month: 'T9', dmVatTu: 3.69, vatTu: 1.34, totalLoi4M: 3.59 },
    ],
  },
  ro: {
    title: 'TỶ LỆ LỖI LINE RO',
    benchmarkDmLoi: 5.2,
    benchmarkLabel: '5.2%',
    benchmarkColor: 'purple',
    lineColor: 'red',
    items: [
      { id: 'ro-q-t6', month: 'T6', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.4 },
      { id: 'ro-q-t7', month: 'T7', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.8 },
      { id: 'ro-q-t8', month: 'T8', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.2 },
      { id: 'ro-q-t9', month: 'T9', dmVatTu: 2.4, vatTu: 1.1, totalLoi4M: 3.0 },
    ],
  },
  bg: {
    title: 'TỶ LỆ LỖI LINE BG',
    benchmarkDmLoi: 7.74,
    benchmarkLabel: 'ĐM % lỗi 4M',
    benchmarkColor: 'green',
    lineColor: 'blue',
    items: [
      { id: 'bg-q-t6', month: 'T6', dmVatTu: 4.03, vatTu: 3.13, totalLoi4M: 8.33 },
      { id: 'bg-q-t7', month: 'T7', dmVatTu: 4.03, vatTu: 2.32, totalLoi4M: 8.26 },
      { id: 'bg-q-t8', month: 'T8', dmVatTu: 4.03, vatTu: 3.97, totalLoi4M: 10.10 },
      { id: 'bg-q-t9', month: 'T9', dmVatTu: 4.03, vatTu: 2.69, totalLoi4M: 6.94 },
    ],
  },
  monthly: {
    pxlr: {
      title: 'TỶ LỆ LỖI PXLR (THEO THÁNG)',
      benchmarkDmLoi: 7.38,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: [
        { id: 'pxlr-q-t6', month: 'T6', dmVatTu: 3.69, vatTu: 1.59, totalLoi4M: 5.07 },
        { id: 'pxlr-q-t7', month: 'T7', dmVatTu: 3.69, vatTu: 1.48, totalLoi4M: 5.78 },
        { id: 'pxlr-q-t8', month: 'T8', dmVatTu: 3.69, vatTu: 1.61, totalLoi4M: 4.97 },
        { id: 'pxlr-q-t9', month: 'T9', dmVatTu: 3.69, vatTu: 1.34, totalLoi4M: 3.59 },
      ],
    },
    ro: {
      title: 'TỶ LỆ LỖI LINE RO (THEO THÁNG)',
      benchmarkDmLoi: 5.2,
      benchmarkLabel: '5.2%',
      benchmarkColor: 'purple',
      lineColor: 'red',
      items: [
        { id: 'ro-q-t6', month: 'T6', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.4 },
        { id: 'ro-q-t7', month: 'T7', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.8 },
        { id: 'ro-q-t8', month: 'T8', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.2 },
        { id: 'ro-q-t9', month: 'T9', dmVatTu: 2.4, vatTu: 1.1, totalLoi4M: 3.0 },
      ],
    },
    bg: {
      title: 'TỶ LỆ LỖI LINE BG (THEO THÁNG)',
      benchmarkDmLoi: 7.74,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: [
        { id: 'bg-q-t6', month: 'T6', dmVatTu: 4.03, vatTu: 3.13, totalLoi4M: 8.33 },
        { id: 'bg-q-t7', month: 'T7', dmVatTu: 4.03, vatTu: 2.32, totalLoi4M: 8.26 },
        { id: 'bg-q-t8', month: 'T8', dmVatTu: 4.03, vatTu: 3.97, totalLoi4M: 10.10 },
        { id: 'bg-q-t9', month: 'T9', dmVatTu: 4.03, vatTu: 2.69, totalLoi4M: 6.94 },
      ],
    },
  },
  weekly: {
    pxlr: {
      title: 'TỶ LỆ LỖI PXLR (THEO TUẦN)',
      benchmarkDmLoi: 7.38,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: [
        { id: 'pxlr-qw-32', month: 'Tuần 32', dmVatTu: 2.57, vatTu: 1.60, totalLoi4M: 4.00 },
        { id: 'pxlr-qw-33', month: 'Tuần 33', dmVatTu: 2.49, vatTu: 0.90, totalLoi4M: 2.70 },
        { id: 'pxlr-qw-34', month: 'Tuần 34', dmVatTu: 2.49, vatTu: 1.30, totalLoi4M: 3.40 },
        { id: 'pxlr-qw-35', month: 'Tuần 35', dmVatTu: 2.40, vatTu: 0.80, totalLoi4M: 3.50 },
        { id: 'pxlr-qw-36', month: 'Tuần 36', dmVatTu: 2.57, vatTu: 1.30, totalLoi4M: 2.80 },
        { id: 'pxlr-qw-37', month: 'Tuần 37', dmVatTu: 2.49, vatTu: 1.00, totalLoi4M: 3.60 },
        { id: 'pxlr-qw-38', month: 'Tuần 38', dmVatTu: 2.49, vatTu: 1.30, totalLoi4M: 3.90 },
        { id: 'pxlr-qw-39', month: 'Tuần 39', dmVatTu: 2.49, vatTu: 0.30, totalLoi4M: 3.50 },
      ],
    },
    ro: {
      title: 'TỶ LỆ LỖI LINE RO (THEO TUẦN)',
      benchmarkDmLoi: 5.2,
      benchmarkLabel: '5.2%',
      benchmarkColor: 'purple',
      lineColor: 'red',
      items: [
        { id: 'ro-qw-32', month: 'Tuần 32', dmVatTu: 2.4, vatTu: 1.4, totalLoi4M: 3.7 },
        { id: 'ro-qw-33', month: 'Tuần 33', dmVatTu: 2.4, vatTu: 0.7, totalLoi4M: 2.5 },
        { id: 'ro-qw-34', month: 'Tuần 34', dmVatTu: 2.4, vatTu: 1.1, totalLoi4M: 3.1 },
        { id: 'ro-qw-35', month: 'Tuần 35', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.5 },
        { id: 'ro-qw-36', month: 'Tuần 36', dmVatTu: 2.4, vatTu: 1.3, totalLoi4M: 2.8 },
        { id: 'ro-qw-37', month: 'Tuần 37', dmVatTu: 2.4, vatTu: 0.9, totalLoi4M: 2.9 },
        { id: 'ro-qw-38', month: 'Tuần 38', dmVatTu: 2.4, vatTu: 1.2, totalLoi4M: 3.8 },
        { id: 'ro-qw-39', month: 'Tuần 39', dmVatTu: 2.4, vatTu: 0.0, totalLoi4M: 3.4 },
      ],
    },
    bg: {
      title: 'TỶ LỆ LỖI LINE BG (THEO TUẦN)',
      benchmarkDmLoi: 7.74,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: [
        { id: 'bg-qw-32', month: 'Tuần 32', dmVatTu: 4.03, vatTu: 2.80, totalLoi4M: 6.00 },
        { id: 'bg-qw-33', month: 'Tuần 33', dmVatTu: 4.03, vatTu: 1.80, totalLoi4M: 4.10 },
        { id: 'bg-qw-34', month: 'Tuần 34', dmVatTu: 4.03, vatTu: 2.50, totalLoi4M: 5.20 },
        { id: 'bg-qw-35', month: 'Tuần 35', dmVatTu: 4.03, vatTu: 0.00, totalLoi4M: 0.00 },
        { id: 'bg-qw-36', month: 'Tuần 36', dmVatTu: 4.03, vatTu: 1.30, totalLoi4M: 2.70 },
        { id: 'bg-qw-37', month: 'Tuần 37', dmVatTu: 4.03, vatTu: 1.80, totalLoi4M: 7.80 },
        { id: 'bg-qw-38', month: 'Tuần 38', dmVatTu: 4.03, vatTu: 2.30, totalLoi4M: 4.90 },
        { id: 'bg-qw-39', month: 'Tuần 39', dmVatTu: 4.03, vatTu: 2.10, totalLoi4M: 3.50 },
      ],
    },
  },
  daily: {
    pxlr: {
      title: 'TỶ LỆ LỖI PXLR (THEO NGÀY)',
      benchmarkDmLoi: 7.38,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: [
        { id: 'pxlr-qd-11', month: '11/09', dmVatTu: 2.50, vatTu: 1.95, totalLoi4M: 3.81 },
        { id: 'pxlr-qd-12', month: '12/09', dmVatTu: 2.49, vatTu: 0.47, totalLoi4M: 2.08 },
        { id: 'pxlr-qd-14', month: '14/09', dmVatTu: 2.53, vatTu: 0.83, totalLoi4M: 2.13 },
        { id: 'pxlr-qd-15', month: '15/09', dmVatTu: 2.49, vatTu: 1.19, totalLoi4M: 3.54 },
        { id: 'pxlr-qd-16', month: '16/09', dmVatTu: 2.48, vatTu: 2.20, totalLoi4M: 4.12 },
        { id: 'pxlr-qd-17', month: '17/09', dmVatTu: 2.49, vatTu: 1.14, totalLoi4M: 5.37 },
      ],
    },
    ro: {
      title: 'TỶ LỆ LỖI LINE RO (THEO NGÀY)',
      benchmarkDmLoi: 5.2,
      benchmarkLabel: '5.2%',
      benchmarkColor: 'purple',
      lineColor: 'red',
      items: [
        { id: 'ro-qd-11', month: '11/09', dmVatTu: 2.4, vatTu: 1.90, totalLoi4M: 3.50 },
        { id: 'ro-qd-12', month: '12/09', dmVatTu: 2.4, vatTu: 0.50, totalLoi4M: 1.80 },
        { id: 'ro-qd-14', month: '14/09', dmVatTu: 2.4, vatTu: 0.90, totalLoi4M: 2.20 },
        { id: 'ro-qd-15', month: '15/09', dmVatTu: 2.4, vatTu: 0.90, totalLoi4M: 3.30 },
        { id: 'ro-qd-16', month: '16/09', dmVatTu: 2.4, vatTu: 2.30, totalLoi4M: 4.10 },
        { id: 'ro-qd-17', month: '17/09', dmVatTu: 2.4, vatTu: 1.00, totalLoi4M: 5.40 },
      ],
    },
    bg: {
      title: 'TỶ LỆ LỖI LINE BG (THEO NGÀY)',
      benchmarkDmLoi: 7.74,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: [
        { id: 'bg-qd-11', month: '11/09', dmVatTu: 4.03, vatTu: 2.78, totalLoi4M: 8.52 },
        { id: 'bg-qd-12', month: '12/09', dmVatTu: 4.03, vatTu: 0.00, totalLoi4M: 6.82 },
        { id: 'bg-qd-14', month: '14/09', dmVatTu: 4.03, vatTu: 0.00, totalLoi4M: 1.36 },
        { id: 'bg-qd-15', month: '15/09', dmVatTu: 4.03, vatTu: 6.19, totalLoi4M: 7.62 },
        { id: 'bg-qd-16', month: '16/09', dmVatTu: 4.03, vatTu: 0.30, totalLoi4M: 4.52 },
        { id: 'bg-qd-17', month: '17/09', dmVatTu: 4.03, vatTu: 3.53, totalLoi4M: 4.81 },
      ],
    },
  },
  keyDefects: {
    title: 'Các lỗi Trọng điểm :',
    items: [
      '53 Lỗi liên quan đến cóc lọc thô xếp lớp chiếm 27% lỗi.',
      '20 lỗi Tuột ống lõi lọc chức năng và cắm không kịch ống 10%',
      '47 máy liên quan đến đĩa chống tràn chiếm 25% tỉ lệ lỗi',
    ],
  },
  countermeasures: {
    title: 'Các đối sách giảm tỉ lệ lỗi trong tháng 9:',
    items: [
      'Cải tiến PP thực hiện khay LLT Xếp Lớp',
      'Đào tạo lại các vị trí trọng điểm hiểu về sản phẩm máy lọc nước RO',
      'Cải tiến thanh ngang cũng như PP bắn đĩa chống tràn',
    ],
  },
};

/**
 * Dữ liệu Slide 3 / 4: Tỉ Lệ Hư Hỏng & Bảng Chi Tiết Tổn Thất Vật Tư
 * Khớp chuẩn 100% theo hình ảnh PowerPoint thực tế của Quản đốc
 */
export const INITIAL_SLIDE3_DEFECT_COST: SlideDefectCostData = {
  slideNumber: '4',
  title: 'Tỉ Lệ Hư Hỏng',
  weeklyTitle: 'Theo Dõi Hàng Hỏng Theo Tuần',
  weeklySubTitle: 'Tổng hợp tổn thất chi tiết vật tư từ tất cả data được cập nhật (Line RO & Bếp Gas)',
  monthlyTitle: 'TL Hư Hỏng Tháng',
  activeChartTab: 'both',
  weeklyData: [
    { id: 'w-32', label: 'W32', value: 2.2, displayLabel: '2.2M' },
    { id: 'w-33', label: 'W33', value: 0.6, displayLabel: '0.6M' },
    { id: 'w-34', label: 'W34', value: 1.8, displayLabel: '1.8M' },
    { id: 'w-35', label: 'W35', value: 1.4, displayLabel: '1.4M' },
    { id: 'w-36', label: 'W36', value: 0, displayLabel: '' },
    { id: 'w-37', label: 'W37', value: 1.4, displayLabel: '1.4M' },
    { id: 'w-38', label: 'W38', value: 1.8, displayLabel: '1.8M' },
    { id: 'w-39', label: 'W39', value: 1.0, displayLabel: '1.0M' },
    { id: 'w-40', label: 'W40', value: 0, displayLabel: '' },
  ],
  monthlyData: [
    { id: 'm-06', label: 'Tháng 6', value: 10.8, displayLabel: '10.8M' },
    { id: 'm-07', label: 'Tháng 7', value: 7.1, displayLabel: '7.1M' },
    { id: 'm-08', label: 'Tháng 8', value: 5.9, displayLabel: '5.9M' },
    { id: 'm-09', label: 'Tháng 9', value: 5.2, displayLabel: '5.2M' },
  ],
  itemsRO: [
    // Tuần 37
    { id: 'ro-dam-1', itemCode: '04-28-03-BRA590N-0007', itemName: 'Van xả áp', quantity: 2, unitPrice: 9999.58, amount: 19999.16, category: 'RO', isHighlighted: false, week: 'W37' },
    { id: 'ro-dam-2', itemCode: '04-29-06-SHA76622KL-0000', itemName: 'Vỏ carton MLN R.O Slim dùng chung', quantity: 3, unitPrice: 23916.90, amount: 71750.70, category: 'RO', isHighlighted: false, week: 'W37' },
    { id: 'ro-dam-3', itemCode: '04-29-07-SHA76636KL-0003', itemName: 'Bộ dây nguồn tổng SHA76636KL', quantity: 2, unitPrice: 18411.65, amount: 36823.30, category: 'RO', isHighlighted: false, week: 'W37' },
    { id: 'ro-dam-4', itemCode: '04-29-03-SHA76218CK-0016', itemName: 'Cút nối tự hãm nước vào 3/8"(DT0303-TSUNG)', quantity: 3, unitPrice: 3458.35, amount: 10375.05, category: 'RO', isHighlighted: false, week: 'W37' },
    // Tuần 38
    { id: 'ro-dam-5', itemCode: '04-29-07-SHA76222KL-0005', itemName: 'Bộ dây điện rời SHA76222KL', quantity: 2, unitPrice: 9245.90, amount: 18491.80, category: 'RO', isHighlighted: false, week: 'W38' },
    { id: 'ro-dam-6', itemCode: '04-29-03-SHA76213CK-0015', itemName: 'Nhựa đế tủ Slim SX', quantity: 5, unitPrice: 20360.55, amount: 101802.75, category: 'RO', isHighlighted: false, week: 'W38' },
    { id: 'ro-dam-7', itemCode: '04-29-06-SHA76601S-0007', itemName: 'Vỏ carton máy lọc nước R.O Slim UltraX', quantity: 3, unitPrice: 21135.54, amount: 63406.62, category: 'RO', isHighlighted: false, week: 'W38' },
    { id: 'ro-dam-8', itemCode: '04-28-01-SHA8820KL-0000', itemName: 'Mặt kính trước SHA8820KL', quantity: 3, unitPrice: 95000.00, amount: 285000.00, category: 'RO', isHighlighted: true, week: 'W38' },
    // Tuần 39 (W39): Line RO KHÔNG CÓ LỖI (0 linh kiện hỏng, 0 VNĐ)
  ],
  itemsBG: [
    // Tuần 37
    { id: 'bg-dam-1', itemCode: '01-55-06-00-0001', itemName: 'Tem bảo hành cụm đánh lửa (5 năm)', quantity: 8, unitPrice: 650.00, amount: 5200.00, category: 'BG', isHighlighted: false, week: 'W37' },
    { id: 'bg-dam-2', itemCode: '02-33-07-MMB0787-0002', itemName: 'Cụm đánh lửa MMB0787-V2', quantity: 1, unitPrice: 29835.98, amount: 29835.98, category: 'BG', isHighlighted: false, week: 'W37' },
    { id: 'bg-dam-3', itemCode: '02-33-08-SH0000-0001', itemName: 'Đĩa chống tràn Inox cuốn mép (SH SX)', quantity: 1, unitPrice: 7724.85, amount: 7724.85, category: 'BG', isHighlighted: false, week: 'W37' },
    { id: 'bg-dam-4', itemCode: '02-33-06-MMBB0787B-0001', itemName: 'Vỏ hộp bếp ga MMBB0787B', quantity: 16, unitPrice: 15361.43, amount: 245782.88, category: 'BG', isHighlighted: true, week: 'W37' },
    { id: 'bg-dam-5', itemCode: '02-33-05-B160000-0001', itemName: 'Nút nhựa B16 đen xám', quantity: 70, unitPrice: 1480.52, amount: 103636.40, category: 'BG', isHighlighted: false, week: 'W37' },
    // Tuần 38
    { id: 'bg-dam-6', itemCode: '02-33-06-SHB32012VMC-0001', itemName: 'Vỏ hộp bếp gas SHB32012-VMC', quantity: 7, unitPrice: 14842.00, amount: 103894.00, category: 'BG', isHighlighted: true, week: 'W38' },
    { id: 'bg-dam-7', itemCode: '02-33-07-MMB3569MT-0000', itemName: 'Cụm đánh lửa 3569MT(0.8)(30 độ )', quantity: 9, unitPrice: 21906.10, amount: 197154.90, category: 'BG', isHighlighted: true, week: 'W38' },
    { id: 'bg-dam-8', itemCode: '02-33-08-SHB201MT-0008', itemName: 'Đĩa chống tràn SHB201MT-V2', quantity: 7, unitPrice: 6381.00, amount: 44667.00, category: 'BG', isHighlighted: false, week: 'W38' },
    { id: 'bg-dam-9', itemCode: '02-33-08-SHB303MT-0002', itemName: 'Bát V cao', quantity: 7, unitPrice: 507.43, amount: 3552.01, category: 'BG', isHighlighted: false, week: 'W38' },
    { id: 'bg-dam-10', itemCode: '02-33-09-650X90-0001', itemName: 'Ống dẫn ga khung 650x90 siêu mỏng, không răng', quantity: 1, unitPrice: 13034.80, amount: 13034.80, category: 'BG', isHighlighted: false, week: 'W38' },
    // Tuần 39 (Tuần mới nhất - Bếp Gas)
    { id: 'bg-dam-11', itemCode: '02-33-01-MKBD-0001', itemName: 'Mặt kính bếp gas đôi in hoa văn chịu lực', quantity: 3, unitPrice: 145000.00, amount: 435000.00, category: 'BG', isHighlighted: true, week: 'W39' },
    { id: 'bg-dam-12', itemCode: '02-33-07-MMB3569MT-0000', itemName: 'Cụm đánh lửa 3569MT(0.8)(30 độ )', quantity: 12, unitPrice: 21906.10, amount: 262873.20, category: 'BG', isHighlighted: true, week: 'W39' },
    { id: 'bg-dam-13', itemCode: '02-33-06-MMBB0787B-0001', itemName: 'Vỏ hộp bếp ga MMBB0787B', quantity: 10, unitPrice: 15361.43, amount: 153614.30, category: 'BG', isHighlighted: false, week: 'W39' },
    { id: 'bg-dam-14', itemCode: '02-33-08-SHB201MT-0008', itemName: 'Đĩa chống tràn SHB201MT-V2', quantity: 8, unitPrice: 6381.00, amount: 51048.00, category: 'BG', isHighlighted: false, week: 'W39' },
    { id: 'bg-dam-15', itemCode: '02-33-09-650X90-0001', itemName: 'Ống dẫn ga khung 650x90 siêu mỏng', quantity: 3, unitPrice: 13034.80, amount: 39104.40, category: 'BG', isHighlighted: false, week: 'W39' },
    { id: 'bg-dam-16', itemCode: '02-33-05-B160000-0001', itemName: 'Nút nhựa B16 đen xám', quantity: 15, unitPrice: 1480.52, amount: 22207.80, category: 'BG', isHighlighted: false, week: 'W39' },
  ],
};

export const INITIAL_SLIDE4_PRODUCTION_TARGET: Slide4ProductionTargetData = {
  title: 'Mục tiêu NSLĐ',
  slideNumber: '5',
  luyKe2025: 104.2,
  luyKe2026: 110.8,
  dinhBienNhanSu: 76,
  calcParams: {
    nlsxHienTaiSQD: 1000,
    tgHDay: 11,
    soNgaySX: {
      'Tháng 1': 22,
      'Tháng 2': 18,
      'Tháng 3': 26,
      'Tháng 4': 25,
      'Tháng 5': 24,
      'Tháng 6': 26,
      'Tháng 7': 27,
      'Tháng 8': 26,
      'Tháng 9': 26,
      'Tháng 10': 28,
      'Tháng 11': 28,
      'Tháng 12': 30,
    }
  },
  monthlyTargets: [
    { month: 'Tháng 1', nsld: 90.14, sanLuong: 12747, cong: 14577, tonThat: 1790.86 },
    { month: 'Tháng 2', nsld: 96.69, sanLuong: 7704, cong: 11151, tonThat: 1277.2 },
    { month: 'Tháng 3', nsld: 93.95, sanLuong: 16609, cong: 23503, tonThat: 2770.55 },
    { month: 'Tháng 4', nsld: 94.41, sanLuong: 15070, cong: 20601, tonThat: 2416.591 },
    { month: 'Tháng 5', nsld: 108.4, sanLuong: 13311, cong: 24456, tonThat: 2498.403 },
    { month: 'Tháng 6', nsld: 131.6, sanLuong: 13000, cong: 21962, tonThat: 1848 },
    { month: 'Tháng 7', nsld: 135.5, sanLuong: 13025, cong: 17233, tonThat: 1408 },
    { month: 'Tháng 8', nsld: 133.6, sanLuong: 12615, cong: 19601, tonThat: 1625 },
    { month: 'Tháng 9', nsld: 112.51, sanLuong: 11514, cong: 14748, tonThat: 1451.585 },
    { month: 'Tháng 10', nsld: 119.2, sanLuong: 23149, cong: 1550, tonThat: 2150 },
    { month: 'Tháng 11', nsld: 119.9, sanLuong: 22955, cong: 1550, tonThat: 2120 },
    { month: 'Tháng 12', nsld: 119.8, sanLuong: 25430, cong: 1550, tonThat: 2350 },
  ]
};

export const INITIAL_SLIDE5_PRODUCTION_PLAN: Slide5ProductionPlanData = {
  title: 'KHSX W39 – Nhân Lực',
  weekHeader: 'W39',
  manpowerSummary: '53/57 NS Line',
  rmaSummary: 'RMA 12/14NS',
  rows: [
    { date: '21/09/2026', planDCLR: 'BLOCK', rmaBg: 'RMA + BG', manpowerLine: '53 NS CT + 15TV', manpowerRma: '12 NS CT + 2TV' },
    { date: '22/09/2026', planDCLR: 'BLOCK', rmaBg: 'RMA + BG', manpowerLine: '53 NS CT + 15TV', manpowerRma: '12 NS CT + 2TV' },
    { date: '23/09/2026', planDCLR: 'BLOCK', rmaBg: 'RMA + BG', manpowerLine: '53 NS CT + 15TV', manpowerRma: '12 NS CT + 2TV' },
    { date: '24/09/2026', planDCLR: 'BLOCK', rmaBg: 'RMA + BG', manpowerLine: '53 NS CT + 15TV', manpowerRma: '12 NS CT + 2TV' },
    { date: '25/09/2026', planDCLR: 'BLOCK', rmaBg: 'RMA + BG', manpowerLine: '53 NS CT + 15TV', manpowerRma: '12 NS CT + 2TV' },
    { date: '26/09/2026', planDCLR: 'BLOCK', rmaBg: 'RMA + BG', manpowerLine: '53 NS CT + 15TV', manpowerRma: '12 NS CT + 2TV' },
    { date: '27/09/2026', planDCLR: 'BLOCK', rmaBg: 'RMA + BG', manpowerLine: '53 NS CT + 15TV', manpowerRma: '12 NS CT + 2TV' },
  ]
};

export const INITIAL_SLIDE6_TASK_PLAN: Slide6TaskPlanData = {
  title: 'Công việc W38 và KHCV W39',
  weekHeader: '7',
  rows: [
    {
      task: 'Sơn nền DCLR',
      detail: 'Triển khai sơn cuốn chiếu DCLR',
      deadline: '05/09/2026\nGia hạn 30/09/2026\n21/09/2026 sơn về',
      status: 'pending',
      highlightedText: '21/09/2026 sơn về'
    },
    {
      task: 'Hoàn thành bàn thao tác BLK Làm Block',
      detail: 'Hoàn thành sắp xếp khu vực Làm BLK + Khay Block + tính toán dòng chảy sản phẩm khu vực làm khay block – Hàn nạp gas – Test lạnh',
      deadline: '10/09/2026\nHoàn thành\nTiếp tục triển khai cải tiến Line hàn Block 30/09/2026',
      status: 'completed'
    },
    {
      task: 'Mua máy test đánh giá máy bơm keo tự động keo dẫn nhiệt bầu lạnh đảm bảo chất lượng sản phẩm',
      detail: 'Đề xuất mua máy – Test đánh giá – đưa vào hoạt động máy bơm keo tự động keo dẫn nhiệt',
      deadline: '20/09/2026\nHoàn thành',
      status: 'completed'
    },
    {
      task: 'Xây dựng SOP Cho tất cả các Model',
      detail: 'Xây dựng SOP all model sản xuất cho DCLR',
      deadline: '30/10/2026',
      status: 'in_progress'
    },
    {
      task: 'Kiểm tra Fix lại các lỗi BCSX',
      detail: 'Kiểm tra Fix lại các lỗi BCSX để chạy báo cáo Online và Chạy tự động',
      deadline: '20/09/2026\n25/09/2026',
      status: 'pending'
    }
  ]
};




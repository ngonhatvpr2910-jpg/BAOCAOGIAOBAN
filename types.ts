export type UserRole = 'manager_pxlr' | 'supervisor_dcbg' | 'supervisor_dcro' | 'planner';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatarColor: string;
}

export interface DailyDCBGRecord {
  id: string;
  date: string; // YYYY-MM-DD
  congBepGa: number;       // CÔNG Bếp GA
  congThoiVu: number;      // CÔNG THỜI VỤ
  congRma: number;         // CÔNG RMA
  sanLuongBepGa: number;   // SẢN LƯỢNG QUY ĐỔI Bếp Ga
  sanLuongRma: number;     // SẢN LƯỢNG QUY ĐỔI RMA
  dinhMucSlTheoNs: number; // ĐỊNH MỨC SL THEO NS
  tongNhanSuLine: number;  // Tổng nhân sự Line
  nhanSuNghi: number;      // Nhân sự nghỉ
  chiPhiHangHong: number;  // Chi phí hàng hỏng (VNĐ)
  tiLeLoiThaoTac: number;  // Tỉ lệ lỗi thao tác (%)
  ghiChu?: string;         // Ghi chú tồn đọng / sự cố line
  // Auto-calculated fields
  tongCong: number;        // Tổng công
  tongSanLuongQuyDoi: number; // Tổng sản lượng quy đổi
  nsldTheoNgay: number;    // NSLĐ THEO NGÀY (%)
  tiLeDiLam: number;       // TỈ LỆ ĐI LÀM (%)
  khsxNgay?: number;       // KHSX NGÀY
  tiLeHoanThanhKhsx?: number; // TỈ LỆ HOÀN THÀNH KHSX (%)
}

export interface DailyDCRORecord {
  id: string;
  date: string; // YYYY-MM-DD
  congChinhThuc: number;   // CÔNG CHÍNH THỨC
  congThoiVu: number;      // CÔNG THỜI VỤ
  sanLuongLineChinh: number; // SẢN LƯỢNG QUY ĐỔI LINE CHÍNH
  dinhMucSlTheoNs: number; // ĐỊNH MỨC SL THEO NS
  tongNhanSuLine: number;  // Tổng nhân sự Line
  nhanSuNghi: number;      // Nhân sự nghỉ
  chiPhiHangHong: number;  // Chi phí hàng hỏng (VNĐ)
  tiLeLoiThaoTac: number;  // Tỉ lệ lỗi thao tác (%)
  ghiChu?: string;
  // Auto-calculated fields
  tongCong: number;
  tongSanLuongQuyDoi: number;
  nsldTheoNgay: number;    // NSLĐ THEO NGÀY (%)
  tiLeDiLam: number;       // TỈ LỆ ĐI LÀM (%)
  khsxNgay?: number;       // KHSX NGÀY
  tiLeHoanThanhKhsx?: number; // TỈ LỆ HOÀN THÀNH KHSX (%) = SL LINE CHÍNH / KHSX NGÀY
}

export interface QualityMetricsSnapshot {
  periodLabel: string;
  source: string;
  timeFrame: 'day' | 'week' | 'month';
  ro: {
    totalLoi4M: number;
    vatTu: number;
    dmVatTu: number;
    benchmark: number;
  };
  bg: {
    totalLoi4M: number;
    vatTu: number;
    dmVatTu: number;
    benchmark: number;
  };
  pxlr: {
    totalLoi4M: number;
    vatTu: number;
    dmVatTu: number;
    benchmark: number;
  };
}

export interface DailyPXLRConsolidated {
  date: string;
  // Totals
  tongCong: number;
  tongCongChinhThuc: number;
  tongCongThoiVu: number;
  tongSanLuongQuyDoi: number;
  tongDinhMucSl: number;
  nsldTrungBinh: number; // %
  tongNhanSu: number;
  tongNghi: number;
  tiLeDiLam: number;     // %
  tongChiPhiHangHong: number;
  tiLeLoiThaoTacTB: number;
  keHoachSanXuat: number;
  tiLeHoanThanhKH: number;
  // Breakdown
  dcbg: DailyDCBGRecord;
  dcro: DailyDCRORecord;
  // Đồng bộ tỉ lệ lỗi từ Slide 2 Chất Lượng
  qualityMetrics?: QualityMetricsSnapshot;
}

export interface MonthlyHistoryRecord {
  month: string; // "Tháng 1", "Tháng 2", ...
  monthNum: number;
  nsld2025: number; // % (e.g. 96.18)
  nsld2026: number; // % (e.g. 90.14)
  cong2025: number; // (e.g. 1473)
  cong2026: number; // (e.g. 1791)
  tiLeDiLam: number; // % (e.g. 93.0)
  sanLuong2025?: number;
  sanLuong2026?: number;
  hangHong?: number; // VNĐ
  nsld?: number; // %
}


export interface WeeklyHistoryRecord {
  week: string; // "W21", "W22", ...
  weekNum: number;
  tiLeDiLam: number; // %
  hangHong: number; // VNĐ
  tiLeLoiThaoTac: number; // %
}

export interface PushAlert {
  id: string;
  timestamp: string;
  type: 'attendance' | 'productivity' | 'defect' | 'output' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  dcSource: 'DCBG' | 'DCRO' | 'PXLR';
  isRead: boolean;
}

export interface ThresholdConfig {
  minAttendanceRate: number;      // e.g., 95%
  minProductivityRate: number;    // e.g., 100%
  maxDefectCostPerDay: number;    // e.g., 1,160,000 VND (~7M VND/week)
  maxErrorRate: number;           // e.g., 7.38%
  enableBrowserPush: boolean;
  autoExportPdfAtEndOfDay: boolean;
  autoExportTime: string;         // e.g. "17:30"
}

export interface UnitExecutiveSummary {
  id: string;
  unitKey: 'PXLR' | 'RO' | 'BG' | 'RMA';
  unitName: string;
  khsxLabel: string; // Kế hoạch sản xuất (KHSX Ngày)
  actualOutputLabel?: string; // Thực hiện (SL Quy đổi Line Chính)
  actualOutput?: number;
  khsxValue?: number;
  completionRate: number;
  completionNote: string;
  nsldActual: number;
  nsldTarget: number;
  nsldDeltaNote: string;
  attendanceActual: number;
  attendanceTarget: number;
  errorRateActual?: number;
  errorRateQuota?: number; // Định mức
  defectCostActual?: number;
  defectCostTarget?: number; // Mục tiêu
  bomNote?: string;
  actionItem?: string;
}

// Exact DCBG Weekly & Monthly records from User Excel Images 3 & 4
export interface WeeklyDCBGRecord {
  tuan: string; // "W23", "W24", "W25", "W26", "W27"
  nsldTuan: number; // % (e.g. 79.06, 82.92, 93.87, 66.00, 101.14)
  tongCongTuan: number; // (e.g. 30.60, 90.08, 74.45, 48.05, 31.65)
  tongSanLuongQuyDoiTuan: number; // (e.g. 219.01, 664.00, 624.53, 296.02, 289.00)
  tiLeDiLamTuan: number; // % (e.g. 100, 96, 86, 91, 90)
}

export interface MonthlyNSLDDCBGRecord {
  thang: string; // "Tháng 5", "Tháng 6", ... "Tháng 12"
  nsld: number; // % (e.g. 61.8, 84.3, 100, 103, 105, 107, 109, 110)
}

export interface DailyNSLDRMARecord {
  date: string; // "26-Jun", "27-Jun", "29-Jun", "30-Jun"
  nsld: number; // % (e.g. 102.1, 100.0, 101.6, 107.7)
}

// Exact RO Daily & Weekly Matrix Column Record from Image 1
export interface ExcelMatrixROColumn {
  id: string;
  label: string; // "01-Jun", "02-Jun", "W22/T6", ...
  dateStr?: string; // "2026-06-01"
  isWeeklyTotal?: boolean;
  isMonthlyTotal?: boolean;
  isOff?: boolean;
  weekRange?: string; // e.g. "01 - 05/09"
  congChinhThuc: number;
  congThoiVu: number;
  sanLuongLineChinh: number;
  dinhMucSlTheoNs: number;
  nsldTheoNgay: number; // %
  khsxNgay: number;
  tiLeHoanThanhKhsx: number; // %
  tongNhanSuLine: number;
  nhanSuNghi: number;
  tiLeDiLam: number; // %
  tiLeLoiThaoTac?: number; // %
}

// Exact BG Daily & Weekly Matrix Column Record from Image 2
export interface ExcelMatrixBGColumn {
  id: string;
  label: string; // "01-Jun", "03-Jun", "W1", "05-Jun"...
  dateStr?: string; // "2026-06-01"
  isWeeklyTotal?: boolean;
  isMonthlyTotal?: boolean;
  isOff?: boolean;
  weekRange?: string; // e.g. "01 - 05/09"
  congBepGa: number;
  congThoiVu: number;
  congRma: number;
  sanLuongBepGa: number;
  sanLuongRma: number;
  dinhMucSlTheoNs: number;
  nsldTheoNgay: number; // %
  khsxNgay: number;
  tiLeHoanThanhKhsx: number; // %
  tongNhanSuLine: number;
  nhanSuNghi: number;
  tiLeDiLam: number; // %
  tiLeLoiThaoTac?: number; // %
}

// PowerPoint Slide 1: So Sánh NSLĐ Tháng
export interface SlideBarItem {
  id: string;
  label: string;
  value: number; // %
}

export interface Slide1NSLDData {
  title: string;
  subTitle: string;
  pxlr: {
    weekly: SlideBarItem[];
    monthly: SlideBarItem[];
  };
  ro: {
    weekly: SlideBarItem[];
    monthly: SlideBarItem[];
  };
  bg: {
    weekly: SlideBarItem[];
    monthly: SlideBarItem[];
  };
}

// PowerPoint Slide 3 / 4: "4 Tỉ Lệ Hư Hỏng"
export interface DamagedItemRecord {
  id: string;
  itemCode: string; // "04-29-06-SHA76622KL-0000"
  itemName: string; // "Vỏ carton MLN R.O Slim dùng chung"
  quantity: number; // 8
  unitPrice: number; // 23916.90
  amount: number; // 191335.20 (auto-calculated: quantity * unitPrice)
  isHighlighted?: boolean; // Highlighted yellow/red row
  category?: 'RO' | 'BG' | string;
  week?: string; // e.g. "W38"
}

export interface DefectCostBarItem {
  id: string;
  label: string; // "W30", "Tháng 5"
  value: number; // in Million VND (e.g. 1.2, 11.4) or exact VND
  displayLabel?: string; // "1.2M", "11.4M"
}

export interface Slide5PlanRow {
  date: string;
  planDCLR: string;
  rmaBg: string;
  manpowerLine: string;
  manpowerRma: string;
}

export interface Slide5ProductionPlanData {
  title: string;
  weekHeader: string;
  manpowerSummary: string;
  rmaSummary: string;
  rows: Slide5PlanRow[];
}

export interface Slide6TaskRow {
  task: string;
  detail: string;
  deadline: string;
  status?: 'pending' | 'completed' | 'overdue' | 'in_progress';
  highlightedText?: string;
}

export interface Slide6TaskPlanData {
  title: string;
  weekHeader: string;
  rows: Slide6TaskRow[];
}

export interface SlideDefectCostData {
  title: string; // "Tỉ Lệ Hư Hỏng"
  slideNumber: string; // "4"
  weeklyTitle: string; // "Theo Dõi Hàng Hỏng Theo Tuần"
  weeklySubTitle: string; // "Tổn thất chi tiết từng tuần sản xuất (VND)"
  monthlyTitle: string; // "TL Hư Hỏng Tháng"
  weeklyData: DefectCostBarItem[];
  monthlyData: DefectCostBarItem[];
  itemsRO: DamagedItemRecord[];
  itemsBG: DamagedItemRecord[];
  activeChartTab?: 'week' | 'month' | 'both';
}

export interface Slide2QualityItem {
  id: string;
  month: string; // "T5", "W35", "01/09" or label
  dmVatTu: number; // % ĐM vật tư (cột xanh đen #244061)
  vatTu: number; // % Vật tư (cột cam viền đỏ)
  totalLoi4M: number; // % Total lỗi 4M (đường line)
}

export interface QualityDailyRecord {
  id: string;
  date: string; // "2026-09-01"
  dayLabel: string; // "01/09"
  week: string; // "W35", "W36", "W37", "W38"
  month: string; // "T9"
  ro: {
    dmVatTu: number;
    vatTu: number;
    totalLoi4M: number;
    sanLuong?: number;
  };
  bg: {
    dmVatTu: number;
    vatTu: number;
    totalLoi4M: number;
    sanLuong?: number;
  };
  pxlr: {
    dmVatTu: number;
    vatTu: number;
    totalLoi4M: number;
  };
}

export interface QualityGroupCharts {
  pxlr: Slide2ChartData;
  ro: Slide2ChartData;
  bg: Slide2ChartData;
}

export interface Slide2ChartData {
  title: string; // "TỶ LỆ LỖI PHÂN XƯỞNG LẮP RÁP", "TỶ LỆ LỖI LINE RO", "TỶ LỆ LỖI LINE BG"
  benchmarkDmLoi: number; // e.g. 7.38 (PXLR), 5.2 (RO), 7.74 (BG)
  benchmarkLabel?: string; // "ĐM % lỗi 4M"
  benchmarkColor?: 'green' | 'purple'; // Green dashed or Purple dashed
  lineColor?: 'blue' | 'red'; // Blue line or Red line
  items: Slide2QualityItem[];
}

export interface Slide2QualityData {
  title: string; // "Chất Lượng"
  slideNumber: string; // "3"
  headerBarText: string; // "Báo Cáo Sản Xuất DCLR"
  activeTimeFrame?: 'month' | 'week' | 'day';
  autoRollup?: boolean;
  // Current active data displayed in charts
  pxlr: Slide2ChartData;
  ro: Slide2ChartData;
  bg: Slide2ChartData;
  // Multiframe stored datasets
  monthly?: QualityGroupCharts;
  weekly?: QualityGroupCharts;
  daily?: QualityGroupCharts;
  dailyRecords?: QualityDailyRecord[];
  keyDefects: {
    title: string;
    items: string[];
  };
  countermeasures: {
    title: string;
    items: string[];
  };
}

export interface ProductionTargetMonth {
  month: string; // "Tháng 1"
  nsld: number;
  sanLuong: number;
  cong: number;
  tonThat: number;
}

export interface Slide4ProductionTargetData {
  title: string; // "Mục tiêu sản xuất tiếp theo"
  slideNumber: string; // "5" or "4"
  monthlyTargets: ProductionTargetMonth[];
  luyKe2025: number;
  luyKe2026: number;
  dinhBienNhanSu: number; // 76
  calcParams: {
    nlsxHienTaiSQD: number; // 1000
    soNgaySX: { [key: string]: number }; // {"Tháng 9": 26, ...}
    tgHDay: number; // 11
  }
}



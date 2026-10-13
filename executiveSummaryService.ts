import { UnitExecutiveSummary, MonthlyHistoryRecord, SlideDefectCostData, Slide1NSLDData, Slide2QualityData, GlobalNormsConfig } from './types';
import { StorageService } from './storage';
import { synchronizeSlide3Data, isSameWeek, isItemInMonth, extractWeekNumber, MONTH_WEEKS_MAP, HISTORICAL_WEEK_BREAKDOWN } from './defectCostSyncService';
import { calculateAbsolutePXLR } from './productivityFormulas';

export interface ExecutiveSummaryPeriodResult {
  periodLabel: string;
  timeFrame: 'week' | 'month';
  units: UnitExecutiveSummary[];
  actionItemTitle: string;
  actionItemContent: string;
  isUrgentAction: boolean;
}

export const AVAILABLE_WEEKS = [
  'W22', 'W23', 'W24', 'W25', 'W26',
  'W27', 'W28', 'W29', 'W30',
  'W31', 'W32', 'W33', 'W34', 'W35',
  'W36', 'W37', 'W38', 'W39', 'W40',
  'W41', 'W42', 'W43', 'W44',
  'W45', 'W46', 'W47', 'W48',
  'W49', 'W50', 'W51', 'W52',
];
export const AVAILABLE_MONTHS = ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export function getWeeksForMonth(monthStr: string): string[] {
  const normalized = monthStr.trim();
  if (MONTH_WEEKS_MAP[normalized]) return MONTH_WEEKS_MAP[normalized];
  const mNum = parseInt(normalized.replace(/\D/g, ''), 10);
  if (mNum === 6) return ['W22', 'W23', 'W24', 'W25', 'W26'];
  if (mNum === 7) return ['W27', 'W28', 'W29', 'W30'];
  if (mNum === 8) return ['W31', 'W32', 'W33', 'W34', 'W35'];
  if (mNum === 9) return ['W36', 'W37', 'W38', 'W39', 'W40'];
  if (mNum === 10) return ['W41', 'W42', 'W43', 'W44'];
  if (mNum === 11) return ['W45', 'W46', 'W47', 'W48'];
  if (mNum === 12) return ['W49', 'W50', 'W51', 'W52'];
  return ['W41', 'W42', 'W43', 'W44'];
}

export function getMonthForWeek(weekStr: string): string {
  const wNum = extractWeekNumber(weekStr);
  if (wNum >= 41 && wNum <= 44) return 'Tháng 10';
  if (wNum >= 45 && wNum <= 48) return 'Tháng 11';
  if (wNum >= 49 && wNum <= 52) return 'Tháng 12';
  if (wNum >= 36 && wNum <= 40) return 'Tháng 9';
  if (wNum >= 31 && wNum <= 35) return 'Tháng 8';
  if (wNum >= 27 && wNum <= 30) return 'Tháng 7';
  if (wNum >= 22 && wNum <= 26) return 'Tháng 6';
  return 'Tháng 10';
}

export const BASE_WEEKLY_SUMMARY: Record<string, ExecutiveSummaryPeriodResult> = {
  'W35': {
    periodLabel: 'W35',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Đối sách tuần W35',
    actionItemContent: 'Tuần cuối Tháng 8: Line RO và Bếp Gas duy trì ổn định sản xuất, kiểm soát chi phí hư hỏng vật tư 1.4M.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w35',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W35)',
        khsxLabel: '7.200 SP',
        actualOutputLabel: '7.200 SP',
        actualOutput: 7200,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
        nsldActual: 100.8,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Đạt mục tiêu 100%',
        attendanceActual: 97.5,
        attendanceTarget: 95.0,
        errorRateActual: 4.80,
        errorRateQuota: 7.38,
        defectCostActual: 1400000,
        defectCostTarget: 7000000,
        actionItem: 'Toàn xưởng hoàn thành KHSX, NSLĐ 100.8%, chi phí hư hỏng 1.4M đạt mục tiêu.',
      },
      {
        id: 'exec-ro-w35',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W35)',
        khsxLabel: '4.200 SP',
        actualOutputLabel: '4.200 SP',
        actualOutput: 4200,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX RO',
        nsldActual: 104.2,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Vượt mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.50,
        errorRateQuota: 5.20,
        defectCostActual: 800000,
        defectCostTarget: 5000000,
        actionItem: 'Line RO hoàn thành 100% KHSX, NSLĐ 104.2%, kiểm soát tốt linh kiện.',
      },
      {
        id: 'exec-bg-w35',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W35)',
        khsxLabel: '3.000 SP',
        actualOutputLabel: '3.000 SP',
        actualOutput: 3000,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX BG',
        nsldActual: 111.7,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 11.7% so với mục tiêu 100%',
        attendanceActual: 97.0,
        attendanceTarget: 95.0,
        errorRateActual: 8.20,
        errorRateQuota: 7.74,
        defectCostActual: 600000,
        defectCostTarget: 2000000,
        actionItem: 'Line BG đạt NSLĐ 111.7%, kiểm soát chặt chẽ tỉ lệ lỗi.',
      },
      {
        id: 'exec-rma-w35',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W35)',
        khsxLabel: '150 SP',
        actualOutputLabel: '150 SP',
        actualOutput: 150,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
        nsldActual: 100.0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Đạt mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Hoàn thành tiến độ trả nợ hàng RMA.',
      },
    ],
  },
  'W36': {
    periodLabel: 'W36',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Đối sách tuần W36',
    actionItemContent: 'Tuần giao thoa cuối tháng 8 và đầu tháng 9: Cả hai chuyền duy trì NSLĐ cao, không phát sinh chi phí hư hỏng (0 đ).',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w36',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W36)',
        khsxLabel: '7.500 SP',
        actualOutputLabel: '7.500 SP',
        actualOutput: 7500,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
        nsldActual: 114.2,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Tiệm cận mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 4.50,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 7000000,
        actionItem: 'Toàn xưởng đạt NSLĐ 114.2%, chi phí hư hỏng 0 đ (Zero Defect vật tư).',
      },
      {
        id: 'exec-ro-w36',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W36)',
        khsxLabel: '4.500 SP',
        actualOutputLabel: '4.500 SP',
        actualOutput: 4500,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX RO',
        nsldActual: 114.7,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Tiệm cận mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.20,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 5000000,
        actionItem: 'Line RO NSLĐ 114.7%, tỉ lệ lỗi 3.20% dưới định mức, không phát sinh hư hỏng (0 đ).',
      },
      {
        id: 'exec-bg-w36',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W36)',
        khsxLabel: '3.000 SP',
        actualOutputLabel: '3.000 SP',
        actualOutput: 3000,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX BG',
        nsldActual: 111.4,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 11.4% so với mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 7.50,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2000000,
        actionItem: 'Line BG đạt NSLĐ 111.4%, không phát sinh hư hỏng vật tư (0 đ).',
      },
      {
        id: 'exec-rma-w36',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W36)',
        khsxLabel: '200 SP',
        actualOutputLabel: '200 SP',
        actualOutput: 200,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
        nsldActual: 100.0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Đạt mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Sản lượng trả RMA đạt 100% kế hoạch.',
      },
    ],
  },
  'W37': {
    periodLabel: 'W37',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Đối sách tuần W37',
    actionItemContent: 'Tập trung khắc phục lỗi thao tác 10.10% tại line Bếp Gas (vượt định mức 7.74%) và chi phí hư hỏng 3.22M (vượt mục tiêu 2M). Thắt chặt kiểm tra linh kiện mâm đốt.',
    isUrgentAction: true,
    units: [
      {
        id: 'exec-pxlr-w37',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W37)',
        khsxLabel: '7.173 SP',
        actualOutputLabel: '7.156 SP',
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
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
        khsxLabel: '4.173 SP',
        actualOutputLabel: '4.156 SP',
        completionRate: 99.6,
        completionNote: 'Đạt 99.6% KHSX RO',
        nsldActual: 125.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.20,
        errorRateQuota: 5.20,
        defectCostActual: 3427997,
        defectCostTarget: 5000000,
        actionItem: 'NSLĐ vượt trội 125%, tỷ lệ lỗi 3.2% thấp hơn định mức 5.2%, hư hỏng 3.4M thấp hơn mục tiêu 5M.',
      },
      {
        id: 'exec-bg-w37',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W37)',
        khsxLabel: '3.000 SP',
        actualOutputLabel: '3.000 SP',
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX BG',
        nsldActual: 108.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 8% so với mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 10.10,
        errorRateQuota: 7.74,
        defectCostActual: 3221924,
        defectCostTarget: 2000000,
        actionItem: 'CẢNH BÁO ĐỎ: Tỉ lệ lỗi 10.10% (vượt định mức 7.74%), Hư hỏng 3.22M (vượt mục tiêu 2M). Cần rà soát công đoạn lắp mâm chia lửa.',
      },
      {
        id: 'exec-rma-w37',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W37)',
        khsxLabel: '200 SP',
        actualOutputLabel: '420 SP',
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
    ],
  },
  'W38': {
    periodLabel: 'W38',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Đối sách tuần W38',
    actionItemContent: 'Kiểm soát chi phí bao bì vỏ carton và mặt kính line RO (1.08M). Siết chặt quy trình thử xì và cụm đánh lửa Bếp Gas để kéo giảm tỉ lệ lỗi về dưới 7.74%.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w38',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W38)',
        khsxLabel: '8.000 SP',
        actualOutputLabel: '8.000 SP',
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
        nsldActual: 122.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 4.45,
        errorRateQuota: 7.38,
        defectCostActual: 1800000,
        defectCostTarget: 7000000,
        actionItem: 'Hư hỏng toàn xưởng giảm mạnh từ 6.65M về 1.8M (đạt mục tiêu ≤ 7M). Tiếp tục đà cải tiến tại các tổ.',
      },
      {
        id: 'exec-ro-w38',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W38)',
        khsxLabel: '4.800 SP',
        actualOutputLabel: '4.800 SP',
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX RO',
        nsldActual: 126.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 2.80,
        errorRateQuota: 5.20,
        defectCostActual: 1080000,
        defectCostTarget: 5000000,
        actionItem: 'NSLĐ đạt 126%, tỉ lệ lỗi 2.80% dưới định mức. Kiểm soát thêm mặt kính trước SHA8820KL để tối ưu chi phí.',
      },
      {
        id: 'exec-bg-w38',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W38)',
        khsxLabel: '3.200 SP',
        actualOutputLabel: '3.200 SP',
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX BG',
        nsldActual: 110.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 10% so với mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 8.50,
        errorRateQuota: 7.74,
        defectCostActual: 720000,
        defectCostTarget: 2000000,
        actionItem: 'Hư hỏng hạ về 720k (đạt mục tiêu ≤ 2M). Tỉ lệ lỗi còn 8.5% cần tiếp tục hỗ trợ công nhân mới khâu bắt vít đĩa tràn.',
      },
      {
        id: 'exec-rma-w38',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W38)',
        khsxLabel: '150 SP',
        actualOutputLabel: '270 SP',
        completionRate: 180.0,
        completionNote: 'Đạt 180% KHSX Trả hàng',
        nsldActual: 91.50,
        nsldTarget: 100.0,
        nsldDeltaNote: '↓ 8.5% so với mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Sản lượng trả bảo hành duy trì mức cao. Tiếp tục tuân thủ nghiêm danh mục vật tư thay thế theo BOM.',
      },
    ],
  },
  'W39': {
    periodLabel: 'W39',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Đối sách tuần',
    actionItemContent: 'Duy trì kiểm soát NSLĐ và chất lượng. Tiếp tục rà soát các công đoạn trọng điểm để đảm bảo mục tiêu.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w39',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W39)',
        khsxLabel: '9.940 SP',
        actualOutputLabel: '9.348,4 SP',
        actualOutput: 9348.4,
        completionRate: 94.1,
        completionNote: 'Đạt 94.1% KHSX',
        nsldActual: 125.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.50,
        errorRateQuota: 7.38,
        defectCostActual: 963848,
        defectCostTarget: 7000000,
        actionItem: 'Tuần xuất sắc: Hư hỏng toàn xưởng chỉ 963k (~1.0M, vượt xa mục tiêu ≤ 7M). Tỉ lệ lỗi hạ về 3.50% so với định mức 7.38%.',
      },
      {
        id: 'exec-ro-w39',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W39)',
        khsxLabel: '5.600 SP',
        actualOutputLabel: '5.008,4 SP',
        actualOutput: 5008.4,
        completionRate: 89.44,
        completionNote: 'Đạt 89.4% KHSX RO',
        nsldActual: 128.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.5,
        attendanceTarget: 95.0,
        errorRateActual: 3.40,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 5000000,
        actionItem: 'Line RO tuần 39 tỉ lệ lỗi 3.40% (thấp hơn định mức 5.20%), chi phí hư hỏng 0 đ (Zero Defect về tổn thất vật tư linh kiện).',
      },
      {
        id: 'exec-bg-w39',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W39)',
        khsxLabel: '4.340 SP',
        actualOutputLabel: '4.340 SP',
        actualOutput: 4340,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX BG',
        nsldActual: 112.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 12% so với mục tiêu 100%',
        attendanceActual: 94.8,
        attendanceTarget: 95.0,
        errorRateActual: 6.80,
        errorRateQuota: 7.74,
        defectCostActual: 963848,
        defectCostTarget: 2000000,
        actionItem: 'Tỉ lệ lỗi đạt chuẩn 6.80% (dưới định mức 7.74%). Hư hỏng 963k đạt mục tiêu. Tập trung đối sách hạn chế xước mặt kính đôi.',
      },
      {
        id: 'exec-rma-w39',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W39)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Không có KHSX RMA',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 94.8,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Tuần 39 không có kế hoạch sản xuất RMA (NSLĐ 0%). Nguồn nhân lực được tập trung hỗ trợ các dây chuyền chính.',
      },
    ],
  },
  'W40': {
    periodLabel: 'W40',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Đối sách tuần W40',
    actionItemContent: 'Tuần giao thoa cuối tháng 9 và đầu tháng 10. Duy trì kiểm soát nhịp chuyền ổn định và đảm bảo tỷ lệ lỗi dưới định mức.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w40',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W40)',
        khsxLabel: '5.800 SP',
        actualOutputLabel: '5.620 SP',
        actualOutput: 5620,
        completionRate: 96.9,
        completionNote: 'Đạt 96.9% KHSX',
        nsldActual: 119.2,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Tiệm cận mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 4.20,
        errorRateQuota: 7.38,
        defectCostActual: 1100000,
        defectCostTarget: 7000000,
        actionItem: 'Toàn xưởng đạt NSLĐ 119.2%, tỷ lệ đi làm 98.0%. Chi phí hư hỏng 1.1M nằm trong vùng an toàn (mục tiêu ≤ 7M).',
      },
      {
        id: 'exec-ro-w40',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W40)',
        khsxLabel: '3.200 SP',
        actualOutputLabel: '3.100 SP',
        actualOutput: 3100,
        completionRate: 96.9,
        completionNote: 'Đạt 96.9% KHSX RO',
        nsldActual: 119.5,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Tiệm cận mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 3.60,
        errorRateQuota: 5.20,
        defectCostActual: 520000,
        defectCostTarget: 5000000,
        actionItem: 'Line RO tuần 40 tỷ lệ lỗi 3.60% (định mức 5.20%), chi phí hư hỏng 520.000 VNĐ kiểm soát tốt.',
      },
      {
        id: 'exec-bg-w40',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W40)',
        khsxLabel: '2.600 SP',
        actualOutputLabel: '2.520 SP',
        actualOutput: 2520,
        completionRate: 96.9,
        completionNote: 'Đạt 96.9% KHSX BG',
        nsldActual: 114.5,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 14.5% so với mục tiêu 100%',
        attendanceActual: 97.5,
        attendanceTarget: 95.0,
        errorRateActual: 5.80,
        errorRateQuota: 7.74,
        defectCostActual: 580000,
        defectCostTarget: 2000000,
        actionItem: 'Line BG hoàn thành 96.9% KHSX, NSLĐ 114.5% vượt chuẩn. Tỷ lệ lỗi 5.80% dưới định mức 7.74%.',
      },
      {
        id: 'exec-rma-w40',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W40)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Không có KHSX RMA',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 97.5,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Tuần 40 không có kế hoạch RMA riêng lẻ.',
      },
    ],
  },
  'W41': {
    periodLabel: 'W41',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Đối sách tuần W41 (Hiện tại)',
    actionItemContent: 'Duy trì đà tăng trưởng NSLĐ toàn xưởng 122.6% (vượt mục tiêu 120%), bám sát kế hoạch sản xuất tuần đạt 101.5% (9.500/9.360 SP) và giữ vững tỷ lệ lỗi thao tác 3.40% dưới định mức 7.38%. Tuần 41 hiện tại kiểm soát tốt hư hỏng (0 đ - Zero Defect).',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w41',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W41)',
        khsxLabel: '9.360 SP',
        actualOutputLabel: '9.500 SP',
        actualOutput: 9500,
        completionRate: 101.5,
        completionNote: 'Đạt 101.5% KHSX',
        nsldActual: 122.6,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 3.40,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 7000000,
        actionItem: 'Tuần 41 (Hiện tại): Toàn xưởng tiếp tục duy trì đà tăng trưởng NSLĐ 122.6% (vượt mục tiêu 120%), KHSX đạt 101.5% (9.500/9.360 SP), tỷ lệ lỗi 3.40% (dưới định mức 7.38%), chi phí hư hỏng 0 đ (Zero Defect).',
      },
      {
        id: 'exec-ro-w41',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W41)',
        khsxLabel: '5.040 SP',
        actualOutputLabel: '5.120 SP',
        actualOutput: 5120,
        completionRate: 101.6,
        completionNote: 'Đạt 101.6% KHSX RO',
        nsldActual: 123.4,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.5,
        attendanceTarget: 95.0,
        errorRateActual: 2.90,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 5000000,
        actionItem: 'Line RO tuần 41 vượt kế hoạch (101.6%), NSLĐ 123.4% (vượt mục tiêu 120%), tỷ lệ lỗi 2.90% rất thấp so với định mức 5.20%, chưa phát sinh hư hỏng (0 đ).',
      },
      {
        id: 'exec-bg-w41',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W41)',
        khsxLabel: '4.320 SP',
        actualOutputLabel: '4.380 SP',
        actualOutput: 4380,
        completionRate: 101.4,
        completionNote: 'Đạt 101.4% KHSX BG',
        nsldActual: 115.8,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 15.8% so với mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 5.40,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2000000,
        actionItem: 'Line BG tuần 41 đạt sản lượng 4.380 SP (101.4% KHSX), NSLĐ 115.8% vượt xa mục tiêu 100%, tỷ lệ lỗi 5.40% nằm trong định mức 7.74%, chưa phát sinh hư hỏng (0 đ).',
      },
      {
        id: 'exec-rma-w41',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W41)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Không có KHSX RMA',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh sản xuất & không có dữ liệu báo cáo',
        actionItem: 'Tuần 41: RMA không có sản xuất và không có dữ liệu báo cáo. Nguồn nhân lực tập trung hỗ trợ các dây chuyền chính.',
      },
    ],
  },
  'W42': {
    periodLabel: 'W42',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Kế hoạch Tuần W42',
    actionItemContent: 'Chuẩn bị kế hoạch sản xuất tuần tiếp theo, kiểm tra sẵn sàng nguyên vật liệu và bố trí nhân lực chuyền. Chi phí hư hỏng mục tiêu 0 đ.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w42',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W42)',
        khsxLabel: '9.400 SP',
        actualOutputLabel: '9.580 SP',
        actualOutput: 9580,
        completionRate: 101.9,
        completionNote: 'Đạt 101.9% KHSX',
        nsldActual: 120.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Đạt mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.50,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 7000000,
        actionItem: 'Dự kiến NSLĐ duy trì ở mức 120%, chi phí hư hỏng chưa phát sinh (0 đ).',
      },
      {
        id: 'exec-ro-w42',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W42)',
        khsxLabel: '5.040 SP',
        actualOutputLabel: '5.100 SP',
        actualOutput: 5100,
        completionRate: 101.2,
        completionNote: 'Đạt 101.2% KHSX RO',
        nsldActual: 120.5,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Đạt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 3.00,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 5000000,
        actionItem: 'Duy trì ổn định chất lượng và kiểm soát linh kiện (0 đ hư hỏng).',
      },
      {
        id: 'exec-bg-w42',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W42)',
        khsxLabel: '4.360 SP',
        actualOutputLabel: '4.480 SP',
        actualOutput: 4480,
        completionRate: 102.8,
        completionNote: 'Đạt 102.8% KHSX BG',
        nsldActual: 115.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 15% so với mục tiêu 100%',
        attendanceActual: 97.8,
        attendanceTarget: 95.0,
        errorRateActual: 5.20,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2000000,
        actionItem: 'Giữ vững nhịp chuyền và kiểm soát linh kiện mâm đốt (0 đ hư hỏng).',
      },
      {
        id: 'exec-rma-w42',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W42)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Theo kế hoạch',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Bám sát kế hoạch trả hàng RMA.',
      },
    ],
  },
  'W43': {
    periodLabel: 'W43',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Kế hoạch Tuần W43',
    actionItemContent: 'Duy trì năng suất cao các chuyền, kiểm soát tỷ lệ lỗi và linh kiện vật tư.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w43',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W43)',
        khsxLabel: '9.400 SP',
        actualOutputLabel: '9.620 SP',
        actualOutput: 9620,
        completionRate: 102.3,
        completionNote: 'Đạt 102.3% KHSX',
        nsldActual: 122.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.40,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 7000000,
        actionItem: 'Toàn xưởng NSLĐ 122.0%, kiểm soát tốt chi phí vật tư.',
      },
      {
        id: 'exec-ro-w43',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W43)',
        khsxLabel: '5.040 SP',
        actualOutputLabel: '5.150 SP',
        actualOutput: 5150,
        completionRate: 102.2,
        completionNote: 'Đạt 102.2% KHSX RO',
        nsldActual: 122.5,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 2.80,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 5000000,
        actionItem: 'Line RO NSLĐ 122.5%, chất lượng đảm bảo.',
      },
      {
        id: 'exec-bg-w43',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W43)',
        khsxLabel: '4.360 SP',
        actualOutputLabel: '4.470 SP',
        actualOutput: 4470,
        completionRate: 102.5,
        completionNote: 'Đạt 102.5% KHSX BG',
        nsldActual: 117.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 17% so với mục tiêu 100%',
        attendanceActual: 97.8,
        attendanceTarget: 95.0,
        errorRateActual: 5.30,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2000000,
        actionItem: 'Line BG NSLĐ 117.0%, hoàn thành vượt kế hoạch.',
      },
      {
        id: 'exec-rma-w43',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W43)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Theo kế hoạch',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Theo dõi linh kiện thay thế RMA.',
      },
    ],
  },
  'W44': {
    periodLabel: 'W44',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Kế hoạch Tuần W44',
    actionItemContent: 'Tuần cuối Tháng 10: Tổng kết số liệu sản xuất tháng, chuẩn bị chuyển giao Tháng 11.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w44',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W44)',
        khsxLabel: '9.400 SP',
        actualOutputLabel: '9.550 SP',
        actualOutput: 9550,
        completionRate: 101.6,
        completionNote: 'Đạt 101.6% KHSX',
        nsldActual: 121.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.40,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 7000000,
        actionItem: 'Toàn xưởng hoàn thành KHSX tháng 10, NSLĐ 121.0%.',
      },
      {
        id: 'exec-ro-w44',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (W44)',
        khsxLabel: '5.040 SP',
        actualOutputLabel: '5.110 SP',
        actualOutput: 5110,
        completionRate: 101.4,
        completionNote: 'Đạt 101.4% KHSX RO',
        nsldActual: 121.5,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 2.85,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 5000000,
        actionItem: 'Line RO hoàn thành xuất sắc tháng 10, NSLĐ 121.5%.',
      },
      {
        id: 'exec-bg-w44',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (W44)',
        khsxLabel: '4.360 SP',
        actualOutputLabel: '4.440 SP',
        actualOutput: 4440,
        completionRate: 101.8,
        completionNote: 'Đạt 101.8% KHSX BG',
        nsldActual: 116.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 16% so với mục tiêu 100%',
        attendanceActual: 97.8,
        attendanceTarget: 95.0,
        errorRateActual: 5.35,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2000000,
        actionItem: 'Line BG hoàn thành KHSX tháng 10, NSLĐ 116.0%.',
      },
      {
        id: 'exec-rma-w44',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W44)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Theo kế hoạch',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Tổng kết hoàn thành trả hàng bảo hành.',
      },
    ],
  },
};

// Helper: Parse Vietnamese formatted numbers safely (e.g. "17.420,4 SP" -> 17420.4, "1.853,6" -> 1853.6, "1.553" -> 1553)
export function parseVNNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  // Extract only digits, comma, dot, and minus
  let clean = str.replace(/[^\d.,-]/g, '').trim();
  if (!clean) return 0;

  if (clean.includes('.') && clean.includes(',')) {
    // Standard Vietnamese: 17.420,4 -> remove dot, replace comma with dot
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // 17420,4 or 17,42
    clean = clean.replace(',', '.');
  } else if (clean.includes('.')) {
    // Could be thousands separator like 15.000 or decimal 113.5
    const parts = clean.split('.');
    if (parts.length > 2) {
      // 1.234.567 -> thousands separators
      clean = clean.replace(/\./g, '');
    } else if (parts.length === 2) {
      // If 3 digits after dot, like "1.553" or "15.000", treat as thousand separator
      if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        clean = clean.replace(/\./g, '');
      }
    }
  }

  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

// Helper: Format number to Vietnamese locale
export function formatVNNumber(num: number, maxDecimals: number = 1): string {
  if (isNaN(num)) return '0';
  if (Number.isInteger(num)) {
    return num.toLocaleString('vi-VN');
  }
  return num.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export const BASE_MONTHLY_SUMMARY: Record<string, ExecutiveSummaryPeriodResult> = {
  'Tháng 12': {
    periodLabel: 'Tháng 12',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng 12',
    actionItemContent: 'Tháng cao điểm hoàn thành kế hoạch năm 2026: Đảm bảo sản lượng 19.500 SP, duy trì NSLĐ ≥ 120%, tỷ lệ đi làm 98%, kiểm soát chất lượng xuất xưởng.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-m12',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (Tháng 12)',
        khsxLabel: '19.500 SP',
        actualOutputLabel: '19.500 SP',
        actualOutput: 19500,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
        nsldActual: 120.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Mục tiêu ≥ 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.50,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 6500000,
        actionItem: 'Tháng 12 Toàn Phân Xưởng: KHSX 19.500 SP, Thực hiện 19.500 SP (100% KHSX). NSLĐ 120.0%, Đi làm 98.0%. Chi phí hư hỏng 0 đ.',
      },
      {
        id: 'exec-ro-m12',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (Tháng 12)',
        khsxLabel: '16.500 SP',
        actualOutputLabel: '16.500 SP',
        actualOutput: 16500,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX RO',
        nsldActual: 120.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Đạt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 3.00,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 3500000,
        actionItem: 'Line RO Tháng 12: KHSX 16.500 SP, Thực hiện 16.500 SP (100% KHSX), NSLĐ 120.0%, Đi làm 98.2%, Tỉ lệ lỗi 3.00% dưới định mức. Chưa phát sinh hư hỏng (0 đ).',
      },
      {
        id: 'exec-bg-m12',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (Tháng 12)',
        khsxLabel: '3.000 SP',
        actualOutputLabel: '3.000 SP',
        actualOutput: 3000,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX BG',
        nsldActual: 100.0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Đạt mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 6.50,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2500000,
        actionItem: 'Line BG Tháng 12: KHSX 3.000 SP, Thực hiện 3.000 SP (100% KHSX), NSLĐ 100.0%, Tỉ lệ lỗi 6.50% dưới định mức. Hư hỏng 0 đ.',
      },
      {
        id: 'exec-rma-m12',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (Tháng 12)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Không có KHSX RMA',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh sản xuất & không có dữ liệu báo cáo',
        actionItem: 'Tháng 12: Tổ RMA không có sản xuất riêng, dồn lực hỗ trợ đóng gói và xuất hàng.',
      },
    ],
  },
  'Tháng 11': {
    periodLabel: 'Tháng 11',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng 11',
    actionItemContent: 'Kế hoạch sản xuất Tháng 11: Đảm bảo KHSX 18.000 SP, NSLĐ toàn xưởng ≥ 120%, kiểm soát chặt chẽ tỷ lệ lỗi thao tác và không để phát sinh chi phí hư hỏng vật tư ngoài định mức.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-m11',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (Tháng 11)',
        khsxLabel: '18.000 SP',
        actualOutputLabel: '18.000 SP',
        actualOutput: 18000,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX',
        nsldActual: 120.1,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Mục tiêu ≥ 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.59,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 6500000,
        actionItem: 'Tháng 11 Toàn Phân Xưởng: KHSX 18.000 SP, Thực hiện 18.000 SP (100% KHSX). NSLĐ 120.1%, Đi làm 98.0%. Chi phí hư hỏng 0 đ.',
      },
      {
        id: 'exec-ro-m11',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (Tháng 11)',
        khsxLabel: '15.400 SP',
        actualOutputLabel: '15.400 SP',
        actualOutput: 15400,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX RO',
        nsldActual: 120.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Đạt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 3.00,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 3500000,
        actionItem: 'Line RO Tháng 11: KHSX 15.400 SP, Thực hiện 15.400 SP (100% KHSX), NSLĐ 120.0%, Đi làm 98.2%, Tỉ lệ lỗi 3.00% dưới định mức 5.20%. Chưa phát sinh hư hỏng (0 đ).',
      },
      {
        id: 'exec-bg-m11',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (Tháng 11)',
        khsxLabel: '2.600 SP',
        actualOutputLabel: '2.600 SP',
        actualOutput: 2600,
        completionRate: 100.0,
        completionNote: 'Đạt 100% KHSX BG',
        nsldActual: 100.6,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 0.6% so với mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 6.70,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2500000,
        actionItem: 'Line BG Tháng 11: KHSX 2.600 SP, Thực hiện 2.600 SP (100% KHSX), NSLĐ 100.6%, Tỉ lệ lỗi 6.70% dưới định mức 7.74%. Hư hỏng 0 đ.',
      },
      {
        id: 'exec-rma-m11',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (Tháng 11)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Không có KHSX RMA',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất (0%)',
        attendanceActual: 0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh sản xuất & không có dữ liệu báo cáo',
        actionItem: 'Tháng 11: Tổ RMA không có sản xuất riêng, nhân sự điều động hỗ trợ sản xuất các dây chuyền chính.',
      },
    ],
  },
  'Tháng 10': {
    periodLabel: 'Tháng 10',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng 10',
    actionItemContent: 'Toàn xưởng bám sát kế hoạch sản xuất 18.200 SP, NSLĐ toàn xưởng duy trì 118.7% (RO 121.1%, BG 102.7%). Chi phí hư hỏng Tháng 10 hiện là 0 đ (Tuần 41 chưa cập nhật hư hỏng).',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-m10',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (Tháng 10)',
        khsxLabel: '18.200 SP',
        actualOutputLabel: '17.730 SP',
        actualOutput: 17730,
        completionRate: 97.4,
        completionNote: 'Đạt 97.4% KHSX',
        nsldActual: 118.7,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Mục tiêu ≥ 120%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.42,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 6500000,
        actionItem: 'Tháng 10 Toàn Phân Xưởng: KHSX 18.200 SP, Thực hiện 17.730 SP (97.4% KHSX). NSLĐ 118.7%, Đi làm 98.0%. Chi phí hư hỏng Tháng 10 hiện là 0 đ (Tuần 41 chưa cập nhật dữ liệu hư hỏng).',
      },
      {
        id: 'exec-ro-m10',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (Tháng 10)',
        khsxLabel: '15.600 SP',
        actualOutputLabel: '15.280 SP',
        actualOutput: 15280,
        completionRate: 97.9,
        completionNote: 'Đạt 97.9% KHSX RO',
        nsldActual: 121.1,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 2.80,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 3500000,
        actionItem: 'Line RO Tháng 10: KHSX 15.600 SP, Thực hiện 15.280 SP (97.9% KHSX), NSLĐ 121.1% vượt chuẩn 120%, Đi làm 98.2%, Tỉ lệ lỗi 2.80% dưới định mức 5.20%. Chưa phát sinh hư hỏng (0 đ).',
      },
      {
        id: 'exec-bg-m10',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (Tháng 10)',
        khsxLabel: '2.600 SP',
        actualOutputLabel: '2.450 SP',
        actualOutput: 2450,
        completionRate: 94.2,
        completionNote: 'Đạt 94.2% KHSX BG',
        nsldActual: 102.7,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 2.7% so với mục tiêu 100%',
        attendanceActual: 97.5,
        attendanceTarget: 95.0,
        errorRateActual: 5.80,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2500000,
        actionItem: 'Line BG Tháng 10: KHSX 2.600 SP, Thực hiện 2.450 SP (94.2% KHSX), NSLĐ 102.7% đạt trên chuẩn 100%. Tỉ lệ lỗi 5.80% đạt định mức 7.74%. Chưa phát sinh hư hỏng (0 đ).',
      },
      {
        id: 'exec-rma-m10',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (Tháng 10)',
        khsxLabel: '0 SP',
        actualOutputLabel: '380 SP',
        actualOutput: 380,
        completionRate: 100.0,
        completionNote: 'SL Quy đổi RMA: 380 SP',
        nsldActual: 100.0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Đạt mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Sản lượng quy đổi RMA Tháng 10 đạt 380 SP, kiểm soát 100% định mức linh kiện theo BOM.',
      },
    ],
  },
  'Tháng 9': {
    periodLabel: 'Tháng 9',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng',
    actionItemContent: 'Tổng kết kết quả sản xuất tháng và đề ra mục tiêu cho tháng tiếp theo. Tập trung kiểm soát các chỉ số NSLĐ và Chất Lượng.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-m09',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (Tháng 9)',
        khsxLabel: '17.420,4 SP',
        actualOutputLabel: '16.680,1 SP',
        actualOutput: 16680.1,
        completionRate: 95.8,
        completionNote: 'Đạt 95.8% KHSX',
        nsldActual: 117.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Mục tiêu ≥ 120%',
        attendanceActual: 97.7,
        attendanceTarget: 95.0,
        errorRateActual: 3.59,
        errorRateQuota: 7.38,
        defectCostActual: 5200000,
        defectCostTarget: 6200000,
        actionItem: 'Tháng 9 Toàn Phân Xưởng: KHSX 17.420,4 SP, Thực hiện 16.680,1 SP (Đạt 95.8% KHSX = RO 15.127,1 + BG 1.553 + RMA 0). NSLĐ 117.0%, Đi làm 97.7%. Chi phí hư hỏng 5.2M dưới mục tiêu 6.2M.',
      },
      {
        id: 'exec-ro-m09',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (Tháng 9)',
        khsxLabel: '15.566,8 SP',
        actualOutputLabel: '15.127,1 SP',
        actualOutput: 15127.1,
        completionRate: 97.2,
        completionNote: 'Đạt 97.2% KHSX RO',
        nsldActual: 117.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Mục tiêu ≥ 120%',
        attendanceActual: 97.7,
        attendanceTarget: 95.0,
        errorRateActual: 3.0,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 3500000,
        actionItem: 'Line RO Tháng 9: KHSX 15.566,8 SP, Thực hiện 15.127,1 SP (97.2% KHSX), NSLĐ 117.0%, Đi làm 97.7%, Đạt Zero Defect hư hỏng vật tư.',
      },
      {
        id: 'exec-bg-m09',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (Tháng 9)',
        khsxLabel: '1.853,6 SP',
        actualOutputLabel: '1.553 SP',
        actualOutput: 1553,
        completionRate: 83.8,
        completionNote: 'Đạt 83.8% KHSX BG',
        nsldActual: 97.0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Mục tiêu ≥ 100%',
        attendanceActual: 94.8,
        attendanceTarget: 95.0,
        errorRateActual: 6.7,
        errorRateQuota: 7.74,
        defectCostActual: 878011,
        defectCostTarget: 2000000,
        actionItem: 'Line BG Tháng 9: KHSX 1.853,6 SP, Thực hiện 1.553 SP (83.8% KHSX), NSLĐ 97%, Tỉ lệ lỗi 6.7% đạt định mức 7.74%. Hư hỏng 878.011 VNĐ dưới mục tiêu 2 triệu.',
      },
      {
        id: 'exec-rma-m09',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (Tháng 9)',
        khsxLabel: '0 SP',
        actualOutputLabel: '0 SP',
        actualOutput: 0,
        completionRate: 0,
        completionNote: 'Không có KHSX RMA',
        nsldActual: 0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Không phát sinh sản xuất',
        attendanceActual: 94.8,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Không phát sinh kế hoạch RMA Tháng 9, kiểm soát 100% định mức linh kiện theo BOM.',
      },
    ],
  },
  'Tháng 8': {
    periodLabel: 'Tháng 8',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng 8',
    actionItemContent: 'Hạ chi phí hư hỏng vật tư từ 7.1M về 5.9M. Ổn định nguồn nhân lực các dây chuyền lắp ráp để chuẩn bị cho cao điểm quý 4.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-m08',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (Tháng 8)',
        khsxLabel: '15.000 SP',
        actualOutputLabel: '11.718 SP',
        completionRate: 78.1,
        completionNote: '11.718 / 15.000 SP',
        nsldActual: 132.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 95.5,
        attendanceTarget: 95.0,
        errorRateActual: 5.10,
        errorRateQuota: 7.38,
        defectCostActual: 5900000,
        defectCostTarget: 6500000,
        actionItem: 'NSLĐ đạt 132%, chi phí hư hỏng 5.9M kiểm soát tốt dưới mục tiêu 6.5M.',
      },
      {
        id: 'exec-ro-m08',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (Tháng 8)',
        khsxLabel: '8.500 SP',
        actualOutputLabel: '6.900 SP',
        completionRate: 81.2,
        completionNote: '6.900 / 8.500 SP',
        nsldActual: 134.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 96.0,
        attendanceTarget: 95.0,
        errorRateActual: 3.40,
        errorRateQuota: 5.20,
        defectCostActual: 3540000,
        defectCostTarget: 3800000,
        actionItem: 'Kiểm soát tốt lỗi đấu nối điện và đĩa chống tràn, chất lượng xuất xưởng ổn định.',
      },
      {
        id: 'exec-bg-m08',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (Tháng 8)',
        khsxLabel: '6.500 SP',
        actualOutputLabel: '4.818 SP',
        completionRate: 74.1,
        completionNote: '4.818 / 6.500 SP',
        nsldActual: 120.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 20% so với mục tiêu 100%',
        attendanceActual: 95.0,
        attendanceTarget: 95.0,
        errorRateActual: 7.80,
        errorRateQuota: 7.74,
        defectCostActual: 2360000,
        defectCostTarget: 2700000,
        actionItem: 'Tỉ lệ lỗi 7.80% xấp xỉ định mức. Chi phí hư hỏng đạt 2.36M dưới ngưỡng trần 2.7M.',
      },
      {
        id: 'exec-rma-m08',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (Tháng 8)',
        khsxLabel: '500 SP',
        actualOutputLabel: '700 SP',
        completionRate: 140.0,
        completionNote: 'Đạt 140% KHSX',
        nsldActual: 90.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↓ 10% so với mục tiêu 100%',
        attendanceActual: 95.5,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Đáp ứng tốt tiến độ trả hàng bảo hành sau vụ việc cao điểm mùa hè.',
      },
    ],
  },
  'Tháng 7': {
    periodLabel: 'Tháng 7',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng 7',
    actionItemContent: 'Tập trung trả nợ đơn hàng tồn kho, tăng cường kiểm tra chất lượng kính chịu lực đầu vào tránh nứt vỡ trong lắp ráp.',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-m07',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (Tháng 7)',
        khsxLabel: '22.400 SP',
        actualOutputLabel: '20.698 SP',
        completionRate: 92.4,
        completionNote: '20.698 / 22.400 SP',
        nsldActual: 116.0,
        nsldTarget: 120.0,
        nsldDeltaNote: '↓ 4% so với mục tiêu 120%',
        attendanceActual: 94.0,
        attendanceTarget: 95.0,
        errorRateActual: 5.80,
        errorRateQuota: 7.38,
        defectCostActual: 7100000,
        defectCostTarget: 8100000,
        actionItem: 'Sản lượng đạt 20.698 SP, chi phí hư hỏng 7.1M nằm trong hạn mức 8.1M cho phép.',
      },
      {
        id: 'exec-ro-m07',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (Tháng 7)',
        khsxLabel: '13.000 SP',
        actualOutputLabel: '12.100 SP',
        completionRate: 93.1,
        completionNote: '12.100 / 13.000 SP',
        nsldActual: 118.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Tiệm cận mục tiêu 120%',
        attendanceActual: 94.5,
        attendanceTarget: 95.0,
        errorRateActual: 4.10,
        errorRateQuota: 5.20,
        defectCostActual: 4260000,
        defectCostTarget: 4800000,
        actionItem: 'Line RO hoàn thành 12.100 máy, tỉ lệ lỗi 4.10% đạt chỉ tiêu.',
      },
      {
        id: 'exec-bg-m07',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (Tháng 7)',
        khsxLabel: '9.400 SP',
        actualOutputLabel: '8.598 SP',
        completionRate: 91.5,
        completionNote: '8.598 / 9.400 SP',
        nsldActual: 105.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 5% so với mục tiêu 100%',
        attendanceActual: 93.5,
        attendanceTarget: 95.0,
        errorRateActual: 8.60,
        errorRateQuota: 7.74,
        defectCostActual: 2840000,
        defectCostTarget: 3300000,
        actionItem: 'Tỉ lệ lỗi 8.60% hơi cao do công nhân mới, cần đào tạo lại khâu siết ốc cụm đánh lửa.',
      },
      {
        id: 'exec-rma-m07',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (Tháng 7)',
        khsxLabel: '500 SP',
        actualOutputLabel: '850 SP',
        completionRate: 170.0,
        completionNote: 'Đạt 170% KHSX',
        nsldActual: 86.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↓ 14% so với mục tiêu 100%',
        attendanceActual: 94.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Khối lượng hàng bảo hành lớn trong tháng 7, tập trung giải phóng hàng tồn.',
      },
    ],
  },
  'Tháng 6': {
    periodLabel: 'Tháng 6',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng 6',
    actionItemContent: 'Chi phí hư hỏng đỉnh điểm 10.8M, cần hành động khẩn cải tiến thao tác lắp mâm đánh lửa và đóng gói thùng carton.',
    isUrgentAction: true,
    units: [
      {
        id: 'exec-pxlr-m06',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (Tháng 6)',
        khsxLabel: '21.891 SP',
        actualOutputLabel: '20.850 SP',
        completionRate: 95.2,
        completionNote: '20.850 / 21.891 SP',
        nsldActual: 132.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 93.0,
        attendanceTarget: 95.0,
        errorRateActual: 6.40,
        errorRateQuota: 7.38,
        defectCostActual: 10800000,
        defectCostTarget: 10800000,
        actionItem: 'Tháng 6 sản lượng cao kỷ lục 20.850 SP. Chi phí hư hỏng chạm trần 10.8M cần cắt giảm mạnh trong tháng 7.',
      },
      {
        id: 'exec-ro-m06',
        unitKey: 'RO',
        unitName: 'Line Máy Lọc Nước RO (Tháng 6)',
        khsxLabel: '12.500 SP',
        actualOutputLabel: '12.000 SP',
        completionRate: 96.0,
        completionNote: '12.000 / 12.500 SP',
        nsldActual: 135.0,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 93.5,
        attendanceTarget: 95.0,
        errorRateActual: 4.80,
        errorRateQuota: 5.20,
        defectCostActual: 6480000,
        defectCostTarget: 6500000,
        actionItem: 'NSLĐ đạt 135%, kiểm soát tốt linh kiện van áp và màng RO.',
      },
      {
        id: 'exec-bg-m06',
        unitKey: 'BG',
        unitName: 'Line DC Bếp Gas (Tháng 6)',
        khsxLabel: '9.391 SP',
        actualOutputLabel: '8.850 SP',
        completionRate: 94.2,
        completionNote: '8.850 / 9.391 SP',
        nsldActual: 115.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 15% so với mục tiêu 100%',
        attendanceActual: 92.5,
        attendanceTarget: 95.0,
        errorRateActual: 9.20,
        errorRateQuota: 7.74,
        defectCostActual: 4320000,
        defectCostTarget: 4300000,
        actionItem: 'CẢNH BÁO: Tỉ lệ lỗi 9.20% vượt định mức, chi phí hư hỏng 4.32M cao cần cải tiến đồ gá.',
      },
      {
        id: 'exec-rma-m06',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (Tháng 6)',
        khsxLabel: '500 SP',
        actualOutputLabel: '800 SP',
        completionRate: 160.0,
        completionNote: 'Đạt 160% KHSX',
        nsldActual: 84.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↓ 16% so với mục tiêu 100%',
        attendanceActual: 93.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Tập trung trả nợ hàng bảo hành điều hòa và quạt mát chuyển tiếp sang mùa nóng.',
      },
    ],
  },
};

/**
 * Tự động đồng bộ số liệu chi phí hư hỏng và NSLĐ từ data được cập nhật trong App
 */
/**
 * Helper tìm kiếm khớp tuần linh hoạt (hỗ trợ "W39", "Tuần 39", "39", "w39")
 */
export function isMatchingWeekKey(labelA?: string, labelB?: string): boolean {
  if (!labelA || !labelB) return false;
  const numA = (labelA.match(/\d+/) || [])[0];
  const numB = (labelB.match(/\d+/) || [])[0];
  if (numA && numB) return numA === numB;
  return labelA.trim().toLowerCase() === labelB.trim().toLowerCase();
}

export function isMatchingMonthKey(labelA?: string, labelB?: string): boolean {
  if (!labelA || !labelB) return false;
  const numA = (labelA.match(/\d+/) || [])[0];
  const numB = (labelB.match(/\d+/) || [])[0];
  if (numA && numB) return parseInt(numA, 10) === parseInt(numB, 10);
  return labelA.trim().toLowerCase() === labelB.trim().toLowerCase();
}

/**
 * Helper tìm cột tuần trong ma trận DCRO và DCBG
 */
export const findWeekColumnInMatrices = (weekStr: string) => {
  const wNum = extractWeekNumber(weekStr);
  let primaryMonthIdx = 8; // Tháng 9 (index 8)
  if (wNum >= 41 && wNum <= 44) primaryMonthIdx = 9; // Tháng 10 (index 9)
  else if (wNum >= 45 && wNum <= 48) primaryMonthIdx = 10; // Tháng 11 (index 10)
  else if (wNum >= 49) primaryMonthIdx = 11; // Tháng 12 (index 11)
  else if (wNum <= 35) primaryMonthIdx = 7; // Tháng 8 (index 7)

  const monthsToCheck = [primaryMonthIdx, 8, 9, 7, 5, 6, 10, 11];
  for (const mIdx of monthsToCheck) {
    const matRO = StorageService.getMatrixROForMonth(2026, mIdx) || [];
    const matBG = StorageService.getMatrixBGForMonth(2026, mIdx) || [];
    const colRO = matRO.find(c => c.isWeeklyTotal && (c.label === weekStr || c.label.startsWith(weekStr + ' ') || isMatchingWeekKey(c.label, weekStr)));
    const colBG = matBG.find(c => c.isWeeklyTotal && (c.label === weekStr || c.label.startsWith(weekStr + ' ') || isMatchingWeekKey(c.label, weekStr)));
    if (colRO || colBG) {
      return { colRO, colBG };
    }
  }
  return { colRO: undefined, colBG: undefined };
};

/**
 * Tính toán số liệu báo cáo điều hành THEO TUẦN (W22 -> W52)
 * Cập nhật chính xác theo dữ liệu của từng tuần, không copy W39
 */
export function getWeeklyExecutiveSummaryData(
  weekKey: string,
  defectCostData?: SlideDefectCostData,
  monthlyHistory?: MonthlyHistoryRecord[],
  slide1Data?: Slide1NSLDData,
  slide2QualityData?: Slide2QualityData,
  globalNorms?: GlobalNormsConfig
): ExecutiveSummaryPeriodResult {
  const activeSlide1 = slide1Data || StorageService.getSlide1NSLD();
  const activeSlide2 = slide2QualityData || StorageService.getSlide2Quality();
  const activeSlide3 = defectCostData || StorageService.getSlide3DefectCost();
  const activeNorms = globalNorms || StorageService.getGlobalNorms();

  let base = BASE_WEEKLY_SUMMARY[weekKey];
  if (!base) {
    const monthOfW = getMonthForWeek(weekKey);
    base = {
      periodLabel: weekKey,
      timeFrame: 'week',
      actionItemTitle: `Việc cần làm - Đối sách tuần ${weekKey}`,
      actionItemContent: `Tuần ${weekKey} (${monthOfW}): Duy trì ổn định sản xuất, kiểm soát chất lượng và năng suất lao động.`,
      isUrgentAction: false,
      units: [
        {
          id: `exec-pxlr-${weekKey.toLowerCase()}`,
          unitKey: 'PXLR',
          unitName: `PXLR Toàn Xưởng (${weekKey})`,
          khsxLabel: '8.640 SP',
          actualOutputLabel: '8.640 SP',
          actualOutput: 8640,
          completionRate: 100.0,
          completionNote: 'Đạt 100% KHSX',
          nsldActual: 120.0,
          nsldTarget: activeNorms.nsldTarget.pxlr,
          nsldDeltaNote: 'Đạt mục tiêu 120%',
          attendanceActual: 98.1,
          attendanceTarget: activeNorms.attendanceTarget.pxlr,
          errorRateActual: 3.40,
          errorRateQuota: activeNorms.errorRateQuota.pxlr,
          defectCostActual: 0,
          defectCostTarget: activeNorms.defectCostTarget.pxlr,
          actionItem: `Toàn xưởng ${weekKey} duy trì ổn định sản xuất và kiểm soát chi phí.`,
        },
        {
          id: `exec-ro-${weekKey.toLowerCase()}`,
          unitKey: 'RO',
          unitName: `Line Máy Lọc Nước RO (${weekKey})`,
          khsxLabel: '4.320 SP',
          actualOutputLabel: '4.320 SP',
          actualOutput: 4320,
          completionRate: 100.0,
          completionNote: 'Đạt 100% KHSX RO',
          nsldActual: 120.0,
          nsldTarget: activeNorms.nsldTarget.ro,
          nsldDeltaNote: 'Đạt mục tiêu 120%',
          attendanceActual: 98.2,
          attendanceTarget: activeNorms.attendanceTarget.ro,
          errorRateActual: 2.90,
          errorRateQuota: activeNorms.errorRateQuota.ro,
          defectCostActual: 0,
          defectCostTarget: activeNorms.defectCostTarget.ro,
          actionItem: `Line RO ${weekKey} duy trì nhịp độ sản xuất theo kế hoạch.`,
        },
        {
          id: `exec-bg-${weekKey.toLowerCase()}`,
          unitKey: 'BG',
          unitName: `Line DC Bếp Gas (${weekKey})`,
          khsxLabel: '4.320 SP',
          actualOutputLabel: '4.320 SP',
          actualOutput: 4320,
          completionRate: 100.0,
          completionNote: 'Đạt 100% KHSX BG',
          nsldActual: 105.0,
          nsldTarget: activeNorms.nsldTarget.bg,
          nsldDeltaNote: 'Đạt mục tiêu 100%',
          attendanceActual: 98.0,
          attendanceTarget: activeNorms.attendanceTarget.bg,
          errorRateActual: 5.20,
          errorRateQuota: activeNorms.errorRateQuota.bg,
          defectCostActual: 0,
          defectCostTarget: activeNorms.defectCostTarget.bg,
          actionItem: `Line BG ${weekKey} đảm bảo kiểm soát chất lượng linh kiện mâm đánh lửa.`,
        },
        {
          id: `exec-rma-${weekKey.toLowerCase()}`,
          unitKey: 'RMA',
          unitName: `Tổ Sửa Chữa / Bảo Hành RMA (${weekKey})`,
          khsxLabel: '0 SP',
          actualOutputLabel: '0 SP',
          actualOutput: 0,
          completionRate: 0,
          completionNote: 'Không có KHSX RMA',
          nsldActual: 0,
          nsldTarget: 100.0,
          nsldDeltaNote: 'Không phát sinh KHSX',
          attendanceActual: 0,
          attendanceTarget: 95.0,
          bomNote: 'Không phát sinh sản xuất & không có dữ liệu báo cáo',
          actionItem: 'Không phát sinh bảo hành ngoài kế hoạch.',
        },
      ]
    };
  }

  const result: ExecutiveSummaryPeriodResult = JSON.parse(JSON.stringify(base));

  // 0. Áp dụng định mức & mục tiêu
  result.units = result.units.map(u => {
    if (u.unitKey === 'PXLR') {
      return {
        ...u,
        nsldTarget: activeNorms.nsldTarget.pxlr,
        attendanceTarget: activeNorms.attendanceTarget.pxlr,
        errorRateQuota: activeNorms.errorRateQuota.pxlr,
        defectCostTarget: activeNorms.defectCostTarget.pxlr,
      };
    }
    if (u.unitKey === 'RO') {
      return {
        ...u,
        nsldTarget: activeNorms.nsldTarget.ro,
        attendanceTarget: activeNorms.attendanceTarget.ro,
        errorRateQuota: activeNorms.errorRateQuota.ro,
        defectCostTarget: activeNorms.defectCostTarget.ro,
      };
    }
    if (u.unitKey === 'BG') {
      return {
        ...u,
        nsldTarget: activeNorms.nsldTarget.bg,
        attendanceTarget: activeNorms.attendanceTarget.bg,
        errorRateQuota: activeNorms.errorRateQuota.bg,
        defectCostTarget: activeNorms.defectCostTarget.bg,
      };
    }
    return u;
  });

  // 1. Đồng bộ NSLĐ từ Slide 1
  const itemPXLR = (activeSlide1.pxlr?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, weekKey));
  const itemRO = (activeSlide1.ro?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, weekKey));
  const itemBG = (activeSlide1.bg?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, weekKey));

  result.units = result.units.map(u => {
    if (u.unitKey === 'PXLR' && itemPXLR && itemPXLR.value > 0) {
      return { ...u, nsldActual: Number(itemPXLR.value.toFixed(1)) };
    }
    if (u.unitKey === 'RO' && itemRO && itemRO.value > 0) {
      return { ...u, nsldActual: Number(itemRO.value.toFixed(1)) };
    }
    if (u.unitKey === 'BG' && itemBG && itemBG.value > 0) {
      return { ...u, nsldActual: Number(itemBG.value.toFixed(1)) };
    }
    return u;
  });

  // 2. Đồng bộ Tỉ lệ lỗi từ Slide 2
  const pxlrQuota = activeSlide2.pxlr?.benchmarkDmLoi || 7.38;
  const roQuota = activeSlide2.ro?.benchmarkDmLoi || 5.20;
  const bgQuota = activeSlide2.bg?.benchmarkDmLoi || 7.74;

  const pxlrWeeklyItem = (activeSlide2.weekly?.pxlr?.items || []).find(i => isMatchingWeekKey(i.month, weekKey));
  const roWeeklyItem = (activeSlide2.weekly?.ro?.items || []).find(i => isMatchingWeekKey(i.month, weekKey));
  const bgWeeklyItem = (activeSlide2.weekly?.bg?.items || []).find(i => isMatchingWeekKey(i.month, weekKey));

  const dailyInWeek = (activeSlide2.dailyRecords || []).filter(d => isMatchingWeekKey(d.week, weekKey));
  let avgRO_4M = 0;
  let avgBG_4M = 0;
  let avgPXLR_4M = 0;

  if (dailyInWeek.length > 0) {
    avgRO_4M = Number((dailyInWeek.reduce((s, d) => s + (d.ro?.totalLoi4M || 0), 0) / dailyInWeek.length).toFixed(2));
    avgBG_4M = Number((dailyInWeek.reduce((s, d) => s + (d.bg?.totalLoi4M || 0), 0) / dailyInWeek.length).toFixed(2));
    avgPXLR_4M = Number((dailyInWeek.reduce((s, d) => s + (d.pxlr?.totalLoi4M || 0), 0) / dailyInWeek.length).toFixed(2));
  }

  result.units = result.units.map(u => {
    if (u.unitKey === 'RO') {
      const actualErr = (roWeeklyItem && roWeeklyItem.totalLoi4M > 0)
        ? roWeeklyItem.totalLoi4M
        : (avgRO_4M > 0 ? avgRO_4M : u.errorRateActual);
      return {
        ...u,
        errorRateActual: Number(actualErr.toFixed(2)),
        errorRateQuota: roQuota,
      };
    }
    if (u.unitKey === 'BG') {
      const actualErr = (bgWeeklyItem && bgWeeklyItem.totalLoi4M > 0)
        ? bgWeeklyItem.totalLoi4M
        : (avgBG_4M > 0 ? avgBG_4M : u.errorRateActual);
      return {
        ...u,
        errorRateActual: Number(actualErr.toFixed(2)),
        errorRateQuota: bgQuota,
      };
    }
    if (u.unitKey === 'PXLR') {
      const actualErr = (pxlrWeeklyItem && pxlrWeeklyItem.totalLoi4M > 0)
        ? pxlrWeeklyItem.totalLoi4M
        : (avgPXLR_4M > 0 ? avgPXLR_4M : u.errorRateActual);
      return {
        ...u,
        errorRateActual: Number(actualErr.toFixed(2)),
        errorRateQuota: pxlrQuota,
      };
    }
    return u;
  });

  // 3. Đồng bộ Chi phí hư hỏng từ Slide 3
  const { weeklyTotals } = synchronizeSlide3Data(activeSlide3);
  const matchedWeekKey = Object.keys(weeklyTotals).find(w => isSameWeek(w, weekKey)) || weekKey;
  const breakdown = weeklyTotals[matchedWeekKey] || HISTORICAL_WEEK_BREAKDOWN[weekKey];

  if (breakdown) {
    result.units = result.units.map(u => {
      if (u.unitKey === 'RO') return { ...u, defectCostActual: breakdown.ro };
      if (u.unitKey === 'BG') return { ...u, defectCostActual: breakdown.bg };
      if (u.unitKey === 'PXLR') return { ...u, defectCostActual: breakdown.total };
      if (u.unitKey === 'RMA') return { ...u, defectCostActual: 0 };
      return u;
    });
  } else {
    result.units = result.units.map(u => ({ ...u, defectCostActual: 0 }));
  }

  // 4. Đồng bộ Ma trận DCRO và DCBG
  try {
    const { colRO: weekColRO, colBG: weekColBG } = findWeekColumnInMatrices(weekKey);

    const dynNsldRO = weekColRO && weekColRO.nsldTheoNgay > 0 ? Number(weekColRO.nsldTheoNgay.toFixed(1)) : 0;
    const dynDiLamRO = weekColRO && weekColRO.tiLeDiLam > 0 ? Number(weekColRO.tiLeDiLam.toFixed(1)) : 0;
    const dynKhRO = weekColRO && weekColRO.khsxNgay > 0 ? weekColRO.khsxNgay : 0;
    const dynSlRO = weekColRO && weekColRO.sanLuongLineChinh > 0 ? weekColRO.sanLuongLineChinh : 0;

    const dynNsldBG = weekColBG && weekColBG.nsldTheoNgay > 0 ? Number(weekColBG.nsldTheoNgay.toFixed(1)) : 0;
    const dynDiLamBG = weekColBG && weekColBG.tiLeDiLam > 0 ? Number(weekColBG.tiLeDiLam.toFixed(1)) : 0;
    const dynKhBG = weekColBG && weekColBG.khsxNgay > 0 ? weekColBG.khsxNgay : 0;
    const dynSlBG = weekColBG && weekColBG.sanLuongBepGa > 0 ? weekColBG.sanLuongBepGa : 0;

    const s2ItemRO = (activeSlide1?.ro?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, weekKey));
    const s2ItemBG = (activeSlide1?.bg?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, weekKey));
    const s2ItemPXLR = (activeSlide1?.pxlr?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, weekKey));

    result.units = result.units.map(u => {
      const hasBase = !!BASE_WEEKLY_SUMMARY[weekKey];
      const wNum = extractWeekNumber(weekKey);

      if (u.unitKey === 'RO') {
        let kh = parseVNNumber(u.khsxLabel);
        let sl = (u.actualOutput && u.actualOutput > 0) ? u.actualOutput : parseVNNumber(u.actualOutputLabel);

        if (!hasBase) {
          if (wNum >= 45 && wNum <= 48) { kh = 3850; sl = Math.round(kh * (u.nsldActual / 100)); }
          else if (wNum >= 49 && wNum <= 52) { kh = 4125; sl = Math.round(kh * (u.nsldActual / 100)); }
          else if (wNum >= 31 && wNum <= 35) { kh = 1700; sl = 1380; }
          else if (wNum >= 27 && wNum <= 30) { kh = 3250; sl = 3025; }
          else if (wNum >= 22 && wNum <= 26) { kh = 2500; sl = 2400; }
          else { kh = dynKhRO > 0 ? dynKhRO : 4320; sl = dynSlRO > 0 ? dynSlRO : Math.round(kh * (u.nsldActual / 100)); }
        }

        const rate = kh > 0 ? (sl / kh) * 100 : 100;
        const nsld = (s2ItemRO && s2ItemRO.value > 0) ? Number(s2ItemRO.value.toFixed(1)) : (dynNsldRO > 0 ? dynNsldRO : u.nsldActual);
        const diLam = (dynDiLamRO >= 80) ? dynDiLamRO : u.attendanceActual;
        const isPass = nsld >= u.nsldTarget;
        return {
          ...u,
          khsxLabel: `${formatVNNumber(kh)} SP`,
          actualOutputLabel: `${formatVNNumber(sl)} SP`,
          actualOutput: sl,
          completionRate: Number(rate.toFixed(1)),
          completionNote: `Đạt ${rate.toFixed(1)}% KHSX RO`,
          nsldActual: nsld,
          nsldDeltaNote: isPass ? `Vượt mục tiêu ${u.nsldTarget}%` : `Chưa đạt mục tiêu ${u.nsldTarget}%`,
          attendanceActual: diLam,
        };
      }
      if (u.unitKey === 'BG') {
        let kh = parseVNNumber(u.khsxLabel);
        let sl = (u.actualOutput && u.actualOutput > 0) ? u.actualOutput : parseVNNumber(u.actualOutputLabel);

        if (!hasBase) {
          if (wNum >= 45 && wNum <= 48) { kh = 650; sl = Math.round(kh * (u.nsldActual / 100)); }
          else if (wNum >= 49 && wNum <= 52) { kh = 750; sl = Math.round(kh * (u.nsldActual / 100)); }
          else if (wNum >= 31 && wNum <= 35) { kh = 1300; sl = 964; }
          else if (wNum >= 27 && wNum <= 30) { kh = 2350; sl = 2149; }
          else if (wNum >= 22 && wNum <= 26) { kh = 1878; sl = 1770; }
          else { kh = dynKhBG > 0 ? dynKhBG : 4320; sl = dynSlBG > 0 ? dynSlBG : Math.round(kh * (u.nsldActual / 100)); }
        }

        const rate = kh > 0 ? (sl / kh) * 100 : 100;
        const nsld = (s2ItemBG && s2ItemBG.value > 0) ? Number(s2ItemBG.value.toFixed(1)) : (dynNsldBG > 0 ? dynNsldBG : u.nsldActual);
        const diLam = (dynDiLamBG >= 80) ? dynDiLamBG : u.attendanceActual;
        const delta = nsld - u.nsldTarget;
        return {
          ...u,
          khsxLabel: `${formatVNNumber(kh)} SP`,
          actualOutputLabel: `${formatVNNumber(sl)} SP`,
          actualOutput: sl,
          completionRate: Number(rate.toFixed(1)),
          completionNote: `Đạt ${rate.toFixed(1)}% KHSX BG`,
          nsldActual: nsld,
          nsldDeltaNote: delta >= 0 ? `↑ ${delta.toFixed(1)}% so với mục tiêu ${u.nsldTarget}%` : `↓ ${Math.abs(delta).toFixed(1)}% so với mục tiêu ${u.nsldTarget}%`,
          attendanceActual: diLam,
        };
      }
      if (u.unitKey === 'RMA') {
        const isRmaNoPlan = (u.khsxLabel === '0 SP' || u.khsxLabel === '0' || !u.actualOutput || u.actualOutput === 0 || u.actualOutputLabel === '0 SP');
        if (isRmaNoPlan) {
          return {
            ...u,
            khsxLabel: '0 SP',
            actualOutputLabel: '0 SP',
            actualOutput: 0,
            completionRate: 0,
            completionNote: 'Không có KHSX RMA',
            nsldActual: 0,
            attendanceActual: 0,
            bomNote: 'Không phát sinh sản xuất & không có dữ liệu báo cáo',
          };
        }
        const sl = u.actualOutput || parseVNNumber(u.actualOutputLabel);
        return {
          ...u,
          actualOutput: sl,
          actualOutputLabel: `${formatVNNumber(sl)} SP`,
        };
      }
      return u;
    });

    const roUnit = result.units.find(u => u.unitKey === 'RO');
    const bgUnit = result.units.find(u => u.unitKey === 'BG');
    const rmaUnit = result.units.find(u => u.unitKey === 'RMA');

    const roKh = parseVNNumber(roUnit?.khsxLabel);
    const bgKh = parseVNNumber(bgUnit?.khsxLabel);
    const rmaKh = parseVNNumber(rmaUnit?.khsxLabel);

    const roAct = roUnit?.actualOutput ?? parseVNNumber(roUnit?.actualOutputLabel);
    const bgAct = bgUnit?.actualOutput ?? parseVNNumber(bgUnit?.actualOutputLabel);
    const rmaAct = rmaUnit?.actualOutput ?? parseVNNumber(rmaUnit?.actualOutputLabel);

    const totalKh = roKh + bgKh + (rmaKh > 0 ? rmaKh : 0);
    const totalAct = roAct + bgAct + (rmaKh > 0 ? rmaAct : 0);
    const totalRate = totalKh > 0 ? Number(((totalAct / totalKh) * 100).toFixed(1)) : 100;

    const roNsld = roUnit?.nsldActual || 0;
    const bgNsld = bgUnit?.nsldActual || 0;
    const pxlrNsld = (s2ItemPXLR && s2ItemPXLR.value > 0)
      ? Number(s2ItemPXLR.value.toFixed(1))
      : calculateAbsolutePXLR(roNsld, bgNsld, 'weekly');

    const nsRO = weekColRO ? (Number(weekColRO.tongNhanSuLine) || 0) : 0;
    const nghiRO = weekColRO ? (Number(weekColRO.nhanSuNghi) || 0) : 0;
    const nsBG = weekColBG ? (Number(weekColBG.tongNhanSuLine) || 0) : 0;
    const nghiBG = weekColBG ? (Number(weekColBG.nhanSuNghi) || 0) : 0;
    const totalNs = nsRO + nsBG;
    const totalNghi = nghiRO + nghiBG;
    const pxlrDiLam = totalNs > 0
      ? Number((((totalNs - totalNghi) / totalNs) * 100).toFixed(1))
      : Number((((roUnit?.attendanceActual || 98.2) + (bgUnit?.attendanceActual || 98.0)) / 2).toFixed(1));

    result.units = result.units.map(u => {
      if (u.unitKey === 'PXLR') {
        const isPass = pxlrNsld >= u.nsldTarget;
        return {
          ...u,
          khsxLabel: totalKh > 0 ? `${formatVNNumber(totalKh)} SP` : u.khsxLabel,
          actualOutputLabel: totalAct > 0 ? `${formatVNNumber(totalAct)} SP` : u.actualOutputLabel,
          actualOutput: totalAct,
          completionRate: totalRate,
          completionNote: `Đạt ${totalRate.toFixed(1)}% KHSX`,
          nsldActual: pxlrNsld > 0 ? pxlrNsld : u.nsldActual,
          nsldDeltaNote: isPass ? `Vượt mục tiêu ${u.nsldTarget}%` : `Tiệm cận mục tiêu ${u.nsldTarget}%`,
          attendanceActual: pxlrDiLam,
        };
      }
      return u;
    });
  } catch {}

  // Đảm bảo W41 và các tuần không hư hỏng có defectCostActual = 0
  if (isSameWeek(weekKey, 'W41') || weekKey === 'W41') {
    result.units = result.units.map(u => ({ ...u, defectCostActual: 0 }));
  }

  // Tự động đồng bộ nội dung thông báo hành động (Action Items) theo số liệu thực tế đã khớp
  const pxlrFinal = result.units.find(u => u.unitKey === 'PXLR');
  if (pxlrFinal) {
    const costText = pxlrFinal.defectCostActual === 0 ? '0 đ (Zero Defect)' : `${formatVNNumber(pxlrFinal.defectCostActual)} đ`;
    result.actionItemContent = `Tuần ${weekKey}: Toàn xưởng hoàn thành ${pxlrFinal.actualOutputLabel || `${formatVNNumber(pxlrFinal.actualOutput || 0)} SP`} (${pxlrFinal.completionRate}% KHSX), NSLĐ đạt ${pxlrFinal.nsldActual}% (mục tiêu ≥ ${pxlrFinal.nsldTarget}%), tỷ lệ lỗi ${pxlrFinal.errorRateActual}% (định mức ≤ ${pxlrFinal.errorRateQuota}%), chi phí hư hỏng vật tư ${costText}.`;
  }

  return result;
}

/**
 * TỔNG HỢP BÁO CÁO THÁNG TỪ CÁC TUẦN THUỘC THÁNG ĐÓ
 * Đáp ứng yêu cầu: "khi chọn tháng thì phải được tổng hợp tháng từ các tuần"
 */
export function getMonthlyExecutiveSummaryData(
  monthKey: string,
  defectCostData?: SlideDefectCostData,
  monthlyHistory?: MonthlyHistoryRecord[],
  slide1Data?: Slide1NSLDData,
  slide2QualityData?: Slide2QualityData,
  globalNorms?: GlobalNormsConfig
): ExecutiveSummaryPeriodResult {
  const activeSlide1 = slide1Data || StorageService.getSlide1NSLD();
  const activeSlide2 = slide2QualityData || StorageService.getSlide2Quality();
  const activeSlide3 = defectCostData || StorageService.getSlide3DefectCost();
  const activeNorms = globalNorms || StorageService.getGlobalNorms();

  // 1. LẤY CÁC TUẦN THUỘC THÁNG
  const weeksInMonth = getWeeksForMonth(monthKey);

  // 2. LẤY DỮ LIỆU TỪNG TUẦN ĐỂ TỔNG HỢP
  const weekResults = weeksInMonth.map(w => 
    getWeeklyExecutiveSummaryData(w, activeSlide3, monthlyHistory, activeSlide1, activeSlide2, activeNorms)
  );

  const pxlrQuota = activeSlide2.pxlr?.benchmarkDmLoi || 7.38;
  const roQuota = activeSlide2.ro?.benchmarkDmLoi || 5.20;
  const bgQuota = activeSlide2.bg?.benchmarkDmLoi || 7.74;

  let roKhSum = 0;
  let roActSum = 0;
  let roCostSum = 0;
  let roAttSum = 0;

  let bgKhSum = 0;
  let bgActSum = 0;
  let bgCostSum = 0;
  let bgAttSum = 0;

  let rmaKhSum = 0;
  let rmaActSum = 0;
  let rmaAttSum = 0;

  weekResults.forEach(wr => {
    const ro = wr.units.find(u => u.unitKey === 'RO');
    const bg = wr.units.find(u => u.unitKey === 'BG');
    const rma = wr.units.find(u => u.unitKey === 'RMA');

    if (ro) {
      roKhSum += parseVNNumber(ro.khsxLabel);
      roActSum += (ro.actualOutput ?? parseVNNumber(ro.actualOutputLabel));
      roCostSum += (ro.defectCostActual || 0);
      roAttSum += (ro.attendanceActual || 98.2);
    }
    if (bg) {
      bgKhSum += parseVNNumber(bg.khsxLabel);
      bgActSum += (bg.actualOutput ?? parseVNNumber(bg.actualOutputLabel));
      bgCostSum += (bg.defectCostActual || 0);
      bgAttSum += (bg.attendanceActual || 98.0);
    }
    if (rma) {
      rmaKhSum += parseVNNumber(rma.khsxLabel);
      rmaActSum += (rma.actualOutput ?? parseVNNumber(rma.actualOutputLabel));
      rmaAttSum += (rma.attendanceActual || 0);
    }
  });

  const weekCount = weekResults.length || 1;
  const roAttAvg = Number((roAttSum / weekCount).toFixed(1));
  const bgAttAvg = Number((bgAttSum / weekCount).toFixed(1));
  const rmaAttAvg = Number((rmaAttSum / weekCount).toFixed(1));
  const pxlrAttAvg = Number(((roAttAvg + bgAttAvg) / 2).toFixed(1));

  // Tỉ lệ lỗi: Kiểm tra Slide 2 monthly item hoặc trung bình có trọng số theo sản lượng
  const roMonthItem = (activeSlide2.monthly?.ro?.items || []).find(i => isMatchingMonthKey(i.month, monthKey));
  const bgMonthItem = (activeSlide2.monthly?.bg?.items || []).find(i => isMatchingMonthKey(i.month, monthKey));
  const pxlrMonthItem = (activeSlide2.monthly?.pxlr?.items || []).find(i => isMatchingMonthKey(i.month, monthKey));

  let roErrRate = (roMonthItem && roMonthItem.totalLoi4M > 0) ? roMonthItem.totalLoi4M : 0;
  let bgErrRate = (bgMonthItem && bgMonthItem.totalLoi4M > 0) ? bgMonthItem.totalLoi4M : 0;
  let pxlrErrRate = (pxlrMonthItem && pxlrMonthItem.totalLoi4M > 0) ? pxlrMonthItem.totalLoi4M : 0;

  if (roErrRate === 0) {
    let errProd = 0;
    weekResults.forEach(wr => {
      const ro = wr.units.find(u => u.unitKey === 'RO');
      if (ro) errProd += (ro.errorRateActual || 0) * (ro.actualOutput || 1);
    });
    roErrRate = roActSum > 0 ? Number((errProd / roActSum).toFixed(2)) : 3.0;
  }

  if (bgErrRate === 0) {
    let errProd = 0;
    weekResults.forEach(wr => {
      const bg = wr.units.find(u => u.unitKey === 'BG');
      if (bg) errProd += (bg.errorRateActual || 0) * (bg.actualOutput || 1);
    });
    bgErrRate = bgActSum > 0 ? Number((errProd / bgActSum).toFixed(2)) : 5.8;
  }

  if (pxlrErrRate === 0) {
    let errProd = 0;
    weekResults.forEach(wr => {
      const pxlr = wr.units.find(u => u.unitKey === 'PXLR');
      if (pxlr) errProd += (pxlr.errorRateActual || 0) * (pxlr.actualOutput || 1);
    });
    const totalOut = roActSum + bgActSum;
    pxlrErrRate = totalOut > 0 ? Number((errProd / totalOut).toFixed(2)) : 3.4;
  }

  // NSLĐ: Lấy từ Slide 1 monthly hoặc tính toán từ các tuần
  const s1MonthRO = (activeSlide1.ro?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, monthKey));
  const s1MonthBG = (activeSlide1.bg?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, monthKey));
  const s1MonthPXLR = (activeSlide1.pxlr?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, monthKey));

  const roNsld = (s1MonthRO && s1MonthRO.value > 0)
    ? Number(s1MonthRO.value.toFixed(1))
    : Number((weekResults.reduce((s, wr) => s + (wr.units.find(u => u.unitKey === 'RO')?.nsldActual || 0), 0) / weekCount).toFixed(1));

  const bgNsld = (s1MonthBG && s1MonthBG.value > 0)
    ? Number(s1MonthBG.value.toFixed(1))
    : Number((weekResults.reduce((s, wr) => s + (wr.units.find(u => u.unitKey === 'BG')?.nsldActual || 0), 0) / weekCount).toFixed(1));

  const pxlrNsld = (s1MonthPXLR && s1MonthPXLR.value > 0)
    ? Number(s1MonthPXLR.value.toFixed(1))
    : calculateAbsolutePXLR(roNsld, bgNsld, 'monthly');

  // Tổng hợp Toàn Phân Xưởng PXLR
  const pxlrKhSum = roKhSum + bgKhSum + rmaKhSum;
  const pxlrActSum = roActSum + bgActSum + rmaActSum;
  const pxlrCostSum = roCostSum + bgCostSum;

  const roRate = roKhSum > 0 ? Number(((roActSum / roKhSum) * 100).toFixed(1)) : 100;
  const bgRate = bgKhSum > 0 ? Number(((bgActSum / bgKhSum) * 100).toFixed(1)) : 100;
  const rmaRate = rmaKhSum > 0 ? Number(((rmaActSum / rmaKhSum) * 100).toFixed(1)) : 0;
  const pxlrRate = pxlrKhSum > 0 ? Number(((pxlrActSum / pxlrKhSum) * 100).toFixed(1)) : 100;

  const baseMonth = BASE_MONTHLY_SUMMARY[monthKey];
  const isUrgent = pxlrCostSum > 5000000;

  const result: ExecutiveSummaryPeriodResult = {
    periodLabel: monthKey,
    timeFrame: 'month',
    actionItemTitle: `Việc cần làm - Đối sách ${monthKey}`,
    actionItemContent: baseMonth?.actionItemContent || `Tổng hợp số liệu ${monthKey} từ các tuần (${weeksInMonth.join(', ')}): Toàn xưởng hoàn thành ${formatVNNumber(pxlrActSum)} SP (${pxlrRate}% KHSX). Chi phí hư hỏng tổng hợp ${formatVNNumber(pxlrCostSum)} đ.`,
    isUrgentAction: baseMonth?.isUrgentAction ?? isUrgent,
    units: [
      {
        id: `exec-pxlr-${monthKey.toLowerCase().replace(/\s+/g, '')}`,
        unitKey: 'PXLR',
        unitName: `PXLR Toàn Xưởng (${monthKey})`,
        khsxLabel: `${formatVNNumber(pxlrKhSum)} SP`,
        actualOutputLabel: `${formatVNNumber(pxlrActSum)} SP`,
        actualOutput: pxlrActSum,
        completionRate: pxlrRate,
        completionNote: `Đạt ${pxlrRate}% KHSX (Tổng hợp ${weeksInMonth.join(', ')})`,
        nsldActual: pxlrNsld,
        nsldTarget: activeNorms.nsldTarget.pxlr,
        nsldDeltaNote: pxlrNsld >= activeNorms.nsldTarget.pxlr ? `Vượt mục tiêu ${activeNorms.nsldTarget.pxlr}%` : `Mục tiêu ≥ ${activeNorms.nsldTarget.pxlr}%`,
        attendanceActual: pxlrAttAvg,
        attendanceTarget: activeNorms.attendanceTarget.pxlr,
        errorRateActual: pxlrErrRate,
        errorRateQuota: pxlrQuota,
        defectCostActual: pxlrCostSum,
        defectCostTarget: activeNorms.defectCostTarget.pxlr,
        actionItem: `Toàn xưởng ${monthKey} hoàn thành ${pxlrRate}% KHSX, chi phí hư hỏng tổng hợp ${formatVNNumber(pxlrCostSum)} đ.`,
      },
      {
        id: `exec-ro-${monthKey.toLowerCase().replace(/\s+/g, '')}`,
        unitKey: 'RO',
        unitName: `Line Máy Lọc Nước RO (${monthKey})`,
        khsxLabel: `${formatVNNumber(roKhSum)} SP`,
        actualOutputLabel: `${formatVNNumber(roActSum)} SP`,
        actualOutput: roActSum,
        completionRate: roRate,
        completionNote: `Đạt ${roRate}% KHSX RO`,
        nsldActual: roNsld,
        nsldTarget: activeNorms.nsldTarget.ro,
        nsldDeltaNote: roNsld >= activeNorms.nsldTarget.ro ? `Vượt mục tiêu ${activeNorms.nsldTarget.ro}%` : `Mục tiêu ≥ ${activeNorms.nsldTarget.ro}%`,
        attendanceActual: roAttAvg,
        attendanceTarget: activeNorms.attendanceTarget.ro,
        errorRateActual: roErrRate,
        errorRateQuota: roQuota,
        defectCostActual: roCostSum,
        defectCostTarget: activeNorms.defectCostTarget.ro,
        actionItem: `Line RO ${monthKey} hoàn thành ${roRate}% KHSX, chi phí hư hỏng ${formatVNNumber(roCostSum)} đ.`,
      },
      {
        id: `exec-bg-${monthKey.toLowerCase().replace(/\s+/g, '')}`,
        unitKey: 'BG',
        unitName: `Line DC Bếp Gas (${monthKey})`,
        khsxLabel: `${formatVNNumber(bgKhSum)} SP`,
        actualOutputLabel: `${formatVNNumber(bgActSum)} SP`,
        actualOutput: bgActSum,
        completionRate: bgRate,
        completionNote: `Đạt ${bgRate}% KHSX BG`,
        nsldActual: bgNsld,
        nsldTarget: activeNorms.nsldTarget.bg,
        nsldDeltaNote: bgNsld >= activeNorms.nsldTarget.bg ? `Vượt mục tiêu ${activeNorms.nsldTarget.bg}%` : `Mục tiêu ≥ ${activeNorms.nsldTarget.bg}%`,
        attendanceActual: bgAttAvg,
        attendanceTarget: activeNorms.attendanceTarget.bg,
        errorRateActual: bgErrRate,
        errorRateQuota: bgQuota,
        defectCostActual: bgCostSum,
        defectCostTarget: activeNorms.defectCostTarget.bg,
        actionItem: `Line BG ${monthKey} hoàn thành ${bgRate}% KHSX, chi phí hư hỏng ${formatVNNumber(bgCostSum)} đ.`,
      },
      {
        id: `exec-rma-${monthKey.toLowerCase().replace(/\s+/g, '')}`,
        unitKey: 'RMA',
        unitName: `Tổ Sửa Chữa / Bảo Hành RMA (${monthKey})`,
        khsxLabel: rmaKhSum > 0 ? `${formatVNNumber(rmaKhSum)} SP` : '0 SP',
        actualOutputLabel: rmaActSum > 0 ? `${formatVNNumber(rmaActSum)} SP` : '0 SP',
        actualOutput: rmaActSum,
        completionRate: rmaRate,
        completionNote: rmaKhSum > 0 ? `Đạt ${rmaRate}% KHSX RMA` : 'Không có KHSX RMA',
        nsldActual: rmaKhSum > 0 ? 100.0 : 0,
        nsldTarget: 100.0,
        nsldDeltaNote: rmaKhSum > 0 ? 'Đạt mục tiêu 100%' : 'Không phát sinh KHSX',
        attendanceActual: rmaAttAvg,
        attendanceTarget: 95.0,
        defectCostActual: 0,
        defectCostTarget: 0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: rmaKhSum > 0 ? `Tập trung trả nợ hàng bảo hành ${monthKey}.` : 'Không phát sinh sản xuất RMA ngoài kế hoạch.',
      },
    ]
  };

  return result;
}

/**
 * Tự động đồng bộ số liệu từ Slide 1 (Năng Suất), Slide 2 (Chất Lượng), Slide 3 (Chi Phí Hư Hỏng)
 * và Lịch Sử Hàng Tháng vào Executive Summary
 * - Nếu timeFrame === 'week': Tính theo dữ liệu thực của tuần đó (W22 -> W52)
 * - Nếu timeFrame === 'month': TỔNG HỢP tháng từ các tuần của tháng đó!
 */
export function getExecutiveSummaryData(
  timeFrame: 'week' | 'month',
  periodKey: string,
  defectCostData?: SlideDefectCostData,
  monthlyHistory?: MonthlyHistoryRecord[],
  slide1Data?: Slide1NSLDData,
  slide2QualityData?: Slide2QualityData,
  globalNorms?: GlobalNormsConfig
): ExecutiveSummaryPeriodResult {
  if (timeFrame === 'week') {
    return getWeeklyExecutiveSummaryData(
      periodKey,
      defectCostData,
      monthlyHistory,
      slide1Data,
      slide2QualityData,
      globalNorms
    );
  } else {
    return getMonthlyExecutiveSummaryData(
      periodKey,
      defectCostData,
      monthlyHistory,
      slide1Data,
      slide2QualityData,
      globalNorms
    );
  }
}


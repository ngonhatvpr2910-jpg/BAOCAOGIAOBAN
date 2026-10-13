import { UnitExecutiveSummary, MonthlyHistoryRecord, SlideDefectCostData, Slide1NSLDData, Slide2QualityData, GlobalNormsConfig } from './types';
import { StorageService } from './storage';
import { synchronizeSlide3Data, isSameWeek, isItemInMonth, extractWeekNumber } from './defectCostSyncService';
import { calculateAbsolutePXLR } from './productivityFormulas';

export interface ExecutiveSummaryPeriodResult {
  periodLabel: string;
  timeFrame: 'week' | 'month';
  units: UnitExecutiveSummary[];
  actionItemTitle: string;
  actionItemContent: string;
  isUrgentAction: boolean;
}

export const AVAILABLE_WEEKS = ['W35', 'W36', 'W37', 'W38', 'W39', 'W40', 'W41', 'W42', 'W43', 'W44'];
export const AVAILABLE_MONTHS = ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

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
    actionItemContent: 'Duy trì đà tăng trưởng NSLĐ toàn xưởng (121.5%), bám sát kế hoạch sản xuất tuần và giữ vững tỷ lệ lỗi thao tác dưới định mức. Tuần 41 hiện tại chưa cập nhật hư hỏng (0 đ).',
    isUrgentAction: false,
    units: [
      {
        id: 'exec-pxlr-w41',
        unitKey: 'PXLR',
        unitName: 'PXLR Toàn Xưởng (W41)',
        khsxLabel: '9.360 SP',
        actualOutputLabel: '9.745 SP',
        actualOutput: 9745,
        completionRate: 104.1,
        completionNote: 'Đạt 104.1% KHSX',
        nsldActual: 121.5,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.2,
        attendanceTarget: 95.0,
        errorRateActual: 3.40,
        errorRateQuota: 7.38,
        defectCostActual: 0,
        defectCostTarget: 7000000,
        actionItem: 'Tuần 41 (Hiện tại): Toàn xưởng tiếp tục duy trì đà tăng trưởng NSLĐ (121.5%), KHSX đạt 104.1%. Chưa phát sinh / chưa cập nhật dữ liệu hư hỏng (0 đ). Tỉ lệ đi làm 98.2% ổn định.',
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
        nsldActual: 121.8,
        nsldTarget: 120.0,
        nsldDeltaNote: 'Vượt mục tiêu 120%',
        attendanceActual: 98.5,
        attendanceTarget: 95.0,
        errorRateActual: 2.90,
        errorRateQuota: 5.20,
        defectCostActual: 0,
        defectCostTarget: 5000000,
        actionItem: 'Line RO tuần 41 vượt kế hoạch (101.6%), NSLĐ 121.8%, tỷ lệ lỗi 2.90% rất thấp so với định mức 5.20%. Chưa phát sinh hư hỏng (0 đ).',
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
        nsldActual: 116.0,
        nsldTarget: 100.0,
        nsldDeltaNote: '↑ 16.0% so với mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        errorRateActual: 5.40,
        errorRateQuota: 7.74,
        defectCostActual: 0,
        defectCostTarget: 2000000,
        actionItem: 'Line BG tuần 41 đạt sản lượng 4.380 SP (101.4% KHSX), NSLĐ 116.0% vượt xa mục tiêu 100%. Tỷ lệ lỗi 5.40% nằm trong định mức 7.74%. Chưa phát sinh hư hỏng (0 đ).',
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
 * Tự động đồng bộ số liệu từ Slide 1 (Năng Suất), Slide 2 (Chất Lượng), Slide 3 (Chi Phí Hư Hỏng)
 * và Lịch Sử Hàng Tháng vào Executive Summary
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
  // Lấy dữ liệu nền tảng tương ứng
  let base: ExecutiveSummaryPeriodResult | undefined;
  
  if (timeFrame === 'week') {
    base = BASE_WEEKLY_SUMMARY[periodKey];
  } else {
    base = BASE_MONTHLY_SUMMARY[periodKey];
  }

  // Nếu không có base (tuần/tháng mới), tạo một base mặc định dựa trên W39 hoặc Tháng 9
  if (!base) {
    const templateBase = timeFrame === 'week' ? BASE_WEEKLY_SUMMARY['W39'] : BASE_MONTHLY_SUMMARY['Tháng 9'];
    base = JSON.parse(JSON.stringify(templateBase));
    base!.periodLabel = periodKey;
    base!.actionItemTitle = `Việc cần làm - Đối sách ${periodKey}`;
    base!.actionItemContent = `Đang cập nhật đối sách cho ${periodKey}...`;
    base!.units = base!.units.map(u => {
      const genericName = u.unitName.replace(/\s*\(W\d+\)|\s*\(Tháng \d+\)/g, '');
      return {
        ...u,
        unitName: `${genericName} (${periodKey})`
      };
    });
  }

  // Clone để không biến đổi dữ liệu gốc
  const result: ExecutiveSummaryPeriodResult = JSON.parse(JSON.stringify(base));

  // Tải dữ liệu từ Storage nếu không được truyền vào trực tiếp
  const activeSlide1 = slide1Data || StorageService.getSlide1NSLD();
  const activeSlide2 = slide2QualityData || StorageService.getSlide2Quality();
  const activeSlide3 = defectCostData || StorageService.getSlide3DefectCost();
  const activeNorms = globalNorms || StorageService.getGlobalNorms();

  // 0. ÁP DỤNG ĐỊNH MỨC & MỤC TIÊU TỪ CÀI ĐẶT
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

  // 1. ĐỒNG BỘ DỮ LIỆU TỪ SLIDE 1: NĂNG SUẤT LAO ĐỘNG (NSLĐ), KHSX, THỰC HIỆN, ĐI LÀM %
  if (activeSlide1) {
    if (timeFrame === 'month') {
      // Tìm các item NSLĐ trong các nhóm theo tháng
      const itemPXLR = (activeSlide1.pxlr?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, periodKey));
      const itemRO = (activeSlide1.ro?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, periodKey));
      const itemBG = (activeSlide1.bg?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, periodKey));

      result.units = result.units.map(u => {
        if (u.unitKey === 'PXLR') {
          const nsld = (itemPXLR && itemPXLR.value > 0) ? itemPXLR.value : u.nsldActual;
          return {
            ...u,
            nsldActual: Number(nsld.toFixed(1)),
          };
        }
        if (u.unitKey === 'RO') {
          const nsld = (itemRO && itemRO.value > 0) ? itemRO.value : u.nsldActual;
          return { ...u, nsldActual: Number(nsld.toFixed(1)) };
        }
        if (u.unitKey === 'BG') {
          const nsld = (itemBG && itemBG.value > 0) ? itemBG.value : u.nsldActual;
          return { ...u, nsldActual: Number(nsld.toFixed(1)) };
        }
        return u;
      });
    } else {
      // Theo tuần
      const itemPXLR = (activeSlide1.pxlr?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, periodKey));
      const itemRO = (activeSlide1.ro?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, periodKey));
      const itemBG = (activeSlide1.bg?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, periodKey));

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
    }
  }

  // 2. ĐỒNG BỘ DỮ LIỆU TỪ SLIDE 2: CHẤT LƯỢNG (TỈ LỆ LỖI THAO TÁC / 4M, LỖI VẬT TƯ, ĐỊNH MỨC)
  if (activeSlide2) {
    // Cập nhật định mức (Quota) từ Slide 2
    const pxlrQuota = activeSlide2.pxlr?.benchmarkDmLoi || 7.38;
    const roQuota = activeSlide2.ro?.benchmarkDmLoi || 5.20;
    const bgQuota = activeSlide2.bg?.benchmarkDmLoi || 7.74;

    if (timeFrame === 'week') {
      // Tìm trong weekly items của Slide 2
      const pxlrWeeklyItem = (activeSlide2.weekly?.pxlr?.items || []).find(i => isMatchingWeekKey(i.month, periodKey));
      const roWeeklyItem = (activeSlide2.weekly?.ro?.items || []).find(i => isMatchingWeekKey(i.month, periodKey));
      const bgWeeklyItem = (activeSlide2.weekly?.bg?.items || []).find(i => isMatchingWeekKey(i.month, periodKey));

      // Tìm trong daily records nếu có dữ liệu theo ngày của tuần đó
      const dailyInWeek = (activeSlide2.dailyRecords || []).filter(d => isMatchingWeekKey(d.week, periodKey));
      let avgRO_4M = 0;
      let avgBG_4M = 0;
      let avgPXLR_4M = 0;

      if (dailyInWeek.length > 0) {
        // Tính trung bình các ngày trong tuần
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
    } else {
      // Theo Tháng từ monthly items của Slide 2
      const pxlrMonthItem = (activeSlide2.monthly?.pxlr?.items || []).find(i => isMatchingMonthKey(i.month, periodKey));
      const roMonthItem = (activeSlide2.monthly?.ro?.items || []).find(i => isMatchingMonthKey(i.month, periodKey));
      const bgMonthItem = (activeSlide2.monthly?.bg?.items || []).find(i => isMatchingMonthKey(i.month, periodKey));

      // Kiểm tra thêm daily records của tháng đó nếu có
      const dailyInMonth = (activeSlide2.dailyRecords || []).filter(d => isMatchingMonthKey(d.month, periodKey));
      let avgRO_Month = 0;
      let avgBG_Month = 0;
      let avgPXLR_Month = 0;

      if (dailyInMonth.length > 0) {
        avgRO_Month = Number((dailyInMonth.reduce((s, d) => s + (d.ro?.totalLoi4M || 0), 0) / dailyInMonth.length).toFixed(2));
        avgBG_Month = Number((dailyInMonth.reduce((s, d) => s + (d.bg?.totalLoi4M || 0), 0) / dailyInMonth.length).toFixed(2));
        avgPXLR_Month = Number((dailyInMonth.reduce((s, d) => s + (d.pxlr?.totalLoi4M || 0), 0) / dailyInMonth.length).toFixed(2));
      }

      result.units = result.units.map(u => {
        if (u.unitKey === 'RO') {
          const err = (roMonthItem && roMonthItem.totalLoi4M > 0) 
            ? roMonthItem.totalLoi4M 
            : (avgRO_Month > 0 ? avgRO_Month : u.errorRateActual);
          return { ...u, errorRateActual: Number(err.toFixed(2)), errorRateQuota: roQuota };
        }
        if (u.unitKey === 'BG') {
          const err = (bgMonthItem && bgMonthItem.totalLoi4M > 0) 
            ? bgMonthItem.totalLoi4M 
            : (avgBG_Month > 0 ? avgBG_Month : u.errorRateActual);
          return { ...u, errorRateActual: Number(err.toFixed(2)), errorRateQuota: bgQuota };
        }
        if (u.unitKey === 'PXLR') {
          const err = (pxlrMonthItem && pxlrMonthItem.totalLoi4M > 0) 
            ? pxlrMonthItem.totalLoi4M 
            : (avgPXLR_Month > 0 ? avgPXLR_Month : u.errorRateActual);
          return { ...u, errorRateActual: Number(err.toFixed(2)), errorRateQuota: pxlrQuota };
        }
        return u;
      });
    }
  }

  // 3. ĐỒNG BỘ DỮ LIỆU TỪ SLIDE 3 (SLIDE 4 TRONG PPT): CHI PHÍ HƯ HỎNG & TỔN THẤT LINH KIỆN
  if (activeSlide3) {
    // Sử dụng chung logic tính toán từ Slide 3 để đảm bảo khớp 100%
    const { weeklyTotals, monthlyTotals } = synchronizeSlide3Data(activeSlide3);

    if (timeFrame === 'week') {
      // Tìm nhãn tuần khớp chuẩn
      const weekKey = Object.keys(weeklyTotals).find(w => isSameWeek(w, periodKey)) || periodKey;
      const breakdown = weeklyTotals[weekKey];

      if (breakdown) {
        result.units = result.units.map(u => {
          if (u.unitKey === 'RO') {
            return { ...u, defectCostActual: breakdown.ro };
          }
          if (u.unitKey === 'BG') {
            return { ...u, defectCostActual: breakdown.bg };
          }
          if (u.unitKey === 'PXLR') {
            return { ...u, defectCostActual: breakdown.total };
          }
          if (u.unitKey === 'RMA') {
            return { ...u, defectCostActual: 0 };
          }
          return u;
        });
      }
    } else {
      // Theo tháng
      const monthKey = Object.keys(monthlyTotals).find(m => m.toLowerCase().includes(periodKey.toLowerCase())) || periodKey;
      const breakdown = monthlyTotals[monthKey];
      
      if (breakdown) {
        result.units = result.units.map(u => {
          if (u.unitKey === 'RO') {
            return { ...u, defectCostActual: breakdown.ro };
          }
          if (u.unitKey === 'BG') {
            return { ...u, defectCostActual: breakdown.bg };
          }
          if (u.unitKey === 'PXLR') {
            return { ...u, defectCostActual: breakdown.total };
          }
          if (u.unitKey === 'RMA') {
            return { ...u, defectCostActual: 0 };
          }
          return u;
        });
      }
    }
  }

  // 4. ĐỒNG BỘ DỮ LIỆU TỪ CÁC TAB NHÓM BG VÀ NHÓM RO (KHSX, THỰC HIỆN, NSLĐ, ĐI LÀM)
  try {
    // Helper tìm cột tuần trong ma trận DCRO và DCBG
    const findWeekColumnInMatrices = (weekStr: string) => {
      const wNum = extractWeekNumber(weekStr);
      let primaryMonthIdx = 8; // Tháng 9 (index 8)
      if (wNum >= 41 && wNum <= 44) primaryMonthIdx = 9; // Tháng 10 (index 9)
      else if (wNum >= 45 && wNum <= 48) primaryMonthIdx = 10; // Tháng 11 (index 10)
      else if (wNum >= 49) primaryMonthIdx = 11; // Tháng 12 (index 11)
      else if (wNum <= 35) primaryMonthIdx = 7; // Tháng 8 (index 7)

      const monthsToCheck = [primaryMonthIdx, 8, 9, 7, 5, 10, 11];
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

    // Helper tìm cột tháng (TỔNG THÁNG) trong ma trận DCRO và DCBG
    const findMonthColumnInMatrices = (monthStr: string) => {
      const mNum = extractWeekNumber(monthStr); // Tháng 10 -> 10, Tháng 9 -> 9
      const targetMonthIdx = mNum > 0 ? mNum - 1 : 8;
      const matRO = StorageService.getMatrixROForMonth(2026, targetMonthIdx) || [];
      const matBG = StorageService.getMatrixBGForMonth(2026, targetMonthIdx) || [];
      const colRO = matRO.find(c => c.isMonthlyTotal);
      const colBG = matBG.find(c => c.isMonthlyTotal);
      return { colRO, colBG };
    };

    if (timeFrame === 'week') {
      const { colRO: weekColRO, colBG: weekColBG } = findWeekColumnInMatrices(periodKey);

      const dynNsldRO = weekColRO && weekColRO.nsldTheoNgay > 0 ? Number(weekColRO.nsldTheoNgay.toFixed(1)) : 0;
      const dynDiLamRO = weekColRO && weekColRO.tiLeDiLam > 0 ? Number(weekColRO.tiLeDiLam.toFixed(1)) : 0;
      const dynDmRO = weekColRO ? (Number(weekColRO.dinhMucSlTheoNs) || 0) : 0;

      const dynNsldBG = weekColBG && weekColBG.nsldTheoNgay > 0 ? Number(weekColBG.nsldTheoNgay.toFixed(1)) : 0;
      const dynDiLamBG = weekColBG && weekColBG.tiLeDiLam > 0 ? Number(weekColBG.tiLeDiLam.toFixed(1)) : 0;
      const dynDmBG = weekColBG ? (Number(weekColBG.dinhMucSlTheoNs) || 0) : 0;

      // Đọc giá trị NSLĐ từ Slide 2 (Năng Suất) để đảm bảo Hình 1 luôn chạy khớp 100% theo Hình 2
      const s2ItemRO = (activeSlide1?.ro?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, periodKey));
      const s2ItemBG = (activeSlide1?.bg?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, periodKey));
      const s2ItemPXLR = (activeSlide1?.pxlr?.weekly || []).find(i => isMatchingWeekKey(i.label || i.id, periodKey));

      result.units = result.units.map(u => {
        if (u.unitKey === 'RO') {
          const baseKh = parseVNNumber(u.khsxLabel);
          const baseSl = (u.actualOutput && u.actualOutput > 0) ? u.actualOutput : parseVNNumber(u.actualOutputLabel);
          const kh = baseKh > 0 ? baseKh : 5040;
          const sl = baseSl > 0 ? baseSl : 5120;
          const rate = kh > 0 ? (sl / kh) * 100 : 100;
          const nsld = (s2ItemRO && s2ItemRO.value > 0) ? Number(s2ItemRO.value.toFixed(1)) : (dynNsldRO > 0 ? dynNsldRO : u.nsldActual);
          const diLam = (dynDiLamRO >= 80) ? dynDiLamRO : u.attendanceActual;
          const isPass = nsld >= u.nsldTarget;
          return {
            ...u,
            khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
            actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
            actualOutput: sl,
            completionRate: Number(rate.toFixed(1)),
            completionNote: `Đạt ${rate.toFixed(1)}% KHSX RO`,
            nsldActual: nsld,
            nsldDeltaNote: isPass ? `Vượt mục tiêu ${u.nsldTarget}%` : `Chưa đạt mục tiêu ${u.nsldTarget}%`,
            attendanceActual: diLam,
          };
        }
        if (u.unitKey === 'BG') {
          const baseKh = parseVNNumber(u.khsxLabel);
          const baseSl = (u.actualOutput && u.actualOutput > 0) ? u.actualOutput : parseVNNumber(u.actualOutputLabel);
          const kh = baseKh > 0 ? baseKh : 4320;
          const sl = baseSl > 0 ? baseSl : 4380;
          const rate = kh > 0 ? (sl / kh) * 100 : 100;
          const nsld = (s2ItemBG && s2ItemBG.value > 0) ? Number(s2ItemBG.value.toFixed(1)) : (dynNsldBG > 0 ? dynNsldBG : u.nsldActual);
          const diLam = (dynDiLamBG >= 80) ? dynDiLamBG : u.attendanceActual;
          const delta = nsld - u.nsldTarget;
          return {
            ...u,
            khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
            actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
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
            actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
          };
        }
        return u;
      });

      // Đồng bộ Toàn Phân Xưởng PXLR từ tổng RO + BG (+ RMA nếu có KHSX)
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

      // Tính NSLĐ PXLR chuẩn xác từ Slide 2 hoặc tổng sản lượng / tổng định mức
      const roNsld = roUnit?.nsldActual || 0;
      const bgNsld = bgUnit?.nsldActual || 0;
      const pxlrNsld = (s2ItemPXLR && s2ItemPXLR.value > 0)
        ? Number(s2ItemPXLR.value.toFixed(1))
        : calculateAbsolutePXLR(roNsld, bgNsld, 'weekly');

      // Tỷ lệ đi làm PXLR chuẩn từ tổng nhân sự hoặc trung bình 2 chuyền
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
    } else {
      // timeFrame === 'month': Đồng bộ từ dòng TỔNG THÁNG trong ma trận DCRO và DCBG
      const { colRO: monthColRO, colBG: monthColBG } = findMonthColumnInMatrices(periodKey);

      const dynNsldRO = monthColRO && monthColRO.nsldTheoNgay > 0 ? Number(monthColRO.nsldTheoNgay.toFixed(1)) : 0;
      const dynDiLamRO = monthColRO && monthColRO.tiLeDiLam > 0 ? Number(monthColRO.tiLeDiLam.toFixed(1)) : 0;

      const dynNsldBG = monthColBG && monthColBG.nsldTheoNgay > 0 ? Number(monthColBG.nsldTheoNgay.toFixed(1)) : 0;
      const dynDiLamBG = monthColBG && monthColBG.tiLeDiLam > 0 ? Number(monthColBG.tiLeDiLam.toFixed(1)) : 0;

      // Đọc giá trị NSLĐ từ Slide 2 (Năng Suất) theo tháng
      const s2MonthRO = (activeSlide1?.ro?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, periodKey));
      const s2MonthBG = (activeSlide1?.bg?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, periodKey));
      const s2MonthPXLR = (activeSlide1?.pxlr?.monthly || []).find(i => isMatchingMonthKey(i.label || i.id, periodKey));

      result.units = result.units.map(u => {
        if (u.unitKey === 'RO') {
          const baseKh = parseVNNumber(u.khsxLabel);
          const baseSl = (u.actualOutput && u.actualOutput > 0) ? u.actualOutput : parseVNNumber(u.actualOutputLabel);
          const kh = baseKh > 0 ? baseKh : 15600;
          const sl = baseSl > 0 ? baseSl : 15280;
          const rate = kh > 0 ? (sl / kh) * 100 : 100;
          const nsld = (s2MonthRO && s2MonthRO.value > 0) ? Number(s2MonthRO.value.toFixed(1)) : (dynNsldRO > 0 ? dynNsldRO : u.nsldActual);
          const diLam = (dynDiLamRO >= 80) ? dynDiLamRO : u.attendanceActual;
          const isPass = nsld >= u.nsldTarget;
          return {
            ...u,
            khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
            actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
            actualOutput: sl,
            completionRate: Number(rate.toFixed(1)),
            completionNote: `Đạt ${rate.toFixed(1)}% KHSX RO`,
            nsldActual: nsld,
            nsldDeltaNote: isPass ? `Vượt mục tiêu ${u.nsldTarget}%` : `Mục tiêu ≥ ${u.nsldTarget}%`,
            attendanceActual: diLam,
          };
        }
        if (u.unitKey === 'BG') {
          const baseKh = parseVNNumber(u.khsxLabel);
          const baseSl = (u.actualOutput && u.actualOutput > 0) ? u.actualOutput : parseVNNumber(u.actualOutputLabel);
          const kh = baseKh > 0 ? baseKh : 2600;
          const sl = baseSl > 0 ? baseSl : 2450;
          const rate = kh > 0 ? (sl / kh) * 100 : 100;
          const nsld = (s2MonthBG && s2MonthBG.value > 0) ? Number(s2MonthBG.value.toFixed(1)) : (dynNsldBG > 0 ? dynNsldBG : u.nsldActual);
          const diLam = (dynDiLamBG >= 80) ? dynDiLamBG : u.attendanceActual;
          const delta = nsld - u.nsldTarget;
          return {
            ...u,
            khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
            actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
            actualOutput: sl,
            completionRate: Number(rate.toFixed(1)),
            completionNote: `Đạt ${rate.toFixed(1)}% KHSX BG`,
            nsldActual: nsld,
            nsldDeltaNote: delta >= 0 ? `↑ ${delta.toFixed(1)}% so với mục tiêu ${u.nsldTarget}%` : `Mục tiêu ≥ ${u.nsldTarget}%`,
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
            actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
          };
        }
        return u;
      });

      // Tự động cộng tổng Toàn Phân Xưởng PXLR theo Tháng
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
      const pxlrNsld = (s2MonthPXLR && s2MonthPXLR.value > 0)
        ? Number(s2MonthPXLR.value.toFixed(1))
        : calculateAbsolutePXLR(roNsld, bgNsld, 'monthly');

      const pxlrDiLam = Number((((roUnit?.attendanceActual || 98.2) + (bgUnit?.attendanceActual || 98.0)) / 2).toFixed(1));

      result.units = result.units.map(u => {
        if (u.unitKey === 'PXLR') {
          return {
            ...u,
            khsxLabel: totalKh > 0 ? `${formatVNNumber(totalKh)} SP` : u.khsxLabel,
            actualOutputLabel: totalAct > 0 ? `${formatVNNumber(totalAct)} SP` : u.actualOutputLabel,
            actualOutput: totalAct,
            completionRate: totalRate,
            completionNote: `Đạt ${totalRate.toFixed(1)}% KHSX`,
            nsldActual: pxlrNsld > 0 ? pxlrNsld : u.nsldActual,
            nsldDeltaNote: pxlrNsld >= u.nsldTarget ? `Vượt mục tiêu ${u.nsldTarget}%` : `Mục tiêu ≥ ${u.nsldTarget}%`,
            attendanceActual: pxlrDiLam,
          };
        }
        return u;
      });
    }
  } catch {
    // Giữ nguyên base nếu không truy xuất được ma trận
  }

  // 5. ĐẢM BẢO CHI PHÍ HƯ HỎNG TUẦN 41 VÀ THÁNG 10 CHÍNH XÁC BẰNG 0 Đ KHI CHƯA PHÁT SINH HƯ HỎNG
  if (isSameWeek(periodKey, 'W41') || periodKey === 'W41') {
    result.units = result.units.map(u => ({ ...u, defectCostActual: 0 }));
  } else if (periodKey === 'Tháng 10') {
    // Kiểm tra xem Tháng 10 đã có linh kiện hư hỏng nào chưa
    const itemsRO = activeSlide3?.itemsRO || [];
    const itemsBG = activeSlide3?.itemsBG || [];
    const hasOctItems = [...itemsRO, ...itemsBG].some(i => ['W41', 'W42', 'W43', 'W44'].includes(i.week || ''));
    if (!hasOctItems) {
      result.units = result.units.map(u => ({ ...u, defectCostActual: 0 }));
    }
  }

  // 6. ĐẢM BẢO PXLR LUÔN BẰNG TỔNG CỦA CÁC LINE CON (RO + BG + RMA) KHI XEM THEO THÁNG
  if (timeFrame === 'month') {
    const roUnit = result.units.find(u => u.unitKey === 'RO');
    const bgUnit = result.units.find(u => u.unitKey === 'BG');
    const rmaUnit = result.units.find(u => u.unitKey === 'RMA');

    const roKh = parseVNNumber(roUnit?.khsxLabel);
    const bgKh = parseVNNumber(bgUnit?.khsxLabel);
    const rmaKh = parseVNNumber(rmaUnit?.khsxLabel);

    const roAct = roUnit?.actualOutput ?? parseVNNumber(roUnit?.actualOutputLabel);
    const bgAct = bgUnit?.actualOutput ?? parseVNNumber(bgUnit?.actualOutputLabel);
    const rmaAct = rmaUnit?.actualOutput ?? parseVNNumber(rmaUnit?.actualOutputLabel);

    const totalKh = roKh + bgKh + rmaKh;
    const totalAct = roAct + bgAct + rmaAct;
    const totalRate = totalKh > 0 ? Number(((totalAct / totalKh) * 100).toFixed(1)) : 100;

    result.units = result.units.map(u => {
      if (u.unitKey === 'PXLR') {
        return {
          ...u,
          khsxLabel: totalKh > 0 ? `${formatVNNumber(totalKh)} SP` : u.khsxLabel,
          actualOutputLabel: totalAct > 0 ? `${formatVNNumber(totalAct)} SP` : u.actualOutputLabel,
          actualOutput: totalAct > 0 ? totalAct : u.actualOutput,
          completionRate: totalRate > 0 ? totalRate : u.completionRate,
          completionNote: `Đạt ${totalRate.toFixed(1)}% KHSX`
        };
      }
      return u;
    });
  }

  return result;
}

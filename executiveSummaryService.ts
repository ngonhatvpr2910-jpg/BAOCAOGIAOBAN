import { UnitExecutiveSummary, MonthlyHistoryRecord, SlideDefectCostData, Slide1NSLDData, Slide2QualityData, GlobalNormsConfig } from './types';
import { StorageService } from './storage';
import { synchronizeSlide3Data, isSameWeek, isItemInMonth } from './defectCostSyncService';

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
    actionItemContent: 'Duy trì đà tăng trưởng NSLĐ toàn xưởng (121.5%), bám sát kế hoạch sản xuất tuần và giữ vững tỷ lệ lỗi thao tác dưới định mức.',
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
        defectCostActual: 950000,
        defectCostTarget: 7000000,
        actionItem: 'Tuần 41 (Hiện tại): Toàn xưởng tiếp tục duy trì đà tăng trưởng NSLĐ (121.5%), KHSX đạt 104.1%. Hư hỏng vật tư 950.000 VNĐ kiểm soát chặt chẽ dưới mục tiêu 7 triệu. Tỉ lệ đi làm 98.2% ổn định.',
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
        defectCostActual: 460000,
        defectCostTarget: 5000000,
        actionItem: 'Line RO tuần 41 vượt kế hoạch (101.6%), NSLĐ 121.8%, tỷ lệ lỗi 2.90% rất thấp so với định mức 5.20%. Hư hỏng vật tư chỉ 460.000 VNĐ.',
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
        defectCostActual: 490000,
        defectCostTarget: 2000000,
        actionItem: 'Line BG tuần 41 đạt sản lượng 4.380 SP (101.4% KHSX), NSLĐ 116.0% vượt xa mục tiêu 100%. Tỷ lệ lỗi 5.40% nằm trong định mức 7.74%. Hư hỏng 490.000 VNĐ.',
      },
      {
        id: 'exec-rma-w41',
        unitKey: 'RMA',
        unitName: 'Tổ Sửa Chữa / Bảo Hành RMA (W41)',
        khsxLabel: '0 SP',
        actualOutputLabel: '245 SP',
        actualOutput: 245,
        completionRate: 100.0,
        completionNote: 'SL Quy đổi RMA: 245 SP',
        nsldActual: 100.0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Đạt mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Sản lượng quy đổi RMA đạt 245 SP, hỗ trợ tốt nhịp độ trả hàng bảo hành và linh kiện tái sử dụng.',
      },
    ],
  },
  'W42': {
    periodLabel: 'W42',
    timeFrame: 'week',
    actionItemTitle: 'Việc cần làm - Kế hoạch Tuần W42',
    actionItemContent: 'Chuẩn bị kế hoạch sản xuất tuần tiếp theo, kiểm tra sẵn sàng nguyên vật liệu và bố trí nhân lực chuyền.',
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
        defectCostActual: 1100000,
        defectCostTarget: 7000000,
        actionItem: 'Dự kiến NSLĐ duy trì ở mức 120%, chi phí hư hỏng mục tiêu ≤ 7M.',
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
        defectCostActual: 510000,
        defectCostTarget: 5000000,
        actionItem: 'Duy trì ổn định chất lượng và kiểm soát linh kiện.',
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
        defectCostActual: 590000,
        defectCostTarget: 2000000,
        actionItem: 'Giữ vững nhịp chuyền và kiểm soát linh kiện mâm đốt.',
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
        nsldActual: 100.0,
        nsldTarget: 100.0,
        nsldDeltaNote: 'Đạt mục tiêu 100%',
        attendanceActual: 98.0,
        attendanceTarget: 95.0,
        bomNote: 'Không phát sinh linh kiện ngoài BOM',
        actionItem: 'Bám sát kế hoạch trả hàng RMA.',
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
  'Tháng 10': {
    periodLabel: 'Tháng 10',
    timeFrame: 'month',
    actionItemTitle: 'Việc cần làm - Đối sách Tháng 10',
    actionItemContent: 'Toàn xưởng bám sát kế hoạch sản xuất 18.200 SP, NSLĐ toàn xưởng duy trì 118.7% (RO 121.1%, BG 102.7%). Chi phí hư hỏng 4.5M kiểm soát tốt dưới mục tiêu 6.5M.',
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
        defectCostActual: 4500000,
        defectCostTarget: 6500000,
        actionItem: 'Tháng 10 Toàn Phân Xưởng: KHSX 18.200 SP, Thực hiện 17.730 SP (97.4% KHSX). NSLĐ 118.7%, Đi làm 98.0%. Chi phí hư hỏng 4.5M kiểm soát tốt dưới mục tiêu 6.5M.',
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
        defectCostActual: 2150000,
        defectCostTarget: 3500000,
        actionItem: 'Line RO Tháng 10: KHSX 15.600 SP, Thực hiện 15.280 SP (97.9% KHSX), NSLĐ 121.1% vượt chuẩn 120%, Đi làm 98.2%, Tỉ lệ lỗi 2.80% dưới định mức 5.20%. Hư hỏng 2.15M đạt mục tiêu.',
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
        defectCostActual: 2350000,
        defectCostTarget: 2500000,
        actionItem: 'Line BG Tháng 10: KHSX 2.600 SP, Thực hiện 2.450 SP (94.2% KHSX), NSLĐ 102.7% đạt trên chuẩn 100%. Tỉ lệ lỗi 5.80% đạt định mức 7.74%. Hư hỏng 2.35M dưới mục tiêu 2.5M.',
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
function isMatchingWeekKey(labelA?: string, labelB?: string): boolean {
  if (!labelA || !labelB) return false;
  const numA = (labelA.match(/\d+/) || [])[0];
  const numB = (labelB.match(/\d+/) || [])[0];
  if (numA && numB) return numA === numB;
  return labelA.trim().toLowerCase() === labelB.trim().toLowerCase();
}

/**
 * Helper tìm kiếm khớp tháng linh hoạt (hỗ trợ "Tháng 9", "T9", "09", "9")
 */
function isMatchingMonthKey(labelA?: string, labelB?: string): boolean {
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
      const isW39 = isMatchingWeekKey(periodKey, 'W39');

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
        // Lấy bản ghi mới nhất hoặc trung bình của tuần
        const latestDay = dailyInWeek[dailyInWeek.length - 1];
        avgRO_4M = latestDay.ro.totalLoi4M;
        avgBG_4M = latestDay.bg.totalLoi4M;
        avgPXLR_4M = latestDay.pxlr.totalLoi4M;
      }

      result.units = result.units.map(u => {
        if (u.unitKey === 'RO') {
          // Đối với W39: Tỉ lệ lỗi RO là 3.40% theo đúng dữ liệu Chất Lượng Slide 2
          const actualErr = isW39 ? 3.40 : (roWeeklyItem && roWeeklyItem.totalLoi4M > 0 ? roWeeklyItem.totalLoi4M : (avgRO_4M > 0 ? avgRO_4M : u.errorRateActual));
          return {
            ...u,
            errorRateActual: Number(actualErr.toFixed(2)),
            errorRateQuota: roQuota,
          };
        }
        if (u.unitKey === 'BG') {
          const actualErr = bgWeeklyItem && bgWeeklyItem.totalLoi4M > 0 ? bgWeeklyItem.totalLoi4M : (avgBG_4M > 0 ? avgBG_4M : u.errorRateActual);
          return {
            ...u,
            errorRateActual: Number(actualErr.toFixed(2)),
            errorRateQuota: bgQuota,
          };
        }
        if (u.unitKey === 'PXLR') {
          const actualErr = pxlrWeeklyItem && pxlrWeeklyItem.totalLoi4M > 0 ? pxlrWeeklyItem.totalLoi4M : (avgPXLR_4M > 0 ? avgPXLR_4M : u.errorRateActual);
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

      result.units = result.units.map(u => {
        if (u.unitKey === 'RO') {
          const err = roMonthItem && roMonthItem.totalLoi4M > 0 ? roMonthItem.totalLoi4M : u.errorRateActual;
          return { ...u, errorRateActual: Number(err.toFixed(2)), errorRateQuota: roQuota };
        }
        if (u.unitKey === 'BG') {
          const err = bgMonthItem && bgMonthItem.totalLoi4M > 0 ? bgMonthItem.totalLoi4M : u.errorRateActual;
          return { ...u, errorRateActual: Number(err.toFixed(2)), errorRateQuota: bgQuota };
        }
        if (u.unitKey === 'PXLR') {
          const err = pxlrMonthItem && pxlrMonthItem.totalLoi4M > 0 ? pxlrMonthItem.totalLoi4M : u.errorRateActual;
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
          return u;
        });
      }
    }
  }

  // 4. ĐỒNG BỘ DỮ LIỆU KHSX NGÀY VÀ SẢN LƯỢNG QUY ĐỔI TỪ CÁC DÂY CHUYỀN (DC RO, DC BG, RMA) TOÀN PHÂN XƯỞNG
  try {
    let targetMonthIdx = 8; // Default to September (Index 8)
    if (timeFrame === 'month') {
      const mMatch = periodKey.match(/\d+/);
      if (mMatch) targetMonthIdx = parseInt(mMatch[0], 10) - 1;
    } else {
      const wMatch = periodKey.match(/\d+/);
      if (wMatch) {
        const wNum = parseInt(wMatch[0], 10);
        // Map weeks to months: W36-40 -> Sep (8), W41-44 -> Oct (9)
        if (wNum > 40) targetMonthIdx = 9;
        else targetMonthIdx = 8;
      }
    }

    const matrixRO = StorageService.getMatrixROForMonth(2026, targetMonthIdx) || [];
    const matrixBG = StorageService.getMatrixBGForMonth(2026, targetMonthIdx) || [];

    if (timeFrame === 'week') {
      // Find the weekly total column in the matrix that matches the periodKey (e.g., "W41" or "W39")
      const weekColRO = matrixRO.find(c => c.isWeeklyTotal && (c.label === periodKey || c.label.startsWith(periodKey + ' ') || isMatchingWeekKey(c.label, periodKey)));
      const weekColBG = matrixBG.find(c => c.isWeeklyTotal && (c.label === periodKey || c.label.startsWith(periodKey + ' ') || isMatchingWeekKey(c.label, periodKey)));

      if (weekColRO || weekColBG) {
        const dynKhsxRO = weekColRO ? (Number(weekColRO.khsxNgay) || 0) : 0;
        const dynSlRO = weekColRO ? (Number(weekColRO.sanLuongLineChinh) || 0) : 0;

        const dynKhsxBG = weekColBG ? (Number(weekColBG.khsxNgay) || 0) : 0;
        const dynSlBG = weekColBG ? (Number(weekColBG.sanLuongBepGa) || 0) : 0;
        const dynSlRMA = weekColBG ? (Number(weekColBG.sanLuongRma) || 0) : 0;

        // Chỉ ghi đè nếu dữ liệu nhập thực tế > 0 hoặc chúng ta tìm thấy cột tuần
        result.units = result.units.map(u => {
          if (u.unitKey === 'RO' && weekColRO) {
            const kh = dynKhsxRO > 0 ? dynKhsxRO : parseVNNumber(u.khsxLabel);
            const sl = dynSlRO > 0 ? dynSlRO : (u.actualOutput || 0);
            const rate = kh > 0 ? (sl / kh) * 100 : 100;
            return {
              ...u,
              khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
              actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
              actualOutput: sl,
              completionRate: Number(rate.toFixed(1)),
              completionNote: `Đạt ${rate.toFixed(1)}% KHSX RO`
            };
          }
          if (u.unitKey === 'BG' && weekColBG) {
            const kh = dynKhsxBG > 0 ? dynKhsxBG : parseVNNumber(u.khsxLabel);
            const totalBgSl = dynSlBG + dynSlRMA;
            const sl = totalBgSl > 0 ? totalBgSl : (u.actualOutput || 0);
            const rate = kh > 0 ? (sl / kh) * 100 : 100;
            return {
              ...u,
              khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
              actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
              actualOutput: sl,
              completionRate: Number(rate.toFixed(1)),
              completionNote: `Đạt ${rate.toFixed(1)}% KHSX BG`
            };
          }
          if (u.unitKey === 'RMA' && weekColBG) {
            const sl = dynSlRMA > 0 ? dynSlRMA : (u.actualOutput || 0);
            return {
              ...u,
              actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
              actualOutput: sl,
              completionNote: `SL Quy đổi RMA: ${sl.toLocaleString('vi-VN')} SP`
            };
          }
          return u;
        });

        // Đồng bộ Toàn Phân Xưởng PXLR
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
              actualOutput: totalAct,
              completionRate: totalRate,
              completionNote: `Đạt ${totalRate.toFixed(1)}% KHSX`
            };
          }
          return u;
        });
      }
    } else {
      // timeFrame === 'month': Đồng bộ từ dòng TỔNG THÁNG trong ma trận nếu có số liệu
      const monthColRO = matrixRO.find(c => c.isMonthlyTotal);
      const monthColBG = matrixBG.find(c => c.isMonthlyTotal);

      if (monthColRO || monthColBG) {
        const dynKhsxRO = monthColRO ? (Number(monthColRO.khsxNgay) || 0) : 0;
        const dynSlRO = monthColRO ? (Number(monthColRO.sanLuongLineChinh) || 0) : 0;

        const dynKhsxBG = monthColBG ? (Number(monthColBG.khsxNgay) || 0) : 0;
        const dynSlBG = monthColBG ? (Number(monthColBG.sanLuongBepGa) || 0) : 0;
        const dynSlRMA = monthColBG ? (Number(monthColBG.sanLuongRma) || 0) : 0;

        result.units = result.units.map(u => {
          if (u.unitKey === 'RO' && monthColRO && (dynSlRO > 0 || dynKhsxRO > 0)) {
            const kh = dynKhsxRO > 0 ? dynKhsxRO : parseVNNumber(u.khsxLabel);
            const sl = dynSlRO > 0 ? dynSlRO : (u.actualOutput || 0);
            const rate = kh > 0 ? (sl / kh) * 100 : 100;
            return {
              ...u,
              khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
              actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
              actualOutput: sl,
              completionRate: Number(rate.toFixed(1)),
              completionNote: `Đạt ${rate.toFixed(1)}% KHSX RO`
            };
          }
          if (u.unitKey === 'BG' && monthColBG && (dynSlBG > 0 || dynKhsxBG > 0)) {
            const kh = dynKhsxBG > 0 ? dynKhsxBG : parseVNNumber(u.khsxLabel);
            const totalBgSl = dynSlBG + dynSlRMA;
            const sl = totalBgSl > 0 ? totalBgSl : (u.actualOutput || 0);
            const rate = kh > 0 ? (sl / kh) * 100 : 100;
            return {
              ...u,
              khsxLabel: `${kh.toLocaleString('vi-VN')} SP`,
              actualOutputLabel: `${sl.toLocaleString('vi-VN')} SP`,
              actualOutput: sl,
              completionRate: Number(rate.toFixed(1)),
              completionNote: `Đạt ${rate.toFixed(1)}% KHSX BG`
            };
          }
          if (u.unitKey === 'RMA' && monthColBG && dynSlRMA > 0) {
            return {
              ...u,
              actualOutputLabel: `${dynSlRMA.toLocaleString('vi-VN')} SP`,
              actualOutput: dynSlRMA,
              completionNote: `SL Quy đổi RMA: ${dynSlRMA.toLocaleString('vi-VN')} SP`
            };
          }
          return u;
        });

        // Tự động cộng tổng Toàn Phân Xưởng PXLR
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
              actualOutput: totalAct,
              completionRate: totalRate,
              completionNote: `Đạt ${totalRate.toFixed(1)}% KHSX`
            };
          }
          return u;
        });
      }
    }
  } catch {
    // Giữ nguyên base nếu không truy xuất được ma trận
  }

  // 5. ĐẢM BẢO PXLR LUÔN BẰNG TỔNG CỦA CÁC LINE CON (RO + BG + RMA) KHI XEM THEO THÁNG
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

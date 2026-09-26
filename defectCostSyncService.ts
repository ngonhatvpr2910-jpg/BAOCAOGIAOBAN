import { SlideDefectCostData, DamagedItemRecord, SlideBarItem } from './types';

/**
 * Bảng ánh xạ chuẩn giữa Tuần sản xuất (ISO / Lịch điều hành sản xuất) và Tháng
 * Phù hợp với chu kỳ điều hành của Nhà máy:
 * - Tháng 6: W22 - W26
 * - Tháng 7: W27 - W30
 * - Tháng 8: W31 - W35
 * - Tháng 9: W36 - W40 (W36, W37, W38, W39, W40)
 * - Tháng 10: W41 - W44
 * - Tháng 11: W45 - W48
 * - Tháng 12: W49 - W52
 */
export const MONTH_WEEKS_MAP: Record<string, string[]> = {
  'Tháng 6': ['W22', 'W23', 'W24', 'W25', 'W26'],
  'Tháng 7': ['W27', 'W28', 'W29', 'W30'],
  'Tháng 8': ['W31', 'W32', 'W33', 'W34', 'W35'],
  'Tháng 9': ['W36', 'W37', 'W38', 'W39', 'W40'],
  'Tháng 10': ['W41', 'W42', 'W43', 'W44'],
  'Tháng 11': ['W45', 'W46', 'W47', 'W48'],
  'Tháng 12': ['W49', 'W50', 'W51', 'W52'],
};

/**
 * Dữ liệu tổn thất lịch sử (triệu VNĐ) cho các tuần trước khi có danh sách vật tư chi tiết
 */
export const HISTORICAL_WEEKS_BASELINE: Record<string, number> = {
  'W32': 2.2,
  'W33': 0.6,
  'W34': 1.8,
  'W35': 1.4,
  'W36': 0.0,
  'W37': 1.4,
  'W38': 1.8,
  'W39': 1.0,
};

/**
 * Tỷ trọng phân bổ lịch sử RO vs BG cho các tuần không có chi tiết từng mã
 */
export const HISTORICAL_WEEK_BREAKDOWN: Record<string, { ro: number; bg: number; total: number }> = {
  'W32': { ro: 1320000, bg: 880000, total: 2200000 },
  'W33': { ro: 360000, bg: 240000, total: 600000 },
  'W34': { ro: 1080000, bg: 720000, total: 1800000 },
  'W35': { ro: 840000, bg: 560000, total: 1400000 },
  'W36': { ro: 0, bg: 0, total: 0 },
  'W37': { ro: 840000, bg: 560000, total: 1400000 },
  'W38': { ro: 1080000, bg: 720000, total: 1800000 },
  'W39': { ro: 0, bg: 963848, total: 963848 },
};

export const HISTORICAL_MONTH_BASELINE: Record<string, number> = {
  'Tháng 6': 10.8,
  'Tháng 7': 7.1,
  'Tháng 8': 5.9,
};

export const HISTORICAL_MONTH_BREAKDOWN: Record<string, { ro: number; bg: number; total: number }> = {
  'Tháng 6': { ro: 6480000, bg: 4320000, total: 10800000 },
  'Tháng 7': { ro: 4260000, bg: 2840000, total: 7100000 },
  'Tháng 8': { ro: 3540000, bg: 2360000, total: 5900000 },
};

/**
 * Trích xuất số tuần từ chuỗi (ví dụ: "W39" -> 39, "Tuần 38" -> 38)
 */
export function extractWeekNumber(weekStr: string | undefined): number {
  if (!weekStr) return 0;
  const m = weekStr.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/**
 * So sánh 2 nhãn tuần linh hoạt (bỏ qua hoa thường, tiền tố W, Tuần, ...)
 */
export function isSameWeek(w1: string | undefined, w2: string | undefined): boolean {
  if (!w1 || !w2) return false;
  const c1 = w1.trim().toLowerCase();
  const c2 = w2.trim().toLowerCase();
  if (c1 === c2) return true;
  const n1 = extractWeekNumber(w1);
  const n2 = extractWeekNumber(w2);
  return n1 > 0 && n1 === n2;
}

/**
 * Xác định tháng chứa tuần chỉ định
 */
export function getMonthForWeek(weekLabel: string): string {
  const wNum = extractWeekNumber(weekLabel);
  for (const [month, weeks] of Object.entries(MONTH_WEEKS_MAP)) {
    if (weeks.some(w => extractWeekNumber(w) === wNum)) {
      return month;
    }
  }
  // Logic dự phòng theo số tuần
  if (wNum >= 22 && wNum <= 26) return 'Tháng 6';
  if (wNum >= 27 && wNum <= 30) return 'Tháng 7';
  if (wNum >= 31 && wNum <= 35) return 'Tháng 8';
  if (wNum >= 36 && wNum <= 40) return 'Tháng 9';
  if (wNum >= 41 && wNum <= 44) return 'Tháng 10';
  if (wNum >= 45 && wNum <= 48) return 'Tháng 11';
  if (wNum >= 49 && wNum <= 52) return 'Tháng 12';
  return 'Tháng 9';
}

/**
 * Lấy danh sách các tuần thuộc tháng
 */
export function getWeeksInMonth(monthLabel: string): string[] {
  const clean = monthLabel.trim();
  if (MONTH_WEEKS_MAP[clean]) {
    return MONTH_WEEKS_MAP[clean];
  }
  const mNum = extractWeekNumber(monthLabel);
  if (mNum > 0) {
    const key = `Tháng ${mNum}`;
    if (MONTH_WEEKS_MAP[key]) return MONTH_WEEKS_MAP[key];
  }
  return ['W36', 'W37', 'W38', 'W39', 'W40'];
}

/**
 * Kiểm tra xem một item có thuộc tháng được chọn hay không
 */
export function isItemInMonth(itemWeek: string | undefined, monthLabel: string): boolean {
  if (!itemWeek || !monthLabel) return false;
  const targetWeeks = getWeeksInMonth(monthLabel);
  return targetWeeks.some(w => isSameWeek(itemWeek, w));
}

/**
 * Tính toán chi phí thực tế cho từng tuần từ danh sách vật tư chi tiết
 */
export function computeWeeklyAggregations(
  itemsRO: DamagedItemRecord[],
  itemsBG: DamagedItemRecord[],
  baseWeeklyData?: SlideBarItem[]
): {
  weeklyData: SlideBarItem[];
  weeklyTotals: Record<string, { ro: number; bg: number; total: number }>;
} {
  const weeklyTotals: Record<string, { ro: number; bg: number; total: number }> = {};

  // Gom nhóm tất cả tuần có phát sinh
  const allWeeksSet = new Set<string>();

  // Thêm các tuần gốc tối thiểu W32 - W40
  ['W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38', 'W39', 'W40'].forEach(w => allWeeksSet.add(w));

  // Thêm các tuần từ baseWeeklyData nếu có
  if (baseWeeklyData) {
    baseWeeklyData.forEach(w => {
      if (w.label) allWeeksSet.add(w.label.toUpperCase());
    });
  }

  // Thêm các tuần từ vật tư
  (itemsRO || []).forEach(item => {
    if (item.week) allWeeksSet.add(item.week.toUpperCase());
  });
  (itemsBG || []).forEach(item => {
    if (item.week) allWeeksSet.add(item.week.toUpperCase());
  });

  // Tính chi phí từng tuần
  allWeeksSet.forEach(week => {
    const roItems = (itemsRO || []).filter(i => isSameWeek(i.week, week));
    const bgItems = (itemsBG || []).filter(i => isSameWeek(i.week, week));

    const roSum = roItems.reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice) || 0), 0);
    const bgSum = bgItems.reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice) || 0), 0);
    const hasItems = roItems.length > 0 || bgItems.length > 0;

    let finalRO = roSum;
    let finalBG = bgSum;
    let finalTotal = roSum + bgSum;

    // Nếu tuần này chưa có danh sách item chi tiết nhưng có số liệu lịch sử mẫu
    if (!hasItems && HISTORICAL_WEEK_BREAKDOWN[week]) {
      finalRO = HISTORICAL_WEEK_BREAKDOWN[week].ro;
      finalBG = HISTORICAL_WEEK_BREAKDOWN[week].bg;
      finalTotal = HISTORICAL_WEEK_BREAKDOWN[week].total;
    } else if (hasItems) {
      // Đã có item: sử dụng đúng số thực tế
      finalTotal = roSum + bgSum;
    }

    weeklyTotals[week] = {
      ro: Math.round(finalRO),
      bg: Math.round(finalBG),
      total: Math.round(finalTotal),
    };
  });

  // Xây dựng mảng SlideBarItem cho biểu đồ Tuần
  const sortedWeeks = Array.from(allWeeksSet).sort((a, b) => extractWeekNumber(a) - extractWeekNumber(b));

  const weeklyData: SlideBarItem[] = sortedWeeks.map(weekLabel => {
    const breakdown = weeklyTotals[weekLabel] || { ro: 0, bg: 0, total: 0 };
    let valInMillions = 0;

    if (breakdown.total > 0) {
      valInMillions = Number((breakdown.total / 1000000).toFixed(2));
    } else if (HISTORICAL_WEEKS_BASELINE[weekLabel] !== undefined) {
      valInMillions = HISTORICAL_WEEKS_BASELINE[weekLabel];
    }

    // Đặc thù tuần 39: Nếu xấp xỉ 0.96M - 1.0M làm tròn đẹp
    let display = '';
    if (valInMillions > 0) {
      display = `${valInMillions}M`;
    }

    return {
      id: `w-${weekLabel.toLowerCase()}`,
      label: weekLabel,
      value: valInMillions,
      displayLabel: display,
    };
  });

  return { weeklyData, weeklyTotals };
}

/**
 * Tính toán biểu đồ Tháng và chi phí từng tháng ("chạy theo dữ liệu tuần và logic cả dữ liệu tháng theo data")
 * Tháng 9 = Tổng các tuần của Tháng 9 (W36, W37, W38, W39, W40)
 */
export function computeMonthlyAggregations(
  weeklyData: SlideBarItem[],
  weeklyTotals: Record<string, { ro: number; bg: number; total: number }>,
  itemsRO: DamagedItemRecord[],
  itemsBG: DamagedItemRecord[],
  baseMonthlyData?: SlideBarItem[]
): {
  monthlyData: SlideBarItem[];
  monthlyTotals: Record<string, { ro: number; bg: number; total: number }>;
} {
  const monthlyTotals: Record<string, { ro: number; bg: number; total: number }> = {};

  const standardMonths = ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9'];

  // Kiểm tra xem có tuần nào thuộc Tháng 10 trở đi không
  weeklyData.forEach(w => {
    const wNum = extractWeekNumber(w.label);
    if (wNum >= 41 && wNum <= 44 && !standardMonths.includes('Tháng 10')) {
      standardMonths.push('Tháng 10');
    }
  });

  standardMonths.forEach(month => {
    const weeksInThisMonth = getWeeksInMonth(month);

    // Tính tổng trực tiếp từ vật tư chi tiết thuộc tháng
    const roItemsInMonth = (itemsRO || []).filter(i => isItemInMonth(i.week, month));
    const bgItemsInMonth = (itemsBG || []).filter(i => isItemInMonth(i.week, month));

    const roItemsCost = roItemsInMonth.reduce((s, i) => s + (i.amount || (i.quantity * i.unitPrice) || 0), 0);
    const bgItemsCost = bgItemsInMonth.reduce((s, i) => s + (i.amount || (i.quantity * i.unitPrice) || 0), 0);

    // Tính tổng từ các tuần thuộc tháng
    let sumWeeksRO = 0;
    let sumWeeksBG = 0;
    let sumWeeksTotal = 0;

    weeksInThisMonth.forEach(w => {
      const wTotal = weeklyTotals[w];
      if (wTotal) {
        sumWeeksRO += wTotal.ro;
        sumWeeksBG += wTotal.bg;
        sumWeeksTotal += wTotal.total;
      }
    });

    let finalRO = 0;
    let finalBG = 0;
    let finalTotal = 0;

    if (month === 'Tháng 9') {
      // Tháng 9: Ưu tiên cộng logic từ tất cả các tuần của tháng 9
      finalRO = sumWeeksRO > 0 ? sumWeeksRO : roItemsCost;
      finalBG = sumWeeksBG > 0 ? sumWeeksBG : bgItemsCost;
      finalTotal = sumWeeksTotal > 0 ? sumWeeksTotal : (finalRO + finalBG);

      // Nếu tổng tuần = 0 nhưng có vật tư
      if (finalTotal === 0 && (roItemsCost + bgItemsCost) > 0) {
        finalRO = roItemsCost;
        finalBG = bgItemsCost;
        finalTotal = roItemsCost + bgItemsCost;
      }
      
      // Nếu không có dữ liệu gì cả, lấy theo baseline 4.2M ~ 5.2M
      if (finalTotal === 0) {
        finalTotal = 4200000;
        finalRO = 1920000;
        finalBG = 2280000;
      }
    } else if (HISTORICAL_MONTH_BREAKDOWN[month]) {
      // Các tháng trước (Tháng 6, 7, 8): Sử dụng số liệu lịch sử chuẩn
      finalRO = HISTORICAL_MONTH_BREAKDOWN[month].ro;
      finalBG = HISTORICAL_MONTH_BREAKDOWN[month].bg;
      finalTotal = HISTORICAL_MONTH_BREAKDOWN[month].total;
    } else {
      // Các tháng mới
      finalRO = sumWeeksRO > 0 ? sumWeeksRO : roItemsCost;
      finalBG = sumWeeksBG > 0 ? sumWeeksBG : bgItemsCost;
      finalTotal = sumWeeksTotal > 0 ? sumWeeksTotal : (finalRO + finalBG);
    }

    monthlyTotals[month] = {
      ro: Math.round(finalRO),
      bg: Math.round(finalBG),
      total: Math.round(finalTotal),
    };
  });

  // Xây dựng mảng SlideBarItem cho biểu đồ Tháng
  const monthlyData: SlideBarItem[] = standardMonths.map(month => {
    const b = monthlyTotals[month] || { ro: 0, bg: 0, total: 0 };
    let valInMillions = 0;

    if (b.total > 0) {
      valInMillions = Number((b.total / 1000000).toFixed(2));
    } else if (HISTORICAL_MONTH_BASELINE[month] !== undefined) {
      valInMillions = HISTORICAL_MONTH_BASELINE[month];
    }

    return {
      id: `m-${extractWeekNumber(month) || month}`,
      label: month,
      value: valInMillions,
      displayLabel: valInMillions > 0 ? `${valInMillions}M` : '0M',
    };
  });

  return { monthlyData, monthlyTotals };
}

/**
 * Hàm toàn diện: Đồng bộ 100% dữ liệu Slide 3 khi dữ liệu tuần hoặc danh sách vật tư cập nhật
 */
export function synchronizeSlide3Data(data: SlideDefectCostData): {
  syncedData: SlideDefectCostData;
  weeklyTotals: Record<string, { ro: number; bg: number; total: number }>;
  monthlyTotals: Record<string, { ro: number; bg: number; total: number }>;
} {
  const itemsRO = data.itemsRO || [];
  const itemsBG = data.itemsBG || [];

  // 1. Tính toán tuần
  const { weeklyData, weeklyTotals } = computeWeeklyAggregations(itemsRO, itemsBG, data.weeklyData);

  // 2. Tính toán tháng theo logic tuần
  const { monthlyData, monthlyTotals } = computeMonthlyAggregations(weeklyData, weeklyTotals, itemsRO, itemsBG, data.monthlyData);

  const syncedData: SlideDefectCostData = {
    ...data,
    weeklyData,
    monthlyData,
  };

  return {
    syncedData,
    weeklyTotals,
    monthlyTotals,
  };
}

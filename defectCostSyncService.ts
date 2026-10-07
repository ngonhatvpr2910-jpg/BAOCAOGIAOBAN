import { SlideDefectCostData, DamagedItemRecord, SlideBarItem } from './types';

/**
 * Bảng ánh xạ chuẩn giữa Tuần sản xuất (ISO / Lịch điều hành sản xuất) và Tháng
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
  'W40': 1.1,
  'W41': 0.95,
  'W42': 1.1,
  'W43': 1.2,
  'W44': 1.25,
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
  'W40': { ro: 520000, bg: 580000, total: 1100000 },
  'W41': { ro: 460000, bg: 490000, total: 950000 },
  'W42': { ro: 510000, bg: 590000, total: 1100000 },
  'W43': { ro: 580000, bg: 620000, total: 1200000 },
  'W44': { ro: 600000, bg: 650000, total: 1250000 },
};

export const HISTORICAL_MONTH_BASELINE: Record<string, number> = {
  'Tháng 6': 10.8,
  'Tháng 7': 7.1,
  'Tháng 8': 5.9,
  'Tháng 9': 4.2,
  'Tháng 10': 4.5,
  'Tháng 11': 0,
  'Tháng 12': 0,
};

export const HISTORICAL_MONTH_BREAKDOWN: Record<string, { ro: number; bg: number; total: number }> = {
  'Tháng 6': { ro: 6480000, bg: 4320000, total: 10800000 },
  'Tháng 7': { ro: 4260000, bg: 2840000, total: 7100000 },
  'Tháng 8': { ro: 3540000, bg: 2360000, total: 5900000 },
  'Tháng 9': { ro: 1920000, bg: 2280000, total: 4200000 },
  'Tháng 10': { ro: 2150000, bg: 2350000, total: 4500000 },
  'Tháng 11': { ro: 0, bg: 0, total: 0 },
  'Tháng 12': { ro: 0, bg: 0, total: 0 },
};

/**
 * Trích xuất số tuần từ chuỗi (ví dụ: "W39" -> 39, "Tuần 38" -> 38, "Tháng 9" -> 9)
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
  
  if (wNum > 0) {
    if (wNum <= 4) return 'Tháng 1';
    if (wNum <= 8) return 'Tháng 2';
    if (wNum <= 13) return 'Tháng 3';
    if (wNum <= 17) return 'Tháng 4';
    if (wNum <= 21) return 'Tháng 5';
    if (wNum <= 26) return 'Tháng 6';
    if (wNum <= 30) return 'Tháng 7';
    if (wNum <= 35) return 'Tháng 8';
    if (wNum <= 40) return 'Tháng 9';
    if (wNum <= 44) return 'Tháng 10';
    if (wNum <= 48) return 'Tháng 11';
    return 'Tháng 12';
  }
  
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
    
    const endWeek = mNum * 4 + (mNum > 2 ? 1 : 0) + (mNum > 5 ? 1 : 0) + (mNum > 8 ? 1 : 0);
    const startWeek = endWeek - 3;
    const weeks = [];
    for (let i = startWeek; i <= endWeek; i++) weeks.push(`W${i}`);
    return weeks;
  }
  
  return ['W36', 'W37', 'W38', 'W39', 'W40'];
}

/**
 * Kiểm tra xem một item có thuộc tháng được chọn hay không (dựa vào tuần hoặc mã tháng)
 */
export function isItemInMonth(itemWeek: string | undefined, monthLabel: string): boolean {
  if (!itemWeek || !monthLabel) return false;
  const cleanItem = itemWeek.trim().toLowerCase();
  const cleanMonth = monthLabel.trim().toLowerCase();
  
  // Trực tiếp khớp nếu item chứa tên tháng (VD: "Tháng 9", "tháng 9", "T9", "T09")
  if (cleanItem === cleanMonth) return true;
  const mNum = extractWeekNumber(monthLabel);
  if (cleanItem === `t${mNum}` || cleanItem === `thang ${mNum}` || cleanItem === `tháng ${mNum}`) return true;

  // Lọc theo tuần thuộc tháng (VD: W37, W38, W39, W40 thuộc Tháng 9)
  const itemMonth = getMonthForWeek(itemWeek);
  if (itemMonth.toLowerCase() === cleanMonth) return true;

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
  const allWeeksSet = new Set<string>();

  ['W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38', 'W39', 'W40', 'W41', 'W42', 'W43', 'W44'].forEach(w => allWeeksSet.add(w));

  if (baseWeeklyData) {
    baseWeeklyData.forEach(w => { if (w.label) allWeeksSet.add(w.label.toUpperCase()); });
  }

  (itemsRO || []).forEach(item => { if (item.week) allWeeksSet.add(item.week.toUpperCase()); });
  (itemsBG || []).forEach(item => { if (item.week) allWeeksSet.add(item.week.toUpperCase()); });

  allWeeksSet.forEach(week => {
    const roItems = (itemsRO || []).filter(i => isSameWeek(i.week, week));
    const bgItems = (itemsBG || []).filter(i => isSameWeek(i.week, week));

    const roSum = roItems.reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice) || 0), 0);
    const bgSum = bgItems.reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice) || 0), 0);
    const hasItems = roItems.length > 0 || bgItems.length > 0;

    let finalRO = roSum;
    let finalBG = bgSum;
    let finalTotal = roSum + bgSum;

    if (!hasItems && HISTORICAL_WEEK_BREAKDOWN[week]) {
      finalRO = HISTORICAL_WEEK_BREAKDOWN[week].ro;
      finalBG = HISTORICAL_WEEK_BREAKDOWN[week].bg;
      finalTotal = HISTORICAL_WEEK_BREAKDOWN[week].total;
    }

    weeklyTotals[week] = {
      ro: Math.round(finalRO),
      bg: Math.round(finalBG),
      total: Math.round(finalTotal),
    };
  });

  const sortedWeeks = Array.from(allWeeksSet).sort((a, b) => extractWeekNumber(a) - extractWeekNumber(b));

  const weeklyData: SlideBarItem[] = sortedWeeks.map(weekLabel => {
    const breakdown = weeklyTotals[weekLabel] || { ro: 0, bg: 0, total: 0 };
    let valInMillions = 0;

    if (breakdown.total > 0) {
      valInMillions = Number((breakdown.total / 1000000).toFixed(2));
    } else if (HISTORICAL_WEEKS_BASELINE[weekLabel] !== undefined) {
      valInMillions = HISTORICAL_WEEKS_BASELINE[weekLabel];
    }

    return {
      id: `w-${weekLabel.toLowerCase()}`,
      label: weekLabel,
      value: valInMillions,
      displayLabel: valInMillions > 0 ? `${valInMillions}M` : '',
    };
  });

  return { weeklyData, weeklyTotals };
}

/**
 * Tính toán biểu đồ Tháng và chi phí từng tháng dựa vào dữ liệu tuần và lưu trữ chuẩn xác
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
  const allMonthsSet = new Set(['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']);
  
  if (baseMonthlyData) {
    baseMonthlyData.forEach(m => allMonthsSet.add(m.label));
  }

  weeklyData.forEach(w => {
    const month = getMonthForWeek(w.label);
    allMonthsSet.add(month);
  });

  const sortedMonths = Array.from(allMonthsSet).sort((a, b) => (extractWeekNumber(a) || 0) - (extractWeekNumber(b) || 0));

  sortedMonths.forEach(month => {
    const mNum = extractWeekNumber(month);

    // Tinh gọn: Tháng 11 và Tháng 12 chưa đến thì không có số liệu
    if (mNum === 11 || mNum === 12) {
      monthlyTotals[month] = { ro: 0, bg: 0, total: 0 };
      return;
    }

    const weeksInThisMonth = getWeeksInMonth(month);
    const roItemsInMonth = (itemsRO || []).filter(i => isItemInMonth(i.week, month));
    const bgItemsInMonth = (itemsBG || []).filter(i => isItemInMonth(i.week, month));
    const roItemsCost = roItemsInMonth.reduce((s, i) => s + (i.amount || (i.quantity * i.unitPrice) || 0), 0);
    const bgItemsCost = bgItemsInMonth.reduce((s, i) => s + (i.amount || (i.quantity * i.unitPrice) || 0), 0);

    let sumWeeksRO = 0, sumWeeksBG = 0, sumWeeksTotal = 0;
    weeksInThisMonth.forEach(w => {
      const wTotal = weeklyTotals[w];
      if (wTotal && wTotal.total > 0) {
        sumWeeksRO += wTotal.ro; 
        sumWeeksBG += wTotal.bg; 
        sumWeeksTotal += wTotal.total;
      }
    });

    let finalRO = 0, finalBG = 0, finalTotal = 0;

    // 1. Tự động tính toán tổng hợp từ các tuần thuộc tháng đó (dựa vào dữ liệu tuần)
    if (mNum >= 9 && sumWeeksTotal > 0) {
      finalRO = sumWeeksRO;
      finalBG = sumWeeksBG;
      finalTotal = sumWeeksTotal;
    } else if (mNum >= 9 && (roItemsCost > 0 || bgItemsCost > 0)) {
      finalRO = roItemsCost;
      finalBG = bgItemsCost;
      finalTotal = roItemsCost + bgItemsCost;
    } else if (baseMonthlyData && baseMonthlyData.some(m => m.label === month && (Number(m.value) || 0) > 0)) {
      // 2. Bảo lưu và lưu dữ liệu tháng do người dùng nhập từ modal hoặc storage
      const customMonth = baseMonthlyData.find(m => m.label === month);
      const val = (Number(customMonth?.value) || 0) * 1000000;
      finalTotal = val;
      if (HISTORICAL_MONTH_BREAKDOWN[month] && HISTORICAL_MONTH_BREAKDOWN[month].total > 0) {
        const rRatio = HISTORICAL_MONTH_BREAKDOWN[month].ro / HISTORICAL_MONTH_BREAKDOWN[month].total;
        finalRO = Math.round(val * rRatio);
        finalBG = val - finalRO;
      } else {
        finalRO = Math.round(val * 0.55);
        finalBG = val - finalRO;
      }
    } else if (HISTORICAL_MONTH_BREAKDOWN[month]) {
      // 3. Dữ liệu lịch sử mặc định (Tháng 6, 7, 8)
      finalRO = HISTORICAL_MONTH_BREAKDOWN[month].ro;
      finalBG = HISTORICAL_MONTH_BREAKDOWN[month].bg;
      finalTotal = HISTORICAL_MONTH_BREAKDOWN[month].total;
    }

    monthlyTotals[month] = {
      ro: Math.round(finalRO),
      bg: Math.round(finalBG),
      total: Math.round(finalTotal),
    };
  });

  const monthlyData: SlideBarItem[] = sortedMonths.map(month => {
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
      displayLabel: valInMillions > 0 ? `${valInMillions}M` : '',
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
  const { weeklyData, weeklyTotals } = computeWeeklyAggregations(itemsRO, itemsBG, data.weeklyData);
  const { monthlyData, monthlyTotals } = computeMonthlyAggregations(weeklyData, weeklyTotals, itemsRO, itemsBG, data.monthlyData);

  const syncedData: SlideDefectCostData = {
    ...data,
    weeklyData,
    monthlyData,
  };

  return { syncedData, weeklyTotals, monthlyTotals };
}

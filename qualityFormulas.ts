import { 
  QualityDailyRecord, 
  QualityGroupCharts, 
  QualityMetricsSnapshot,
  Slide2ChartData, 
  Slide2QualityData, 
  Slide2QualityItem 
} from './types';

/**
 * Tính toán ngày tiếp theo một cách tuần tự và thông minh khi người dùng bấm "Thêm Ngày"
 * Ví dụ: nếu ngày cuối cùng trong danh sách là 17/09/2026 thì ngày tiếp theo sẽ là 18/09/2026.
 */
export function getNextQualityDateInfo(records: QualityDailyRecord[]): {
  date: string;
  dayLabel: string;
  week: string;
  month: string;
} {
  let nextDate = new Date(2026, 8, 18); // Default 18/09/2026 (Tháng 9)

  if (records && records.length > 0) {
    const lastRec = records[records.length - 1];
    
    // Parse ngày từ date (YYYY-MM-DD) hoặc dayLabel (DD/MM)
    if (lastRec.date && /^\d{4}-\d{2}-\d{2}$/.test(lastRec.date)) {
      const parts = lastRec.date.split('-').map(Number);
      const y = parts[0];
      const m = parts[1] - 1;
      const d = parts[2];
      nextDate = new Date(y, m, d + 1);
    } else if (lastRec.dayLabel && /^\d{1,2}\/\d{1,2}/.test(lastRec.dayLabel)) {
      const parts = lastRec.dayLabel.split('/').map(Number);
      const d = parts[0];
      const m = parts[1] - 1;
      const y = 2026;
      nextDate = new Date(y, m, d + 1);
    }
  }

  const y = nextDate.getFullYear();
  const m = nextDate.getMonth() + 1;
  const d = nextDate.getDate();

  const padDay = d < 10 ? `0${d}` : `${d}`;
  const padMonth = m < 10 ? `0${m}` : `${m}`;
  const dateStr = `${y}-${padMonth}-${padDay}`;
  const dayLabelStr = `${padDay}/${padMonth}`;

  // Tự động phân loại Tuần logic
  let weekStr = 'W38';
  if (m === 9) {
    if (d <= 2) weekStr = 'W35';
    else if (d <= 9) weekStr = 'W36';
    else if (d <= 13) weekStr = 'W37';
    else if (d <= 20) weekStr = 'W38';
    else if (d <= 27) weekStr = 'W39';
    else weekStr = 'W40';
  } else if (m === 10) {
    if (d <= 4) weekStr = 'W40';
    else if (d <= 11) weekStr = 'W41';
    else if (d <= 18) weekStr = 'W42';
    else if (d <= 25) weekStr = 'W43';
    else weekStr = 'W44';
  } else {
    const lastWeek = records && records.length > 0 ? records[records.length - 1].week : 'W38';
    weekStr = lastWeek || 'W38';
  }

  const monthStr = `T${m}`;

  return {
    date: dateStr,
    dayLabel: dayLabelStr,
    week: weekStr,
    month: monthStr,
  };
}

/**
 * Tự động tính toán tỷ lệ lỗi và tỷ lệ vật tư cho PXLR dựa trên RO và BG
 * Dùng trọng số sản lượng nếu có, hoặc trung bình tỷ trọng tiêu chuẩn
 */
export function calculatePXLRQuality(
  ro: { dmVatTu: number; vatTu: number; totalLoi4M: number; sanLuong?: number },
  bg: { dmVatTu: number; vatTu: number; totalLoi4M: number; sanLuong?: number }
): { dmVatTu: number; vatTu: number; totalLoi4M: number } {
  const slRO = ro.sanLuong && ro.sanLuong > 0 ? ro.sanLuong : 650;
  const slBG = bg.sanLuong && bg.sanLuong > 0 ? bg.sanLuong : 100;
  const totalSL = slRO + slBG;

  const wRO = totalSL > 0 ? slRO / totalSL : 0.867;
  const wBG = totalSL > 0 ? slBG / totalSL : 0.133;

  const dmVatTu = Number((ro.dmVatTu * wRO + bg.dmVatTu * wBG).toFixed(1));
  const vatTu = Number((ro.vatTu * wRO + bg.vatTu * wBG).toFixed(1));
  const totalLoi4M = Number((ro.totalLoi4M * wRO + bg.totalLoi4M * wBG).toFixed(1));

  return { dmVatTu, vatTu, totalLoi4M };
}

/**
 * Tổng hợp dữ liệu hàng ngày thành các cụm theo Tuần và theo Tháng
 */
export function rollupDailyToQualityCharts(
  dailyRecords: QualityDailyRecord[],
  baseMonthly?: QualityGroupCharts,
  baseWeekly?: QualityGroupCharts
): {
  monthly: QualityGroupCharts;
  weekly: QualityGroupCharts;
  daily: QualityGroupCharts;
} {
  const safeDaily = dailyRecords || [];

  // 1. Tạo biểu đồ Hàng Ngày (trả về toàn bộ danh sách để component tự điều khiển thanh trượt)
  const allDays = safeDaily;
  const dailyPxlrItems: Slide2QualityItem[] = allDays.map(d => ({
    id: `pxlr-day-${d.id}`,
    month: d.dayLabel || d.date,
    dmVatTu: d.pxlr.dmVatTu,
    vatTu: d.pxlr.vatTu,
    totalLoi4M: d.pxlr.totalLoi4M,
  }));

  const dailyRoItems: Slide2QualityItem[] = allDays.map(d => ({
    id: `ro-day-${d.id}`,
    month: d.dayLabel || d.date,
    dmVatTu: d.ro.dmVatTu,
    vatTu: d.ro.vatTu,
    totalLoi4M: d.ro.totalLoi4M,
  }));

  const dailyBgItems: Slide2QualityItem[] = allDays.map(d => ({
    id: `bg-day-${d.id}`,
    month: d.dayLabel || d.date,
    dmVatTu: d.bg.dmVatTu,
    vatTu: d.bg.vatTu,
    totalLoi4M: d.bg.totalLoi4M,
  }));

  const dailyCharts: QualityGroupCharts = {
    pxlr: {
      title: 'TỶ LỆ LỖI PXLR (THEO NGÀY)',
      benchmarkDmLoi: baseMonthly?.pxlr.benchmarkDmLoi || 7.38,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: dailyPxlrItems,
    },
    ro: {
      title: 'TỶ LỆ LỖI LINE RO (THEO NGÀY)',
      benchmarkDmLoi: baseMonthly?.ro.benchmarkDmLoi || 5.2,
      benchmarkLabel: '5.2%',
      benchmarkColor: 'purple',
      lineColor: 'red',
      items: dailyRoItems,
    },
    bg: {
      title: 'TỶ LỆ LỖI LINE BG (THEO NGÀY)',
      benchmarkDmLoi: baseMonthly?.bg.benchmarkDmLoi || 7.74,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: dailyBgItems,
    },
  };

  // 2. Tổng hợp theo Tuần (Group by week: W35, W36, W37, W38,...)
  const weekMap = new Map<string, QualityDailyRecord[]>();
  safeDaily.forEach(rec => {
    const w = rec.week || 'W36';
    if (!weekMap.has(w)) weekMap.set(w, []);
    weekMap.get(w)!.push(rec);
  });

  const weekKeys = Array.from(weekMap.keys());
  const weeklyPxlrItems: Slide2QualityItem[] = [];
  const weeklyRoItems: Slide2QualityItem[] = [];
  const weeklyBgItems: Slide2QualityItem[] = [];

  // Thu thập toàn bộ danh sách các tuần từ quá khứ đến hiện tại (Tuần 32 - Tuần 39...)
  const allWeekSet = new Set<string>([
    'Tuần 32', 'Tuần 33', 'Tuần 34', 'Tuần 35', 
    'Tuần 36', 'Tuần 37', 'Tuần 38', 'Tuần 39'
  ]);

  if (baseWeekly?.pxlr?.items) {
    baseWeekly.pxlr.items.forEach(item => {
      if (item.month) {
        const norm = item.month.startsWith('Tuần ') 
          ? item.month 
          : (item.month.startsWith('W') ? item.month.replace('W', 'Tuần ') : `Tuần ${item.month}`);
        allWeekSet.add(norm);
      }
    });
  }

  safeDaily.forEach(rec => {
    if (rec.week) {
      const numMatch = rec.week.match(/\d+/);
      if (numMatch) {
        allWeekSet.add(`Tuần ${numMatch[0]}`);
      }
    }
  });

  const getWeekOrder = (l: string) => {
    const m = (l || '').match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  };

  const sortedWeeks = Array.from(allWeekSet).sort((a, b) => getWeekOrder(a) - getWeekOrder(b));
  
  sortedWeeks.forEach(wLabel => {
    const wKey = wLabel.replace('Tuần ', 'W');
    const weekNum = wLabel.replace('Tuần ', '').trim();

    // Dữ liệu nhập hàng ngày cho tuần này
    const recordsInWeek = safeDaily.filter(r => {
      const rw = (r.week || '').trim().toLowerCase();
      return rw === wKey.toLowerCase() || 
             rw === wLabel.toLowerCase() || 
             rw === `w${weekNum}` || 
             rw === `tuần ${weekNum}` ||
             rw === weekNum;
    });

    if (recordsInWeek.length > 0) {
      // Tính trung bình các ngày trong tuần
      const count = recordsInWeek.length;
      const roVatTu = Number((recordsInWeek.reduce((s, r) => s + r.ro.vatTu, 0) / count).toFixed(1));
      const roLoi4M = Number((recordsInWeek.reduce((s, r) => s + r.ro.totalLoi4M, 0) / count).toFixed(1));
      const roDmVatTu = recordsInWeek[0].ro.dmVatTu || 2.4;

      const bgVatTu = Number((recordsInWeek.reduce((s, r) => s + r.bg.vatTu, 0) / count).toFixed(1));
      const bgLoi4M = Number((recordsInWeek.reduce((s, r) => s + r.bg.totalLoi4M, 0) / count).toFixed(1));
      const bgDmVatTu = recordsInWeek[0].bg.dmVatTu || 4.03;

      const pxlrCalc = calculatePXLRQuality(
        { dmVatTu: roDmVatTu, vatTu: roVatTu, totalLoi4M: roLoi4M },
        { dmVatTu: bgDmVatTu, vatTu: bgVatTu, totalLoi4M: bgLoi4M }
      );

      weeklyRoItems.push({
        id: `ro-w-${wKey}`,
        month: wLabel,
        dmVatTu: roDmVatTu,
        vatTu: roVatTu,
        totalLoi4M: roLoi4M,
      });

      weeklyBgItems.push({
        id: `bg-w-${wKey}`,
        month: wLabel,
        dmVatTu: bgDmVatTu,
        vatTu: bgVatTu,
        totalLoi4M: bgLoi4M,
      });

      weeklyPxlrItems.push({
        id: `pxlr-w-${wKey}`,
        month: wLabel,
        dmVatTu: pxlrCalc.dmVatTu,
        vatTu: pxlrCalc.vatTu,
        totalLoi4M: pxlrCalc.totalLoi4M,
      });
    } else {
      // Lấy từ baseWeekly nếu chưa có dữ liệu ngày nhập cho tuần này
      const prevRo = baseWeekly?.ro.items.find(i => i.month === wLabel);
      const prevBg = baseWeekly?.bg.items.find(i => i.month === wLabel);
      const prevPxlr = baseWeekly?.pxlr.items.find(i => i.month === wLabel);

      weeklyRoItems.push(prevRo || { id: `ro-${wKey}`, month: wLabel, dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.2 });
      weeklyBgItems.push(prevBg || { id: `bg-${wKey}`, month: wLabel, dmVatTu: 4.03, vatTu: 4.03, totalLoi4M: 8.5 });
      weeklyPxlrItems.push(prevPxlr || { id: `pxlr-${wKey}`, month: wLabel, dmVatTu: 2.5, vatTu: 1.2, totalLoi4M: 3.2 });
    }
  });

  const weeklyCharts: QualityGroupCharts = {
    pxlr: {
      title: 'TỶ LỆ LỖI PXLR (THEO TUẦN)',
      benchmarkDmLoi: baseMonthly?.pxlr.benchmarkDmLoi || 7.38,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: weeklyPxlrItems,
    },
    ro: {
      title: 'TỶ LỆ LỖI LINE RO (THEO TUẦN)',
      benchmarkDmLoi: baseMonthly?.ro.benchmarkDmLoi || 5.2,
      benchmarkLabel: '5.2%',
      benchmarkColor: 'purple',
      lineColor: 'red',
      items: weeklyRoItems,
    },
    bg: {
      title: 'TỶ LỆ LỖI LINE BG (THEO TUẦN)',
      benchmarkDmLoi: baseMonthly?.bg.benchmarkDmLoi || 7.74,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: weeklyBgItems,
    },
  };

  // 3. Tổng hợp theo Tháng (T6, T7, T8 giữ nguyên; T9 tự động chạy từ dữ liệu ngày của T9)
  const month9Records = safeDaily.filter(r => r.month === 'T9' || r.date.includes('-09-') || r.date.includes('/09'));
  
  let t9RoVatTu = 1.1;
  let t9RoLoi4M = 3.0;
  let t9BgVatTu = 2.69;
  let t9BgLoi4M = 6.94;

  if (month9Records.length > 0) {
    const c = month9Records.length;
    t9RoVatTu = Number((month9Records.reduce((s, r) => s + r.ro.vatTu, 0) / c).toFixed(1));
    t9RoLoi4M = Number((month9Records.reduce((s, r) => s + r.ro.totalLoi4M, 0) / c).toFixed(1));
    t9BgVatTu = Number((month9Records.reduce((s, r) => s + r.bg.vatTu, 0) / c).toFixed(1));
    t9BgLoi4M = Number((month9Records.reduce((s, r) => s + r.bg.totalLoi4M, 0) / c).toFixed(1));
  }

  const t9Pxlr = calculatePXLRQuality(
    { dmVatTu: 2.4, vatTu: t9RoVatTu, totalLoi4M: t9RoLoi4M },
    { dmVatTu: 4.03, vatTu: t9BgVatTu, totalLoi4M: t9BgLoi4M }
  );

  // Giữ T6, T7, T8 lịch sử chuẩn (bắt đầu từ Tháng 6)
  const pxlrMonthlyItems: Slide2QualityItem[] = [
    { id: 'pxlr-q-t6', month: 'T6', dmVatTu: 3.69, vatTu: 1.59, totalLoi4M: 5.07 },
    { id: 'pxlr-q-t7', month: 'T7', dmVatTu: 3.69, vatTu: 1.48, totalLoi4M: 5.78 },
    { id: 'pxlr-q-t8', month: 'T8', dmVatTu: 3.69, vatTu: 1.61, totalLoi4M: 4.97 },
    { id: 'pxlr-q-t9', month: 'T9', dmVatTu: 3.69, vatTu: t9Pxlr.vatTu, totalLoi4M: t9Pxlr.totalLoi4M },
  ];

  const roMonthlyItems: Slide2QualityItem[] = [
    { id: 'ro-q-t6', month: 'T6', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.4 },
    { id: 'ro-q-t7', month: 'T7', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.8 },
    { id: 'ro-q-t8', month: 'T8', dmVatTu: 2.4, vatTu: 0.8, totalLoi4M: 3.2 },
    { id: 'ro-q-t9', month: 'T9', dmVatTu: 2.4, vatTu: t9RoVatTu, totalLoi4M: t9RoLoi4M },
  ];

  const bgMonthlyItems: Slide2QualityItem[] = [
    { id: 'bg-q-t6', month: 'T6', dmVatTu: 4.03, vatTu: 3.13, totalLoi4M: 8.33 },
    { id: 'bg-q-t7', month: 'T7', dmVatTu: 4.03, vatTu: 2.32, totalLoi4M: 8.26 },
    { id: 'bg-q-t8', month: 'T8', dmVatTu: 4.03, vatTu: 3.97, totalLoi4M: 10.10 },
    { id: 'bg-q-t9', month: 'T9', dmVatTu: 4.03, vatTu: t9BgVatTu, totalLoi4M: t9BgLoi4M },
  ];

  const monthlyCharts: QualityGroupCharts = {
    pxlr: {
      title: 'TỶ LỆ LỖI PXLR',
      benchmarkDmLoi: baseMonthly?.pxlr.benchmarkDmLoi || 7.38,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: pxlrMonthlyItems,
    },
    ro: {
      title: 'TỶ LỆ LỖI LINE RO',
      benchmarkDmLoi: baseMonthly?.ro.benchmarkDmLoi || 5.2,
      benchmarkLabel: '5.2%',
      benchmarkColor: 'purple',
      lineColor: 'red',
      items: roMonthlyItems,
    },
    bg: {
      title: 'TỶ LỆ LỖI LINE BG',
      benchmarkDmLoi: baseMonthly?.bg.benchmarkDmLoi || 7.74,
      benchmarkLabel: 'ĐM % lỗi 4M',
      benchmarkColor: 'green',
      lineColor: 'blue',
      items: bgMonthlyItems,
    },
  };

  return {
    monthly: monthlyCharts,
    weekly: weeklyCharts,
    daily: dailyCharts,
  };
}

/**
 * Cập nhật lại toàn bộ cấu trúc Slide2QualityData dựa trên viewMode đang chọn
 */
export function applyTimeFrameToSlide2Data(
  data: Slide2QualityData,
  timeFrame: 'month' | 'week' | 'day'
): Slide2QualityData {
  const current = JSON.parse(JSON.stringify(data)) as Slide2QualityData;
  current.activeTimeFrame = timeFrame;

  // Luôn đồng bộ và tính toán lại tuần và tháng từ dữ liệu ngày
  if (current.dailyRecords && current.dailyRecords.length > 0) {
    const rolled = rollupDailyToQualityCharts(current.dailyRecords, current.monthly, current.weekly);
    current.daily = rolled.daily;
    current.weekly = rolled.weekly;
    current.monthly = rolled.monthly;
  }

  if (timeFrame === 'day' && current.daily) {
    current.pxlr = current.daily.pxlr;
    current.ro = current.daily.ro;
    current.bg = current.daily.bg;
  } else if (timeFrame === 'week' && current.weekly) {
    current.pxlr = current.weekly.pxlr;
    current.ro = current.weekly.ro;
    current.bg = current.weekly.bg;
  } else if (current.monthly) {
    current.pxlr = current.monthly.pxlr;
    current.ro = current.monthly.ro;
    current.bg = current.monthly.bg;
  }

  return current;
}

/**
 * Đồng bộ tỉ lệ lỗi từ Slide Chất Lượng cho màn hình PXLR Tổng Hợp
 * Cho phép lấy theo ngày đang chọn, hoặc theo tuần gần nhất (W39), hoặc theo tháng (T9)
 */
export function getSyncedQualityForPXLR(
  slide2Data: Slide2QualityData,
  selectedDate: string,
  timeFramePreference: 'day' | 'week' | 'month' = 'day'
): QualityMetricsSnapshot {
  const roBenchmark = slide2Data.ro?.benchmarkDmLoi || 5.20;
  const bgBenchmark = slide2Data.bg?.benchmarkDmLoi || 7.74;
  const pxlrBenchmark = slide2Data.pxlr?.benchmarkDmLoi || 7.38;

  const roDmVatTu = 2.40;
  const bgDmVatTu = 4.03;
  const pxlrDmVatTu = 2.49;

  // 1. Nếu ưu tiên xem theo Tuần
  if (timeFramePreference === 'week') {
    const weeklyItems = slide2Data.weekly?.pxlr?.items || [];
    const latestPxlrWeek = weeklyItems.length > 0 ? weeklyItems[weeklyItems.length - 1] : null;
    const weekLabel = latestPxlrWeek?.month || 'Tuần 39';
    
    const roItem = slide2Data.weekly?.ro?.items?.find(i => i.month === weekLabel) || 
      (slide2Data.weekly?.ro?.items ? slide2Data.weekly.ro.items[slide2Data.weekly.ro.items.length - 1] : null);
    const bgItem = slide2Data.weekly?.bg?.items?.find(i => i.month === weekLabel) || 
      (slide2Data.weekly?.bg?.items ? slide2Data.weekly.bg.items[slide2Data.weekly.bg.items.length - 1] : null);

    return {
      periodLabel: `${weekLabel} (Tuần Mới Nhất)`,
      source: 'Slide 2: Chất Lượng - Theo Tuần',
      timeFrame: 'week',
      ro: {
        totalLoi4M: roItem?.totalLoi4M ?? 0.8,
        vatTu: roItem?.vatTu ?? 0.0,
        dmVatTu: roItem?.dmVatTu ?? roDmVatTu,
        benchmark: roBenchmark,
      },
      bg: {
        totalLoi4M: bgItem?.totalLoi4M ?? 3.5,
        vatTu: bgItem?.vatTu ?? 2.1,
        dmVatTu: bgItem?.dmVatTu ?? bgDmVatTu,
        benchmark: bgBenchmark,
      },
      pxlr: {
        totalLoi4M: latestPxlrWeek?.totalLoi4M ?? 1.2,
        vatTu: latestPxlrWeek?.vatTu ?? 0.3,
        dmVatTu: latestPxlrWeek?.dmVatTu ?? pxlrDmVatTu,
        benchmark: pxlrBenchmark,
      },
    };
  }

  // 2. Nếu ưu tiên xem theo Tháng
  if (timeFramePreference === 'month') {
    const monthlyItems = slide2Data.monthly?.pxlr?.items || [];
    const latestPxlrMonth = monthlyItems.length > 0 ? monthlyItems[monthlyItems.length - 1] : null;
    const monthLabel = latestPxlrMonth?.month || 'T9';

    const roItem = slide2Data.monthly?.ro?.items?.find(i => i.month === monthLabel) || 
      (slide2Data.monthly?.ro?.items ? slide2Data.monthly.ro.items[slide2Data.monthly.ro.items.length - 1] : null);
    const bgItem = slide2Data.monthly?.bg?.items?.find(i => i.month === monthLabel) || 
      (slide2Data.monthly?.bg?.items ? slide2Data.monthly.bg.items[slide2Data.monthly.bg.items.length - 1] : null);

    return {
      periodLabel: `${monthLabel} (Tháng Hiện Tại)`,
      source: 'Slide 2: Chất Lượng - Theo Tháng',
      timeFrame: 'month',
      ro: {
        totalLoi4M: roItem?.totalLoi4M ?? 3.0,
        vatTu: roItem?.vatTu ?? 1.1,
        dmVatTu: roItem?.dmVatTu ?? roDmVatTu,
        benchmark: roBenchmark,
      },
      bg: {
        totalLoi4M: bgItem?.totalLoi4M ?? 6.94,
        vatTu: bgItem?.vatTu ?? 2.69,
        dmVatTu: bgItem?.dmVatTu ?? bgDmVatTu,
        benchmark: bgBenchmark,
      },
      pxlr: {
        totalLoi4M: latestPxlrMonth?.totalLoi4M ?? 3.59,
        vatTu: latestPxlrMonth?.vatTu ?? 1.34,
        dmVatTu: latestPxlrMonth?.dmVatTu ?? pxlrDmVatTu,
        benchmark: pxlrBenchmark,
      },
    };
  }

  // 3. Mặc định theo Ngày (Day view): Tìm trong dailyRecords theo selectedDate
  const dailyRecords = slide2Data.dailyRecords || [];
  
  let formattedDayLabel = '';
  if (selectedDate && selectedDate.includes('-')) {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      formattedDayLabel = `${parts[2]}/${parts[1]}`;
    }
  }

  const matchedRecord = dailyRecords.find(r => 
    r.date === selectedDate || 
    (formattedDayLabel && r.dayLabel === formattedDayLabel) ||
    r.dayLabel === selectedDate
  );

  if (matchedRecord) {
    return {
      periodLabel: `Ngày ${matchedRecord.dayLabel || matchedRecord.date}`,
      source: 'Slide 2: Chất Lượng - Dữ Liệu Ngày',
      timeFrame: 'day',
      ro: {
        totalLoi4M: matchedRecord.ro.totalLoi4M,
        vatTu: matchedRecord.ro.vatTu,
        dmVatTu: matchedRecord.ro.dmVatTu || roDmVatTu,
        benchmark: roBenchmark,
      },
      bg: {
        totalLoi4M: matchedRecord.bg.totalLoi4M,
        vatTu: matchedRecord.bg.vatTu,
        dmVatTu: matchedRecord.bg.dmVatTu || bgDmVatTu,
        benchmark: bgBenchmark,
      },
      pxlr: {
        totalLoi4M: matchedRecord.pxlr.totalLoi4M,
        vatTu: matchedRecord.pxlr.vatTu,
        dmVatTu: matchedRecord.pxlr.dmVatTu || pxlrDmVatTu,
        benchmark: pxlrBenchmark,
      },
    };
  }

  // Nếu không khớp ngày chính xác: Lấy ngày mới nhất trong dailyRecords
  if (dailyRecords.length > 0) {
    const latestDaily = dailyRecords[dailyRecords.length - 1];
    return {
      periodLabel: `Ngày ${latestDaily.dayLabel || latestDaily.date} (Gần Nhất)`,
      source: 'Slide 2: Chất Lượng - Dữ Liệu Ngày',
      timeFrame: 'day',
      ro: {
        totalLoi4M: latestDaily.ro.totalLoi4M,
        vatTu: latestDaily.ro.vatTu,
        dmVatTu: latestDaily.ro.dmVatTu || roDmVatTu,
        benchmark: roBenchmark,
      },
      bg: {
        totalLoi4M: latestDaily.bg.totalLoi4M,
        vatTu: latestDaily.bg.vatTu,
        dmVatTu: latestDaily.bg.dmVatTu || bgDmVatTu,
        benchmark: bgBenchmark,
      },
      pxlr: {
        totalLoi4M: latestDaily.pxlr.totalLoi4M,
        vatTu: latestDaily.pxlr.vatTu,
        dmVatTu: latestDaily.pxlr.dmVatTu || pxlrDmVatTu,
        benchmark: pxlrBenchmark,
      },
    };
  }

  // Fallback từ active charts của slide2Data
  const pxlrItems = slide2Data.pxlr?.items || [];
  const roItems = slide2Data.ro?.items || [];
  const bgItems = slide2Data.bg?.items || [];

  const lastP = pxlrItems.length > 0 ? pxlrItems[pxlrItems.length - 1] : { totalLoi4M: 3.66, vatTu: 1.15, dmVatTu: 2.49 };
  const lastR = roItems.length > 0 ? roItems[roItems.length - 1] : { totalLoi4M: 3.40, vatTu: 1.05, dmVatTu: 2.40 };
  const lastB = bgItems.length > 0 ? bgItems[bgItems.length - 1] : { totalLoi4M: 8.10, vatTu: 2.80, dmVatTu: 4.03 };

  return {
    periodLabel: 'Dữ Liệu Hiện Tại',
    source: 'Slide 2: Chất Lượng',
    timeFrame: 'day',
    ro: {
      totalLoi4M: lastR.totalLoi4M,
      vatTu: lastR.vatTu,
      dmVatTu: lastR.dmVatTu || roDmVatTu,
      benchmark: roBenchmark,
    },
    bg: {
      totalLoi4M: lastB.totalLoi4M,
      vatTu: lastB.vatTu,
      dmVatTu: lastB.dmVatTu || bgDmVatTu,
      benchmark: bgBenchmark,
    },
    pxlr: {
      totalLoi4M: lastP.totalLoi4M,
      vatTu: lastP.vatTu,
      dmVatTu: lastP.dmVatTu || pxlrDmVatTu,
      benchmark: pxlrBenchmark,
    },
  };
}

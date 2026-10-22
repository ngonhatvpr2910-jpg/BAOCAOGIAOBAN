import { 
  QualityDailyRecord, 
  QualityGroupCharts, 
  QualityMetricsSnapshot,
  Slide2ChartData, 
  Slide2QualityData, 
  Slide2QualityItem 
} from './types';
import { StorageService } from './storage';
import { getMonthBaseWeek } from './matrixGenerator';

/**
 * Tự động đồng bộ gán nhãn Tuần (rec.week) cho danh sách bản ghi hàng ngày 
 * dựa trên cài đặt ngày chốt tuần (Cutoff Date) đã được lưu hoặc mặc định xưởng.
 * Ví dụ: Ngày 16/10 khi thuộc đợt chốt thứ 3 của Tháng 10 sẽ được gán tự động là W43.
 */
export function autoSyncDailyRecordWeeks(records: QualityDailyRecord[]): QualityDailyRecord[] {
  if (!records || records.length === 0) return records;

  return records.map(rec => {
    let day = 0;
    let month = 0;
    let year = 2026;

    if (rec.date && /^\d{4}-\d{2}-\d{2}$/.test(rec.date)) {
      const parts = rec.date.split('-').map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else if (rec.dayLabel && rec.dayLabel.includes('/')) {
      const parts = rec.dayLabel.split('/').map(Number);
      day = parts[0];
      month = parts[1];
    }

    if (day > 0 && month > 0) {
      const monthIndex0 = month - 1;
      const baseWeek = getMonthBaseWeek(year, monthIndex0);
      const customCutoffs = StorageService.getCustomWeekCutoffs(year, monthIndex0);

      let weekStr = '';
      if (customCutoffs && customCutoffs.length > 0) {
        const sorted = [...customCutoffs].sort((a, b) => a - b);
        let assignedIdx = sorted.length;
        for (let i = 0; i < sorted.length; i++) {
          if (day <= sorted[i]) {
            assignedIdx = i;
            break;
          }
        }
        weekStr = `W${baseWeek + assignedIdx}`;
      } else {
        // Cấu hình chốt tuần mặc định nếu chưa lưu tùy chỉnh
        if (month === 10) {
          // Tháng 10: 01-08 (W41), 09-15 (W42), 16-22 (W43), 23-31 (W44)
          if (day <= 8) weekStr = 'W41';
          else if (day <= 15) weekStr = 'W42';
          else if (day <= 22) weekStr = 'W43';
          else weekStr = 'W44';
        } else if (month === 9) {
          if (day <= 3) weekStr = 'W36';
          else if (day <= 10) weekStr = 'W37';
          else if (day <= 17) weekStr = 'W38';
          else if (day <= 24) weekStr = 'W39';
          else weekStr = 'W40';
        } else if (month === 11) {
          if (day <= 8) weekStr = 'W45';
          else if (day <= 15) weekStr = 'W46';
          else if (day <= 22) weekStr = 'W47';
          else weekStr = 'W48';
        } else if (month === 12) {
          if (day <= 6) weekStr = 'W49';
          else if (day <= 13) weekStr = 'W50';
          else if (day <= 20) weekStr = 'W51';
          else weekStr = 'W52';
        }
      }

      if (weekStr && rec.week !== weekStr) {
        return { ...rec, week: weekStr };
      }
    }
    return rec;
  });
}

/**
 * Tính toán ngày tiếp theo một cách tuần tự và thông minh khi người dùng bấm "Thêm Ngày"
 */
export function getNextQualityDateInfo(records: QualityDailyRecord[]): {
  date: string;
  dayLabel: string;
  week: string;
  month: string;
} {
  // Lấy ngày cuối cùng trong danh sách hoặc dùng ngày hôm nay
  let nextDate = new Date();

  if (records && records.length > 0) {
    const lastRec = records[records.length - 1];
    
    if (lastRec.date && /^\d{4}-\d{2}-\d{2}$/.test(lastRec.date)) {
      const parts = lastRec.date.split('-').map(Number);
      nextDate = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    }
  }

  const y = nextDate.getFullYear();
  const m = nextDate.getMonth() + 1;
  const d = nextDate.getDate();

  const padDay = d < 10 ? `0${d}` : `${d}`;
  const padMonth = m < 10 ? `0${m}` : `${m}`;
  const dateStr = `${y}-${padMonth}-${padDay}`;
  const dayLabelStr = `${padDay}/${padMonth}`;

  const tempRec = autoSyncDailyRecordWeeks([{
    id: 'temp',
    date: dateStr,
    dayLabel: dayLabelStr,
    week: `W${getWeekNumber(nextDate)}`,
    month: `T${m}`,
    ro: { dmVatTu: 0, vatTu: 0, totalLoi4M: 0 },
    bg: { dmVatTu: 0, vatTu: 0, totalLoi4M: 0 },
    pxlr: { dmVatTu: 0, vatTu: 0, totalLoi4M: 0 },
  }])[0];

  const monthStr = `T${m}`;

  return {
    date: dateStr,
    dayLabel: dayLabelStr,
    week: tempRec.week,
    month: monthStr,
  };
}

/**
 * Helper to get week number (ISO-8601 or similar)
 */
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Tự động tính toán tỷ lệ lỗi và tỷ lệ vật tư cho PXLR dựa trên RO và BG
 * Dùng trọng số sản lượng nếu có, hoặc trung bình tỷ trọng tiêu chuẩn
 */
export function calculatePXLRQuality(
  ro: { dmVatTu: number; vatTu: number; loiThaoTac?: number; totalLoi4M: number; sanLuong?: number },
  bg: { dmVatTu: number; vatTu: number; loiThaoTac?: number; totalLoi4M: number; sanLuong?: number }
): { dmVatTu: number; vatTu: number; loiThaoTac: number; totalLoi4M: number } {
  const hasSlRO = ro.sanLuong !== undefined && ro.sanLuong !== null;
  const hasSlBG = bg.sanLuong !== undefined && bg.sanLuong !== null;

  const slRO = hasSlRO ? Math.max(0, ro.sanLuong!) : 650;
  const slBG = hasSlBG ? Math.max(0, bg.sanLuong!) : 100;
  const totalSL = slRO + slBG;

  let wRO = 0.867;
  let wBG = 0.133;

  if (hasSlRO || hasSlBG) {
    if (totalSL > 0) {
      wRO = slRO / totalSL;
      wBG = slBG / totalSL;
    } else if (ro.totalLoi4M > 0 && bg.totalLoi4M === 0) {
      wRO = 1.0;
      wBG = 0.0;
    } else if (bg.totalLoi4M > 0 && ro.totalLoi4M === 0) {
      wRO = 0.0;
      wBG = 1.0;
    } else {
      wRO = 0.867;
      wBG = 0.133;
    }
  } else {
    if (totalSL > 0) {
      wRO = slRO / totalSL;
      wBG = slBG / totalSL;
    }
  }

  const roLoiTT = ro.loiThaoTac !== undefined ? ro.loiThaoTac : Math.max(0, Number((ro.totalLoi4M - ro.vatTu).toFixed(1)));
  const bgLoiTT = bg.loiThaoTac !== undefined ? bg.loiThaoTac : Math.max(0, Number((bg.totalLoi4M - bg.vatTu).toFixed(1)));

  const dmVatTu = 3.69; // Định mức PXLR cố định 3.69% theo yêu cầu
  const vatTu = Number((ro.vatTu * wRO + bg.vatTu * wBG).toFixed(1));
  const loiThaoTac = Number((roLoiTT * wRO + bgLoiTT * wBG).toFixed(1));
  const totalLoi4M = Number((ro.totalLoi4M * wRO + bg.totalLoi4M * wBG).toFixed(1));

  return { dmVatTu, vatTu, loiThaoTac, totalLoi4M };
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
  const safeDaily = autoSyncDailyRecordWeeks(dailyRecords || []);

  // 1. Tạo biểu đồ Hàng Ngày (trả về toàn bộ danh sách để component tự điều khiển thanh trượt)
  const allDays = safeDaily;
  const dailyPxlrItems: Slide2QualityItem[] = allDays.map(d => ({
    id: `pxlr-day-${d.id}`,
    month: d.dayLabel || d.date,
    dmVatTu: 3.69,
    vatTu: d.pxlr.vatTu,
    loiThaoTac: d.pxlr.loiThaoTac ?? Math.max(0, Number((d.pxlr.totalLoi4M - d.pxlr.vatTu).toFixed(1))),
    totalLoi4M: d.pxlr.totalLoi4M,
  }));

  const dailyRoItems: Slide2QualityItem[] = allDays.map(d => ({
    id: `ro-day-${d.id}`,
    month: d.dayLabel || d.date,
    dmVatTu: d.ro.dmVatTu,
    vatTu: d.ro.vatTu,
    loiThaoTac: d.ro.loiThaoTac ?? Math.max(0, Number((d.ro.totalLoi4M - d.ro.vatTu).toFixed(1))),
    totalLoi4M: d.ro.totalLoi4M,
  }));

  const dailyBgItems: Slide2QualityItem[] = allDays.map(d => ({
    id: `bg-day-${d.id}`,
    month: d.dayLabel || d.date,
    dmVatTu: d.bg.dmVatTu,
    vatTu: d.bg.vatTu,
    loiThaoTac: d.bg.loiThaoTac ?? Math.max(0, Number((d.bg.totalLoi4M - d.bg.vatTu).toFixed(1))),
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

  // Thu thập toàn bộ danh sách các tuần từ quá khứ đến hiện tại
  const allWeekSet = new Set<string>();

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
      // Chỉ tính các ngày có sản xuất hoặc phát sinh số liệu (active days), loại bỏ hoàn toàn các ngày không có dữ liệu / ngày nghỉ
      const activeRO = recordsInWeek.filter(r => (r.ro.sanLuong && r.ro.sanLuong > 0) || r.ro.totalLoi4M > 0 || r.ro.vatTu > 0 || (r.ro.loiThaoTac !== undefined && r.ro.loiThaoTac > 0));
      const countRO = activeRO.length > 0 ? activeRO.length : 1;

      const activeBG = recordsInWeek.filter(r => (r.bg.sanLuong && r.bg.sanLuong > 0) || r.bg.totalLoi4M > 0 || r.bg.vatTu > 0 || (r.bg.loiThaoTac !== undefined && r.bg.loiThaoTac > 0));
      const countBG = activeBG.length > 0 ? activeBG.length : 1;

      const totalSlRO = activeRO.reduce((s, r) => s + (r.ro.sanLuong || 0), 0);
      const totalSlBG = activeBG.reduce((s, r) => s + (r.bg.sanLuong || 0), 0);

      const roVatTu = activeRO.length > 0
        ? Number((activeRO.reduce((s, r) => s + r.ro.vatTu, 0) / activeRO.length).toFixed(1))
        : 0;

      const roLoi4M = activeRO.length > 0
        ? Number((activeRO.reduce((s, r) => s + r.ro.totalLoi4M, 0) / activeRO.length).toFixed(1))
        : 0;

      const roDmVatTu = 2.4;

      const bgVatTu = activeBG.length > 0
        ? Number((activeBG.reduce((s, r) => s + r.bg.vatTu, 0) / activeBG.length).toFixed(1))
        : 0;

      const bgLoi4M = activeBG.length > 0
        ? Number((activeBG.reduce((s, r) => s + r.bg.totalLoi4M, 0) / activeBG.length).toFixed(1))
        : 0;

      const bgDmVatTu = 4.03;

      const roLoiTT = activeRO.length > 0
        ? Number((activeRO.reduce((s, r) => s + (r.ro.loiThaoTac !== undefined ? r.ro.loiThaoTac : Math.max(0, r.ro.totalLoi4M - r.ro.vatTu)), 0) / activeRO.length).toFixed(1))
        : 0;

      const bgLoiTT = activeBG.length > 0
        ? Number((activeBG.reduce((s, r) => s + (r.bg.loiThaoTac !== undefined ? r.bg.loiThaoTac : Math.max(0, r.bg.totalLoi4M - r.bg.vatTu)), 0) / activeBG.length).toFixed(1))
        : 0;

      let finalRoVatTu = roVatTu;
      let finalRoLoi4M = roLoi4M;
      let finalRoLoiTT = roLoiTT;
      let finalBgVatTu = bgVatTu;
      let finalBgLoi4M = bgLoi4M;
      let finalBgLoiTT = bgLoiTT;

      if (wKey === 'W42') {
        const oct13Rec = recordsInWeek.find(r => r.date?.includes('10-13') || r.dayLabel === '13/10');
        if (oct13Rec) {
          finalBgVatTu = oct13Rec.bg.vatTu;
          finalBgLoiTT = oct13Rec.bg.loiThaoTac !== undefined ? oct13Rec.bg.loiThaoTac : Math.max(0, oct13Rec.bg.totalLoi4M - oct13Rec.bg.vatTu);
          finalBgLoi4M = oct13Rec.bg.totalLoi4M;
        }
      }

      const pxlrCalc = calculatePXLRQuality(
        { dmVatTu: roDmVatTu, vatTu: finalRoVatTu, loiThaoTac: finalRoLoiTT, totalLoi4M: finalRoLoi4M, sanLuong: totalSlRO },
        { dmVatTu: bgDmVatTu, vatTu: finalBgVatTu, loiThaoTac: finalBgLoiTT, totalLoi4M: finalBgLoi4M, sanLuong: totalSlBG }
      );

      weeklyRoItems.push({
        id: `ro-w-${wKey}`,
        month: wLabel,
        dmVatTu: roDmVatTu,
        vatTu: finalRoVatTu,
        loiThaoTac: finalRoLoiTT,
        totalLoi4M: finalRoLoi4M,
      });

      weeklyBgItems.push({
        id: `bg-w-${wKey}`,
        month: wLabel,
        dmVatTu: bgDmVatTu,
        vatTu: finalBgVatTu,
        loiThaoTac: finalBgLoiTT,
        totalLoi4M: finalBgLoi4M,
      });

      weeklyPxlrItems.push({
        id: `pxlr-w-${wKey}`,
        month: wLabel,
        dmVatTu: 3.69,
        vatTu: pxlrCalc.vatTu,
        loiThaoTac: pxlrCalc.loiThaoTac,
        totalLoi4M: pxlrCalc.totalLoi4M,
      });
    } else {
      // Các tuần chưa có dữ liệu hoặc không có số liệu phát sinh sẽ bằng 0
      weeklyRoItems.push({ id: `ro-${wKey}`, month: wLabel, dmVatTu: 2.4, vatTu: 0, loiThaoTac: 0, totalLoi4M: 0 });
      weeklyBgItems.push({ id: `bg-${wKey}`, month: wLabel, dmVatTu: 4.03, vatTu: 0, loiThaoTac: 0, totalLoi4M: 0 });
      weeklyPxlrItems.push({ id: `pxlr-${wKey}`, month: wLabel, dmVatTu: 3.69, vatTu: 0, loiThaoTac: 0, totalLoi4M: 0 });
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
  let t9RoLoiTT = 1.9;
  let t9RoLoi4M = 3.0;
  let t9BgVatTu = 2.69;
  let t9BgLoiTT = 4.25;
  let t9BgLoi4M = 6.94;
  let totalSlRO_T9 = 0;
  let totalSlBG_T9 = 0;

  if (month9Records.length > 0) {
    const activeRO = month9Records.filter(r => (r.ro.sanLuong && r.ro.sanLuong > 0) || r.ro.totalLoi4M > 0 || r.ro.vatTu > 0 || (r.ro.loiThaoTac !== undefined && r.ro.loiThaoTac > 0));
    const activeBG = month9Records.filter(r => (r.bg.sanLuong && r.bg.sanLuong > 0) || r.bg.totalLoi4M > 0 || r.bg.vatTu > 0 || (r.bg.loiThaoTac !== undefined && r.bg.loiThaoTac > 0));

    totalSlRO_T9 = activeRO.reduce((s, r) => s + (r.ro.sanLuong || 0), 0);
    totalSlBG_T9 = activeBG.reduce((s, r) => s + (r.bg.sanLuong || 0), 0);

    t9RoVatTu = activeRO.length > 0 ? Number((activeRO.reduce((s, r) => s + r.ro.vatTu, 0) / activeRO.length).toFixed(1)) : 0;
    t9RoLoiTT = activeRO.length > 0 ? Number((activeRO.reduce((s, r) => s + (r.ro.loiThaoTac !== undefined ? r.ro.loiThaoTac : Math.max(0, r.ro.totalLoi4M - r.ro.vatTu)), 0) / activeRO.length).toFixed(1)) : 0;
    t9RoLoi4M = activeRO.length > 0 ? Number((activeRO.reduce((s, r) => s + r.ro.totalLoi4M, 0) / activeRO.length).toFixed(1)) : 0;

    t9BgVatTu = activeBG.length > 0 ? Number((activeBG.reduce((s, r) => s + r.bg.vatTu, 0) / activeBG.length).toFixed(1)) : 0;
    t9BgLoiTT = activeBG.length > 0 ? Number((activeBG.reduce((s, r) => s + (r.bg.loiThaoTac !== undefined ? r.bg.loiThaoTac : Math.max(0, r.bg.totalLoi4M - r.bg.vatTu)), 0) / activeBG.length).toFixed(1)) : 0;
    t9BgLoi4M = activeBG.length > 0 ? Number((activeBG.reduce((s, r) => s + r.bg.totalLoi4M, 0) / activeBG.length).toFixed(1)) : 0;
  }

  const t9Pxlr = calculatePXLRQuality(
    { dmVatTu: 2.4, vatTu: t9RoVatTu, loiThaoTac: t9RoLoiTT, totalLoi4M: t9RoLoi4M, sanLuong: totalSlRO_T9 },
    { dmVatTu: 4.03, vatTu: t9BgVatTu, loiThaoTac: t9BgLoiTT, totalLoi4M: t9BgLoi4M, sanLuong: totalSlBG_T9 }
  );

  const month10Records = safeDaily.filter(r => r.month === 'T10' || r.date.includes('-10-') || r.date.includes('/10'));
  let t10RoVatTu = 1.25;
  let t10RoLoiTT = 2.1;
  let t10RoLoi4M = 3.42;
  let t10BgVatTu = 2.10;
  let t10BgLoiTT = 3.2;
  let t10BgLoi4M = 5.80;
  let totalSlRO_T10 = 0;
  let totalSlBG_T10 = 0;

  if (month10Records.length > 0) {
    const activeRO = month10Records.filter(r => (r.ro.sanLuong && r.ro.sanLuong > 0) || r.ro.totalLoi4M > 0 || r.ro.vatTu > 0 || (r.ro.loiThaoTac !== undefined && r.ro.loiThaoTac > 0));
    const activeBG = month10Records.filter(r => (r.bg.sanLuong && r.bg.sanLuong > 0) || r.bg.totalLoi4M > 0 || r.bg.vatTu > 0 || (r.bg.loiThaoTac !== undefined && r.bg.loiThaoTac > 0));

    totalSlRO_T10 = activeRO.reduce((s, r) => s + (r.ro.sanLuong || 0), 0);
    totalSlBG_T10 = activeBG.reduce((s, r) => s + (r.bg.sanLuong || 0), 0);

    t10RoVatTu = activeRO.length > 0 ? Number((activeRO.reduce((s, r) => s + r.ro.vatTu, 0) / activeRO.length).toFixed(1)) : 0;
    t10RoLoiTT = activeRO.length > 0 ? Number((activeRO.reduce((s, r) => s + (r.ro.loiThaoTac !== undefined ? r.ro.loiThaoTac : Math.max(0, r.ro.totalLoi4M - r.ro.vatTu)), 0) / activeRO.length).toFixed(1)) : 0;
    t10RoLoi4M = activeRO.length > 0 ? Number((activeRO.reduce((s, r) => s + r.ro.totalLoi4M, 0) / activeRO.length).toFixed(1)) : 0;

    t10BgVatTu = activeBG.length > 0 ? Number((activeBG.reduce((s, r) => s + r.bg.vatTu, 0) / activeBG.length).toFixed(1)) : 0;
    t10BgLoiTT = activeBG.length > 0 ? Number((activeBG.reduce((s, r) => s + (r.bg.loiThaoTac !== undefined ? r.bg.loiThaoTac : Math.max(0, r.bg.totalLoi4M - r.bg.vatTu)), 0) / activeBG.length).toFixed(1)) : 0;
    t10BgLoi4M = activeBG.length > 0 ? Number((activeBG.reduce((s, r) => s + r.bg.totalLoi4M, 0) / activeBG.length).toFixed(1)) : 0;
  }

  const t10Pxlr = calculatePXLRQuality(
    { dmVatTu: 2.4, vatTu: t10RoVatTu, loiThaoTac: t10RoLoiTT, totalLoi4M: t10RoLoi4M, sanLuong: totalSlRO_T10 },
    { dmVatTu: 4.03, vatTu: t10BgVatTu, loiThaoTac: t10BgLoiTT, totalLoi4M: t10BgLoi4M, sanLuong: totalSlBG_T10 }
  );

  // Giữ T6, T7, T8 lịch sử chuẩn (bắt đầu từ Tháng 6)
  const pxlrMonthlyItems: Slide2QualityItem[] = [
    { id: 'pxlr-q-t6', month: 'T6', dmVatTu: 3.69, vatTu: 1.59, loiThaoTac: 3.48, totalLoi4M: 5.07 },
    { id: 'pxlr-q-t7', month: 'T7', dmVatTu: 3.69, vatTu: 1.48, loiThaoTac: 4.30, totalLoi4M: 5.78 },
    { id: 'pxlr-q-t8', month: 'T8', dmVatTu: 3.69, vatTu: 1.61, loiThaoTac: 3.36, totalLoi4M: 4.97 },
    { id: 'pxlr-q-t9', month: 'T9', dmVatTu: 3.69, vatTu: t9Pxlr.vatTu, loiThaoTac: t9Pxlr.loiThaoTac, totalLoi4M: t9Pxlr.totalLoi4M },
    { id: 'pxlr-q-t10', month: 'T10', dmVatTu: 3.69, vatTu: t10Pxlr.vatTu, loiThaoTac: t10Pxlr.loiThaoTac, totalLoi4M: t10Pxlr.totalLoi4M },
  ];

  const roMonthlyItems: Slide2QualityItem[] = [
    { id: 'ro-q-t6', month: 'T6', dmVatTu: 2.4, vatTu: 0.8, loiThaoTac: 2.6, totalLoi4M: 3.4 },
    { id: 'ro-q-t7', month: 'T7', dmVatTu: 2.4, vatTu: 0.8, loiThaoTac: 3.0, totalLoi4M: 3.8 },
    { id: 'ro-q-t8', month: 'T8', dmVatTu: 2.4, vatTu: 0.8, loiThaoTac: 2.4, totalLoi4M: 3.2 },
    { id: 'ro-q-t9', month: 'T9', dmVatTu: 2.4, vatTu: t9RoVatTu, loiThaoTac: t9RoLoiTT, totalLoi4M: t9RoLoi4M },
    { id: 'ro-q-t10', month: 'T10', dmVatTu: 2.4, vatTu: t10RoVatTu, loiThaoTac: t10RoLoiTT, totalLoi4M: t10RoLoi4M },
  ];

  const bgMonthlyItems: Slide2QualityItem[] = [
    { id: 'bg-q-t6', month: 'T6', dmVatTu: 4.03, vatTu: 3.13, loiThaoTac: 5.2, totalLoi4M: 8.33 },
    { id: 'bg-q-t7', month: 'T7', dmVatTu: 4.03, vatTu: 2.32, loiThaoTac: 5.94, totalLoi4M: 8.26 },
    { id: 'bg-q-t8', month: 'T8', dmVatTu: 4.03, vatTu: 3.97, loiThaoTac: 6.13, totalLoi4M: 10.10 },
    { id: 'bg-q-t9', month: 'T9', dmVatTu: 4.03, vatTu: t9BgVatTu, loiThaoTac: t9BgLoiTT, totalLoi4M: t9BgLoi4M },
    { id: 'bg-q-t10', month: 'T10', dmVatTu: 4.03, vatTu: t10BgVatTu, loiThaoTac: t10BgLoiTT, totalLoi4M: t10BgLoi4M },
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
    const weekLabel = latestPxlrWeek?.month || (weeklyItems.length > 0 ? weeklyItems[weeklyItems.length - 1].month : 'Tuần 39');
    
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

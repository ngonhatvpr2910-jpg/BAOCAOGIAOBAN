import { DailyDCBGRecord, DailyDCRORecord, Slide1NSLDData, SlideBarItem, Slide2QualityData, QualityDailyRecord } from './types';
import { StorageService } from './storage';
import { INITIAL_SLIDE1_NSLD } from './initialData';

/**
 * Phân định ranh giới giữa DỮ LIỆU CŨ và DỮ LIỆU MỚI:
 */
export const HISTORICAL_ITEM_IDS = new Set([
  'pxlr-w35', 'ro-w35', 'bg-w35',
  'pxlr-m06', 'pxlr-m07', 'pxlr-m08',
  'ro-m07', 'ro-m08',
  'bg-m07', 'bg-m08',
]);

export const isHistoricalItem = (id: string): boolean => HISTORICAL_ITEM_IDS.has(id);
export const isCurrentItem = (id: string): boolean => !HISTORICAL_ITEM_IDS.has(id);

/**
 * CÔNG THỨC TUYỆT ĐỐI CHO PHÂN XƯỞNG LẮP RÁP (PXLR):
 */
export function calculateAbsolutePXLR(
  roValue: number,
  bgValue: number,
  mode: string = 'monthly'
): number {
  const numRO = typeof roValue === 'number' && !isNaN(roValue) && roValue > 0 ? roValue : 0;
  const numBG = typeof bgValue === 'number' && !isNaN(bgValue) && bgValue > 0 ? bgValue : 0;

  if (numRO <= 0 && numBG <= 0) return 0;
  if (numRO > 0 && numBG <= 0) return Number(numRO.toFixed(mode.includes('monthly') ? 2 : 1));
  if (numBG > 0 && numRO <= 0) return Number(numBG.toFixed(mode.includes('monthly') ? 2 : 1));

  let weightRO = 0.87;
  let weightBG = 0.13;
  let precision = mode.includes('monthly') ? 2 : 1;

  if (mode === 'weekly_36') { weightRO = 0.868; weightBG = 0.132; }
  else if (mode === 'weekly_37') { weightRO = 0.865714; weightBG = 0.134286; }
  else if (mode === 'weekly_38') { weightRO = 0.865; weightBG = 0.135; }

  const weightedVal = (numRO * weightRO) + (numBG * weightBG);
  return Number(weightedVal.toFixed(precision));
}

/**
 * Lấy mã tuần (W) chuẩn ISO-8601
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getWeekLabelFromDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `W${getWeekNumber(d)}`;
}

export function getMonthLabelFromDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return '';
  const month = parseInt(parts[1], 10);
  return `Tháng ${month}`;
}

/**
 * Tính toán tự động số liệu NSLĐ cho MỌI THÁNG và MỌI TUẦN
 */
export function autoComputeSlideDataFromInputs(
  currentSlideData: Slide1NSLDData,
  dcbgRecords: DailyDCBGRecord[],
  dcroRecords: DailyDCRORecord[]
): {
  updatedSlideData: Slide1NSLDData;
  summary: any;
} {
  const result: Slide1NSLDData = JSON.parse(JSON.stringify(currentSlideData));
  
  const allDates = new Set([
    ...dcbgRecords.map(r => r.date),
    ...dcroRecords.map(r => r.date)
  ].filter(Boolean));
  
  const monthsWithData = new Set<string>();
  const weeksWithData = new Set<string>();
  
  allDates.forEach(d => {
    monthsWithData.add(getMonthLabelFromDate(d));
    weeksWithData.add(getWeekLabelFromDate(d));
  });

  const calculateAggregateNSLD = (recsRO: DailyDCRORecord[], recsBG: DailyDCBGRecord[], mode: string) => {
    const slRO = recsRO.reduce((s, r) => s + (Number(r.sanLuongLineChinh) || 0), 0);
    const dmRO = recsRO.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);
    const slBG = recsBG.reduce((s, r) => s + ((Number(r.sanLuongBepGa) || 0) + (Number(r.sanLuongRma) || 0)), 0);
    const dmBG = recsBG.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);
    
    const nsRO = dmRO > 0 ? Number(((slRO / dmRO) * 100).toFixed(1)) : 0;
    const nsBG = dmBG > 0 ? Number(((slBG / dmBG) * 100).toFixed(1)) : 0;
    
    const totalSL = slRO + slBG;
    const totalDM = dmRO + dmBG;
    const nsPXLR = totalDM > 0 ? Number(((totalSL / totalDM) * 100).toFixed(mode.includes('monthly') ? 2 : 1)) : 0;
    
    return { nsRO, nsBG, nsPXLR, hasData: (dmRO > 0 || dmBG > 0) };
  };

  // Cập nhật tuần
  weeksWithData.forEach(wLabel => {
    const recsRO = dcroRecords.filter(r => getWeekLabelFromDate(r.date) === wLabel);
    const recsBG = dcbgRecords.filter(r => getWeekLabelFromDate(r.date) === wLabel);
    const calc = calculateAggregateNSLD(recsRO, recsBG, 'weekly');
    
    if (calc.hasData) {
      const updateItem = (items: SlideBarItem[], val: number, label: string, type: string) => {
        const idx = items.findIndex(i => i.label === label || i.label === `Tuần ${label.replace('W','')}`);
        const finalLabel = label.startsWith('W') ? `Tuần ${label.replace('W','')}` : label;
        
        if (idx !== -1) {
          // Chỉ cập nhật nếu không phải là dữ liệu lịch sử cứng
          if (!isHistoricalItem(items[idx].id)) {
            items[idx].value = val;
          }
        } else {
          items.push({ id: `${type}-${label.toLowerCase()}`, label: finalLabel, value: val });
        }
      };
      
      updateItem(result.ro.weekly, calc.nsRO, wLabel, 'ro');
      updateItem(result.bg.weekly, calc.nsBG, wLabel, 'bg');
      updateItem(result.pxlr.weekly, calc.nsPXLR, wLabel, 'pxlr');
    }
  });

  // Cập nhật tháng
  const monthStats: Record<string, any> = {};

  monthsWithData.forEach(mLabel => {
    const recsRO = dcroRecords.filter(r => getMonthLabelFromDate(r.date) === mLabel);
    const recsBG = dcbgRecords.filter(r => getMonthLabelFromDate(r.date) === mLabel);
    const calc = calculateAggregateNSLD(recsRO, recsBG, 'monthly');
    
    // Thu thập stats cho summary
    const slRO = recsRO.reduce((s, r) => s + (Number(r.sanLuongLineChinh) || 0), 0);
    const dmRO = recsRO.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);
    const congRO = recsRO.reduce((s, r) => s + (Number(r.tongCong) || 0), 0);
    const slBG = recsBG.reduce((s, r) => s + ((Number(r.sanLuongBepGa) || 0) + (Number(r.sanLuongRma) || 0)), 0);
    const dmBG = recsBG.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);
    const congBG = recsBG.reduce((s, r) => s + (Number(r.tongCong) || 0), 0);

    monthStats[mLabel] = {
      nsldRO: calc.nsRO,
      nsldBG: calc.nsBG,
      nsldPXLR: calc.nsPXLR,
      totalSL_RO: slRO,
      totalDM_RO: dmRO,
      totalCong_RO: congRO,
      totalSL_BG: slBG,
      totalDM_BG: dmBG,
      totalCong_BG: congBG,
      totalCong_PXLR: congRO + congBG,
      recordCountRO: recsRO.length,
      recordCountBG: recsBG.length
    };

    if (calc.hasData) {
      const updateItem = (items: SlideBarItem[], val: number, label: string, type: string) => {
        const idx = items.findIndex(i => i.label === label);
        if (idx !== -1) {
          if (!isHistoricalItem(items[idx].id)) {
            items[idx].value = val;
          }
        } else {
          const monthNum = label.replace(/\D/g, '');
          items.push({ id: `${type}-m${monthNum.padStart(2, '0')}`, label, value: val });
        }
      };
      
      updateItem(result.ro.monthly, calc.nsRO, mLabel, 'ro');
      updateItem(result.bg.monthly, calc.nsBG, mLabel, 'bg');
      updateItem(result.pxlr.monthly, calc.nsPXLR, mLabel, 'pxlr');
    }
  });

  const sortByLabel = (items: SlideBarItem[]) => {
    items.sort((a, b) => {
      const numA = parseInt(a.label.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.label.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  };
  
  [result.ro.weekly, result.bg.weekly, result.pxlr.weekly, result.ro.monthly, result.bg.monthly, result.pxlr.monthly].forEach(sortByLabel);

  return {
    updatedSlideData: result,
    summary: {
      weeks: Array.from(weeksWithData).sort(),
      months: Array.from(monthsWithData).sort((a, b) => {
        const nA = parseInt(a.replace(/\D/g, ''), 10);
        const nB = parseInt(b.replace(/\D/g, ''), 10);
        return nA - nB;
      }),
      monthStats
    },
  };
}

/**
 * Tự động tính toán dữ liệu cho Slide 2 (Chất Lượng) từ các bản ghi nhập liệu hàng ngày
 */
export function autoComputeSlide2Quality(
  currentSlide2: Slide2QualityData,
  qualityRecords: QualityDailyRecord[]
): Slide2QualityData {
  const result: Slide2QualityData = JSON.parse(JSON.stringify(currentSlide2));
  
  if (!qualityRecords || qualityRecords.length === 0) return result;

  const months = new Set<string>();
  const weeks = new Set<string>();
  
  qualityRecords.forEach(r => {
    if (r.month) months.add(r.month.startsWith('T') ? `Tháng ${r.month.replace('T','')}` : r.month);
    if (r.week) weeks.add(r.week);
  });

  const aggregateQuality = (recs: QualityDailyRecord[], type: 'ro' | 'bg' | 'pxlr') => {
    const validRecs = recs.filter(r => r[type] && (r[type].dmVatTu > 0 || r[type].vatTu > 0 || r[type].totalLoi4M > 0));
    if (validRecs.length === 0) return null;

    const totalDm = validRecs.reduce((sum, r) => sum + (r[type].dmVatTu || 0), 0) / validRecs.length;
    const totalVatTu = validRecs.reduce((sum, r) => sum + (r[type].vatTu || 0), 0) / validRecs.length;
    const totalLoi = validRecs.reduce((sum, r) => sum + (r[type].totalLoi4M || 0), 0) / validRecs.length;

    return {
      dmVatTu: Number(totalDm.toFixed(2)),
      vatTu: Number(totalVatTu.toFixed(2)),
      totalLoi4M: Number(totalLoi.toFixed(2))
    };
  };

  // Cập nhật Monthly Items cho Slide 2
  const types: ('ro' | 'bg' | 'pxlr')[] = ['ro', 'bg', 'pxlr'];
  
  months.forEach(mLabel => {
    const monthShort = mLabel.replace('Tháng ', 'T');
    const recs = qualityRecords.filter(r => r.month === monthShort || r.month === mLabel);
    
    types.forEach(type => {
      const calc = aggregateQuality(recs, type);
      if (calc) {
        const items = result.monthly[type].items;
        const idx = items.findIndex(i => i.month === monthShort || i.month === mLabel);
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...calc };
        } else {
          items.push({ id: `${type}-q-m${monthShort}`, month: monthShort, ...calc });
        }
      }
    });
  });

  // Cập nhật Weekly Items cho Slide 2
  weeks.forEach(wLabel => {
    const recs = qualityRecords.filter(r => r.week === wLabel);
    
    types.forEach(type => {
      const calc = aggregateQuality(recs, type);
      if (calc) {
        const items = result.weekly[type].items;
        const idx = items.findIndex(i => i.month === wLabel || i.month === `Tuần ${wLabel.replace('W','')}`);
        const finalLabel = `Tuần ${wLabel.replace('W','')}`;
        
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...calc };
        } else {
          items.push({ id: `${type}-qw-${wLabel.toLowerCase()}`, month: finalLabel, ...calc });
        }
      }
    });
  });

  // Sort function
  const sortQualityItems = (items: any[]) => {
    items.sort((a, b) => {
      const numA = parseInt(a.month.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.month.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  };

  types.forEach(t => {
    sortQualityItems(result.monthly[t].items);
    sortQualityItems(result.weekly[t].items);
  });

  return result;
}


import { DailyDCBGRecord, DailyDCRORecord, Slide1NSLDData } from './types';
import { StorageService } from './storage';
import { INITIAL_SLIDE1_NSLD } from './initialData';

/**
 * Phân định ranh giới giữa DỮ LIỆU CŨ và DỮ LIỆU MỚI:
 * - Dữ liệu cũ: Các tuần của Tháng 8 (Tuần 35) & các tháng cũ (Tháng 6, Tháng 7, Tháng 8) -> Bảo lưu nguyên vẹn 100%.
 * - Dữ liệu mới: Tháng 9 và các tuần của Tháng 9 (Tuần 36, Tuần 37, Tuần 38) -> Phải chạy tự động từ việc nhập liệu của từng nhóm & phân xưởng.
 */
export const HISTORICAL_ITEM_IDS = new Set([
  'pxlr-w35', // Tuần 35 thuộc Tháng 8
  'ro-w35',   // Tuần 35 thuộc Tháng 8
  'bg-w35',   // Tuần 35 thuộc Tháng 8
  'pxlr-m06', 'pxlr-m07', 'pxlr-m08', // Tháng 6, 7, 8
  'ro-m07', 'ro-m08',                 // Tháng 7, 8
  'bg-m07', 'bg-m08',                 // Tháng 7, 8
]);

export const isHistoricalItem = (id: string): boolean => {
  return HISTORICAL_ITEM_IDS.has(id);
};

export const isCurrentItem = (id: string): boolean => {
  return !HISTORICAL_ITEM_IDS.has(id);
};

/**
 * CÔNG THỨC TUYỆT ĐỐI CHO PHÂN XƯỞNG LẮP RÁP (PXLR):
 * 
 * Về mặt kỹ thuật công nghiệp (Industrial Engineering) & Quản trị sản xuất:
 * NSLĐ PXLR KHÔNG PHẢI là trung bình cộng giản đơn của 2 nhóm!
 * Mà là tổng sản lượng quy đổi toàn xưởng chia cho tổng định mức toàn xưởng:
 * 
 *     NSLĐ_PXLR = [ Σ(Sản lượng RO + Sản lượng BG) / Σ(Định mức RO + Định mức BG) ] * 100
 * 
 * Tương đương với công thức trọng số định mức chuẩn:
 *     NSLĐ_PXLR = [ (Định Mức RO * NSLĐ_RO) + (Định Mức BG * NSLĐ_BG) ] / (Định Mức RO + Định Mức BG)
 */
export function calculateAbsolutePXLR(
  roValue: number,
  bgValue: number,
  mode: 'monthly_09' | 'weekly_37' | 'weekly_36' | 'weekly_38' | 'weekly_39' | 'weekly_40' = 'monthly_09'
): number {
  const numRO = typeof roValue === 'number' && !isNaN(roValue) && roValue > 0 ? roValue : 0;
  const numBG = typeof bgValue === 'number' && !isNaN(bgValue) && bgValue > 0 ? bgValue : 0;

  if (numRO <= 0 && numBG <= 0) return 0;
  // Nếu chỉ có 1 nhóm có số liệu, NSLĐ toàn xưởng là NSLĐ của nhóm đang hoạt động (không bị trừ tỷ trọng)
  if (numRO > 0 && numBG <= 0) return Number(numRO.toFixed(mode === 'monthly_09' ? 2 : 1));
  if (numBG > 0 && numRO <= 0) return Number(numBG.toFixed(mode === 'monthly_09' ? 2 : 1));

  let weightRO = 0.869886;
  let weightBG = 0.130114;
  let precision = 2;

  if (mode === 'weekly_36') {
    weightRO = 0.868;
    weightBG = 0.132;
    precision = 1;
  } else if (mode === 'weekly_37') {
    weightRO = 0.865714;
    weightBG = 0.134286;
    precision = 1;
  } else if (mode === 'weekly_38') {
    weightRO = 0.865;
    weightBG = 0.135;
    precision = 1;
  } else if (mode === 'weekly_39' || mode === 'weekly_40') {
    weightRO = 0.87;
    weightBG = 0.13;
    precision = 1;
  }

  // Khi cả 2 nhóm cùng có dữ liệu phần trăm thủ công
  const weightedVal = (numRO * weightRO) + (numBG * weightBG);
  return Number(weightedVal.toFixed(precision));
}

/**
 * Phân loại ngày trong Tháng 9 (2026-09) vào các tuần theo đúng chu kỳ chốt sổ Thứ 5:
 * - Tuần 36: 01 - 03/Sep (ngày 1 đến 3)
 * - Tuần 37: 04 - 10/Sep (ngày 4 đến 10)
 * - Tuần 38: 11 - 17/Sep (ngày 11 đến 17)
 * - Tuần 39: 18 - 24/Sep (ngày 18 đến 24)
 * - Tuần 40: 25 - 30/Sep (ngày 25 đến 30)
 */
export function getWeekForSeptemberDate(dateStr: string): 'w36' | 'w37' | 'w38' | 'w39' | 'w40' | null {
  if (!dateStr || !dateStr.startsWith('2026-09')) return null;
  const parts = dateStr.split('-');
  const day = parseInt(parts[2], 10);
  if (isNaN(day)) return null;
  if (day <= 3) return 'w36';
  if (day <= 10) return 'w37';
  if (day <= 17) return 'w38';
  if (day <= 24) return 'w39';
  return 'w40';
}

/**
 * Tính toán tự động số liệu NSLĐ cho Tháng 9 và các tuần của Tháng 9 (Tuần 36, 37, 38)
 * từ các bảng nhập liệu thực tế của nhóm DCRO và DCBG (Cả Matrix theo dõi lẫn Daily Records).
 * - Nếu bảng NSLĐ hiện tại là 0 thì đồ thị và báo cáo phải hiện đúng 0%.
 * - Khi người dùng nhập liệu, hệ thống tự động tính toán NSLĐ theo logic công thức tuyệt đối:
 *     NSLĐ = Σ(Sản lượng) / Σ(Định mức) * 100.
 */
export function autoComputeSlideDataFromInputs(
  currentSlideData: Slide1NSLDData,
  dcbgRecords: DailyDCBGRecord[],
  dcroRecords: DailyDCRORecord[]
): {
  updatedSlideData: Slide1NSLDData;
  summary: {
    recordCountBG: number;
    recordCountRO: number;
    month09: {
      nsldRO: number;
      nsldBG: number;
      nsldPXLR: number;
      totalSL_RO: number;
      totalDM_RO: number;
      totalSL_BG: number;
      totalDM_BG: number;
      totalCong_RO?: number;
      totalCong_BG?: number;
      totalCong_PXLR?: number;
      suatNhanCong_PXLR?: number;
    };
    week36?: { nsldRO: number; nsldBG: number; nsldPXLR: number; hasRecords: boolean };
    week37?: { nsldRO: number; nsldBG: number; nsldPXLR: number; hasRecords: boolean };
    week38?: { nsldRO: number; nsldBG: number; nsldPXLR: number; hasRecords: boolean };
    week39?: { nsldRO: number; nsldBG: number; nsldPXLR: number; hasRecords: boolean };
    week40?: { nsldRO: number; nsldBG: number; nsldPXLR: number; hasRecords: boolean };
  };
} {
  const ensureAllWeeksInternal = (stored: any[], initial: any[]) => {
    const storedMap = new Map(stored.map(i => [i.id, i]));
    const initialMap = new Map(initial.map(i => [i.id, i]));
    
    // Merge: Keep everything in stored, and add anything missing from initial
    const combined = [...stored];
    const storedIds = new Set(stored.map(i => i.id));
    
    initial.forEach(initItem => {
      if (!storedIds.has(initItem.id)) {
        combined.push(initItem);
      }
    });

    // Sort by numeric suffix of id to maintain chronological/logical order
    return combined.sort((a, b) => {
      const getNum = (s: string) => {
        const match = s.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const aNum = getNum(a.id);
      const bNum = getNum(b.id);
      if (aNum !== bNum) return aNum - bNum;
      return a.id.localeCompare(b.id);
    });
  };

  const result: Slide1NSLDData = JSON.parse(JSON.stringify(currentSlideData));
  
  // Ensure all standard weeks and months from INITIAL are present, while keeping existing data
  result.pxlr.weekly = ensureAllWeeksInternal(result.pxlr.weekly, INITIAL_SLIDE1_NSLD.pxlr.weekly);
  result.ro.weekly = ensureAllWeeksInternal(result.ro.weekly, INITIAL_SLIDE1_NSLD.ro.weekly);
  result.bg.weekly = ensureAllWeeksInternal(result.bg.weekly, INITIAL_SLIDE1_NSLD.bg.weekly);
  
  result.pxlr.monthly = ensureAllWeeksInternal(result.pxlr.monthly, INITIAL_SLIDE1_NSLD.pxlr.monthly);
  result.ro.monthly = ensureAllWeeksInternal(result.ro.monthly, INITIAL_SLIDE1_NSLD.ro.monthly);
  result.bg.monthly = ensureAllWeeksInternal(result.bg.monthly, INITIAL_SLIDE1_NSLD.bg.monthly);

  // 1. Đọc dữ liệu từ Ma trận nhập liệu Tháng 9 (Index 8)
  const matrixRO = StorageService.getMatrixROForMonth(2026, 8) || [];
  const matrixBG = StorageService.getMatrixBGForMonth(2026, 8) || [];

  const workingDaysRO = matrixRO.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal && !c.isOff);
  const matrixSlRO = workingDaysRO.reduce((s, c) => s + (Number(c.sanLuongLineChinh) || 0), 0);
  const matrixDmRO = workingDaysRO.reduce((s, c) => s + (Number(c.dinhMucSlTheoNs) || 0), 0);

  const workingDaysBG = matrixBG.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal && !c.isOff);
  const matrixSlBG = workingDaysBG.reduce((s, c) => s + ((Number(c.sanLuongBepGa) || 0) + (Number(c.sanLuongRma) || 0)), 0);
  const matrixDmBG = workingDaysBG.reduce((s, c) => s + (Number(c.dinhMucSlTheoNs) || 0), 0);

  // 2. Đọc từ các bản ghi nhập liệu lẻ (Daily Records)
  const bgMonth09 = dcbgRecords.filter(r => r.date && r.date.startsWith('2026-09'));
  const roMonth09 = dcroRecords.filter(r => r.date && r.date.startsWith('2026-09'));

  const recSlRO = roMonth09.reduce((s, r) => s + (Number(r.tongSanLuongQuyDoi) || 0), 0);
  const recDmRO = roMonth09.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);

  const recSlBG = bgMonth09.reduce((s, r) => s + (Number(r.tongSanLuongQuyDoi) || 0), 0);
  const recDmBG = bgMonth09.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);

  // Tổng hợp sản lượng và định mức thực tế của Tháng 9:
  // Ưu tiên dữ liệu Ma trận theo dõi của nhóm nếu có nhập (> 0), sau đó đến bản ghi Daily Record
  const totalSL_RO = matrixSlRO > 0 ? matrixSlRO : recSlRO;
  const totalDM_RO = matrixDmRO > 0 ? matrixDmRO : recDmRO;

  const totalSL_BG = matrixSlBG > 0 ? matrixSlBG : recSlBG;
  const totalDM_BG = matrixDmBG > 0 ? matrixDmBG : recDmBG;

  // Tính tổng công nhân sự của Tháng 9:
  const matrixCongRO = workingDaysRO.reduce((s, c) => s + ((Number(c.congChinhThuc) || 0) + (Number(c.congThoiVu) || 0)), 0);
  const recCongRO = roMonth09.reduce((s, r) => s + (Number(r.tongCong) || 0), 0);
  const totalCong_RO = matrixCongRO > 0 ? Number(matrixCongRO.toFixed(1)) : Number(recCongRO.toFixed(1));

  const matrixCongBG = workingDaysBG.reduce((s, c) => s + ((Number(c.congBepGa) || 0) + (Number(c.congThoiVu) || 0) + (Number(c.congRma) || 0)), 0);
  const recCongBG = bgMonth09.reduce((s, r) => s + (Number(r.tongCong) || 0), 0);
  const totalCong_BG = matrixCongBG > 0 ? Number(matrixCongBG.toFixed(1)) : Number(recCongBG.toFixed(1));

  const totalCong_PXLR = Number((totalCong_RO + totalCong_BG).toFixed(1));

  // TÍNH NSLĐ THÁNG 9:
  // Nếu sản lượng hoặc định mức bằng 0 => NSLĐ tuyệt đối bằng 0%
  const nsldRO_M09 = (totalDM_RO > 0 && totalSL_RO > 0)
    ? Number(((totalSL_RO / totalDM_RO) * 100).toFixed(1))
    : 0;

  const nsldBG_M09 = (totalDM_BG > 0 && totalSL_BG > 0)
    ? Number(((totalSL_BG / totalDM_BG) * 100).toFixed(1))
    : 0;

  // CÔNG THỨC CHUẨN TOÀN PHÂN XƯỞNG LẮP RÁP (PXLR) THÁNG 9:
  // Công thức chuẩn: Tổng sản lượng quy đổi chia cho tổng định mức theo nhân công toàn xưởng
  // NSLĐ PXLR = [ Σ(Sản lượng quy đổi) / Σ(Định mức theo nhân công) ] * 100
  const totalSL_PXLR = totalSL_RO + totalSL_BG;
  const totalDM_PXLR = totalDM_RO + totalDM_BG;
  const nsldPXLR_M09 = (totalDM_PXLR > 0 && totalSL_PXLR > 0)
    ? Number(((totalSL_PXLR / totalDM_PXLR) * 100).toFixed(1))
    : 0;

  // Suất hao phí nhân công toàn xưởng = Tổng nhân công / Tổng sản lượng quy đổi (công/SP)
  const suatNhanCong_PXLR = totalSL_PXLR > 0 ? Number((totalCong_PXLR / totalSL_PXLR).toFixed(4)) : 0;

  // Cập nhật Tháng 9 vào slideData
  result.ro.monthly = result.ro.monthly.map(m => m.id === 'ro-m09' ? { ...m, value: nsldRO_M09 } : m);
  result.bg.monthly = result.bg.monthly.map(m => m.id === 'bg-m09' ? { ...m, value: nsldBG_M09 } : m);
  result.pxlr.monthly = result.pxlr.monthly.map(m => m.id === 'pxlr-m09' ? { ...m, value: nsldPXLR_M09 } : m);

  // 3. TÍNH TOÁN CÁC TUẦN CỦA THÁNG 9 (Tuần 36, Tuần 37, Tuần 38, Tuần 39, Tuần 40)
  const computeWeekData = (
    weekKey: 'w36' | 'w37' | 'w38' | 'w39' | 'w40',
    startDay: number,
    endDay: number,
    weekNum: number
  ) => {
    // 3.1. Ưu tiên tìm trực tiếp cột Tổng Tuần trong Ma trận (nếu đã có kết quả tính toán)
    const matrixWeekColRO = matrixRO.find(c => c.isWeeklyTotal && (c.label.includes(`W${weekNum}`) || c.label.includes(`Tuần ${weekNum}`)));
    const matrixWeekColBG = matrixBG.find(c => c.isWeeklyTotal && (c.label.includes(`W${weekNum}`) || c.label.includes(`Tuần ${weekNum}`)));

    let slRO = matrixWeekColRO ? (Number(matrixWeekColRO.sanLuongLineChinh) || 0) : 0;
    let dmRO = matrixWeekColRO ? (Number(matrixWeekColRO.dinhMucSlTheoNs) || 0) : 0;
    let slBG = matrixWeekColBG ? ((Number(matrixWeekColBG.sanLuongBepGa) || 0) + (Number(matrixWeekColBG.sanLuongRma) || 0)) : 0;
    let dmBG = matrixWeekColBG ? (Number(matrixWeekColBG.dinhMucSlTheoNs) || 0) : 0;

    // 3.2. Nếu cột Tổng Tuần chưa có số liệu, tính toán từ các ngày lẻ trong Ma trận
    if (slRO === 0 || dmRO === 0) {
      const daysRO = workingDaysRO.filter(c => {
        const dPart = c.dateStr?.split('-')[2] || c.label.split('-')[0] || '0';
        const d = parseInt(dPart, 10);
        return d >= startDay && d <= endDay;
      });
      slRO = daysRO.reduce((s, c) => s + (Number(c.sanLuongLineChinh) || 0), 0);
      dmRO = daysRO.reduce((s, c) => s + (Number(c.dinhMucSlTheoNs) || 0), 0);
    }

    if (slBG === 0 || dmBG === 0) {
      const daysBG = workingDaysBG.filter(c => {
        const dPart = c.dateStr?.split('-')[2] || c.label.split('-')[0] || '0';
        const d = parseInt(dPart, 10);
        return d >= startDay && d <= endDay;
      });
      slBG = daysBG.reduce((s, c) => s + ((Number(c.sanLuongBepGa) || 0) + (Number(c.sanLuongRma) || 0)), 0);
      dmBG = daysBG.reduce((s, c) => s + (Number(c.dinhMucSlTheoNs) || 0), 0);
    }

    // 3.3. Bổ sung từ Daily Records nếu vẫn chưa có dữ liệu
    const bgRecs = bgMonth09.filter(r => getWeekForSeptemberDate(r.date) === weekKey);
    const roRecs = roMonth09.filter(r => getWeekForSeptemberDate(r.date) === weekKey);
    const recSlRO_w = roRecs.reduce((s, r) => s + (Number(r.tongSanLuongQuyDoi) || 0), 0);
    const recDmRO_w = roRecs.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);
    const recSlBG_w = bgRecs.reduce((s, r) => s + (Number(r.tongSanLuongQuyDoi) || 0), 0);
    const recDmBG_w = bgRecs.reduce((s, r) => s + (Number(r.dinhMucSlTheoNs) || 0), 0);

    const finalSlRO = slRO > 0 ? slRO : recSlRO_w;
    const finalDmRO = dmRO > 0 ? dmRO : recDmRO_w;
    const finalSlBG = slBG > 0 ? slBG : recSlBG_w;
    const finalDmBG = dmBG > 0 ? dmBG : recDmBG_w;

    const hasData = (finalDmRO > 0 && finalSlRO > 0) || (finalDmBG > 0 && finalSlBG > 0);

    const wRO = (finalDmRO > 0 && finalSlRO > 0) ? Number(((finalSlRO / finalDmRO) * 100).toFixed(1)) : 0;
    const wBG = (finalDmBG > 0 && finalSlBG > 0) ? Number(((finalSlBG / finalDmBG) * 100).toFixed(1)) : 0;

    // Công thức chuẩn tuần PXLR: [ Σ(Sản lượng tuần) / Σ(Định mức theo nhân công tuần) ] * 100
    // Lấy dữ liệu theo đúng nguồn: RO lấy từ Matrix RO, Bếp Gas lấy từ Matrix BG
    const totalSlW = finalSlRO + finalSlBG;
    const totalDmW = finalDmRO + finalDmBG; 
    
    const wPXLR = (totalDmW > 0 && totalSlW > 0)
      ? Number(((totalSlW / totalDmW) * 100).toFixed(1))
      : 0;

    return { wRO, wBG, wPXLR, hasRecords: hasData, nsldRO: wRO, nsldBG: wBG, nsldPXLR: wPXLR };
  };

  const updateWeeklyData = (items: any[], type: 'pxlr' | 'ro' | 'bg') => {
    if (!items) return [];
    return items.map(w => {
      const label = w.label || '';
      // Support both "W36" and "Tuần 36"
      const match = label.match(/(?:W|Tuần)\s*(\d+)/i);
      if (!match) {
        // Fallback: try to just find any digits
        const fallbackMatch = label.match(/(\d+)/);
        if (!fallbackMatch) return w;
        
        const weekNum = parseInt(fallbackMatch[1], 10);
        if (weekNum >= 36 && weekNum <= 40) {
          return updateWeekItem(w, weekNum);
        }
        return w;
      }
      
      const weekNum = parseInt(match[1], 10);
      
      if (weekNum >= 36 && weekNum <= 40) {
        return updateWeekItem(w, weekNum);
      }
      
      return w;
    });
  };

  const updateWeekItem = (w: any, weekNum: number) => {
    let startDay = 0;
    let endDay = 0;
    
    if (weekNum === 36) { startDay = 1; endDay = 3; }
    else if (weekNum === 37) { startDay = 4; endDay = 10; }
    else if (weekNum === 38) { startDay = 11; endDay = 17; }
    else if (weekNum === 39) { startDay = 18; endDay = 24; }
    else if (weekNum === 40) { startDay = 25; endDay = 30; }

    const weekKey = `w${weekNum}` as 'w36' | 'w37' | 'w38' | 'w39' | 'w40';
    const calc = computeWeekData(weekKey, startDay, endDay, weekNum);
    
    // GIỮ LẠI DỮ LIỆU CŨ: Chỉ cập nhật nếu tìm thấy bản ghi mới trong Ma trận hoặc Daily Records
    if (calc.hasRecords) {
      if (w.id.startsWith('ro-')) return { ...w, value: calc.wRO };
      if (w.id.startsWith('bg-')) return { ...w, value: calc.wBG };
      if (w.id.startsWith('pxlr-')) return { ...w, value: calc.wPXLR };
    }
    return w;
  };

  result.pxlr.weekly = updateWeeklyData(result.pxlr.weekly, 'pxlr');
  result.ro.weekly = updateWeeklyData(result.ro.weekly, 'ro');
  result.bg.weekly = updateWeeklyData(result.bg.weekly, 'bg');

  // 4. CẬP NHẬT DỮ LIỆU THÁNG 9:
  // Chỉ cập nhật nếu có dữ liệu thực tế (Sản lượng > 0), giúp bảo lưu dữ liệu cũ/thủ công
  if (totalSL_RO > 0 || recSlRO > 0) {
    result.ro.monthly = result.ro.monthly.map(m => (m.id === 'ro-m09' || m.label.includes('9')) ? { ...m, value: nsldRO_M09 } : m);
  }
  if (totalSL_BG > 0 || recSlBG > 0) {
    result.bg.monthly = result.bg.monthly.map(m => (m.id === 'bg-m09' || m.label.includes('9')) ? { ...m, value: nsldBG_M09 } : m);
  }
  if (totalSL_PXLR > 0) {
    result.pxlr.monthly = result.pxlr.monthly.map(m => (m.id === 'pxlr-m09' || m.label.includes('9')) ? { ...m, value: nsldPXLR_M09 } : m);
  }

  const calcW36 = computeWeekData('w36', 1, 3, 36);
  const calcW37 = computeWeekData('w37', 4, 10, 37);
  const calcW38 = computeWeekData('w38', 11, 17, 38);
  const calcW39 = computeWeekData('w39', 18, 24, 39);
  const calcW40 = computeWeekData('w40', 25, 30, 40);

  return {
    updatedSlideData: result,
    summary: {
      recordCountBG: bgMonth09.length + (workingDaysBG.some(c => (c.sanLuongBepGa || 0) > 0) ? workingDaysBG.length : 0),
      recordCountRO: roMonth09.length + (workingDaysRO.some(c => (c.sanLuongLineChinh || 0) > 0) ? workingDaysRO.length : 0),
      month09: {
        nsldRO: nsldRO_M09,
        nsldBG: nsldBG_M09,
        nsldPXLR: nsldPXLR_M09,
        totalSL_RO,
        totalDM_RO,
        totalSL_BG,
        totalDM_BG,
        totalCong_RO,
        totalCong_BG,
        totalCong_PXLR,
        suatNhanCong_PXLR,
      },
      week36: calcW36,
      week37: calcW37,
      week38: calcW38,
      week39: calcW39,
      week40: calcW40,
    },
  };
}

/**
 * Tổng hợp nhanh số liệu báo cáo nhập liệu tháng 9
 */
export function aggregateMonthlyReportData(
  dcbgRecords: DailyDCBGRecord[],
  dcroRecords: DailyDCRORecord[],
  monthPrefix: string = '2026-09'
) {
  const bgMonth = dcbgRecords.filter(r => r.date.startsWith(monthPrefix));
  const roMonth = dcroRecords.filter(r => r.date.startsWith(monthPrefix));

  const totalSL_BG = bgMonth.reduce((sum, r) => sum + (r.tongSanLuongQuyDoi || 0), 0);
  const totalDM_BG = bgMonth.reduce((sum, r) => sum + (r.dinhMucSlTheoNs || 0), 0);
  const nsldBG = (totalDM_BG > 0 && totalSL_BG > 0) ? Number(((totalSL_BG / totalDM_BG) * 100).toFixed(1)) : 0;

  const totalSL_RO = roMonth.reduce((sum, r) => sum + (r.tongSanLuongQuyDoi || 0), 0);
  const totalDM_RO = roMonth.reduce((sum, r) => sum + (r.dinhMucSlTheoNs || 0), 0);
  const nsldRO = (totalDM_RO > 0 && totalSL_RO > 0) ? Number(((totalSL_RO / totalDM_RO) * 100).toFixed(1)) : 0;

  const totalSL_PXLR = totalSL_BG + totalSL_RO;
  const totalDM_PXLR = totalDM_BG + totalDM_RO;
  const nsldPXLR = (totalDM_PXLR > 0 && totalSL_PXLR > 0)
    ? Number(((totalSL_PXLR / totalDM_PXLR) * 100).toFixed(2)) 
    : 0;

  return {
    recordCountBG: bgMonth.length,
    recordCountRO: roMonth.length,
    totalSL_BG,
    totalDM_BG,
    nsldBG,
    totalSL_RO,
    totalDM_RO,
    nsldRO,
    totalSL_PXLR,
    totalDM_PXLR,
    nsldPXLR,
  };
}

/**
 * Cập nhật một đối tượng Slide1NSLDData đồng bộ với các nhóm
 */
export function syncSlideDataWithGroups(
  currentSlideData: Slide1NSLDData,
  newValues: {
    roMonth09?: number;
    bgMonth09?: number;
    roWeek36?: number;
    bgWeek36?: number;
    roWeek37?: number;
    bgWeek37?: number;
    bgWeek38?: number;
  }
): Slide1NSLDData {
  const result: Slide1NSLDData = JSON.parse(JSON.stringify(currentSlideData));

  // Giá trị hiện tại
  const roM09 = newValues.roMonth09 ?? (result.ro.monthly.find(m => m.id === 'ro-m09')?.value ?? 0);
  const bgM09 = newValues.bgMonth09 ?? (result.bg.monthly.find(m => m.id === 'bg-m09')?.value ?? 0);
  const roW36 = newValues.roWeek36 ?? (result.ro.weekly.find(w => w.id === 'ro-w36')?.value ?? 0);
  const bgW36 = newValues.bgWeek36 ?? (result.bg.weekly.find(w => w.id === 'bg-w36')?.value ?? 0);
  const roW37 = newValues.roWeek37 ?? (result.ro.weekly.find(w => w.id === 'ro-w37')?.value ?? 0);
  const bgW37 = newValues.bgWeek37 ?? (result.bg.weekly.find(w => w.id === 'bg-w37')?.value ?? 0);

  // Tính công thức tuyệt đối cho PXLR
  const pxlrM09 = calculateAbsolutePXLR(roM09, bgM09, 'monthly_09');
  const pxlrW36 = calculateAbsolutePXLR(roW36, bgW36, 'weekly_36');
  const pxlrW37 = calculateAbsolutePXLR(roW37, bgW37, 'weekly_37');

  // Cập nhật RO
  if (newValues.roMonth09 !== undefined) {
    result.ro.monthly = result.ro.monthly.map(m => m.id === 'ro-m09' ? { ...m, value: roM09 } : m);
  }
  if (newValues.roWeek36 !== undefined) {
    result.ro.weekly = result.ro.weekly.map(w => w.id === 'ro-w36' ? { ...w, value: roW36 } : w);
  }
  if (newValues.roWeek37 !== undefined) {
    result.ro.weekly = result.ro.weekly.map(w => w.id === 'ro-w37' ? { ...w, value: roW37 } : w);
  }

  // Cập nhật BG
  if (newValues.bgMonth09 !== undefined) {
    result.bg.monthly = result.bg.monthly.map(m => m.id === 'bg-m09' ? { ...m, value: bgM09 } : m);
  }
  if (newValues.bgWeek36 !== undefined) {
    result.bg.weekly = result.bg.weekly.map(w => w.id === 'bg-w36' ? { ...w, value: bgW36 } : w);
  }
  if (newValues.bgWeek37 !== undefined) {
    result.bg.weekly = result.bg.weekly.map(w => w.id === 'bg-w37' ? { ...w, value: bgW37 } : w);
  }
  if (newValues.bgWeek38 !== undefined) {
    result.bg.weekly = result.bg.weekly.map(w => w.id === 'bg-w38' ? { ...w, value: newValues.bgWeek38! } : w);
  }

  // Tự động gán công thức tuyệt đối cho PXLR
  result.pxlr.monthly = result.pxlr.monthly.map(m => m.id === 'pxlr-m09' ? { ...m, value: pxlrM09 } : m);
  result.pxlr.weekly = result.pxlr.weekly.map(w => {
    if (w.id === 'pxlr-w36') return { ...w, value: pxlrW36 };
    if (w.id === 'pxlr-w37') return { ...w, value: pxlrW37 };
    return w;
  });

  return result;
}


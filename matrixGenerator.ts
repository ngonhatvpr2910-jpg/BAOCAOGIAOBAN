import { ExcelMatrixBGColumn, ExcelMatrixROColumn } from './types';
import { INITIAL_MATRIX_BG, INITIAL_MATRIX_RO } from './initialData';

// Month names in English short format matching user's Excel tables (Jun, Sep, Oct, etc.)
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns number of days in a given month of a year
 */
export function getDaysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/**
 * Helper to ensure percentage values are stored as percentage points (e.g., 120 instead of 1.2)
 */
function sanitizePercentage(val: number): number {
  if (val > 0 && val < 5) { // Productivity can be up to 400-500% but unlikely to be < 5% as a real value
    return Number((val * 100).toFixed(1));
  }
  return Number(val.toFixed(1));
}

/**
 * Recalculate all weekly columns and monthly total column for BG Matrix
 */
export function recalculateBGMatrix(cols: ExcelMatrixBGColumn[]): ExcelMatrixBGColumn[] {
  const result = cols.map(c => {
    if (!c.isWeeklyTotal && !c.isMonthlyTotal) {
      return {
        ...c,
        nsldTheoNgay: sanitizePercentage(c.nsldTheoNgay),
        tiLeHoanThanhKhsx: sanitizePercentage(c.tiLeHoanThanhKhsx),
        tiLeDiLam: c.tiLeDiLam < 2 ? sanitizePercentage(c.tiLeDiLam) : Number(c.tiLeDiLam.toFixed(1))
      };
    }
    return { ...c };
  });
  
  // Identify day columns belonging to each week
  // We group day columns until we hit a weekly column
  let currentWeekDays: ExcelMatrixBGColumn[] = [];
  const allWorkingDays: ExcelMatrixBGColumn[] = [];

  for (let i = 0; i < result.length; i++) {
    const col = result[i];
    if (!col.isWeeklyTotal && !col.isMonthlyTotal) {
      if (!col.isOff) {
        currentWeekDays.push(col);
        allWorkingDays.push(col);
      }
    } else if (col.isWeeklyTotal) {
      // Calculate weekly totals
      const cGa = Number(currentWeekDays.reduce((s, d) => s + (Number(d.congBepGa) || 0), 0).toFixed(1));
      const cTv = Number(currentWeekDays.reduce((s, d) => s + (Number(d.congThoiVu) || 0), 0).toFixed(1));
      const cRma = Number(currentWeekDays.reduce((s, d) => s + (Number(d.congRma) || 0), 0).toFixed(1));
      const slGa = currentWeekDays.reduce((s, d) => s + (Number(d.sanLuongBepGa) || 0), 0);
      const slRma = currentWeekDays.reduce((s, d) => s + (Number(d.sanLuongRma) || 0), 0);
      const dm = Number(currentWeekDays.reduce((s, d) => s + (Number(d.dinhMucSlTheoNs) || 0), 0).toFixed(1));
      const totalSL = slGa + slRma;
      const nsld = dm > 0 ? Number(((totalSL / dm) * 100).toFixed(1)) : 0;
      const khsx = currentWeekDays.reduce((s, d) => s + (Number(d.khsxNgay) || 0), 0);
      const sumSLWeighted = currentWeekDays.reduce((s, d) => {
        const dKhsx = Number(d.khsxNgay) || 0;
        const dRate = Number(d.tiLeHoanThanhKhsx) || 0;
        return s + (dKhsx * dRate / 100);
      }, 0);
      const tiLeKhsx = khsx > 0 ? Number(((sumSLWeighted / khsx) * 100).toFixed(1)) : 0;
      const nsLine = currentWeekDays.reduce((s, d) => s + (Number(d.tongNhanSuLine) || 0), 0);
      const nsNghi = currentWeekDays.reduce((s, d) => s + (Number(d.nhanSuNghi) || 0), 0);
      const tiLe = nsLine > 0 ? Number((((nsLine - nsNghi) / nsLine) * 100).toFixed(1)) : 100;

      let rangeStr = col.weekRange;
      if (currentWeekDays.length > 0) {
        const firstDay = currentWeekDays[0];
        const lastDay = currentWeekDays[currentWeekDays.length - 1];
        const d1 = firstDay.label.split('-')[0];
        const d2 = lastDay.label.split('-')[0];
        const mStr = firstDay.label.split('-')[1] || '';
        rangeStr = `${d1} - ${d2}/${mStr}`;
      }

      result[i] = {
        ...col,
        weekRange: rangeStr,
        congBepGa: cGa,
        congThoiVu: cTv,
        congRma: cRma,
        sanLuongBepGa: slGa,
        sanLuongRma: slRma,
        dinhMucSlTheoNs: dm,
        nsldTheoNgay: nsld,
        khsxNgay: khsx,
        tiLeHoanThanhKhsx: tiLeKhsx,
        tongNhanSuLine: nsLine,
        nhanSuNghi: nsNghi,
        tiLeDiLam: tiLe,
      };
      currentWeekDays = []; // reset for next week
    }
  }

  // Calculate Monthly Total if present
  const monthlyIdx = result.findIndex(c => c.isMonthlyTotal);
  if (monthlyIdx >= 0) {
    const cGa = Number(allWorkingDays.reduce((s, d) => s + (Number(d.congBepGa) || 0), 0).toFixed(1));
    const cTv = Number(allWorkingDays.reduce((s, d) => s + (Number(d.congThoiVu) || 0), 0).toFixed(1));
    const cRma = Number(allWorkingDays.reduce((s, d) => s + (Number(d.congRma) || 0), 0).toFixed(1));
    const slGa = allWorkingDays.reduce((s, d) => s + (Number(d.sanLuongBepGa) || 0), 0);
    const slRma = allWorkingDays.reduce((s, d) => s + (Number(d.sanLuongRma) || 0), 0);
    const dm = Number(allWorkingDays.reduce((s, d) => s + (Number(d.dinhMucSlTheoNs) || 0), 0).toFixed(1));
    const totalSL = slGa + slRma;
    const nsld = dm > 0 ? Number(((totalSL / dm) * 100).toFixed(1)) : 0;
    const khsx = allWorkingDays.reduce((s, d) => s + (Number(d.khsxNgay) || 0), 0);
    const sumSLWeighted = allWorkingDays.reduce((s, d) => {
      const dKhsx = Number(d.khsxNgay) || 0;
      const dRate = Number(d.tiLeHoanThanhKhsx) || 0;
      return s + (dKhsx * dRate / 100);
    }, 0);
    const tiLeKhsx = khsx > 0 ? Number(((sumSLWeighted / khsx) * 100).toFixed(1)) : 0;
    const nsLine = allWorkingDays.reduce((s, d) => s + (Number(d.tongNhanSuLine) || 0), 0);
    const nsNghi = allWorkingDays.reduce((s, d) => s + (Number(d.nhanSuNghi) || 0), 0);
    const tiLe = nsLine > 0 ? Number((((nsLine - nsNghi) / nsLine) * 100).toFixed(1)) : 100;

    result[monthlyIdx] = {
      ...result[monthlyIdx],
      congBepGa: cGa,
      congThoiVu: cTv,
      congRma: cRma,
      sanLuongBepGa: slGa,
      sanLuongRma: slRma,
      dinhMucSlTheoNs: dm,
      nsldTheoNgay: nsld,
      khsxNgay: khsx,
      tiLeHoanThanhKhsx: tiLeKhsx,
      tongNhanSuLine: nsLine,
      nhanSuNghi: nsNghi,
      tiLeDiLam: tiLe,
    };
  }

  return result;
}

/**
 * Generate full columns for a month for BG Matrix
 */
export function generateMonthBGMatrix(year: number, monthIndex0: number): ExcelMatrixBGColumn[] {
  // If Month 6 (June) and year 2026, return the exact initial dataset from Image 2 + Monthly total
  if (monthIndex0 === 5 && year === 2026) {
    const base = [...INITIAL_MATRIX_BG];
    // Check if month total exists
    if (!base.some(c => c.isMonthlyTotal)) {
      base.push({
        id: 'bg-month-total',
        label: 'TỔNG THÁNG 6',
        isMonthlyTotal: true,
        congBepGa: 0,
        congThoiVu: 0,
        congRma: 0,
        sanLuongBepGa: 0,
        sanLuongRma: 0,
        dinhMucSlTheoNs: 0,
        nsldTheoNgay: 0,
        khsxNgay: 0,
        tiLeHoanThanhKhsx: 0,
        tongNhanSuLine: 0,
        nhanSuNghi: 0,
        tiLeDiLam: 0,
      });
    }
    return recalculateBGMatrix(base);
  }

  const daysCount = getDaysInMonth(year, monthIndex0);
  const monthShort = MONTH_NAMES_SHORT[monthIndex0];
  const cols: ExcelMatrixBGColumn[] = [];
  const isNewInputMonth = monthIndex0 >= 8; // Tháng 9 trở đi là dữ liệu mới chạy tự động từ nhập liệu, khởi tạo bằng 0
  const isMonth9 = (year === 2026 && monthIndex0 === 8);
  const month9Cutoffs = [3, 10, 17, 24];
  const month9Labels: Record<number, string> = {
    3: 'W36 01 - 03/Sep',
    10: 'W37 04 - 10/Sep',
    17: 'W38 11 - 17/Sep',
    24: 'W39 18 - 24/Sep',
    30: 'W40 25 - 30/Sep',
  };

  let weekNum = 1;
  for (let day = 1; day <= daysCount; day++) {
    const dateObj = new Date(year, monthIndex0, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const isSunday = dayOfWeek === 0;
    const dayStr = String(day).padStart(2, '0');
    const label = `${dayStr}-${monthShort}`;
    const dateIso = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${dayStr}`;

    // All days are open online, never marked as OFF
    const baseGa = isNewInputMonth ? 0 : (4 + Math.round((day % 5) * 1.5 * 10) / 10);
    const baseTv = isNewInputMonth ? 0 : (3 + Math.round((day % 4) * 1.2 * 10) / 10);
    const baseRma = isNewInputMonth ? 0 : (day % 3 === 0 ? 3.5 : 0);
    const slGa = isNewInputMonth ? 0 : Math.round(baseGa * 14);
    const slRma = isNewInputMonth ? 0 : (baseRma > 0 ? 35 : 0);
    const totalCong = baseGa + baseTv + baseRma;
    const dm = Number((totalCong * 9.03).toFixed(1));
    const totalSl = slGa + slRma;
    const nsld = dm > 0 ? Number(((totalSl / dm) * 100).toFixed(1)) : 0;
    const nsLine = 8;
    const nsNghi = isNewInputMonth ? 0 : (day % 6 === 0 ? 1 : 0);
    const tiLe = 100;
    const baseKhsx = isNewInputMonth ? 0 : (700 + (day % 5) * 20);

    cols.push({
      id: `bg-${year}-${monthIndex0 + 1}-${dayStr}`,
      label,
      dateStr: dateIso,
      congBepGa: baseGa,
      congThoiVu: baseTv,
      congRma: baseRma,
      sanLuongBepGa: slGa,
      sanLuongRma: slRma,
      dinhMucSlTheoNs: dm,
      nsldTheoNgay: nsld,
      khsxNgay: baseKhsx,
      tiLeHoanThanhKhsx: baseKhsx > 0 ? Number(((totalSl / baseKhsx) * 100).toFixed(1)) : 0,
      tongNhanSuLine: nsLine,
      nhanSuNghi: nsNghi,
      tiLeDiLam: tiLe,
    });

    // Check cutoff
    const isCutoff = isMonth9 ? month9Cutoffs.includes(day) : isSunday;
    if (isCutoff) {
      const wLabel = isMonth9 ? (month9Labels[day] || `W${35 + weekNum}`) : `W${weekNum}`;
      cols.push({
        id: `bg-w${weekNum}-${monthIndex0 + 1}-${day}`,
        label: wLabel,
        isWeeklyTotal: true,
        congBepGa: 0,
        congThoiVu: 0,
        congRma: 0,
        sanLuongBepGa: 0,
        sanLuongRma: 0,
        dinhMucSlTheoNs: 0,
        nsldTheoNgay: 0,
        khsxNgay: 0,
        tiLeHoanThanhKhsx: 0,
        tongNhanSuLine: 0,
        nhanSuNghi: 0,
        tiLeDiLam: 0,
      });
      weekNum++;
    }
  }

  // If last day of month wasn't cutoff, still add a weekly column for remaining days
  const lastCol = cols[cols.length - 1];
  if (!lastCol.isWeeklyTotal) {
    const finalLabel = isMonth9 ? (month9Labels[daysCount] || `W40 25 - 30/Sep`) : `W${weekNum}`;
    cols.push({
      id: `bg-w${weekNum}-${monthIndex0 + 1}-final`,
      label: finalLabel,
      isWeeklyTotal: true,
      congBepGa: 0,
      congThoiVu: 0,
      congRma: 0,
      sanLuongBepGa: 0,
      sanLuongRma: 0,
      dinhMucSlTheoNs: 0,
      nsldTheoNgay: 0,
      khsxNgay: 0,
      tiLeHoanThanhKhsx: 0,
      tongNhanSuLine: 0,
      nhanSuNghi: 0,
      tiLeDiLam: 0,
    });
  }

  // Finally append Monthly Total column
  cols.push({
    id: `bg-month-total-${monthIndex0 + 1}`,
    label: `TỔNG T${monthIndex0 + 1}`,
    isMonthlyTotal: true,
    congBepGa: 0,
    congThoiVu: 0,
    congRma: 0,
    sanLuongBepGa: 0,
    sanLuongRma: 0,
    dinhMucSlTheoNs: 0,
    nsldTheoNgay: 0,
    khsxNgay: 0,
    tiLeHoanThanhKhsx: 0,
    tongNhanSuLine: 0,
    nhanSuNghi: 0,
    tiLeDiLam: 0,
  });

  return recalculateBGMatrix(cols);
}


/**
 * Recalculate all weekly columns and monthly total column for RO Matrix
 */
export function recalculateROMatrix(cols: ExcelMatrixROColumn[]): ExcelMatrixROColumn[] {
  const result = cols.map(c => {
    if (!c.isWeeklyTotal && !c.isMonthlyTotal) {
      return {
        ...c,
        nsldTheoNgay: sanitizePercentage(c.nsldTheoNgay),
        tiLeHoanThanhKhsx: sanitizePercentage(c.tiLeHoanThanhKhsx),
        tiLeDiLam: c.tiLeDiLam < 2 ? sanitizePercentage(c.tiLeDiLam) : Number(c.tiLeDiLam.toFixed(1))
      };
    }
    return { ...c };
  });
  let currentWeekDays: ExcelMatrixROColumn[] = [];
  const allWorkingDays: ExcelMatrixROColumn[] = [];

  for (let i = 0; i < result.length; i++) {
    const col = result[i];
    if (!col.isWeeklyTotal && !col.isMonthlyTotal) {
      if (!col.isOff) {
        currentWeekDays.push(col);
        allWorkingDays.push(col);
      }
    } else if (col.isWeeklyTotal) {
      const cCt = Number(currentWeekDays.reduce((s, d) => s + (Number(d.congChinhThuc) || 0), 0).toFixed(1));
      const cTv = Number(currentWeekDays.reduce((s, d) => s + (Number(d.congThoiVu) || 0), 0).toFixed(1));
      const sl = currentWeekDays.reduce((s, d) => s + (Number(d.sanLuongLineChinh) || 0), 0);
      const dm = Number(currentWeekDays.reduce((s, d) => s + (Number(d.dinhMucSlTheoNs) || 0), 0).toFixed(1));
      const nsld = dm > 0 ? Number(((sl / dm) * 100).toFixed(1)) : 0;
      const khsx = currentWeekDays.reduce((s, d) => s + (Number(d.khsxNgay) || 0), 0);
      const tiLeKhsx = khsx > 0 ? Number(((sl / khsx) * 100).toFixed(1)) : 0;
      const nsLine = currentWeekDays.reduce((s, d) => s + (Number(d.tongNhanSuLine) || 0), 0);
      const nsNghi = currentWeekDays.reduce((s, d) => s + (Number(d.nhanSuNghi) || 0), 0);
      const tiLe = nsLine > 0 ? Number((((nsLine - nsNghi) / nsLine) * 100).toFixed(1)) : 100;

      let rangeStr = col.weekRange;
      if (currentWeekDays.length > 0) {
        const firstDay = currentWeekDays[0];
        const lastDay = currentWeekDays[currentWeekDays.length - 1];
        const d1 = firstDay.label.split('-')[0];
        const d2 = lastDay.label.split('-')[0];
        const mStr = firstDay.label.split('-')[1] || '';
        rangeStr = `${d1} - ${d2}/${mStr}`;
      }

      result[i] = {
        ...col,
        weekRange: rangeStr,
        congChinhThuc: cCt,
        congThoiVu: cTv,
        sanLuongLineChinh: sl,
        dinhMucSlTheoNs: dm,
        nsldTheoNgay: nsld,
        khsxNgay: khsx,
        tiLeHoanThanhKhsx: tiLeKhsx,
        tongNhanSuLine: nsLine,
        nhanSuNghi: nsNghi,
        tiLeDiLam: tiLe,
      };
      currentWeekDays = [];
    }
  }

  // Monthly Total
  const monthlyIdx = result.findIndex(c => c.isMonthlyTotal);
  if (monthlyIdx >= 0) {
    const cCt = Number(allWorkingDays.reduce((s, d) => s + (Number(d.congChinhThuc) || 0), 0).toFixed(1));
    const cTv = Number(allWorkingDays.reduce((s, d) => s + (Number(d.congThoiVu) || 0), 0).toFixed(1));
    const sl = allWorkingDays.reduce((s, d) => s + (Number(d.sanLuongLineChinh) || 0), 0);
    const dm = Number(allWorkingDays.reduce((s, d) => s + (Number(d.dinhMucSlTheoNs) || 0), 0).toFixed(1));
    const nsld = dm > 0 ? Number(((sl / dm) * 100).toFixed(1)) : 0;
    const khsx = allWorkingDays.reduce((s, d) => s + (Number(d.khsxNgay) || 0), 0);
    const tiLeKhsx = khsx > 0 ? Number(((sl / khsx) * 100).toFixed(1)) : 0;
    const nsLine = allWorkingDays.reduce((s, d) => s + (Number(d.tongNhanSuLine) || 0), 0);
    const nsNghi = allWorkingDays.reduce((s, d) => s + (Number(d.nhanSuNghi) || 0), 0);
    const tiLe = nsLine > 0 ? Number((((nsLine - nsNghi) / nsLine) * 100).toFixed(1)) : 100;

    result[monthlyIdx] = {
      ...result[monthlyIdx],
      congChinhThuc: cCt,
      congThoiVu: cTv,
      sanLuongLineChinh: sl,
      dinhMucSlTheoNs: dm,
      nsldTheoNgay: nsld,
      khsxNgay: khsx,
      tiLeHoanThanhKhsx: tiLeKhsx,
      tongNhanSuLine: nsLine,
      nhanSuNghi: nsNghi,
      tiLeDiLam: tiLe,
    };
  }

  return result;
}

/**
 * Generate full columns for a month for RO Matrix
 */
export function generateMonthROMatrix(year: number, monthIndex0: number): ExcelMatrixROColumn[] {
  // If Month 6 (June) and year 2026, return exact dataset from Image 1 + Monthly total
  if (monthIndex0 === 5 && year === 2026) {
    const base = [...INITIAL_MATRIX_RO];
    if (!base.some(c => c.isMonthlyTotal)) {
      base.push({
        id: 'ro-month-total',
        label: 'TỔNG THÁNG 6',
        isMonthlyTotal: true,
        congChinhThuc: 0,
        congThoiVu: 0,
        sanLuongLineChinh: 0,
        dinhMucSlTheoNs: 0,
        nsldTheoNgay: 0,
        khsxNgay: 0,
        tiLeHoanThanhKhsx: 0,
        tongNhanSuLine: 0,
        nhanSuNghi: 0,
        tiLeDiLam: 0,
      });
    }
    return recalculateROMatrix(base);
  }

  const daysCount = getDaysInMonth(year, monthIndex0);
  const monthShort = MONTH_NAMES_SHORT[monthIndex0];
  const cols: ExcelMatrixROColumn[] = [];
  const isNewInputMonth = monthIndex0 >= 8; // Tháng 9 trở đi là dữ liệu mới chạy tự động từ nhập liệu, khởi tạo bằng 0
  const isMonth9 = (year === 2026 && monthIndex0 === 8);
  const month9Cutoffs = [3, 10, 17, 24];
  const month9Labels: Record<number, string> = {
    3: 'W36 01 - 03/Sep',
    10: 'W37 04 - 10/Sep',
    17: 'W38 11 - 17/Sep',
    24: 'W39 18 - 24/Sep',
    30: 'W40 25 - 30/Sep',
  };

  let weekNum = 1;
  for (let day = 1; day <= daysCount; day++) {
    const dateObj = new Date(year, monthIndex0, day);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const dayStr = String(day).padStart(2, '0');
    const label = `${dayStr}-${monthShort}`;
    const dateIso = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${dayStr}`;

    // All days are open online, never marked as OFF
    const baseCt = isNewInputMonth ? 0 : (54 + (day % 4));
    const baseTv = isNewInputMonth ? 0 : (15 + (day % 3));
    const totalCong = baseCt + baseTv;
    const dm = Number((totalCong * 9.03).toFixed(1)); // Công thức chuẩn Excel nhóm RO: = (Công CT + Công TV) * 9.03
    const sl = isNewInputMonth ? 0 : (680 + (day % 7) * 25);
    const nsld = dm > 0 ? Number(((sl / dm) * 100).toFixed(1)) : 0;
    const khsx = isNewInputMonth ? 0 : (700 + (day % 5) * 20);
    const tiLeKhsx = khsx > 0 ? Number(((sl / khsx) * 100).toFixed(1)) : 0;
    const nsLine = 55;
    const nsNghi = isNewInputMonth ? 1 : (day % 5 === 0 ? 3 : 1);
    const tiLe = 98.2;

    cols.push({
      id: `ro-${year}-${monthIndex0 + 1}-${dayStr}`,
      label,
      dateStr: dateIso,
      congChinhThuc: baseCt,
      congThoiVu: baseTv,
      sanLuongLineChinh: sl,
      dinhMucSlTheoNs: dm,
      nsldTheoNgay: nsld,
      khsxNgay: khsx,
      tiLeHoanThanhKhsx: tiLeKhsx,
      tongNhanSuLine: nsLine,
      nhanSuNghi: nsNghi,
      tiLeDiLam: tiLe,
    });

    const isCutoff = isMonth9 ? month9Cutoffs.includes(day) : isSunday;
    if (isCutoff) {
      const wLabel = isMonth9 ? (month9Labels[day] || `W${35 + weekNum}`) : `W${weekNum}/T${monthIndex0 + 1}`;
      cols.push({
        id: `ro-w${weekNum}-${monthIndex0 + 1}-${day}`,
        label: wLabel,
        isWeeklyTotal: true,
        congChinhThuc: 0,
        congThoiVu: 0,
        sanLuongLineChinh: 0,
        dinhMucSlTheoNs: 0,
        nsldTheoNgay: 0,
        khsxNgay: 0,
        tiLeHoanThanhKhsx: 0,
        tongNhanSuLine: 0,
        nhanSuNghi: 0,
        tiLeDiLam: 0,
      });
      weekNum++;
    }
  }

  const lastCol = cols[cols.length - 1];
  if (!lastCol.isWeeklyTotal) {
    const finalLabel = isMonth9 ? (month9Labels[daysCount] || `W40 25 - 30/Sep`) : `W${weekNum}/T${monthIndex0 + 1}`;
    cols.push({
      id: `ro-w${weekNum}-${monthIndex0 + 1}-final`,
      label: finalLabel,
      isWeeklyTotal: true,
      congChinhThuc: 0,
      congThoiVu: 0,
      sanLuongLineChinh: 0,
      dinhMucSlTheoNs: 0,
      nsldTheoNgay: 0,
      khsxNgay: 0,
      tiLeHoanThanhKhsx: 0,
      tongNhanSuLine: 0,
      nhanSuNghi: 0,
      tiLeDiLam: 0,
    });
  }

  cols.push({
    id: `ro-month-total-${monthIndex0 + 1}`,
    label: `TỔNG T${monthIndex0 + 1}`,
    isMonthlyTotal: true,
    congChinhThuc: 0,
    congThoiVu: 0,
    sanLuongLineChinh: 0,
    dinhMucSlTheoNs: 0,
    nsldTheoNgay: 0,
    khsxNgay: 0,
    tiLeHoanThanhKhsx: 0,
    tongNhanSuLine: 0,
    nhanSuNghi: 0,
    tiLeDiLam: 0,
  });

  return recalculateROMatrix(cols);
}

/**
 * Extract integer day number (1..31) from a matrix column
 */
export function getDayNumberFromCol(col: { dateStr?: string; label: string }): number {
  if (col.dateStr) {
    const parts = col.dateStr.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      if (!isNaN(d)) return d;
    }
  }
  const match = col.label.match(/^(\d{1,2})/);
  if (match) {
    const d = parseInt(match[1], 10);
    if (!isNaN(d)) return d;
  }
  return 0;
}

/**
 * Check whether a matrix column represents a Sunday
 */
export function isColumnSunday(
  col: { isWeeklyTotal?: boolean; isMonthlyTotal?: boolean; dateStr?: string; label: string },
  year?: number,
  monthIndex0?: number
): boolean {
  if (col.isWeeklyTotal || col.isMonthlyTotal) return false;
  if (col.dateStr) {
    const d = new Date(col.dateStr);
    if (!isNaN(d.getTime())) {
      return d.getDay() === 0;
    }
  }
  const day = getDayNumberFromCol(col);
  if (day > 0) {
    const parts = col.label.split('-');
    if (parts.length === 2) {
      const mStr = parts[1].trim().toLowerCase();
      const mIdx = MONTH_NAMES_SHORT.findIndex(m => m.toLowerCase() === mStr);
      if (mIdx >= 0) {
        const y = year || 2026;
        return new Date(y, mIdx, day).getDay() === 0;
      }
    }
    if (year !== undefined && monthIndex0 !== undefined) {
      return new Date(year, monthIndex0, day).getDay() === 0;
    }
  }
  return false;
}

/**
 * Find all day numbers that currently serve as week cutoffs in a matrix
 */
export function getCutoffDaysFromMatrix(cols: (ExcelMatrixBGColumn | ExcelMatrixROColumn)[]): number[] {
  const cutoffs: number[] = [];
  for (let i = 0; i < cols.length; i++) {
    if (cols[i].isWeeklyTotal) {
      // Look back for the preceding day column
      for (let j = i - 1; j >= 0; j--) {
        if (!cols[j].isWeeklyTotal && !cols[j].isMonthlyTotal) {
          const d = getDayNumberFromCol(cols[j]);
          if (d > 0 && !cutoffs.includes(d)) {
            cutoffs.push(d);
          }
          break;
        }
      }
    }
  }
  return cutoffs.sort((a, b) => a - b);
}

/**
 * Calculate ISO-8601 week number for a given date
 * (e.g. 17/09/2026 is Week 38 of the year)
 */
export function getWeekOfYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Sunday = 7, Monday = 1
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Given an anchor day in a month, generate recurring cutoff days every 7 days (6 days between each cutoff)
 * For example, if anchor is day 17 (Thursday) in a 30-day month:
 * Backwards: 10, 3
 * Anchor: 17
 * Forwards: 24
 * Returns [3, 10, 17, 24]
 */
export function calculateRecurringCutoffs(anchorDay: number, totalDaysInMonth: number): number[] {
  if (anchorDay < 1 || anchorDay > totalDaysInMonth) return [anchorDay];
  const cutoffs: number[] = [];
  // Go backwards
  let d = anchorDay;
  while (d >= 1) {
    cutoffs.push(d);
    d -= 7;
  }
  // Go forwards
  d = anchorDay + 7;
  while (d <= totalDaysInMonth) {
    cutoffs.push(d);
    d += 7;
  }
  return cutoffs.sort((a, b) => a - b);
}

/**
 * Get all cutoff days for a specific day of week (e.g. all Thursdays) in the month
 * dayOfWeek: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
 */
export function getCutoffsByDayOfWeek(year: number, monthIndex0: number, dayOfWeek: number): number[] {
  const daysCount = getDaysInMonth(year, monthIndex0);
  const cutoffs: number[] = [];
  for (let day = 1; day <= daysCount; day++) {
    const d = new Date(year, monthIndex0, day);
    if (d.getDay() === dayOfWeek) {
      cutoffs.push(day);
    }
  }
  return cutoffs;
}

export type WeekLabelMode = 'year' | 'year_month' | 'month';

/**
 * Get all Sundays in the given month as default cutoff days
 */
export function getDefaultSundayCutoffs(year: number, monthIndex0: number): number[] {
  return getCutoffsByDayOfWeek(year, monthIndex0, 0);
}

/**
 * Restructure the BG matrix by positioning week cutoffs at specified days
 * (e.g. choosing day 5/09 calculates week 1 from day 1 through day 5/09)
 */
export function applyWeekCutoffsToBGMatrix(
  cols: ExcelMatrixBGColumn[],
  cutoffDays: number[],
  year: number,
  monthIndex0: number,
  weekLabelMode: WeekLabelMode = 'year'
): ExcelMatrixBGColumn[] {
  const dayCols = cols.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal);
  if (dayCols.length === 0) return cols;

  const totalDaysInMonth = getDaysInMonth(year, monthIndex0);
  const validCutoffs = Array.from(new Set(cutoffDays))
    .filter(d => typeof d === 'number' && d >= 1 && d <= totalDaysInMonth)
    .sort((a, b) => a - b);

  const newCols: ExcelMatrixBGColumn[] = [];
  let weekNum = 1;
  let lastCutoffProcessed = 0;

  for (let i = 0; i < dayCols.length; i++) {
    const dayCol = dayCols[i];
    newCols.push(dayCol);
    const dayNum = getDayNumberFromCol(dayCol);

    if (validCutoffs.includes(dayNum)) {
      const cutoffDate = new Date(year, monthIndex0, dayNum);
      const yearWeek = getWeekOfYear(cutoffDate);
      let label = `W${yearWeek}`;
      if (weekLabelMode === 'month') {
        label = `W${weekNum}`;
      } else if (weekLabelMode === 'year_month') {
        label = `W${yearWeek} (T${weekNum})`;
      }

      newCols.push({
        id: `bg-w${weekNum}-${monthIndex0 + 1}-${dayNum}`,
        label,
        isWeeklyTotal: true,
        congBepGa: 0,
        congThoiVu: 0,
        congRma: 0,
        sanLuongBepGa: 0,
        sanLuongRma: 0,
        dinhMucSlTheoNs: 0,
        nsldTheoNgay: 0,
        khsxNgay: 0,
        tiLeHoanThanhKhsx: 0,
        tongNhanSuLine: 0,
        nhanSuNghi: 0,
        tiLeDiLam: 0,
      });
      lastCutoffProcessed = dayNum;
      weekNum++;
    }
  }

  // If there are remaining days after the last cutoff, add a final week column for the remainder
  const lastDayCol = dayCols[dayCols.length - 1];
  const lastDayNum = getDayNumberFromCol(lastDayCol);
  if (lastCutoffProcessed < lastDayNum && validCutoffs.length > 0) {
    const lastDate = new Date(year, monthIndex0, lastDayNum);
    const lastYearWeek = getWeekOfYear(lastDate);
    let label = `W${lastYearWeek}`;
    if (weekLabelMode === 'month') {
      label = `W${weekNum}`;
    } else if (weekLabelMode === 'year_month') {
      label = `W${lastYearWeek} (T${weekNum})`;
    }

    newCols.push({
      id: `bg-w${weekNum}-${monthIndex0 + 1}-${lastDayNum}`,
      label,
      isWeeklyTotal: true,
      congBepGa: 0,
      congThoiVu: 0,
      congRma: 0,
      sanLuongBepGa: 0,
      sanLuongRma: 0,
      dinhMucSlTheoNs: 0,
      nsldTheoNgay: 0,
      khsxNgay: 0,
      tiLeHoanThanhKhsx: 0,
      tongNhanSuLine: 0,
      nhanSuNghi: 0,
      tiLeDiLam: 0,
    });
  }

  // Preserve Monthly Total
  const existingMonthly = cols.find(c => c.isMonthlyTotal);
  if (existingMonthly) {
    newCols.push(existingMonthly);
  } else {
    newCols.push({
      id: `bg-month-total-${monthIndex0 + 1}`,
      label: `TỔNG T${monthIndex0 + 1}`,
      isMonthlyTotal: true,
      congBepGa: 0,
      congThoiVu: 0,
      congRma: 0,
      sanLuongBepGa: 0,
      sanLuongRma: 0,
      dinhMucSlTheoNs: 0,
      nsldTheoNgay: 0,
      khsxNgay: 0,
      tiLeHoanThanhKhsx: 0,
      tongNhanSuLine: 0,
      nhanSuNghi: 0,
      tiLeDiLam: 0,
    });
  }

  return recalculateBGMatrix(newCols);
}

/**
 * Restructure the RO matrix by positioning week cutoffs at specified days
 * (e.g. choosing day 5/09 calculates week 1 from day 1 through day 5/09)
 */
export function applyWeekCutoffsToROMatrix(
  cols: ExcelMatrixROColumn[],
  cutoffDays: number[],
  year: number,
  monthIndex0: number,
  weekLabelMode: WeekLabelMode = 'year'
): ExcelMatrixROColumn[] {
  const dayCols = cols.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal);
  if (dayCols.length === 0) return cols;

  const totalDaysInMonth = getDaysInMonth(year, monthIndex0);
  const validCutoffs = Array.from(new Set(cutoffDays))
    .filter(d => typeof d === 'number' && d >= 1 && d <= totalDaysInMonth)
    .sort((a, b) => a - b);

  const newCols: ExcelMatrixROColumn[] = [];
  let weekNum = 1;
  let lastCutoffProcessed = 0;

  for (let i = 0; i < dayCols.length; i++) {
    const dayCol = dayCols[i];
    newCols.push(dayCol);
    const dayNum = getDayNumberFromCol(dayCol);

    if (validCutoffs.includes(dayNum)) {
      const cutoffDate = new Date(year, monthIndex0, dayNum);
      const yearWeek = getWeekOfYear(cutoffDate);
      let label = `W${yearWeek}`;
      if (weekLabelMode === 'month') {
        label = `W${weekNum}/T${monthIndex0 + 1}`;
      } else if (weekLabelMode === 'year_month') {
        label = `W${yearWeek}/T${monthIndex0 + 1} (T${weekNum})`;
      }

      newCols.push({
        id: `ro-w${weekNum}-${monthIndex0 + 1}-${dayNum}`,
        label,
        isWeeklyTotal: true,
        congChinhThuc: 0,
        congThoiVu: 0,
        sanLuongLineChinh: 0,
        dinhMucSlTheoNs: 0,
        nsldTheoNgay: 0,
        khsxNgay: 0,
        tiLeHoanThanhKhsx: 0,
        tongNhanSuLine: 0,
        nhanSuNghi: 0,
        tiLeDiLam: 0,
      });
      lastCutoffProcessed = dayNum;
      weekNum++;
    }
  }

  // If there are remaining days after the last cutoff, add a final week column
  const lastDayCol = dayCols[dayCols.length - 1];
  const lastDayNum = getDayNumberFromCol(lastDayCol);
  if (lastCutoffProcessed < lastDayNum && validCutoffs.length > 0) {
    const lastDate = new Date(year, monthIndex0, lastDayNum);
    const lastYearWeek = getWeekOfYear(lastDate);
    let label = `W${lastYearWeek}`;
    if (weekLabelMode === 'month') {
      label = `W${weekNum}/T${monthIndex0 + 1}`;
    } else if (weekLabelMode === 'year_month') {
      label = `W${lastYearWeek}/T${monthIndex0 + 1} (T${weekNum})`;
    }

    newCols.push({
      id: `ro-w${weekNum}-${monthIndex0 + 1}-${lastDayNum}`,
      label,
      isWeeklyTotal: true,
      congChinhThuc: 0,
      congThoiVu: 0,
      sanLuongLineChinh: 0,
      dinhMucSlTheoNs: 0,
      nsldTheoNgay: 0,
      khsxNgay: 0,
      tiLeHoanThanhKhsx: 0,
      tongNhanSuLine: 0,
      nhanSuNghi: 0,
      tiLeDiLam: 0,
    });
  }

  // Preserve Monthly Total
  const existingMonthly = cols.find(c => c.isMonthlyTotal);
  if (existingMonthly) {
    newCols.push(existingMonthly);
  } else {
    newCols.push({
      id: `ro-month-total-${monthIndex0 + 1}`,
      label: `TỔNG T${monthIndex0 + 1}`,
      isMonthlyTotal: true,
      congChinhThuc: 0,
      congThoiVu: 0,
      sanLuongLineChinh: 0,
      dinhMucSlTheoNs: 0,
      nsldTheoNgay: 0,
      khsxNgay: 0,
      tiLeHoanThanhKhsx: 0,
      tongNhanSuLine: 0,
      nhanSuNghi: 0,
      tiLeDiLam: 0,
    });
  }

  return recalculateROMatrix(newCols);
}

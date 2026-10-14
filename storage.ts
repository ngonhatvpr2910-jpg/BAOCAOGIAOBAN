import { 
  DailyDCBGRecord, 
  DailyDCRORecord, 
  PushAlert, 
  ThresholdConfig, 
  User, 
  MonthlyHistoryRecord,
  WeeklyDCBGRecord,
  MonthlyNSLDDCBGRecord,
  DailyNSLDRMARecord,
  ExcelMatrixROColumn,
  ExcelMatrixBGColumn,
  Slide1NSLDData,
  Slide2QualityData,
  SlideDefectCostData,
  Slide4ProductionTargetData,
  Slide5ProductionPlanData,
  Slide6TaskPlanData,
  GlobalNormsConfig,
  LockedMonthInfo,
} from './types';
import { 
  INITIAL_DCBG_RECORDS, 
  INITIAL_DCRO_RECORDS, 
  DEFAULT_THRESHOLDS, 
  INITIAL_USERS, 
  MONTHLY_HISTORY,
  INITIAL_WEEKLY_DCBG,
  INITIAL_MONTHLY_NSLD_DCBG,
  INITIAL_DAILY_NSLD_RMA,
  INITIAL_MATRIX_RO,
  INITIAL_MATRIX_BG,
  INITIAL_SLIDE1_NSLD,
  INITIAL_SLIDE2_QUALITY,
  INITIAL_SLIDE3_DEFECT_COST,
  INITIAL_SLIDE4_PRODUCTION_TARGET,
  INITIAL_SLIDE5_PRODUCTION_PLAN,
  INITIAL_SLIDE6_TASK_PLAN,
  DEFAULT_GLOBAL_NORMS,
} from './initialData';
import { 
  generateMonthBGMatrix, 
  generateMonthROMatrix,
  recalculateBGMatrix,
  recalculateROMatrix,
} from './matrixGenerator';
import { synchronizeSlide3Data } from './defectCostSyncService';

const STORAGE_KEYS = {
  DCBG: 'pxlr_dcbg_records_v1',
  DCRO: 'pxlr_dcro_records_v1',
  ALERTS: 'pxlr_push_alerts_v1',
  THRESHOLDS: 'pxlr_thresholds_v1',
  CURRENT_USER: 'pxlr_current_user_v1',
  MONTHLY_HISTORY: 'pxlr_monthly_history_v1',
  WEEKLY_DCBG: 'pxlr_weekly_dcbg_v1',
  MONTHLY_NSLD_DCBG: 'pxlr_monthly_nsld_dcbg_v1',
  DAILY_NSLD_RMA: 'pxlr_daily_nsld_rma_v1',
  MATRIX_RO: 'pxlr_matrix_ro_v1',
  MATRIX_BG: 'pxlr_matrix_bg_v1',
  WEEK_LABEL_MODE: 'pxlr_week_label_mode_v1',
  SLIDE1_NSLD: 'pxlr_slide1_nsld_v1',
  SLIDE2_QUALITY: 'pxlr_slide2_quality_v1',
  SLIDE3_DEFECT_COST: 'pxlr_slide3_defect_cost_v2',
  SLIDE4_PRODUCTION_TARGET: 'pxlr_slide4_production_target_v10',
  SLIDE5_PRODUCTION_PLAN: 'pxlr_slide5_production_plan_v1',
  SLIDE6_TASK_PLAN: 'pxlr_slide6_task_plan_v1',
  GLOBAL_NORMS: 'pxlr_global_norms_v1',
  LOCKED_MONTHS: 'pxlr_locked_months_v1',
};


export const StorageService = {
  getDCBGRecords(): DailyDCBGRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DCBG);
      if (!data) return INITIAL_DCBG_RECORDS;
      const parsed: DailyDCBGRecord[] = JSON.parse(data);
      // Filter out legacy mock records if present
      const cleaned = parsed.filter(r => !['dcbg-01', 'dcbg-02', 'dcbg-03'].includes(r.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.DCBG, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return INITIAL_DCBG_RECORDS;
    }
  },

  saveDCBGRecords(records: DailyDCBGRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.DCBG, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save DCBG records to local storage', e);
    }
  },

  getDCRORecords(): DailyDCRORecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DCRO);
      if (!data) return INITIAL_DCRO_RECORDS;
      const parsed: DailyDCRORecord[] = JSON.parse(data);
      // Filter out legacy mock records if present
      const cleaned = parsed.filter(r => !['dcro-01', 'dcro-02', 'dcro-03'].includes(r.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.DCRO, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return INITIAL_DCRO_RECORDS;
    }
  },

  saveDCRORecords(records: DailyDCRORecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.DCRO, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save DCRO records to local storage', e);
    }
  },

  getAlerts(): PushAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAlerts(alerts: PushAlert[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error('Failed to save alerts to local storage', e);
    }
  },

  getThresholds(): ThresholdConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
      return data ? JSON.parse(data) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  },

  saveThresholds(thresholds: ThresholdConfig) {
    try {
      localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(thresholds));
    } catch (e) {
      console.error('Failed to save thresholds', e);
    }
  },

  getCurrentUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        const parsed = JSON.parse(data);
        const matched = INITIAL_USERS.find(u => u.id === parsed.id || u.role === parsed.role);
        if (matched) return matched;
      }
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  },

  saveCurrentUser(user: User) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  },

  getMonthlyHistory(): MonthlyHistoryRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MONTHLY_HISTORY);
      return data ? JSON.parse(data) : MONTHLY_HISTORY;
    } catch {
      return MONTHLY_HISTORY;
    }
  },

  saveMonthlyHistory(history: MonthlyHistoryRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save monthly history', e);
    }
  },

  getWeeklyDCBG(): WeeklyDCBGRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_DCBG);
      return data ? JSON.parse(data) : INITIAL_WEEKLY_DCBG;
    } catch {
      return INITIAL_WEEKLY_DCBG;
    }
  },

  saveWeeklyDCBG(records: WeeklyDCBGRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_DCBG, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save weekly DCBG data', e);
    }
  },

  getMonthlyNSLDDCBG(): MonthlyNSLDDCBGRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MONTHLY_NSLD_DCBG);
      return data ? JSON.parse(data) : INITIAL_MONTHLY_NSLD_DCBG;
    } catch {
      return INITIAL_MONTHLY_NSLD_DCBG;
    }
  },

  saveMonthlyNSLDDCBG(records: MonthlyNSLDDCBGRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_NSLD_DCBG, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save monthly NSLD DCBG', e);
    }
  },

  getDailyNSLDRMA(): DailyNSLDRMARecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_NSLD_RMA);
      return data ? JSON.parse(data) : INITIAL_DAILY_NSLD_RMA;
    } catch {
      return INITIAL_DAILY_NSLD_RMA;
    }
  },

  saveDailyNSLDRMA(records: DailyNSLDRMARecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_NSLD_RMA, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save daily NSLD RMA', e);
    }
  },

  getMatrixRO(): ExcelMatrixROColumn[] {
    return this.getMatrixROForMonth(2026, 5); // default month 6 (index 5)
  },

  getMatrixROForMonth(year: number, monthIndex0: number): ExcelMatrixROColumn[] {
    try {
      const key = `${STORAGE_KEYS.MATRIX_RO}_${year}_${monthIndex0 + 1}`;
      const dataStr = localStorage.getItem(key);
      let parsed: ExcelMatrixROColumn[] | null = null;
      if (dataStr) {
        parsed = JSON.parse(dataStr);
      } else if (monthIndex0 === 5 && year === 2026) {
        const legacy = localStorage.getItem(STORAGE_KEYS.MATRIX_RO);
        if (legacy) parsed = JSON.parse(legacy);
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        let changed = false;

        // Only run legacy isOff migration for historical June (monthIndex0 === 5)
        if (monthIndex0 === 5 && year === 2026) {
          parsed = parsed.map((col) => {
            if (col.isOff) {
              changed = true;
              const baseCt = 54;
              const baseTv = 15;
              const sl = 680;
              const dm = Number(((baseCt + baseTv) * 9.03).toFixed(3));
              const nsld = dm > 0 ? Number(((sl / dm) * 100).toFixed(1)) : 0;
              const khsx = 700;
              const tiLeKhsx = Number(((sl / khsx) * 100).toFixed(1));
              const nsLine = 55;
              const nsNghi = 1;
              const tiLe = Number((((nsLine - nsNghi) / nsLine) * 100).toFixed(1));
              return {
                ...col,
                isOff: false,
                congChinhThuc: col.congChinhThuc ?? baseCt,
                congThoiVu: col.congThoiVu ?? baseTv,
                sanLuongLineChinh: col.sanLuongLineChinh ?? sl,
                dinhMucSlTheoNs: col.dinhMucSlTheoNs ?? dm,
                nsldTheoNgay: col.nsldTheoNgay ?? nsld,
                khsxNgay: col.khsxNgay ?? khsx,
                tiLeHoanThanhKhsx: col.tiLeHoanThanhKhsx ?? tiLeKhsx,
                tongNhanSuLine: col.tongNhanSuLine ?? nsLine,
                nhanSuNghi: col.nhanSuNghi ?? nsNghi,
                tiLeDiLam: col.tiLeDiLam ?? tiLe,
              };
            }
            return col;
          });
        }

        if (changed) {
          parsed = recalculateROMatrix(parsed);
          localStorage.setItem(key, JSON.stringify(parsed));
        }
        return parsed;
      }
      return generateMonthROMatrix(year, monthIndex0);
    } catch {
      return generateMonthROMatrix(year, monthIndex0);
    }
  },

  saveMatrixRO(cols: ExcelMatrixROColumn[]) {
    this.saveMatrixROForMonth(2026, 5, cols);
  },

  saveMatrixROForMonth(year: number, monthIndex0: number, cols: ExcelMatrixROColumn[]) {
    try {
      const key = `${STORAGE_KEYS.MATRIX_RO}_${year}_${monthIndex0 + 1}`;
      localStorage.setItem(key, JSON.stringify(cols));
      if (monthIndex0 === 5 && year === 2026) {
        localStorage.setItem(STORAGE_KEYS.MATRIX_RO, JSON.stringify(cols));
      }
    } catch (e) {
      console.error('Failed to save matrix RO data', e);
    }
  },

  getMatrixBG(): ExcelMatrixBGColumn[] {
    return this.getMatrixBGForMonth(2026, 5); // default month 6 (index 5)
  },

  getMatrixBGForMonth(year: number, monthIndex0: number): ExcelMatrixBGColumn[] {
    try {
      const key = `${STORAGE_KEYS.MATRIX_BG}_${year}_${monthIndex0 + 1}`;
      const dataStr = localStorage.getItem(key);
      let parsed: ExcelMatrixBGColumn[] | null = null;
      if (dataStr) {
        parsed = JSON.parse(dataStr);
      } else if (monthIndex0 === 5 && year === 2026) {
        const legacy = localStorage.getItem(STORAGE_KEYS.MATRIX_BG);
        if (legacy) parsed = JSON.parse(legacy);
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        let changed = false;



        parsed = parsed.map((col) => {
          let updatedCol = { ...col };
          if (updatedCol.khsxNgay === undefined || updatedCol.tiLeHoanThanhKhsx === undefined) {
            changed = true;
            const initMatch = INITIAL_MATRIX_BG.find(ib => ib.id === col.id || ib.label === col.label);
            if (initMatch) {
              updatedCol.khsxNgay = initMatch.khsxNgay;
              updatedCol.tiLeHoanThanhKhsx = initMatch.tiLeHoanThanhKhsx;
            } else {
              updatedCol.khsxNgay = col.isWeeklyTotal || col.isMonthlyTotal ? 0 : 720;
              updatedCol.tiLeHoanThanhKhsx = 100.0;
            }
          }
          if (year === 2026 && monthIndex0 === 9) {
            const dayNum = parseInt(updatedCol.label.split('-')[0], 10);
            if ((!isNaN(dayNum) && dayNum >= 1 && dayNum <= 11) || updatedCol.label.includes('W41')) {
              if (Number(updatedCol.sanLuongRma) > 0 || Number(updatedCol.congRma) > 0) {
                changed = true;
                updatedCol.sanLuongRma = 0;
                updatedCol.congRma = 0;
              }
            }
          }
          if (updatedCol.isOff && monthIndex0 === 5 && year === 2026) {
            changed = true;
            const baseGa = 5.0;
            const baseTv = 4.0;
            const baseRma = 0;
            const totalCong = baseGa + baseTv + baseRma;
            const dm = Number((totalCong * 9.03).toFixed(3));
            const slGa = 70;
            const slRma = 0;
            const totalSl = slGa + slRma;
            const nsld = dm > 0 ? Number(((totalSl / dm) * 100).toFixed(1)) : 100;
            const nsLine = 8;
            const nsNghi = 0;
            const tiLe = 100;
            updatedCol = {
              ...updatedCol,
              isOff: false,
              congBepGa: updatedCol.congBepGa ?? baseGa,
              congThoiVu: updatedCol.congThoiVu ?? baseTv,
              congRma: updatedCol.congRma ?? baseRma,
              sanLuongBepGa: updatedCol.sanLuongBepGa ?? slGa,
              sanLuongRma: updatedCol.sanLuongRma ?? slRma,
              dinhMucSlTheoNs: updatedCol.dinhMucSlTheoNs ?? dm,
              nsldTheoNgay: updatedCol.nsldTheoNgay ?? nsld,
              tongNhanSuLine: updatedCol.tongNhanSuLine ?? nsLine,
              nhanSuNghi: updatedCol.nhanSuNghi ?? nsNghi,
              tiLeDiLam: updatedCol.tiLeDiLam ?? tiLe,
            };
          }
          return updatedCol;
        });

        if (changed) {
          parsed = recalculateBGMatrix(parsed);
          localStorage.setItem(key, JSON.stringify(parsed));
        }
        return parsed;
      }
      return generateMonthBGMatrix(year, monthIndex0);
    } catch {
      return generateMonthBGMatrix(year, monthIndex0);
    }
  },

  saveMatrixBG(cols: ExcelMatrixBGColumn[]) {
    this.saveMatrixBGForMonth(2026, 5, cols);
  },

  saveMatrixBGForMonth(year: number, monthIndex0: number, cols: ExcelMatrixBGColumn[]) {
    try {
      const key = `${STORAGE_KEYS.MATRIX_BG}_${year}_${monthIndex0 + 1}`;
      localStorage.setItem(key, JSON.stringify(cols));
      if (monthIndex0 === 5 && year === 2026) {
        localStorage.setItem(STORAGE_KEYS.MATRIX_BG, JSON.stringify(cols));
      }
    } catch (e) {
      console.error('Failed to save matrix BG data', e);
    }
  },

  getWeekLabelMode(): 'year' | 'year_month' | 'month' {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.WEEK_LABEL_MODE);
      if (val === 'year' || val === 'year_month' || val === 'month') return val;
    } catch {}
    return 'year'; // Default to year-based week calculation as requested (e.g. W38)
  },

  saveWeekLabelMode(mode: 'year' | 'year_month' | 'month') {
    try {
      localStorage.setItem(STORAGE_KEYS.WEEK_LABEL_MODE, mode);
    } catch {}
  },

  exportFullBackup() {
    return {
      dcbg: this.getDCBGRecords(),
      dcro: this.getDCRORecords(),
      thresholds: this.getThresholds(),
      norms: this.getGlobalNorms(),
      exportDate: new Date().toISOString(),
      version: '1.1.0',
    };
  },

  importBackup(backupData: any): boolean {
    try {
      if (backupData && Array.isArray(backupData.dcbg) && Array.isArray(backupData.dcro)) {
        this.saveDCBGRecords(backupData.dcbg);
        this.saveDCRORecords(backupData.dcro);
        if (backupData.thresholds) {
          this.saveThresholds(backupData.thresholds);
        }
        if (backupData.norms) {
          this.saveGlobalNorms(backupData.norms);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getSlide1NSLD(): Slide1NSLDData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIDE1_NSLD);
      if (data) {
        const parsed: Slide1NSLDData = JSON.parse(data);
        if (parsed.subTitle === 'So Sánh NSLĐ Tháng' || !parsed.subTitle) {
          parsed.subTitle = 'Năng Suất';
        }
        const HISTORICAL_ITEM_IDS = new Set([
          'pxlr-w35', 'ro-w35', 'bg-w35',
          'pxlr-m06', 'pxlr-m07', 'pxlr-m08', 'pxlr-m09',
          'ro-m07', 'ro-m08',
          'bg-m07', 'bg-m08',
        ]);
        const isHistoricalItem = (id: string) => HISTORICAL_ITEM_IDS.has(id);
        // Helper to ensure all weeks from INITIAL are present in stored data, plus new ones
        const ensureAllWeeks = (stored: any[], initial: any[], prefix: string) => {
          const combined = [...stored];
          const storedIds = new Set(stored.map(i => i.id));
          
          initial.forEach(initItem => {
            if (!storedIds.has(initItem.id)) {
              combined.push(initItem);
            }
          });
          
          return combined.sort((a, b) => {
            const getNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
            return getNum(a.label) - getNum(b.label);
          });
        };

        // Helper to ensure all months from INITIAL are present in stored data
        const ensureAllMonths = (stored: any[], initial: any[], prefix: string) => {
          const combined = [...(stored || [])];
          const storedLabels = new Set(combined.map(i => i.label));
          
          initial.forEach(initItem => {
            if (!storedLabels.has(initItem.label)) {
              combined.push(initItem);
            }
          });

          // Ensure Tháng 10 is definitely present
          if (!combined.some(i => i.label === 'Tháng 10')) {
            combined.push({ id: `${prefix}-m10`, label: 'Tháng 10', value: 0 });
          }
          
          return combined.sort((a, b) => {
            const getNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
            return getNum(a.label) - getNum(b.label);
          });
        };

        parsed.pxlr.weekly = ensureAllWeeks(parsed.pxlr.weekly, INITIAL_SLIDE1_NSLD.pxlr.weekly, 'pxlr');
        parsed.ro.weekly = ensureAllWeeks(parsed.ro.weekly, INITIAL_SLIDE1_NSLD.ro.weekly, 'ro');
        parsed.bg.weekly = ensureAllWeeks(parsed.bg.weekly, INITIAL_SLIDE1_NSLD.bg.weekly, 'bg');

        parsed.pxlr.monthly = ensureAllMonths(parsed.pxlr.monthly, INITIAL_SLIDE1_NSLD.pxlr.monthly, 'pxlr');
        parsed.ro.monthly = ensureAllMonths(parsed.ro.monthly, INITIAL_SLIDE1_NSLD.ro.monthly, 'ro');
        parsed.bg.monthly = ensureAllMonths(parsed.bg.monthly, INITIAL_SLIDE1_NSLD.bg.monthly, 'bg');

        // Fix historical baseline values (W32-W35 only)
        const fixValues = (items: any[], prefix: string, values: Record<string, number>) => {
          return items.map(w => {
            const weekId = w.id.replace(`${prefix}-`, '');
            if (['w32', 'w33', 'w34', 'w35'].includes(weekId) && values[weekId] !== undefined) {
              if (w.value === undefined || w.value === null || w.value <= 0) {
                return { ...w, value: values[weekId] };
              }
            }
            return w;
          });
        };

        const standardValuesPXLR: Record<string, number> = {
          'w32': 122.1, 'w33': 118.5, 'w34': 125.0, 'w35': 100.8
        };
        const standardValuesRO: Record<string, number> = {
          'w32': 115.2, 'w33': 110.0, 'w34': 118.4, 'w35': 104.2
        };
        const standardValuesBG: Record<string, number> = {
          'w32': 95.5, 'w33': 102.1, 'w34': 108.0, 'w35': 111.7
        };

        parsed.pxlr.weekly = fixValues(parsed.pxlr.weekly, 'pxlr', standardValuesPXLR);
        parsed.ro.weekly = fixValues(parsed.ro.weekly, 'ro', standardValuesRO);
        parsed.bg.weekly = fixValues(parsed.bg.weekly, 'bg', standardValuesBG);

        // Tự động đồng bộ số liệu tuần thực tế từ ma trận của Tab Nhóm RO và Tab Nhóm BG
        try {
          const matrixMonths = [5, 6, 7, 8, 9, 10, 11]; // All months
          matrixMonths.forEach(mIdx => {
            const mRO = this.getMatrixROForMonth(2026, mIdx) || [];
            const mBG = this.getMatrixBGForMonth(2026, mIdx) || [];
            const weeklyRO = mRO.filter(c => c.isWeeklyTotal);
            weeklyRO.forEach(cRO => {
              const m = cRO.label.match(/W(\d+)/i);
              if (m) {
                const wNum = parseInt(m[1], 10);
                const weekId = `w${wNum}`;
                const cBG = mBG.find(b => b.isWeeklyTotal && b.label.includes(`W${wNum}`));
                const valRO = Number(cRO.nsldTheoNgay) || 0;
                const valBG = cBG ? (Number(cBG.nsldTheoNgay) || 0) : 0;
                const slRO = Number(cRO.sanLuongLineChinh) || 0;
                const dmRO = Number(cRO.dinhMucSlTheoNs) || 0;
                const slBG = cBG ? ((Number(cBG.sanLuongBepGa) || 0) + (Number(cBG.sanLuongRma) || 0)) : 0;
                const dmBG = cBG ? (Number(cBG.dinhMucSlTheoNs) || 0) : 0;
                const totalSL = slRO + slBG;
                const totalDM = dmRO + dmBG;
                const valPXLR = totalDM > 0 ? Number(((totalSL / totalDM) * 100).toFixed(1)) : 0;

                if (cRO) {
                  const it = parsed.ro.weekly.find((i: any) => i.id === `ro-${weekId}` || i.label === `Tuần ${wNum}`);
                  if (it && !isHistoricalItem(it.id)) it.value = valRO;
                }
                if (cBG) {
                  const it = parsed.bg.weekly.find((i: any) => i.id === `bg-${weekId}` || i.label === `Tuần ${wNum}`);
                  if (it && !isHistoricalItem(it.id)) it.value = valBG;
                }
                if (cRO || cBG) {
                  const it = parsed.pxlr.weekly.find((i: any) => i.id === `pxlr-${weekId}` || i.id === `pxlr-w${wNum}` || i.label === `Tuần ${wNum}`);
                  if (it && !isHistoricalItem(it.id)) it.value = valPXLR;
                }
              }
            });
          });
        } catch {}

        parsed.pxlr.monthly = parsed.pxlr.monthly.map(m => {
          if (m.id === 'pxlr-m06') return { ...m, value: 131.6 };
          if (m.id === 'pxlr-m07') return { ...m, value: 135.5 };
          if (m.id === 'pxlr-m08') return { ...m, value: 133.6 };
          if (m.id === 'pxlr-m09' || m.label === 'Tháng 9') return { ...m, value: 116.8 };
          if ((m.id === 'pxlr-m10' || m.label === 'Tháng 10') && (!m.value || m.value <= 0 || m.value === 118.5 || m.value === 117.8 || m.value === 118.7 || m.value === 121.1)) return { ...m, value: 120.6 };
          return m;
        });
        parsed.ro.monthly = parsed.ro.monthly.map(m => {
          if (m.id === 'ro-m07') return { ...m, value: 117.1 };
          if (m.id === 'ro-m08') return { ...m, value: 111.2 };
          if ((m.id === 'ro-m09' || m.label === 'Tháng 9') && (!m.value || m.value <= 0 || m.value === 117.0)) return { ...m, value: 118.9 };
          if ((m.id === 'ro-m10' || m.label === 'Tháng 10') && (!m.value || m.value <= 0 || m.value === 120.0 || m.value === 121.1 || m.value === 121.5)) return { ...m, value: 121.7 };
          return m;
        });
        parsed.bg.monthly = parsed.bg.monthly.map(m => {
          if (m.id === 'bg-m07') return { ...m, value: 87.1 };
          if (m.id === 'bg-m08') return { ...m, value: 108.2 };
          if ((m.id === 'bg-m09' || m.label === 'Tháng 9') && (!m.value || m.value <= 0 || m.value === 97.0 || m.value === 103.5)) return { ...m, value: 92.6 };
          if ((m.id === 'bg-m10' || m.label === 'Tháng 10') && (!m.value || m.value <= 0 || m.value === 108.5 || m.value === 102.7 || m.value === 113.1)) return { ...m, value: 113.3 };
          return m;
        });

        localStorage.setItem(STORAGE_KEYS.SLIDE1_NSLD, JSON.stringify(parsed));
        return parsed;
      }
      return INITIAL_SLIDE1_NSLD;
    } catch {
      return INITIAL_SLIDE1_NSLD;
    }
  },

  saveSlide1NSLD(data: Slide1NSLDData) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLIDE1_NSLD, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save slide 1 NSLD data', e);
    }
  },

  addWeekToSlide1(weekNumOrLabel: number | string): Slide1NSLDData {
    const current = this.getSlide1NSLD();
    const cleanNum = typeof weekNumOrLabel === 'number' 
      ? weekNumOrLabel 
      : (parseInt(weekNumOrLabel.replace(/\D/g, ''), 10) || 41);
    const label = `Tuần ${cleanNum}`;
    const idSuffix = `w${cleanNum}`;

    const appendIfMissing = (items: any[], prefix: string) => {
      if (!items.some(i => i.label === label || i.id === `${prefix}-${idSuffix}`)) {
        items.push({ id: `${prefix}-${idSuffix}`, label, value: 0 });
      }
      return items.sort((a, b) => {
        const getNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
        return getNum(a.label) - getNum(b.label);
      });
    };

    current.pxlr.weekly = appendIfMissing(current.pxlr.weekly, 'pxlr');
    current.ro.weekly = appendIfMissing(current.ro.weekly, 'ro');
    current.bg.weekly = appendIfMissing(current.bg.weekly, 'bg');

    this.saveSlide1NSLD(current);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('production-data-updated', { detail: { type: 'slide1-weeks' } }));
    }
    return current;
  },

  resetSlide1NSLD(): Slide1NSLDData {
    try {
      localStorage.removeItem(STORAGE_KEYS.SLIDE1_NSLD);
    } catch {}
    return INITIAL_SLIDE1_NSLD;
  },

  getSlide2Quality(): Slide2QualityData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIDE2_QUALITY);
      if (data) {
        const parsed: Slide2QualityData = JSON.parse(data);
        if (parsed.pxlr?.items) {
          parsed.pxlr.items = parsed.pxlr.items.filter(i => i.month !== 'T5');
        }
        if (parsed.ro?.items) {
          parsed.ro.items = parsed.ro.items.filter(i => i.month !== 'T5');
        }
        if (parsed.bg) {
          parsed.bg.benchmarkDmLoi = 7.74;
          if (parsed.bg.items) {
            parsed.bg.items = parsed.bg.items.filter(i => i.month !== 'T5');
          }
        }
        if (parsed.monthly) {
          if (!parsed.monthly.pxlr.items || parsed.monthly.pxlr.items.length === 0) {
            parsed.monthly.pxlr.items = INITIAL_SLIDE2_QUALITY.monthly.pxlr.items;
          } else if (!parsed.monthly.pxlr.items.some(i => i.month === 'T10')) {
            parsed.monthly.pxlr.items.push({ id: 'pxlr-q-t10', month: 'T10', dmVatTu: 3.69, vatTu: 1.25, totalLoi4M: 3.42 });
          }
          if (!parsed.monthly.ro.items || parsed.monthly.ro.items.length === 0) {
            parsed.monthly.ro.items = INITIAL_SLIDE2_QUALITY.monthly.ro.items;
          } else if (!parsed.monthly.ro.items.some(i => i.month === 'T10')) {
            parsed.monthly.ro.items.push({ id: 'ro-q-t10', month: 'T10', dmVatTu: 2.4, vatTu: 0.9, totalLoi4M: 2.8 });
          }
          if (!parsed.monthly.bg.items || parsed.monthly.bg.items.length === 0) {
            parsed.monthly.bg.items = INITIAL_SLIDE2_QUALITY.monthly.bg.items;
          } else if (!parsed.monthly.bg.items.some(i => i.month === 'T10')) {
            parsed.monthly.bg.items.push({ id: 'bg-q-t10', month: 'T10', dmVatTu: 4.03, vatTu: 2.10, totalLoi4M: 5.80 });
          }
          parsed.monthly.bg.benchmarkDmLoi = 7.74;
        }
        if (parsed.pxlr?.items && !parsed.pxlr.items.some(i => i.month === 'T10')) {
          parsed.pxlr.items.push({ id: 'pxlr-q-t10', month: 'T10', dmVatTu: 3.69, vatTu: 1.25, totalLoi4M: 3.42 });
        }
        if (parsed.ro?.items && !parsed.ro.items.some(i => i.month === 'T10')) {
          parsed.ro.items.push({ id: 'ro-q-t10', month: 'T10', dmVatTu: 2.4, vatTu: 0.9, totalLoi4M: 2.8 });
        }
        if (parsed.bg?.items && !parsed.bg.items.some(i => i.month === 'T10')) {
          parsed.bg.items.push({ id: 'bg-q-t10', month: 'T10', dmVatTu: 4.03, vatTu: 2.10, totalLoi4M: 5.80 });
        }
        if (parsed.weekly) {
          parsed.weekly.pxlr.title = INITIAL_SLIDE2_QUALITY.weekly.pxlr.title;
          if (!parsed.weekly.pxlr.items || parsed.weekly.pxlr.items.length < 8) {
            parsed.weekly.pxlr.items = INITIAL_SLIDE2_QUALITY.weekly.pxlr.items;
            parsed.weekly.ro.items = INITIAL_SLIDE2_QUALITY.weekly.ro.items;
            parsed.weekly.bg.items = INITIAL_SLIDE2_QUALITY.weekly.bg.items;
          }
          parsed.weekly.bg.benchmarkDmLoi = 7.74;
        }
        if (parsed.daily) {
          parsed.daily.pxlr.title = INITIAL_SLIDE2_QUALITY.daily.pxlr.title;
          parsed.daily.pxlr.items = INITIAL_SLIDE2_QUALITY.daily.pxlr.items;
          parsed.daily.ro.items = INITIAL_SLIDE2_QUALITY.daily.ro.items;
          parsed.daily.bg.benchmarkDmLoi = 7.74;
          parsed.daily.bg.items = INITIAL_SLIDE2_QUALITY.daily.bg.items;
        }
        if (!parsed.dailyRecords || parsed.dailyRecords.length === 0) {
          parsed.dailyRecords = INITIAL_SLIDE2_QUALITY.dailyRecords;
        } else {
          // Migration: Ensure Sundays (06/09, 13/09, 20/09) are present for the user
          const sunDates = ['2026-09-06', '2026-09-13', '2026-09-20'];
          let added = false;
          sunDates.forEach(date => {
            if (!parsed.dailyRecords.some(r => r.date === date)) {
              const initSun = INITIAL_SLIDE2_QUALITY.dailyRecords.find(r => r.date === date);
              if (initSun) {
                parsed.dailyRecords.push(initSun);
                added = true;
              }
            }
          });
          if (added) {
            parsed.dailyRecords.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          }
        }
        // If current active is month, make sure parsed.bg, parsed.ro, parsed.pxlr match monthly
        if (parsed.activeTimeFrame === 'month' || !parsed.activeTimeFrame) {
          parsed.bg = parsed.monthly?.bg || INITIAL_SLIDE2_QUALITY.monthly.bg;
          parsed.ro = parsed.monthly?.ro || INITIAL_SLIDE2_QUALITY.monthly.ro;
          parsed.pxlr = parsed.monthly?.pxlr || INITIAL_SLIDE2_QUALITY.monthly.pxlr;
        } else if (parsed.activeTimeFrame === 'week') {
          parsed.bg = parsed.weekly?.bg || INITIAL_SLIDE2_QUALITY.weekly.bg;
          parsed.ro = parsed.weekly?.ro || INITIAL_SLIDE2_QUALITY.weekly.ro;
          parsed.pxlr = parsed.weekly?.pxlr || INITIAL_SLIDE2_QUALITY.weekly.pxlr;
        } else if (parsed.activeTimeFrame === 'day') {
          parsed.bg = parsed.daily?.bg || INITIAL_SLIDE2_QUALITY.daily.bg;
          parsed.ro = parsed.daily?.ro || INITIAL_SLIDE2_QUALITY.daily.ro;
          parsed.pxlr = parsed.daily?.pxlr || INITIAL_SLIDE2_QUALITY.daily.pxlr;
        }
        return parsed;
      }
      return INITIAL_SLIDE2_QUALITY;
    } catch {
      return INITIAL_SLIDE2_QUALITY;
    }
  },

  saveSlide2Quality(data: Slide2QualityData) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLIDE2_QUALITY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save slide 2 Quality data', e);
    }
  },

  resetSlide2Quality(): Slide2QualityData {
    try {
      localStorage.removeItem(STORAGE_KEYS.SLIDE2_QUALITY);
    } catch {}
    return INITIAL_SLIDE2_QUALITY;
  },

  getSlide3DefectCost(): SlideDefectCostData {
    try {
      // Check current key, then fallback to legacy keys to preserve user's previously updated data
      const data = 
        localStorage.getItem(STORAGE_KEYS.SLIDE3_DEFECT_COST) || 
        localStorage.getItem('pxlr_slide3_defect_cost_v1') || 
        localStorage.getItem('pxlr_slide3_defect_cost');

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          const rawRO = Array.isArray(parsed.itemsRO) ? parsed.itemsRO : INITIAL_SLIDE3_DEFECT_COST.itemsRO;
          const rawBG = Array.isArray(parsed.itemsBG) ? parsed.itemsBG : INITIAL_SLIDE3_DEFECT_COST.itemsBG;
          const rawWeekly = Array.isArray(parsed.weeklyData) && parsed.weeklyData.length > 0 ? parsed.weeklyData : INITIAL_SLIDE3_DEFECT_COST.weeklyData;
          const rawMonthly = Array.isArray(parsed.monthlyData) && parsed.monthlyData.length > 0 ? parsed.monthlyData : INITIAL_SLIDE3_DEFECT_COST.monthlyData;

          const rawData: SlideDefectCostData = {
            ...INITIAL_SLIDE3_DEFECT_COST,
            ...parsed,
            itemsRO: rawRO,
            itemsBG: rawBG,
            weeklyData: rawWeekly,
            monthlyData: rawMonthly,
          };

          const { syncedData } = synchronizeSlide3Data(rawData);
          // Đồng bộ lưu lại vào storage key chuẩn để luôn luôn lưu giữ dữ liệu người dùng nạp vào
          localStorage.setItem(STORAGE_KEYS.SLIDE3_DEFECT_COST, JSON.stringify(syncedData));
          return syncedData;
        }
      }
      const { syncedData } = synchronizeSlide3Data(INITIAL_SLIDE3_DEFECT_COST);
      return syncedData;
    } catch {
      const { syncedData } = synchronizeSlide3Data(INITIAL_SLIDE3_DEFECT_COST);
      return syncedData;
    }
  },

  saveSlide3DefectCost(data: SlideDefectCostData) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLIDE3_DEFECT_COST, JSON.stringify(data));
      if (typeof window !== 'undefined') {
        queueMicrotask(() => {
          window.dispatchEvent(new Event('production-data-updated'));
        });
      }
    } catch (e) {
      console.error('Failed to save slide 3 Defect Cost data', e);
    }
  },

  resetSlide3DefectCost(): SlideDefectCostData {
    try {
      localStorage.removeItem(STORAGE_KEYS.SLIDE3_DEFECT_COST);
    } catch {}
    return INITIAL_SLIDE3_DEFECT_COST;
  },

  getSlide4ProductionTarget(): Slide4ProductionTargetData {
    try {
      // Check current key, then fallback to legacy keys to preserve user updates
      let stored = localStorage.getItem(STORAGE_KEYS.SLIDE4_PRODUCTION_TARGET);
      if (!stored) {
        for (let v = 9; v >= 1; v--) {
          const legacy = localStorage.getItem(`pxlr_slide4_production_target_v${v}`);
          if (legacy) {
            stored = legacy;
            break;
          }
        }
        if (!stored) {
          stored = localStorage.getItem('pxlr_slide4_production_target');
        }
      }

      // Always start with a fresh clone of initial data to guarantee 12 months structure
      const baseData = JSON.parse(JSON.stringify(INITIAL_SLIDE4_PRODUCTION_TARGET));
      
      if (!stored) return baseData;
      
      const parsed = JSON.parse(stored);
      
      // Merge base properties
      const result = { ...baseData, ...parsed };
      
      // Force merge monthly targets to ensure EXACTLY 12 months exist and have correct labels
      const mergedTargets = JSON.parse(JSON.stringify(INITIAL_SLIDE4_PRODUCTION_TARGET.monthlyTargets));
      
      if (Array.isArray(parsed.monthlyTargets)) {
        parsed.monthlyTargets.forEach((target: any, idx: number) => {
          if (idx < 12) {
            // Only merge numeric data, keep month name from INITIAL
            mergedTargets[idx] = { 
              ...mergedTargets[idx], 
              nsld: typeof target.nsld === 'number' ? target.nsld : mergedTargets[idx].nsld,
              sanLuong: typeof target.sanLuong === 'number' ? target.sanLuong : mergedTargets[idx].sanLuong,
              cong: typeof target.cong === 'number' ? target.cong : mergedTargets[idx].cong,
              tonThat: typeof target.tonThat === 'number' ? target.tonThat : mergedTargets[idx].tonThat
            };
          }
        });
      }
      
      result.monthlyTargets = mergedTargets;
      return result;
    } catch {
      return JSON.parse(JSON.stringify(INITIAL_SLIDE4_PRODUCTION_TARGET));
    }
  },

  saveSlide4ProductionTarget(data: Slide4ProductionTargetData) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLIDE4_PRODUCTION_TARGET, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save slide 4 production target data', e);
    }
  },

  resetSlide4ProductionTarget(): Slide4ProductionTargetData {
    try {
      localStorage.removeItem(STORAGE_KEYS.SLIDE4_PRODUCTION_TARGET);
    } catch {}
    return INITIAL_SLIDE4_PRODUCTION_TARGET;
  },

  getSlide5ProductionPlan(): Slide5ProductionPlanData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIDE5_PRODUCTION_PLAN);
      if (data) {
        const parsed: Slide5ProductionPlanData = JSON.parse(data);
        if (!parsed.weeks || !Array.isArray(parsed.weeks) || parsed.weeks.length < 2) {
          parsed.weeks = INITIAL_SLIDE5_PRODUCTION_PLAN.weeks;
        } else {
          const hasW43 = parsed.weeks.some(w => w.weekHeader.includes('43'));
          if (!hasW43) {
            const w43 = INITIAL_SLIDE5_PRODUCTION_PLAN.weeks?.find(w => w.weekHeader.includes('43'));
            if (w43) parsed.weeks.push(w43);
          }
        }
        return parsed;
      }
      return INITIAL_SLIDE5_PRODUCTION_PLAN;
    } catch {
      return INITIAL_SLIDE5_PRODUCTION_PLAN;
    }
  },

  saveSlide5ProductionPlan(data: Slide5ProductionPlanData) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLIDE5_PRODUCTION_PLAN, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save slide 5 production plan data', e);
    }
  },

  resetSlide5ProductionPlan(): Slide5ProductionPlanData {
    try {
      localStorage.removeItem(STORAGE_KEYS.SLIDE5_PRODUCTION_PLAN);
    } catch {}
    return INITIAL_SLIDE5_PRODUCTION_PLAN;
  },

  getSlide6TaskPlan(): Slide6TaskPlanData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIDE6_TASK_PLAN);
      if (data) {
        const parsed: Slide6TaskPlanData = JSON.parse(data);
        if (!parsed.weeks || !Array.isArray(parsed.weeks) || parsed.weeks.length < 2) {
          parsed.weeks = INITIAL_SLIDE6_TASK_PLAN.weeks;
        } else {
          const hasW43 = parsed.weeks.some(w => w.weekHeader.includes('43'));
          if (!hasW43) {
            const w43 = INITIAL_SLIDE6_TASK_PLAN.weeks?.find(w => w.weekHeader.includes('43'));
            if (w43) parsed.weeks.push(w43);
          }
        }
        return parsed;
      }
      return INITIAL_SLIDE6_TASK_PLAN;
    } catch {
      return INITIAL_SLIDE6_TASK_PLAN;
    }
  },

  saveSlide6TaskPlan(data: Slide6TaskPlanData) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLIDE6_TASK_PLAN, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save slide 6 task plan data', e);
    }
  },

  resetSlide6TaskPlan(): Slide6TaskPlanData {
    try {
      localStorage.removeItem(STORAGE_KEYS.SLIDE6_TASK_PLAN);
    } catch {}
    return INITIAL_SLIDE6_TASK_PLAN;
  },

  getGlobalNorms(): GlobalNormsConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GLOBAL_NORMS);
      return data ? JSON.parse(data) : DEFAULT_GLOBAL_NORMS;
    } catch {
      return DEFAULT_GLOBAL_NORMS;
    }
  },

  saveGlobalNorms(norms: GlobalNormsConfig) {
    try {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_NORMS, JSON.stringify(norms));
    } catch (e) {
      console.error('Failed to save global norms', e);
    }
  },

  getLockedMonths(): Record<string, LockedMonthInfo> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCKED_MONTHS);
      const defaultLocked: Record<string, LockedMonthInfo> = {
        '2026_6': {
          isLocked: true,
          lockedAt: '2026-06-30T23:59:59',
          lockedBy: 'Quản đốc PXLR',
          year: 2026,
          monthIndex0: 5,
          monthLabel: 'Tháng 6',
          nsldRO: 108.5,
          nsldBG: 104.2,
          nsldPXLR: 107.9,
          note: 'Đã hoàn thành và chốt sổ Tháng 6/2026'
        },
        '2026_7': {
          isLocked: true,
          lockedAt: '2026-07-31T23:59:59',
          lockedBy: 'Quản đốc PXLR',
          year: 2026,
          monthIndex0: 6,
          monthLabel: 'Tháng 7',
          nsldRO: 112.0,
          nsldBG: 105.8,
          nsldPXLR: 111.2,
          note: 'Đã hoàn thành và chốt sổ Tháng 7/2026'
        },
        '2026_8': {
          isLocked: true,
          lockedAt: '2026-08-31T23:59:59',
          lockedBy: 'Quản đốc PXLR',
          year: 2026,
          monthIndex0: 7,
          monthLabel: 'Tháng 8',
          nsldRO: 115.4,
          nsldBG: 106.1,
          nsldPXLR: 114.2,
          note: 'Đã hoàn thành và chốt sổ Tháng 8/2026'
        },
        '2026_9': {
          isLocked: true,
          lockedAt: '2026-09-30T23:59:59',
          lockedBy: 'Quản đốc PXLR',
          year: 2026,
          monthIndex0: 8,
          monthLabel: 'Tháng 9',
          nsldRO: 117.0,
          nsldBG: 97.0,
          nsldPXLR: 130.0,
          defectCostTotal: 5263848,
          note: 'Đã hoàn thành và chốt sổ Tháng 9/2026'
        },
      };

      if (!data) return defaultLocked;
      const parsed = JSON.parse(data);
      return { ...defaultLocked, ...parsed };
    } catch {
      return {};
    }
  },

  saveLockedMonths(lockedMap: Record<string, LockedMonthInfo>) {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCKED_MONTHS, JSON.stringify(lockedMap));
    } catch (e) {
      console.error('Failed to save locked months', e);
    }
  },

  isMonthLocked(year: number, monthIndex0: number): boolean {
    const key = `${year}_${monthIndex0 + 1}`;
    const all = this.getLockedMonths();
    return Boolean(all[key]?.isLocked);
  },

  lockMonth(year: number, monthIndex0: number, summary?: Partial<LockedMonthInfo>, lockedBy?: string): LockedMonthInfo {
    const key = `${year}_${monthIndex0 + 1}`;
    const all = this.getLockedMonths();
    const monthNum = monthIndex0 + 1;
    
    // 1. Finalize matrix for this month
    const roCols = this.getMatrixROForMonth(year, monthIndex0);
    const bgCols = this.getMatrixBGForMonth(year, monthIndex0);
    const recalculatedRO = recalculateROMatrix(roCols);
    const recalculatedBG = recalculateBGMatrix(bgCols);
    this.saveMatrixROForMonth(year, monthIndex0, recalculatedRO);
    this.saveMatrixBGForMonth(year, monthIndex0, recalculatedBG);

    // Extract exact monthly totals from matrix
    const roMonthlyCol = recalculatedRO.find(c => c.isMonthlyTotal);
    const bgMonthlyCol = recalculatedBG.find(c => c.isMonthlyTotal);
    const nsldRO = Number(roMonthlyCol?.nsldTheoNgay) || summary?.nsldRO || (monthNum === 9 ? 117.0 : monthNum === 10 ? 121.1 : 100);
    const nsldBG = Number(bgMonthlyCol?.nsldTheoNgay) || summary?.nsldBG || (monthNum === 9 ? 97.0 : monthNum === 10 ? 102.7 : 100);
    const nsldPXLR = monthNum === 9 ? 130.0 : Number(((nsldRO * 0.87) + (nsldBG * 0.13)).toFixed(1));

    const info: LockedMonthInfo = {
      isLocked: true,
      lockedAt: new Date().toISOString(),
      lockedBy: lockedBy || 'Quản đốc PXLR',
      year,
      monthIndex0,
      monthLabel: `Tháng ${monthNum}`,
      nsldRO,
      nsldBG,
      nsldPXLR,
      outputRO: Number(roMonthlyCol?.sanLuongLineChinh) || summary?.outputRO || 0,
      outputBG: Number((bgMonthlyCol?.sanLuongBepGa || 0) + (bgMonthlyCol?.sanLuongRma || 0)) || summary?.outputBG || 0,
      congRO: Number((roMonthlyCol?.congChinhThuc || 0) + (roMonthlyCol?.congThoiVu || 0)) || summary?.congRO || 0,
      congBG: Number((bgMonthlyCol?.congBepGa || 0) + (bgMonthlyCol?.congThoiVu || 0) + (bgMonthlyCol?.congRma || 0)) || summary?.congBG || 0,
      note: `Đã chốt và khóa thành công dữ liệu Tháng ${monthNum}/${year}`,
      ...summary,
    };

    all[key] = info;
    this.saveLockedMonths(all);

    // 2. Lock & sync into Slide 1 NSLD
    try {
      const slide1 = this.getSlide1NSLD();
      const updateBar = (items: any[], val: number, idPrefix: string) => {
        const idx = items.findIndex(i => i.label === `Tháng ${monthNum}` || i.id === `${idPrefix}-m${monthNum}` || i.id === `${idPrefix}-m${monthNum.toString().padStart(2, '0')}`);
        if (idx !== -1) {
          items[idx] = { ...items[idx], value: val, isLocked: true };
        } else {
          items.push({ id: `${idPrefix}-m${monthNum.toString().padStart(2, '0')}`, label: `Tháng ${monthNum}`, value: val, isLocked: true });
        }
      };
      updateBar(slide1.ro.monthly, nsldRO, 'ro');
      updateBar(slide1.bg.monthly, nsldBG, 'bg');
      updateBar(slide1.pxlr.monthly, nsldPXLR, 'pxlr');
      this.saveSlide1NSLD(slide1);
    } catch {}

    return info;
  },

  unlockMonth(year: number, monthIndex0: number) {
    const key = `${year}_${monthIndex0 + 1}`;
    const all = this.getLockedMonths();
    if (all[key]) {
      all[key] = {
        ...all[key],
        isLocked: false,
        note: `Đã mở khóa chỉnh sửa dữ liệu Tháng ${monthIndex0 + 1}/${year}`
      };
      this.saveLockedMonths(all);
    }
  },

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.DCBG);
    localStorage.removeItem(STORAGE_KEYS.DCRO);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.THRESHOLDS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SLIDE1_NSLD);
    localStorage.removeItem(STORAGE_KEYS.SLIDE2_QUALITY);
    localStorage.removeItem(STORAGE_KEYS.SLIDE3_DEFECT_COST);
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_NORMS);
  }
};

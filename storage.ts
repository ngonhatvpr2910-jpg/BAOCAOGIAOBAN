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
} from './initialData';
import { 
  generateMonthBGMatrix, 
  generateMonthROMatrix,
  recalculateBGMatrix,
  recalculateROMatrix,
} from './matrixGenerator';

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
      exportDate: new Date().toISOString(),
      version: '1.0.0',
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
        // Helper to ensure all weeks from INITIAL are present in stored data
        const ensureAllWeeks = (stored: any[], initial: any[], prefix: string) => {
          const initialMap = new Map(initial.map(i => [i.id, i]));
          const storedMap = new Map(stored.map(i => [i.id, i]));
          
          // Use initial list as the template for order and completeness
          return initial.map(initItem => {
            const storedItem = storedMap.get(initItem.id);
            if (storedItem) {
              // Preserve value but could update label if needed
              return { ...initItem, value: storedItem.value };
            }
            return initItem; // Use initial if missing
          });
        };

        parsed.pxlr.weekly = ensureAllWeeks(parsed.pxlr.weekly, INITIAL_SLIDE1_NSLD.pxlr.weekly, 'pxlr');
        parsed.ro.weekly = ensureAllWeeks(parsed.ro.weekly, INITIAL_SLIDE1_NSLD.ro.weekly, 'ro');
        parsed.bg.weekly = ensureAllWeeks(parsed.bg.weekly, INITIAL_SLIDE1_NSLD.bg.weekly, 'bg');

        // Fix historical values (W32-W35)
        const fixValues = (items: any[], prefix: string, values: Record<string, number>) => {
          return items.map(w => {
            const weekId = w.id.replace(`${prefix}-`, '');
            if (values[weekId] !== undefined) {
              return { ...w, value: values[weekId] };
            }
            return w;
          });
        };

        parsed.pxlr.weekly = fixValues(parsed.pxlr.weekly, 'pxlr', { 'w32': 122.1, 'w33': 118.5, 'w34': 125.0, 'w35': 100.8 });
        parsed.ro.weekly = fixValues(parsed.ro.weekly, 'ro', { 'w32': 115.2, 'w33': 110.0, 'w34': 118.4, 'w35': 104.2 });
        parsed.bg.weekly = fixValues(parsed.bg.weekly, 'bg', { 'w32': 95.5, 'w33': 102.1, 'w34': 108.0, 'w35': 111.7 });

        parsed.pxlr.monthly = parsed.pxlr.monthly.map(m => {
          if (m.id === 'pxlr-m06') return { ...m, value: 131.6 };
          if (m.id === 'pxlr-m07') return { ...m, value: 135.5 };
          if (m.id === 'pxlr-m08') return { ...m, value: 133.6 };
          if (m.id === 'pxlr-m09' && (!m.value || m.value <= 0)) return { ...m, value: 117.0 };
          return m;
        });
        parsed.ro.monthly = parsed.ro.monthly.map(m => {
          if (m.id === 'ro-m07') return { ...m, value: 117.1 };
          if (m.id === 'ro-m08') return { ...m, value: 111.2 };
          if (m.id === 'ro-m09' && (!m.value || m.value <= 0)) return { ...m, value: 117.0 };
          return m;
        });
        parsed.bg.monthly = parsed.bg.monthly.map(m => {
          if (m.id === 'bg-m07') return { ...m, value: 87.1 };
          if (m.id === 'bg-m08') return { ...m, value: 108.2 };
          if (m.id === 'bg-m09' && (!m.value || m.value <= 0)) return { ...m, value: 97.0 };
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
          }
          if (!parsed.monthly.ro.items || parsed.monthly.ro.items.length === 0) {
            parsed.monthly.ro.items = INITIAL_SLIDE2_QUALITY.monthly.ro.items;
          }
          if (!parsed.monthly.bg.items || parsed.monthly.bg.items.length === 0) {
            parsed.monthly.bg.items = INITIAL_SLIDE2_QUALITY.monthly.bg.items;
          }
          parsed.monthly.bg.benchmarkDmLoi = 7.74;
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

      // Chuẩn hóa dữ liệu lịch sử cố định từ Tháng 6 đến Tháng 8
      const historicalMonths: Record<string, number> = {
        'Tháng 6': 10.8,
        'Tháng 7': 7.1,
        'Tháng 8': 5.9,
      };
      const historicalWeeks: Record<string, number> = {
        'W32': 2.2,
        'W33': 0.6,
        'W34': 1.8,
        'W35': 1.4,
      };

      const getNum = (label: string) => {
        const m = (label || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      };

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          const rawWeekly = Array.isArray(parsed.weeklyData) && parsed.weeklyData.length > 0 ? parsed.weeklyData : INITIAL_SLIDE3_DEFECT_COST.weeklyData;
          const rawMonthly = Array.isArray(parsed.monthlyData) && parsed.monthlyData.length > 0 ? parsed.monthlyData : INITIAL_SLIDE3_DEFECT_COST.monthlyData;

          // Bảo lưu nguyên vẹn 100% dữ liệu lịch sử từ Tháng 6 đến Tháng 8
          const preservedMonthly = rawMonthly.map((m: any) => {
            const hist = historicalMonths[m.label];
            if (hist !== undefined && (!m.value || m.value <= 0)) {
              return { ...m, value: hist, displayLabel: `${hist}M` };
            }
            return m;
          });

          // Nếu thiếu Tháng 6, 7, 8 thì tự động bổ sung
          Object.entries(historicalMonths).forEach(([mLabel, mVal]) => {
            if (!preservedMonthly.some((m: any) => m.label === mLabel)) {
              preservedMonthly.push({ id: `m-${mLabel}`, label: mLabel, value: mVal, displayLabel: `${mVal}M` });
            }
          });
          preservedMonthly.sort((a: any, b: any) => getNum(a.label) - getNum(b.label));

          const preservedWeekly = rawWeekly.map((w: any) => {
            const hist = historicalWeeks[w.label];
            if (hist !== undefined && (!w.value || w.value <= 0)) {
              return { ...w, value: hist, displayLabel: `${hist}M` };
            }
            if (w.label === 'W38' && (!w.value || w.value <= 0)) {
              return { ...w, value: 1.8, displayLabel: '1.8M' };
            }
            if (w.label === 'W39' && (!w.value || w.value <= 0 || w.value === 2.0)) {
              return { ...w, value: 1.0, displayLabel: '1.0M' };
            }
            return w;
          });
          // Nếu thiếu tuần lịch sử W32-W35 thì tự động bổ sung
          Object.entries(historicalWeeks).forEach(([wLabel, wVal]) => {
            if (!preservedWeekly.some((w: any) => w.label === wLabel)) {
              preservedWeekly.push({ id: `w-${wLabel.toLowerCase()}`, label: wLabel, value: wVal, displayLabel: `${wVal}M` });
            }
          });
          // Đảm bảo W38 và W39 có mặt trong danh sách tuần
          if (!preservedWeekly.some((w: any) => w.label === 'W38')) {
            preservedWeekly.push({ id: 'w-38', label: 'W38', value: 1.8, displayLabel: '1.8M' });
          }
          if (!preservedWeekly.some((w: any) => w.label === 'W39')) {
            preservedWeekly.push({ id: 'w-39', label: 'W39', value: 1.0, displayLabel: '1.0M' });
          }
          preservedWeekly.sort((a: any, b: any) => getNum(a.label) - getNum(b.label));

          let finalItemsRO = Array.isArray(parsed.itemsRO) && parsed.itemsRO.length > 0 ? [...parsed.itemsRO] : [...INITIAL_SLIDE3_DEFECT_COST.itemsRO];
          let finalItemsBG = Array.isArray(parsed.itemsBG) && parsed.itemsBG.length > 0 ? [...parsed.itemsBG] : [...INITIAL_SLIDE3_DEFECT_COST.itemsBG];

          // Tuần 39 (W39): Line RO KHÔNG CÓ LỖI (0 lỗi, 0 linh kiện hỏng, 0 VNĐ)
          // Xóa bỏ hoàn toàn mọi item lỗi W39 của Line RO nếu từng bị lưu vào localStorage
          finalItemsRO = finalItemsRO.filter((item: any) => {
            const isW39 = (item.week || '').toUpperCase().includes('39');
            const isRO = item.category === 'RO' || (item.id && String(item.id).startsWith('ro-dam-'));
            const isFakeW39Id = ['ro-dam-9', 'ro-dam-10', 'ro-dam-11', 'ro-dam-12', 'ro-dam-13', 'ro-dam-14'].includes(item.id);
            return !(isFakeW39Id || (isW39 && isRO));
          });

          const hasW39BG = finalItemsBG.some((item: any) => (item.week || '').toUpperCase().includes('39'));
          if (!hasW39BG) {
            const w39BG = INITIAL_SLIDE3_DEFECT_COST.itemsBG.filter(i => (i.week || '').toUpperCase().includes('39'));
            finalItemsBG = [...finalItemsBG, ...w39BG];
          }

          const preservedMonthlyFinal = preservedMonthly.map((m: any) => {
            if (m.label === 'Tháng 9' && (!m.value || m.value <= 0)) {
              return { ...m, value: 5.2, displayLabel: '5.2M' };
            }
            return m;
          });

          const result: SlideDefectCostData = {
            ...INITIAL_SLIDE3_DEFECT_COST,
            ...parsed,
            weeklyData: preservedWeekly,
            monthlyData: preservedMonthlyFinal,
            itemsRO: finalItemsRO,
            itemsBG: finalItemsBG,
          };

          // Đồng bộ lưu lại vào storage key chuẩn
          localStorage.setItem(STORAGE_KEYS.SLIDE3_DEFECT_COST, JSON.stringify(result));
          return result;
        }
      }
      return INITIAL_SLIDE3_DEFECT_COST;
    } catch {
      return INITIAL_SLIDE3_DEFECT_COST;
    }
  },

  saveSlide3DefectCost(data: SlideDefectCostData) {
    try {
      localStorage.setItem(STORAGE_KEYS.SLIDE3_DEFECT_COST, JSON.stringify(data));
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
      return data ? JSON.parse(data) : INITIAL_SLIDE5_PRODUCTION_PLAN;
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
      return data ? JSON.parse(data) : INITIAL_SLIDE6_TASK_PLAN;
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

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.DCBG);
    localStorage.removeItem(STORAGE_KEYS.DCRO);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.THRESHOLDS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SLIDE1_NSLD);
    localStorage.removeItem(STORAGE_KEYS.SLIDE2_QUALITY);
    localStorage.removeItem(STORAGE_KEYS.SLIDE3_DEFECT_COST);
  }
};

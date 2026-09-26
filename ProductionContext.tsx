import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DailyDCBGRecord, 
  DailyDCRORecord, 
  DailyPXLRConsolidated, 
  QualityMetricsSnapshot,
  PushAlert, 
  ThresholdConfig, 
  MonthlyHistoryRecord, 
  WeeklyHistoryRecord,
  WeeklyDCBGRecord,
  MonthlyNSLDDCBGRecord,
  DailyNSLDRMARecord,
  ExcelMatrixROColumn,
  ExcelMatrixBGColumn,
  Slide2QualityData,
} from './types';
import { StorageService } from './storage';
import { getSyncedQualityForPXLR } from './qualityFormulas';
import { 
  MONTHLY_HISTORY, 
  WEEKLY_HISTORY,
  INITIAL_WEEKLY_DCBG,
  INITIAL_MONTHLY_NSLD_DCBG,
  INITIAL_DAILY_NSLD_RMA,
  INITIAL_MATRIX_RO,
  INITIAL_MATRIX_BG,
} from './initialData';

interface ProductionContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dcbgRecords: DailyDCBGRecord[];
  dcroRecords: DailyDCRORecord[];
  activeDCBGRecord: DailyDCBGRecord;
  activeDCRORecord: DailyDCRORecord;
  consolidatedPXLR: DailyPXLRConsolidated;
  monthlyHistory: MonthlyHistoryRecord[];
  weeklyHistory: WeeklyHistoryRecord[];
  cumulativeNSLD: { nsld2025: number; nsld2026: number };
  updateMonthlyRecord: (monthNum: number, updatedFields: Partial<MonthlyHistoryRecord>) => void;
  updateAllMonthlyRecords: (records: MonthlyHistoryRecord[]) => void;
  resetMonthlyHistory: () => void;
  // Specific DCBG & DCRO Excel Data from User Images
  weeklyDCBG: WeeklyDCBGRecord[];
  updateWeeklyDCBG: (records: WeeklyDCBGRecord[]) => void;
  resetWeeklyDCBG: () => void;
  monthlyNSLDDCBG: MonthlyNSLDDCBGRecord[];
  updateMonthlyNSLDDCBG: (records: MonthlyNSLDDCBGRecord[]) => void;
  resetMonthlyNSLDDCBG: () => void;
  dailyNSLDRMA: DailyNSLDRMARecord[];
  updateDailyNSLDRMA: (records: DailyNSLDRMARecord[]) => void;
  resetDailyNSLDRMA: () => void;
  matrixRO: ExcelMatrixROColumn[];
  updateMatrixRO: (columns: ExcelMatrixROColumn[]) => void;
  updateMatrixROForMonth: (year: number, monthIndex0: number, columns: ExcelMatrixROColumn[]) => void;
  resetMatrixRO: () => void;
  matrixBG: ExcelMatrixBGColumn[];
  updateMatrixBG: (columns: ExcelMatrixBGColumn[]) => void;
  updateMatrixBGForMonth: (year: number, monthIndex0: number, columns: ExcelMatrixBGColumn[]) => void;
  resetMatrixBG: () => void;
  alerts: PushAlert[];
  unreadAlertCount: number;
  thresholds: ThresholdConfig;
  updateDCBGRecord: (record: Partial<DailyDCBGRecord>) => void;
  updateDCRORecord: (record: Partial<DailyDCRORecord>) => void;
  saveNewDCBGRecord: (record: Omit<DailyDCBGRecord, 'id'>) => void;
  saveNewDCRORecord: (record: Omit<DailyDCRORecord, 'id'>) => void;
  updateThresholds: (config: ThresholdConfig) => void;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  sendManualPushNotification: (title: string, message: string, severity?: 'critical' | 'warning' | 'info') => void;
  simulateResourceTransfer: (fromDC: 'DCBG' | 'DCRO', toDC: 'DCBG' | 'DCRO', workerCount: number) => {
    projectedDCBGOutput: number;
    projectedDCROOutput: number;
    projectedTotalOutput: number;
    projectedDelta: number;
    recommendation: string;
  };
  // Slide 2 Chất Lượng Synchronization
  slide2Quality: Slide2QualityData;
  updateSlide2Quality: (data: Slide2QualityData) => void;
  qualityTimeFrame: 'day' | 'week' | 'month';
  setQualityTimeFrame: (tf: 'day' | 'week' | 'month') => void;
  qualityMetrics: QualityMetricsSnapshot;
  // Global Lock
  GLOBAL_LOCK_DATE: string;
  isDateLocked: (date: string) => boolean;
  isWeekLocked: (week: string) => boolean;
}

export const GLOBAL_LOCK_DATE = '2026-09-24';

export const isDateLocked = (dateStr: string): boolean => {
  if (!dateStr) return false;
  // If dateStr is "YYYY-MM-DD"
  if (dateStr.length === 10) {
    return dateStr <= GLOBAL_LOCK_DATE;
  }
  // Fallback for other formats if any (like labels "01-Sep") - but logic usually uses YYYY-MM-DD
  return false;
};

export const isWeekLocked = (week: string): boolean => {
  if (!week) return false;
  // Extract number from W38, W37 etc.
  const match = week.match(/W(\d+)/);
  if (!match) return false;
  const weekNum = parseInt(match[1], 10);
  // 24/09/2026 is in W38. We lock W38 and earlier as per "cập nhật hiện tại đến ngày 24/09"
  return weekNum <= 38;
};


const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

export const ProductionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [dcbgRecords, setDcbgRecords] = useState<DailyDCBGRecord[]>(() => StorageService.getDCBGRecords());
  const [dcroRecords, setDcroRecords] = useState<DailyDCRORecord[]>(() => StorageService.getDCRORecords());
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryRecord[]>(() => StorageService.getMonthlyHistory());
  const [weeklyDCBG, setWeeklyDCBG] = useState<WeeklyDCBGRecord[]>(() => StorageService.getWeeklyDCBG());
  const [monthlyNSLDDCBG, setMonthlyNSLDDCBG] = useState<MonthlyNSLDDCBGRecord[]>(() => StorageService.getMonthlyNSLDDCBG());
  const [dailyNSLDRMA, setDailyNSLDRMA] = useState<DailyNSLDRMARecord[]>(() => StorageService.getDailyNSLDRMA());
  const [matrixRO, setMatrixRO] = useState<ExcelMatrixROColumn[]>(() => StorageService.getMatrixRO());
  const [matrixBG, setMatrixBG] = useState<ExcelMatrixBGColumn[]>(() => StorageService.getMatrixBG());
  const [alerts, setAlerts] = useState<PushAlert[]>(() => StorageService.getAlerts());
  const [thresholds, setThresholds] = useState<ThresholdConfig>(() => StorageService.getThresholds());
  
  // Dữ liệu Slide 2: Chất Lượng
  const [slide2Quality, setSlide2Quality] = useState<Slide2QualityData>(() => StorageService.getSlide2Quality());
  const [qualityTimeFrame, setQualityTimeFrame] = useState<'day' | 'week' | 'month'>('day');

  const updateSlide2Quality = useCallback((newData: Slide2QualityData) => {
    StorageService.saveSlide2Quality(newData);
    setSlide2Quality(newData);
  }, []);

  const qualityMetrics = useMemo(() => {
    return getSyncedQualityForPXLR(slide2Quality, selectedDate, qualityTimeFrame);
  }, [slide2Quality, selectedDate, qualityTimeFrame]);

  // Save changes
  useEffect(() => {
    StorageService.saveDCBGRecords(dcbgRecords);
  }, [dcbgRecords]);

  useEffect(() => {
    StorageService.saveDCRORecords(dcroRecords);
  }, [dcroRecords]);

  useEffect(() => {
    StorageService.saveMonthlyHistory(monthlyHistory);
  }, [monthlyHistory]);

  useEffect(() => {
    StorageService.saveWeeklyDCBG(weeklyDCBG);
  }, [weeklyDCBG]);

  useEffect(() => {
    StorageService.saveMonthlyNSLDDCBG(monthlyNSLDDCBG);
  }, [monthlyNSLDDCBG]);

  useEffect(() => {
    StorageService.saveDailyNSLDRMA(dailyNSLDRMA);
  }, [dailyNSLDRMA]);

  useEffect(() => {
    StorageService.saveMatrixRO(matrixRO);
  }, [matrixRO]);

  useEffect(() => {
    StorageService.saveMatrixBG(matrixBG);
  }, [matrixBG]);

  useEffect(() => {
    StorageService.saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    StorageService.saveThresholds(thresholds);
  }, [thresholds]);

  // Request browser notification
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch (err) {
        console.warn('Error requesting notification permission', err);
        return false;
      }
    }
    return false;
  };

  // Helper to dispatch alert + browser notification
  const triggerAlert = useCallback((
    type: PushAlert['type'],
    severity: PushAlert['severity'],
    title: string,
    message: string,
    dcSource: PushAlert['dcSource']
  ) => {
    const newAlert: PushAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type,
      severity,
      title,
      message,
      dcSource,
      isRead: false,
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // keep latest 50

    // Browser Push
    if (thresholds.enableBrowserPush && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`[PXLR Báo Cáo] ${title}`, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Browser notification error', e);
      }
    }
  }, [thresholds.enableBrowserPush]);

  const sendManualPushNotification = (title: string, message: string, severity: 'critical' | 'warning' | 'info' = 'info') => {
    triggerAlert('system', severity, title, message, 'PXLR');
  };

  // Calculate fields for DCBG
  const computeDCBG = (r: Partial<DailyDCBGRecord>): DailyDCBGRecord => {
    const congBepGa = Number(r.congBepGa) || 0;
    const congThoiVu = Number(r.congThoiVu) || 0;
    const congRma = Number(r.congRma) || 0;
    const sanLuongBepGa = Number(r.sanLuongBepGa) || 0;
    const sanLuongRma = Number(r.sanLuongRma) || 0;
    const dinhMucSlTheoNs = Number(r.dinhMucSlTheoNs) || 0;
    const tongNhanSuLine = Number(r.tongNhanSuLine) || 0;
    const nhanSuNghi = Number(r.nhanSuNghi) || 0;
    const chiPhiHangHong = Number(r.chiPhiHangHong) || 0;
    const tiLeLoiThaoTac = Number(r.tiLeLoiThaoTac) || 0;

    const tongCong = congBepGa + congThoiVu + congRma;
    const tongSanLuongQuyDoi = sanLuongBepGa + sanLuongRma;
    const nsldTheoNgay = dinhMucSlTheoNs > 0 ? Number(((tongSanLuongQuyDoi / dinhMucSlTheoNs) * 100).toFixed(2)) : 0;
    const tiLeDiLam = tongNhanSuLine > 0 ? Number((((tongNhanSuLine - nhanSuNghi) / tongNhanSuLine) * 100).toFixed(2)) : 0;
    
    // KHSX Ngày & Tỉ lệ hoàn thành KHSX = Sản lượng quy đổi / KHSX Ngày
    const khsxNgay = Number(r.khsxNgay) || 520;
    const tiLeHoanThanhKhsx = khsxNgay > 0 ? Number(((tongSanLuongQuyDoi / khsxNgay) * 100).toFixed(1)) : 0;

    return {
      id: r.id || `dcbg-${Date.now()}`,
      date: r.date || todayStr,
      congBepGa,
      congThoiVu,
      congRma,
      sanLuongBepGa,
      sanLuongRma,
      dinhMucSlTheoNs,
      tongNhanSuLine,
      nhanSuNghi,
      chiPhiHangHong,
      tiLeLoiThaoTac,
      ghiChu: r.ghiChu || '',
      tongCong,
      tongSanLuongQuyDoi,
      nsldTheoNgay,
      tiLeDiLam,
      khsxNgay,
      tiLeHoanThanhKhsx,
    };
  };

  // Calculate fields for DCRO
  const computeDCRO = (r: Partial<DailyDCRORecord>): DailyDCRORecord => {
    const congChinhThuc = Number(r.congChinhThuc) || 0;
    const congThoiVu = Number(r.congThoiVu) || 0;
    const sanLuongLineChinh = Number(r.sanLuongLineChinh) || 0;
    const tongNhanSuLine = Number(r.tongNhanSuLine) || 0;
    const nhanSuNghi = Number(r.nhanSuNghi) || 0;
    const chiPhiHangHong = Number(r.chiPhiHangHong) || 0;
    const tiLeLoiThaoTac = Number(r.tiLeLoiThaoTac) || 0;

    const tongCong = congChinhThuc + congThoiVu;
    const tongSanLuongQuyDoi = sanLuongLineChinh;
    // Chuẩn định mức SL theo NS nhóm RO: = (Công chính thức + Công thời vụ) * 9.03
    const dinhMucSlTheoNs = Number(r.dinhMucSlTheoNs) > 0 
      ? Number(r.dinhMucSlTheoNs) 
      : Number((tongCong * 9.03).toFixed(3));
    const nsldTheoNgay = dinhMucSlTheoNs > 0 ? Number(((tongSanLuongQuyDoi / dinhMucSlTheoNs) * 100).toFixed(2)) : 0;
    const tiLeDiLam = tongNhanSuLine > 0 ? Number((((tongNhanSuLine - nhanSuNghi) / tongNhanSuLine) * 100).toFixed(2)) : 0;
    const khsxNgay = Number(r.khsxNgay) || 0;
    // CÔNG THỨC: TỈ LỆ HOÀN THÀNH KHSX = SẢN LƯỢNG QUY ĐỔI LINE CHÍNH / KHSX NGÀY
    const tiLeHoanThanhKhsx = khsxNgay > 0 ? Number(((sanLuongLineChinh / khsxNgay) * 100).toFixed(1)) : 0;

    return {
      id: r.id || `dcro-${Date.now()}`,
      date: r.date || todayStr,
      congChinhThuc,
      congThoiVu,
      sanLuongLineChinh,
      dinhMucSlTheoNs,
      tongNhanSuLine,
      nhanSuNghi,
      chiPhiHangHong,
      tiLeLoiThaoTac,
      ghiChu: r.ghiChu || '',
      tongCong,
      tongSanLuongQuyDoi,
      nsldTheoNgay,
      tiLeDiLam,
      khsxNgay,
      tiLeHoanThanhKhsx,
    };
  };

  // Check metrics against thresholds
  const checkMetricsAlerts = useCallback((record: DailyDCBGRecord | DailyDCRORecord, dcType: 'DCBG' | 'DCRO') => {
    if (record.tiLeDiLam < thresholds.minAttendanceRate && record.tongNhanSuLine > 0) {
      triggerAlert(
        'attendance',
        'critical',
        `Biến động nhân sự ${dcType}: Tỉ lệ đi làm giảm thấp`,
        `Tỉ lệ đi làm của ${dcType} chỉ đạt ${record.tiLeDiLam}% (ngưỡng an toàn: ≥${thresholds.minAttendanceRate}%). Nghỉ: ${record.nhanSuNghi}/${record.tongNhanSuLine} người.`,
        dcType
      );
    }
    if (record.nsldTheoNgay < thresholds.minProductivityRate && record.dinhMucSlTheoNs > 0) {
      triggerAlert(
        'productivity',
        'warning',
        `Cảnh báo NSLĐ ${dcType}: Chưa đạt định mức`,
        `Năng suất lao động ${dcType} đạt ${record.nsldTheoNgay}% (mục tiêu: ≥${thresholds.minProductivityRate}%).`,
        dcType
      );
    }
    if (record.chiPhiHangHong > thresholds.maxDefectCostPerDay) {
      triggerAlert(
        'defect',
        'critical',
        `Cảnh báo hàng hỏng ${dcType}: Vượt định mức chi phí`,
        `Chi phí hàng hỏng tại ${dcType} ghi nhận ${(record.chiPhiHangHong / 1e6).toFixed(2)} triệu VNĐ (giới hạn: ${(thresholds.maxDefectCostPerDay / 1e6).toFixed(2)} triệu VNĐ).`,
        dcType
      );
    }
    if (record.tiLeLoiThaoTac > thresholds.maxErrorRate) {
      triggerAlert(
        'defect',
        'warning',
        `Cảnh báo lỗi thao tác ${dcType}: Tăng đột biến`,
        `Tỉ lệ lỗi thao tác ${dcType} là ${record.tiLeLoiThaoTac}% (ngưỡng cho phép: ≤${thresholds.maxErrorRate}%).`,
        dcType
      );
    }
  }, [thresholds, triggerAlert]);

  // Update existing DCBG record
  const updateDCBGRecord = (changes: Partial<DailyDCBGRecord>) => {
    if (isDateLocked(selectedDate)) {
      console.warn(`Attempted to update locked DCBG record for ${selectedDate}`);
      return;
    }
    const [year, month, day] = selectedDate.split('-').map(Number);
    const monthIndex0 = month - 1;

    setDcbgRecords(prev => {
      const existingIndex = prev.findIndex(r => r.date === selectedDate);
      let updated: DailyDCBGRecord;
      let next: DailyDCBGRecord[];

      if (existingIndex >= 0) {
        updated = computeDCBG({ ...prev[existingIndex], ...changes });
        next = [...prev];
        next[existingIndex] = updated;
      } else {
        updated = computeDCBG({ date: selectedDate, ...changes });
        next = [updated, ...prev];
      }
      checkMetricsAlerts(updated, 'DCBG');
      return next;
    });

    // Also update the Matrix for the corresponding month/day
    const currentMatrix = StorageService.getMatrixBGForMonth(year, monthIndex0);
    const dayStr = String(day).padStart(2, '0');
    const targetId = `bg-${year}-${month}-${dayStr}`;
    
    const updatedMatrix = currentMatrix.map(col => {
      if (col.id === targetId || col.dateStr === selectedDate) {
        // Sync fields from changes
        return {
          ...col,
          congBepGa: changes.congBepGa !== undefined ? Number(changes.congBepGa) : col.congBepGa,
          congThoiVu: changes.congThoiVu !== undefined ? Number(changes.congThoiVu) : col.congThoiVu,
          congRma: changes.congRma !== undefined ? Number(changes.congRma) : col.congRma,
          sanLuongBepGa: changes.sanLuongBepGa !== undefined ? Number(changes.sanLuongBepGa) : col.sanLuongBepGa,
          sanLuongRma: changes.sanLuongRma !== undefined ? Number(changes.sanLuongRma) : col.sanLuongRma,
          dinhMucSlTheoNs: changes.dinhMucSlTheoNs !== undefined ? Number(changes.dinhMucSlTheoNs) : col.dinhMucSlTheoNs,
          khsxNgay: changes.khsxNgay !== undefined ? Number(changes.khsxNgay) : col.khsxNgay,
          tongNhanSuLine: changes.tongNhanSuLine !== undefined ? Number(changes.tongNhanSuLine) : col.tongNhanSuLine,
          nhanSuNghi: changes.nhanSuNghi !== undefined ? Number(changes.nhanSuNghi) : col.nhanSuNghi,
          tiLeDiLam: changes.tiLeDiLam !== undefined ? Number(changes.tiLeDiLam) : col.tiLeDiLam,
          tiLeLoiThaoTac: changes.tiLeLoiThaoTac !== undefined ? Number(changes.tiLeLoiThaoTac) : col.tiLeLoiThaoTac,
        };
      }
      return col;
    });

    const recalculated = recalculateBGMatrix(updatedMatrix);
    updateMatrixBGForMonth(year, monthIndex0, recalculated);
  };

  // Update existing DCRO record
  const updateDCRORecord = (changes: Partial<DailyDCRORecord>) => {
    if (isDateLocked(selectedDate)) {
      console.warn(`Attempted to update locked DCRO record for ${selectedDate}`);
      return;
    }
    const [year, month, day] = selectedDate.split('-').map(Number);
    const monthIndex0 = month - 1;

    setDcroRecords(prev => {
      const existingIndex = prev.findIndex(r => r.date === selectedDate);
      let updated: DailyDCRORecord;
      let next: DailyDCRORecord[];

      if (existingIndex >= 0) {
        updated = computeDCRO({ ...prev[existingIndex], ...changes });
        next = [...prev];
        next[existingIndex] = updated;
      } else {
        updated = computeDCRO({ date: selectedDate, ...changes });
        next = [updated, ...prev];
      }
      checkMetricsAlerts(updated, 'DCRO');
      return next;
    });

    // Also update the Matrix for the corresponding month/day
    const currentMatrix = StorageService.getMatrixROForMonth(year, monthIndex0);
    const dayStr = String(day).padStart(2, '0');
    const targetId = `ro-${year}-${month}-${dayStr}`;
    
    const updatedMatrix = currentMatrix.map(col => {
      if (col.id === targetId || col.dateStr === selectedDate) {
        return {
          ...col,
          congChinhThuc: changes.congChinhThuc !== undefined ? Number(changes.congChinhThuc) : col.congChinhThuc,
          congThoiVu: changes.congThoiVu !== undefined ? Number(changes.congThoiVu) : col.congThoiVu,
          sanLuongLineChinh: changes.sanLuongLineChinh !== undefined ? Number(changes.sanLuongLineChinh) : col.sanLuongLineChinh,
          dinhMucSlTheoNs: changes.dinhMucSlTheoNs !== undefined ? Number(changes.dinhMucSlTheoNs) : col.dinhMucSlTheoNs,
          khsxNgay: changes.khsxNgay !== undefined ? Number(changes.khsxNgay) : col.khsxNgay,
          tongNhanSuLine: changes.tongNhanSuLine !== undefined ? Number(changes.tongNhanSuLine) : col.tongNhanSuLine,
          nhanSuNghi: changes.nhanSuNghi !== undefined ? Number(changes.nhanSuNghi) : col.nhanSuNghi,
          tiLeDiLam: changes.tiLeDiLam !== undefined ? Number(changes.tiLeDiLam) : col.tiLeDiLam,
          tiLeLoiThaoTac: changes.tiLeLoiThaoTac !== undefined ? Number(changes.tiLeLoiThaoTac) : col.tiLeLoiThaoTac,
        };
      }
      return col;
    });

    const recalculated = recalculateROMatrix(updatedMatrix);
    updateMatrixROForMonth(year, monthIndex0, recalculated);
  };

  const saveNewDCBGRecord = (rec: Omit<DailyDCBGRecord, 'id'>) => {
    if (isDateLocked(rec.date)) {
      console.warn(`Attempted to save locked DCBG record for ${rec.date}`);
      return;
    }
    const computed = computeDCBG(rec);
    checkMetricsAlerts(computed, 'DCBG');
    setDcbgRecords(prev => [computed, ...prev.filter(r => r.date !== computed.date)]);
  };

  const saveNewDCRORecord = (rec: Omit<DailyDCRORecord, 'id'>) => {
    if (isDateLocked(rec.date)) {
      console.warn(`Attempted to save locked DCRO record for ${rec.date}`);
      return;
    }
    const computed = computeDCRO(rec);
    checkMetricsAlerts(computed, 'DCRO');
    setDcroRecords(prev => [computed, ...prev.filter(r => r.date !== computed.date)]);
  };

  // Active records for selected date - DERIVE FROM MATRIX IF POSSIBLE for sync
  const activeDCBGRecord: DailyDCBGRecord = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const monthIndex0 = month - 1;
    const currentMatrix = StorageService.getMatrixBGForMonth(year, monthIndex0);
    const dayStr = String(day).padStart(2, '0');
    const targetId = `bg-${year}-${month}-${dayStr}`;
    const matrixCol = currentMatrix.find(c => c.id === targetId || c.dateStr === selectedDate);

    if (matrixCol && !matrixCol.isWeeklyTotal && !matrixCol.isMonthlyTotal) {
      return {
        id: matrixCol.id,
        date: selectedDate,
        congBepGa: matrixCol.congBepGa || 0,
        congThoiVu: matrixCol.congThoiVu || 0,
        congRma: matrixCol.congRma || 0,
        sanLuongBepGa: matrixCol.sanLuongBepGa || 0,
        sanLuongRma: matrixCol.sanLuongRma || 0,
        dinhMucSlTheoNs: matrixCol.dinhMucSlTheoNs || 480,
        tongNhanSuLine: matrixCol.tongNhanSuLine || 55,
        nhanSuNghi: matrixCol.nhanSuNghi || 0,
        chiPhiHangHong: 0, // Not in matrix
        tiLeLoiThaoTac: matrixCol.tiLeLoiThaoTac || 0,
        ghiChu: '',
        tongCong: (matrixCol.congBepGa || 0) + (matrixCol.congThoiVu || 0) + (matrixCol.congRma || 0),
        tongSanLuongQuyDoi: (matrixCol.sanLuongBepGa || 0) + (matrixCol.sanLuongRma || 0),
        nsldTheoNgay: matrixCol.nsldTheoNgay || 0,
        tiLeDiLam: matrixCol.tiLeDiLam || 100,
        khsxNgay: matrixCol.khsxNgay || 720,
        tiLeHoanThanhKhsx: matrixCol.tiLeHoanThanhKhsx || 0,
      };
    }

    const found = dcbgRecords.find(r => r.date === selectedDate);
    if (found) return found;
    return computeDCBG({ date: selectedDate, tongNhanSuLine: 55, dinhMucSlTheoNs: 480 });
  }, [dcbgRecords, selectedDate, matrixBG]);

  const activeDCRORecord: DailyDCRORecord = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const monthIndex0 = month - 1;
    const currentMatrix = StorageService.getMatrixROForMonth(year, monthIndex0);
    const dayStr = String(day).padStart(2, '0');
    const targetId = `ro-${year}-${month}-${dayStr}`;
    const matrixCol = currentMatrix.find(c => c.id === targetId || c.dateStr === selectedDate);

    if (matrixCol && !matrixCol.isWeeklyTotal && !matrixCol.isMonthlyTotal) {
      return {
        id: matrixCol.id,
        date: selectedDate,
        congChinhThuc: matrixCol.congChinhThuc || 0,
        congThoiVu: matrixCol.congThoiVu || 0,
        sanLuongLineChinh: matrixCol.sanLuongLineChinh || 0,
        dinhMucSlTheoNs: matrixCol.dinhMucSlTheoNs || 540,
        tongNhanSuLine: matrixCol.tongNhanSuLine || 62,
        nhanSuNghi: matrixCol.nhanSuNghi || 0,
        chiPhiHangHong: 0,
        tiLeLoiThaoTac: matrixCol.tiLeLoiThaoTac || 0,
        ghiChu: '',
        tongCong: (matrixCol.congChinhThuc || 0) + (matrixCol.congThoiVu || 0),
        tongSanLuongQuyDoi: matrixCol.sanLuongLineChinh || 0,
        nsldTheoNgay: matrixCol.nsldTheoNgay || 0,
        tiLeDiLam: matrixCol.tiLeDiLam || 100,
        khsxNgay: matrixCol.khsxNgay || 0,
        tiLeHoanThanhKhsx: matrixCol.tiLeHoanThanhKhsx || 0,
      };
    }

    const found = dcroRecords.find(r => r.date === selectedDate);
    if (found) return found;
    return computeDCRO({ date: selectedDate, tongNhanSuLine: 62, dinhMucSlTheoNs: 540 });
  }, [dcroRecords, selectedDate, matrixRO]);

  // Consolidated PXLR Data (Automatically synchronized)
  const consolidatedPXLR: DailyPXLRConsolidated = useMemo(() => {
    const tongCong = activeDCBGRecord.tongCong + activeDCRORecord.tongCong;
    const tongCongChinhThuc = activeDCBGRecord.congBepGa + activeDCRORecord.congChinhThuc;
    const tongCongThoiVu = activeDCBGRecord.congThoiVu + activeDCRORecord.congThoiVu;
    const tongSanLuongQuyDoi = activeDCBGRecord.tongSanLuongQuyDoi + activeDCRORecord.tongSanLuongQuyDoi;
    const tongDinhMucSl = activeDCBGRecord.dinhMucSlTheoNs + activeDCRORecord.dinhMucSlTheoNs;
    const nsldTrungBinh = tongDinhMucSl > 0 ? Number(((tongSanLuongQuyDoi / tongDinhMucSl) * 100).toFixed(2)) : 0;
    const tongNhanSu = activeDCBGRecord.tongNhanSuLine + activeDCRORecord.tongNhanSuLine;
    const tongNghi = activeDCBGRecord.nhanSuNghi + activeDCRORecord.nhanSuNghi;
    const tiLeDiLam = tongNhanSu > 0 ? Number((((tongNhanSu - tongNghi) / tongNhanSu) * 100).toFixed(2)) : 0;
    const tongChiPhiHangHong = activeDCBGRecord.chiPhiHangHong + activeDCRORecord.chiPhiHangHong;
    // Yêu cầu: "PXLR Tổng hợp tỉ lệ lỗi sẽ lấy từ data silde Chất Lượng"
    // Tỉ lệ lỗi thao tác / 4M của PXLR được đồng bộ chuẩn xác từ Slide 2 Chất Lượng
    const tiLeLoiThaoTacTB = qualityMetrics.pxlr.totalLoi4M;
    const keHoachSanXuat = tongDinhMucSl;
    const tiLeHoanThanhKH = keHoachSanXuat > 0 ? Number(((tongSanLuongQuyDoi / keHoachSanXuat) * 100).toFixed(2)) : 0;

    // Đảm bảo thông số lỗi thao tác của DCBG và DCRO cũng liên kết với data Slide Chất Lượng
    const effectiveDcbg = {
      ...activeDCBGRecord,
      tiLeLoiThaoTac: activeDCBGRecord.tiLeLoiThaoTac > 0 ? activeDCBGRecord.tiLeLoiThaoTac : qualityMetrics.bg.totalLoi4M,
    };
    const effectiveDcro = {
      ...activeDCRORecord,
      tiLeLoiThaoTac: activeDCRORecord.tiLeLoiThaoTac > 0 ? activeDCRORecord.tiLeLoiThaoTac : qualityMetrics.ro.totalLoi4M,
    };

    return {
      date: selectedDate,
      tongCong,
      tongCongChinhThuc,
      tongCongThoiVu,
      tongSanLuongQuyDoi,
      tongDinhMucSl,
      nsldTrungBinh,
      tongNhanSu,
      tongNghi,
      tiLeDiLam,
      tongChiPhiHangHong,
      tiLeLoiThaoTacTB,
      keHoachSanXuat,
      tiLeHoanThanhKH,
      dcbg: effectiveDcbg,
      dcro: effectiveDcro,
      qualityMetrics,
    };
  }, [activeDCBGRecord, activeDCRORecord, selectedDate, qualityMetrics]);

  // Simulator helper: What-if resource transfer
  const simulateResourceTransfer = (
    fromDC: 'DCBG' | 'DCRO',
    toDC: 'DCBG' | 'DCRO',
    workerCount: number
  ) => {
    // Standard productivity rate per worker:
    // DCBG: ~9.5 products / man-day
    // DCRO: ~9.2 products / man-day
    const prodPerWorkerDCBG = 9.5;
    const prodPerWorkerDCRO = 9.2;

    const baseDCBGOut = activeDCBGRecord.tongSanLuongQuyDoi;
    const baseDCROOut = activeDCRORecord.tongSanLuongQuyDoi;
    const baseTotal = baseDCBGOut + baseDCROOut;

    let projDCBG = baseDCBGOut;
    let projDCRO = baseDCROOut;

    if (fromDC === 'DCRO' && toDC === 'DCBG') {
      projDCRO = Math.max(0, Math.round(baseDCROOut - workerCount * prodPerWorkerDCRO));
      projDCBG = Math.round(baseDCBGOut + workerCount * prodPerWorkerDCBG * 0.95); // 5% ramp-up learning curve
    } else if (fromDC === 'DCBG' && toDC === 'DCRO') {
      projDCBG = Math.max(0, Math.round(baseDCBGOut - workerCount * prodPerWorkerDCBG));
      projDCRO = Math.round(baseDCROOut + workerCount * prodPerWorkerDCRO * 0.95);
    }

    const projectedTotal = projDCBG + projDCRO;
    const delta = projectedTotal - baseTotal;

    let recommendation = '';
    if (delta >= 0) {
      recommendation = `Điều phối ${workerCount} nhân sự từ ${fromDC} sang ${toDC} dự kiến duy trì hoặc gia tăng thêm ${Math.abs(delta)} sản phẩm quy đổi do hiệu suất đòn bẩy line tiếp nhận cao.`;
    } else {
      recommendation = `Điều chuyển ${workerCount} nhân sự sang ${toDC} sẽ giảm sản lượng ròng ${Math.abs(delta)} sp, tuy nhiên giúp giải tỏa ách tắc khâu lắp ráp trọng yếu.`;
    }

    return {
      projectedDCBGOutput: projDCBG,
      projectedDCROOutput: projDCRO,
      projectedTotalOutput: projectedTotal,
      projectedDelta: delta,
      recommendation,
    };
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const updateMonthlyRecord = (monthNum: number, updatedFields: Partial<MonthlyHistoryRecord>) => {
    setMonthlyHistory(prev => {
      const updated = prev.map(m => m.monthNum === monthNum ? { ...m, ...updatedFields } : m);
      StorageService.saveMonthlyHistory(updated);
      return updated;
    });
  };

  const updateAllMonthlyRecords = (records: MonthlyHistoryRecord[]) => {
    setMonthlyHistory(records);
    StorageService.saveMonthlyHistory(records);
  };

  const resetMonthlyHistory = () => {
    setMonthlyHistory(MONTHLY_HISTORY);
    StorageService.saveMonthlyHistory(MONTHLY_HISTORY);
  };

  // Dynamic cumulative NSLD 2025 vs 2026 based on monthly data
  const cumulativeNSLD = useMemo(() => {
    const valid2025 = monthlyHistory.filter(m => m.nsld2025 > 0);
    const avg2025 = valid2025.length > 0 
      ? Number((valid2025.reduce((sum, m) => sum + m.nsld2025, 0) / valid2025.length).toFixed(2))
      : 101.03;

    const valid2026 = monthlyHistory.filter(m => m.nsld2026 > 0);
    const avg2026 = valid2026.length > 0
      ? Number((valid2026.reduce((sum, m) => sum + m.nsld2026, 0) / valid2026.length).toFixed(2))
      : 110.19;

    return { nsld2025: avg2025, nsld2026: avg2026 };
  }, [monthlyHistory]);

  const updateWeeklyDCBG = useCallback((records: WeeklyDCBGRecord[]) => {
    setWeeklyDCBG(records);
  }, []);

  const resetWeeklyDCBG = useCallback(() => {
    setWeeklyDCBG(INITIAL_WEEKLY_DCBG);
    StorageService.saveWeeklyDCBG(INITIAL_WEEKLY_DCBG);
  }, []);

  const updateMonthlyNSLDDCBG = useCallback((records: MonthlyNSLDDCBGRecord[]) => {
    setMonthlyNSLDDCBG(records);
  }, []);

  const resetMonthlyNSLDDCBG = useCallback(() => {
    setMonthlyNSLDDCBG(INITIAL_MONTHLY_NSLD_DCBG);
    StorageService.saveMonthlyNSLDDCBG(INITIAL_MONTHLY_NSLD_DCBG);
  }, []);

  const updateDailyNSLDRMA = useCallback((records: DailyNSLDRMARecord[]) => {
    setDailyNSLDRMA(records);
  }, []);

  const resetDailyNSLDRMA = useCallback(() => {
    setDailyNSLDRMA(INITIAL_DAILY_NSLD_RMA);
    StorageService.saveDailyNSLDRMA(INITIAL_DAILY_NSLD_RMA);
  }, []);

  const updateMatrixRO = useCallback((columns: ExcelMatrixROColumn[]) => {
    setMatrixRO(columns);
  }, []);

  const updateMatrixROForMonth = useCallback((year: number, monthIndex0: number, columns: ExcelMatrixROColumn[]) => {
    StorageService.saveMatrixROForMonth(year, monthIndex0, columns);
    // If it's the current selected year/month, update state too
    // In a real app we might want to track current dashboard month in context
    // For now, if year/month matches what's expected for 'current'
    if (year === 2026 && monthIndex0 === 8) {
      setMatrixRO(columns);
    }
    // Notify components that data has updated
    window.dispatchEvent(new CustomEvent('production-data-updated', { 
      detail: { type: 'matrix-ro', year, monthIndex0 } 
    }));
  }, []);

  const resetMatrixRO = useCallback(() => {
    setMatrixRO(INITIAL_MATRIX_RO);
    StorageService.saveMatrixRO(INITIAL_MATRIX_RO);
  }, []);

  const updateMatrixBG = useCallback((columns: ExcelMatrixBGColumn[]) => {
    setMatrixBG(columns);
  }, []);

  const updateMatrixBGForMonth = useCallback((year: number, monthIndex0: number, columns: ExcelMatrixBGColumn[]) => {
    StorageService.saveMatrixBGForMonth(year, monthIndex0, columns);
    if (year === 2026 && monthIndex0 === 8) {
      setMatrixBG(columns);
    }
    window.dispatchEvent(new CustomEvent('production-data-updated', { 
      detail: { type: 'matrix-bg', year, monthIndex0 } 
    }));
  }, []);

  const resetMatrixBG = useCallback(() => {
    setMatrixBG(INITIAL_MATRIX_BG);
    StorageService.saveMatrixBG(INITIAL_MATRIX_BG);
  }, []);

  const unreadAlertCount = useMemo(() => alerts.filter(a => !a.isRead).length, [alerts]);

  return (
    <ProductionContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        dcbgRecords,
        dcroRecords,
        activeDCBGRecord,
        activeDCRORecord,
        consolidatedPXLR,
        monthlyHistory,
        weeklyHistory: WEEKLY_HISTORY,
        cumulativeNSLD,
        updateMonthlyRecord,
        updateAllMonthlyRecords,
        resetMonthlyHistory,
        weeklyDCBG,
        updateWeeklyDCBG,
        resetWeeklyDCBG,
        monthlyNSLDDCBG,
        updateMonthlyNSLDDCBG,
        resetMonthlyNSLDDCBG,
        dailyNSLDRMA,
        updateDailyNSLDRMA,
        resetDailyNSLDRMA,
        matrixRO,
        updateMatrixRO,
        updateMatrixROForMonth,
        resetMatrixRO,
        matrixBG,
        updateMatrixBG,
        updateMatrixBGForMonth,
        resetMatrixBG,
        alerts,
        unreadAlertCount,
        thresholds,
        updateDCBGRecord,
        updateDCRORecord,
        saveNewDCBGRecord,
        saveNewDCRORecord,
        updateThresholds: setThresholds,
        markAlertAsRead,
        clearAllAlerts,
        requestNotificationPermission,
        sendManualPushNotification,
        simulateResourceTransfer,
        slide2Quality,
        updateSlide2Quality,
        qualityTimeFrame,
        setQualityTimeFrame,
        qualityMetrics,
        GLOBAL_LOCK_DATE,
        isDateLocked,
        isWeekLocked,
      }}
    >
      {children}
    </ProductionContext.Provider>
  );

};

export const useProduction = () => {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
};

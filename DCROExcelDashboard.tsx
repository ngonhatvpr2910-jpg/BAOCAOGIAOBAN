import React, { useState, useEffect, useMemo } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { StorageService } from './storage';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  Table, 
  BarChart3, 
  Save, 
  RotateCcw, 
  Check, 
  Droplets, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Flag,
  Plus,
  X,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { 
  recalculateROMatrix, 
  generateMonthROMatrix,
  getCutoffDaysFromMatrix,
  getDayNumberFromCol,
  applyWeekCutoffsToROMatrix,
  isColumnSunday,
  calculateRecurringCutoffs,
  getCutoffsByDayOfWeek,
  getDaysInMonth,
  WeekLabelMode,
  MONTH_NAMES_SHORT,
} from './matrixGenerator';
import { ExcelMatrixROColumn, ExcelMatrixBGColumn } from './types';
import { WeekCutoffModal } from './WeekCutoffModal';
import { exportProductionTemplate, importProductionExcel } from './excelProductionService';

export const DCROExcelDashboard: React.FC = () => {
  const { updateMatrixBGForMonth, updateMatrixROForMonth, isDateLocked } = useProduction();
  const { canEditDCRO } = useAuth();

  const canEditCell = (col: ExcelMatrixROColumn) => {
    if (!canEditDCRO) return false;
    if (col.dateStr && isDateLocked(col.dateStr)) return false;
    return true;
  };

  // Current system month/year (September 2026 in environment, monthIndex0 = 8)
  const now = new Date();
  const sysYear = now.getFullYear() || 2026;
  const sysMonthIndex0 = now.getMonth() >= 0 && now.getMonth() <= 11 ? now.getMonth() : 8;

  // Selected Month State
  const [selectedYear, setSelectedYear] = useState<number>(sysYear);
  const [selectedMonthIndex0, setSelectedMonthIndex0] = useState<number>(sysMonthIndex0);

  // Local matrix data for the chosen month
  const [localMatrix, setLocalMatrix] = useState<ExcelMatrixROColumn[]>(() => {
    return StorageService.getMatrixROForMonth(sysYear, sysMonthIndex0);
  });

  const [showMatrixEditor, setShowMatrixEditor] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [importing, setImporting] = useState(false);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollMatrix = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = 300;
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToToday = () => {
    if (tableContainerRef.current) {
      const today = new Date();
      const day = today.getDate();
      const month = MONTH_NAMES_SHORT[today.getMonth()];
      const targetLabel = `${String(day).padStart(2, '0')}-${month}`;
      
      const colIndex = localMatrix.findIndex(c => c.label === targetLabel);
      if (colIndex !== -1) {
        const colWidth = 78; // min-w-[78px]
        tableContainerRef.current.scrollTo({
          left: colIndex * colWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  // Load matrix whenever selected month changes or when external update occurs
  useEffect(() => {
    const refreshData = () => {
      const data = StorageService.getMatrixROForMonth(selectedYear, selectedMonthIndex0);
      setLocalMatrix(data);
    };

    refreshData();

    const handleUpdate = (e: any) => {
      if (e.detail?.type === 'matrix-ro' && e.detail?.year === selectedYear && e.detail?.monthIndex0 === selectedMonthIndex0) {
        refreshData();
      }
    };

    window.addEventListener('production-data-updated', handleUpdate);
    return () => window.removeEventListener('production-data-updated', handleUpdate);
  }, [selectedYear, selectedMonthIndex0]);

  // Recalculate dynamic totals when any day cell is edited
  const handleMatrixCellChange = (colId: string, field: keyof ExcelMatrixROColumn, val: string) => {
    const numVal = parseFloat(val) || 0;
    setLocalMatrix(prev => {
      const next = prev.map(col => {
        if (col.id === colId) {
          const updated = { ...col, [field]: numVal };
          // Tự động tính ĐỊNH MỨC SL THEO NS chuẩn nhóm RO: = (Công Chính Thức + Công Thời Vụ) * 9.03
          if (field === 'congChinhThuc' || field === 'congThoiVu') {
            const sumCong = (Number(updated.congChinhThuc) || 0) + (Number(updated.congThoiVu) || 0);
            updated.dinhMucSlTheoNs = Number((sumCong * 9.03).toFixed(1));
          }
          // If editing SL or định mức or công, auto update NSLĐ
          if (
            field === 'sanLuongLineChinh' || 
            field === 'dinhMucSlTheoNs' || 
            field === 'congChinhThuc' || 
            field === 'congThoiVu'
          ) {
            const sl = Number(updated.sanLuongLineChinh) || 0;
            const dm = Number(updated.dinhMucSlTheoNs) || 0;
            updated.nsldTheoNgay = dm > 0 ? Number(((sl / dm) * 100).toFixed(1)) : 0;
          }
          // If editing KHSX, update tỉ lệ hoàn thành KHSX
          if (field === 'sanLuongLineChinh' || field === 'khsxNgay') {
            const sl = Number(updated.sanLuongLineChinh) || 0;
            const kh = Number(updated.khsxNgay) || 0;
            updated.tiLeHoanThanhKhsx = kh > 0 ? Number(((sl / kh) * 100).toFixed(1)) : 0;
          }
          // If editing Tổng nhân sự or Nghỉ, auto update Tỉ Lệ Đi Làm: =+(B10-B11)/100%/B10
          if (field === 'tongNhanSuLine' || field === 'nhanSuNghi') {
            const tongNS = Number(updated.tongNhanSuLine) || 0;
            const nghi = Number(updated.nhanSuNghi) || 0;
            updated.tiLeDiLam = tongNS > 0 ? Number((((tongNS - nghi) / tongNS) * 100).toFixed(1)) : 100;
          }
          return updated;
        }
        return col;
      });

      const recalculated = recalculateROMatrix(next);
      // Tự động lưu tức thời vào StorageService để đồng bộ số liệu sang Slide 1 & PXLR
      StorageService.saveMatrixROForMonth(selectedYear, selectedMonthIndex0, recalculated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('production-data-updated', {
          detail: { type: 'matrix-ro', year: selectedYear, monthIndex0: selectedMonthIndex0 }
        }));
      }
      return recalculated;
    });
  };

  const handleSaveMatrix = () => {
    StorageService.saveMatrixROForMonth(selectedYear, selectedMonthIndex0, localMatrix);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('production-data-updated', {
        detail: { type: 'matrix-ro', year: selectedYear, monthIndex0: selectedMonthIndex0 }
      }));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetCurrentMonth = () => {
    const fresh = generateMonthROMatrix(selectedYear, selectedMonthIndex0);
    setLocalMatrix(fresh);
    StorageService.saveMatrixROForMonth(selectedYear, selectedMonthIndex0, fresh);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('production-data-updated', {
        detail: { type: 'matrix-ro', year: selectedYear, monthIndex0: selectedMonthIndex0 }
      }));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState(false);
  const currentCutoffs = useMemo(() => getCutoffDaysFromMatrix(localMatrix), [localMatrix]);

  const handleApplyCutoffs = (newCutoffs: number[], weekLabelMode?: WeekLabelMode) => {
    const mode = weekLabelMode || StorageService.getWeekLabelMode();
    const updated = applyWeekCutoffsToROMatrix(localMatrix, newCutoffs, selectedYear, selectedMonthIndex0, mode);
    setLocalMatrix(updated);
    StorageService.saveMatrixROForMonth(selectedYear, selectedMonthIndex0, updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Quick 1-click apply recurring Thursdays (Thứ 5 tuần này -> W38)
  const handleQuickPresetThursday = () => {
    if (!canEditDCRO) return;
    const thuCutoffs = getCutoffsByDayOfWeek(selectedYear, selectedMonthIndex0, 4);
    handleApplyCutoffs(thuCutoffs, 'year');
  };

  // When clicking cutoff on a day: apply recurring 7-day cycle starting from that day!
  const handleApplyRecurringCutoffFromDay = (dayNum: number) => {
    if (!canEditDCRO) return;
    const totalDays = getDaysInMonth(selectedYear, selectedMonthIndex0);
    const recurring = calculateRecurringCutoffs(dayNum, totalDays);
    handleApplyCutoffs(recurring);
  };

  const handleToggleDayCutoff = (dayNum: number) => {
    if (!canEditDCRO) return;
    let newCutoffs: number[];
    if (currentCutoffs.includes(dayNum)) {
      newCutoffs = currentCutoffs.filter(d => d !== dayNum);
    } else {
      newCutoffs = [...currentCutoffs, dayNum].sort((a, b) => a - b);
    }
    handleApplyCutoffs(newCutoffs);
  };

  const handleRemoveCutoffByWeeklyCol = (colId: string) => {
    if (!canEditDCRO) return;
    const idx = localMatrix.findIndex(c => c.id === colId);
    if (idx > 0) {
      for (let j = idx - 1; j >= 0; j--) {
        if (!localMatrix[j].isWeeklyTotal && !localMatrix[j].isMonthlyTotal) {
          const dayNum = getDayNumberFromCol(localMatrix[j]);
          if (dayNum > 0) {
            handleToggleDayCutoff(dayNum);
          }
          break;
        }
      }
    }
  };

  const isColSunday = (col: ExcelMatrixROColumn) => isColumnSunday(col, selectedYear, selectedMonthIndex0);
  
  const formatValue = (val: any): string => {
    const n = Number(val);
    if (isNaN(n)) return '0';
    return n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  };

  const getCellBgClass = (col: ExcelMatrixROColumn) => {
    if (col.isMonthlyTotal) return 'bg-purple-50 font-bold text-purple-950 border-r border-slate-200';
    if (col.isWeeklyTotal) return 'bg-amber-100/70 font-bold text-amber-950 border-r border-slate-200';
    if (isColSunday(col)) {
      return 'bg-yellow-100/80 font-semibold text-yellow-950 border-r border-yellow-200/90 shadow-2xs';
    }
    return 'bg-white border-r border-slate-200';
  };

  const getInputClass = (col: ExcelMatrixROColumn) => {
    const isSun = isColSunday(col);
    return `w-full text-center border-0 font-medium rounded py-1 ${
      isSun
        ? 'bg-transparent text-yellow-950 focus:bg-white focus:ring-1 focus:ring-amber-500 font-semibold'
        : 'bg-transparent text-slate-800 focus:bg-white focus:ring-1 focus:ring-purple-500'
    }`;
  };

  // Derive charts data from active month's matrix
  const weeklyColsInMatrix = useMemo(() => {
    return localMatrix.filter(c => c.isWeeklyTotal);
  }, [localMatrix]);

  const chartDataNSLD = useMemo(() => {
    // If weekly totals exist, show all weeks in month
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(c => ({
        label: c.weekRange ? `${c.label} (${c.weekRange})` : c.label,
        nsld: c.nsldTheoNgay,
        nsldFormatted: `${c.nsldTheoNgay}%`,
      }));
    }
    return localMatrix.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal).map(c => ({
      label: c.label,
      nsld: c.nsldTheoNgay,
      nsldFormatted: `${c.nsldTheoNgay}%`,
    }));
  }, [weeklyColsInMatrix, localMatrix]);

  const chartDataSanLuongVsKHSX = useMemo(() => {
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(c => ({
        label: c.weekRange ? `${c.label} (${c.weekRange})` : c.label,
        sanLuong: c.sanLuongLineChinh,
        khsx: c.khsxNgay,
        tiLeHT: c.tiLeHoanThanhKhsx,
      }));
    }
    return localMatrix.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal).map(c => ({
      label: c.label,
      sanLuong: c.sanLuongLineChinh,
      khsx: c.khsxNgay,
      tiLeHT: c.tiLeHoanThanhKhsx,
    }));
  }, [weeklyColsInMatrix, localMatrix]);

  const chartDataCong = useMemo(() => {
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(c => ({
        label: c.weekRange ? `${c.label} (${c.weekRange})` : c.label,
        chinhThuc: c.congChinhThuc,
        thoiVu: c.congThoiVu,
        tong: Number((c.congChinhThuc + c.congThoiVu).toFixed(1)),
      }));
    }
    return localMatrix.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal).map(c => ({
      label: c.label,
      chinhThuc: c.congChinhThuc,
      thoiVu: c.congThoiVu,
      tong: Number((c.congChinhThuc + c.congThoiVu).toFixed(1)),
    }));
  }, [weeklyColsInMatrix, localMatrix]);

  const chartDataTiLeDiLam = useMemo(() => {
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(c => ({
        label: c.weekRange ? `${c.label} (${c.weekRange})` : c.label,
        tiLe: c.tiLeDiLam,
        tiLeFormatted: `${c.tiLeDiLam}%`,
      }));
    }
    return localMatrix.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal).map(c => ({
      label: c.label,
      tiLe: c.tiLeDiLam,
      tiLeFormatted: `${c.tiLeDiLam}%`,
    }));
  }, [weeklyColsInMatrix, localMatrix]);

  const isCurrentMonth = selectedYear === sysYear && selectedMonthIndex0 === sysMonthIndex0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              THÁNG HIỆN HỮU: THÁNG {selectedMonthIndex0 + 1}/{selectedYear}
            </span>
            {isCurrentMonth && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                Tháng Hiện Tại
              </span>
            )}
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Droplets className="w-5 h-5 text-purple-600" />
              Bảng Nhập Dữ Liệu & Hệ Thống Đồ Thị Nhóm RO (Lắp Ráp)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bảng hiển thị theo tháng hiện hữu ({selectedMonthIndex0 + 1}/{selectedYear}) cho nhóm Lắp Ráp RO. Dữ liệu ngày tự động tính các tuần W1, W2, W3... và vẽ lại 4 đồ thị so sánh.
          </p>
        </div>

        {/* Quick Month Switcher Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setSelectedYear(sysYear);
                setSelectedMonthIndex0(sysMonthIndex0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isCurrentMonth
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tháng Hiện Hữu (T{sysMonthIndex0 + 1})</span>
            </button>

            <button
              onClick={() => {
                setSelectedYear(2026);
                setSelectedMonthIndex0(5); // June (index 5)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedMonthIndex0 === 5 && selectedYear === 2026
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng 6 (Mẫu Excel)
            </button>

            <select
              value={selectedMonthIndex0}
              onChange={(e) => setSelectedMonthIndex0(Number(e.target.value))}
              aria-label="Chọn tháng làm việc"
              className="bg-transparent text-xs font-bold text-slate-700 px-2 py-1 outline-hidden cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowMatrixEditor(!showMatrixEditor)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Table className="w-4 h-4 text-purple-600" />
            <span>{showMatrixEditor ? 'Ẩn Ma Trận' : 'Hiện Ma Trận'}</span>
            {showMatrixEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
            <button
              onClick={() => exportProductionTemplate(selectedYear, selectedMonthIndex0)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-300"
              title="Tải file Excel mẫu để cập nhật dữ liệu"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Tải File Mẫu</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200 shadow-2xs">
              <Plus className="w-4 h-4" />
              <span>{importing ? 'Đang xử lý...' : 'Up Dữ Liệu'}</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                disabled={importing}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImporting(true);
                  try {
                    const result = await importProductionExcel(file, selectedYear, selectedMonthIndex0);
                    if (result.roMatrix) {
                      updateMatrixROForMonth(result.year, result.monthIndex0, result.roMatrix);
                      // Update local state if the month matches
                      if (result.year === selectedYear && result.monthIndex0 === selectedMonthIndex0) {
                        setLocalMatrix(result.roMatrix);
                      }
                    }
                    if (result.bgMatrix) {
                      updateMatrixBGForMonth(result.year, result.monthIndex0, result.bgMatrix);
                    }
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                  } catch (error: any) {
                    alert('Lỗi khi nhập dữ liệu: ' + error.message);
                  } finally {
                    setImporting(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>

          {saveSuccess && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-xs">
              <Check className="w-3.5 h-3.5" /> Đã Lưu & Vẽ Lại Đồ Thị!
            </span>
          )}
        </div>
      </div>

      {/* SECTION 1: EXCEL MATRIX SPREADSHEET (IMAGE 1) */}
      {showMatrixEditor && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-purple-950 text-white flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-purple-950">
                  BẢNG THÁNG HIỆN HỮU
                </span>
                <h3 className="text-base font-black tracking-wide">
                  Nhóm RO – BẢNG THEO DÕI NĂNG SUẤT & CÔNG (THÁNG {selectedMonthIndex0 + 1}/{selectedYear})
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-300 text-yellow-950 border border-yellow-400 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>Cột Chủ Nhật (Tô màu vàng)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black bg-emerald-400 text-emerald-950 border border-emerald-300 shadow-2xs">
                  🎯 Định mức SL: (Công CT + Công TV) × 9.03
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black bg-blue-500 text-white border border-blue-400 shadow-2xs">
                  📊 Hoàn thành KHSX: SL Line Chính / KHSX Ngày
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Các ô ngày có thể chỉnh sửa trực tiếp. Định Mức SL Theo NS: <code className="bg-purple-900 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">=SUM(Công CT + Công TV) * 9.03</code>. Tỉ lệ hoàn thành KHSX: <code className="bg-purple-900 px-1.5 py-0.5 rounded text-blue-200 font-mono font-bold">=Sản Lượng Line Chính / KHSX Ngày</code>.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleQuickPresetThursday}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Chốt 1 ngày Thứ 5 làm mốc, các tuần khác cách nhau 6 ngày (mỗi 7 ngày). Tuần hiện hữu là W38!"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⭐ Chốt Thứ 5 (W38)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCutoffModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Chọn ngày chốt tuần (chốt 1 ngày lặp lại mỗi 7 ngày hoặc tùy chọn)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Cài đặt ngày chốt tuần</span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-amber-300 text-[10px] font-mono">
                  {currentCutoffs.length} tuần
                </span>
              </button>
              <button
                onClick={handleResetCurrentMonth}
                className="px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục gốc T{selectedMonthIndex0 + 1}
              </button>
              <button
                onClick={handleSaveMatrix}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-purple-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Lưu Dữ Liệu Tháng {selectedMonthIndex0 + 1}
              </button>

              <div className="flex items-center bg-slate-200 rounded-lg p-0.5 gap-0.5 shadow-2xs">
                <button
                  onClick={() => scrollMatrix('left')}
                  className="p-1.5 hover:bg-white rounded text-slate-700 transition cursor-pointer"
                  title="Cuộn sang trái (Xem ngày trước đó)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <button
                  onClick={scrollToToday}
                  className="px-2 py-1 text-[10px] font-bold hover:bg-white rounded text-blue-700 transition cursor-pointer whitespace-nowrap"
                  title="Cuộn đến ngày hôm nay"
                >
                  Hôm nay
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <button
                  onClick={() => scrollMatrix('right')}
                  className="p-1.5 hover:bg-white rounded text-slate-700 transition cursor-pointer"
                  title="Cuộn sang phải (Xem ngày tiếp theo)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div ref={tableContainerRef} className="overflow-x-auto max-h-[520px] scroll-smooth">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 text-left sticky left-0 z-20 bg-slate-300 min-w-[200px] border-r border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span>NGÀY</span>
                      <span className="text-[10px] font-normal text-slate-600">
                        (Nhấp +Chốt để chia tuần)
                      </span>
                    </div>
                  </th>
                  {localMatrix.map((col) => {
                    const dayNum = getDayNumberFromCol(col);
                    const isCutoff = currentCutoffs.includes(dayNum);
                    const isSun = isColSunday(col);

                    return (
                      <th
                        key={col.id}
                        className={`py-2 px-1 text-center min-w-[78px] border-r ${
                          col.isMonthlyTotal
                            ? 'bg-purple-950 text-amber-300 font-black border-slate-300'
                            : col.isWeeklyTotal
                            ? 'bg-amber-400 text-purple-950 font-black border-slate-300'
                            : isSun
                            ? 'bg-yellow-300 text-yellow-950 font-black border-yellow-400 border-r-2 shadow-xs'
                            : isCutoff
                            ? 'bg-amber-100/90 text-amber-950 border-r-2 border-r-amber-400 font-bold'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        {col.isMonthlyTotal ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-black">{col.label}</span>
                            <span className="text-[9px] text-amber-300/80 font-normal">Toàn tháng</span>
                          </div>
                        ) : col.isWeeklyTotal ? (
                          <div className="relative group/week flex flex-col items-center justify-center">
                            <span className="text-xs font-black">{col.label}</span>
                            {col.weekRange && (
                              <span className="text-[9px] text-purple-900 font-bold whitespace-nowrap">
                                {col.weekRange}
                              </span>
                            )}
                            {canEditDCRO && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCutoffByWeeklyCol(col.id)}
                                title="Xóa mốc chốt tuần này"
                                className="opacity-0 group-hover/week:opacity-100 transition-opacity mt-0.5 text-[9px] px-1 py-0.2 rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-0.5 shadow-2xs cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" /> Hủy
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center group/day">
                            <div className="flex items-center gap-1">
                              {col.dateStr && isDateLocked(col.dateStr) && (
                                <Lock className="w-2.5 h-2.5 text-purple-600" />
                              )}
                              <span className={`font-bold text-xs ${isSun ? 'font-black text-yellow-950' : ''}`}>
                                {col.label}
                              </span>
                            </div>
                            {isSun && (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-yellow-400 text-yellow-950 mt-0.5 border border-yellow-500/40 shadow-2xs">
                                Chủ nhật
                              </span>
                            )}
                            {isCutoff ? (
                              <button
                                type="button"
                                onClick={() => handleToggleDayCutoff(dayNum)}
                                title={`Ngày chốt tuần ${col.label} (Nhấp để hủy chốt)`}
                                className="mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 hover:bg-rose-200 text-amber-900 hover:text-rose-900 border border-amber-400 hover:border-rose-400 flex items-center gap-0.5 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Flag className="w-2.5 h-2.5 fill-amber-600 text-amber-700" />
                                <span>Chốt</span>
                              </button>
                            ) : (
                              canEditDCRO && (
                                <div className="opacity-0 group-hover/day:opacity-100 transition-opacity mt-0.5 flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApplyRecurringCutoffFromDay(dayNum)}
                                    title={`Chốt định kỳ mỗi 7 ngày bắt đầu từ ngày ${col.label} (cách 6 ngày)`}
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shadow-2xs ${
                                      isSun 
                                        ? 'bg-amber-400 text-amber-950 hover:bg-amber-500' 
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                    } flex items-center gap-0.5 cursor-pointer`}
                                  >
                                    <Sparkles className="w-2 h-2" /> 7 ngày
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDayCutoff(dayNum)}
                                    title={`Chỉ chốt riêng ngày ${col.label}`}
                                    className="text-[9px] font-medium px-1 py-0.2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center cursor-pointer"
                                  >
                                    <Plus className="w-2 h-2" />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Row 1: CÔNG CHÍNH THỨC */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    CÔNG CHÍNH THỨC
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-purple-950">{formatValue(col.congChinhThuc)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          value={col.congChinhThuc}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'congChinhThuc', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 2: CÔNG THỜI VỤ */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    CÔNG THỜI VỤ
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-purple-950">{formatValue(col.congThoiVu)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          value={col.congThoiVu}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'congThoiVu', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 3: SẢN LƯỢNG QUY ĐỔI LINE CHÍNH */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    SL QUY ĐỔI LINE CHÍNH
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-purple-950">{formatValue(col.sanLuongLineChinh)}</span>
                      ) : (
                        <input
                          type="number"
                          value={col.sanLuongLineChinh}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'sanLuongLineChinh', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 4: ĐỊNH MỨC SL THEO NS */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-bold">ĐỊNH MỨC SL THEO NS</span>
                      </div>
                      <span className="text-[10px] font-semibold text-purple-700 font-mono tracking-tight">
                        = (Công CT + Công TV) × 9.03
                      </span>
                    </div>
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-purple-950">{formatValue(col.dinhMucSlTheoNs)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          value={col.dinhMucSlTheoNs}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'dinhMucSlTheoNs', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 5: NSLĐ THEO NGÀY */}
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/70">
                  <td className="py-2.5 px-3 font-black text-emerald-950 sticky left-0 bg-emerald-100 border-r border-slate-200 shadow-xs">
                    NSLĐ THEO NGÀY
                  </td>
                  {localMatrix.map((col) => {
                    const isSun = isColSunday(col);
                    return (
                      <td
                        key={col.id}
                        className={`p-1 text-center font-bold border-r ${
                          col.isMonthlyTotal
                            ? 'bg-purple-950 text-amber-300 font-black border-slate-200'
                            : col.isWeeklyTotal
                            ? 'bg-amber-400 text-purple-950 font-black border-slate-200'
                            : isSun
                            ? (col.nsldTheoNgay >= 100 
                                ? 'bg-yellow-200/90 text-emerald-950 font-black border-yellow-300' 
                                : 'bg-yellow-200/90 text-yellow-950 font-black border-yellow-300')
                            : col.nsldTheoNgay >= 100
                            ? 'text-emerald-700 font-black border-slate-200'
                            : 'text-amber-700 font-black border-slate-200'
                        }`}
                      >
                        {formatValue(col.nsldTheoNgay)}%
                      </td>
                    );
                  })}
                </tr>

                {/* Row 6: KHSX NGÀY */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    KHSX NGÀY
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-purple-950">{formatValue(col.khsxNgay)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.5"
                          value={col.khsxNgay}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'khsxNgay', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 7: TỈ LỆ HOÀN THÀNH KHSX */}
                <tr className="bg-blue-50/40 hover:bg-blue-50/70 border-y border-blue-200/60">
                  <td className="py-2 px-3 font-black text-blue-950 sticky left-0 bg-blue-100/90 border-r border-slate-200 shadow-xs">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-950 font-black tracking-tight">TỈ LỆ HOÀN THÀNH KHSX</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-800 font-mono tracking-tight">
                        = SL Line Chính / KHSX Ngày
                      </span>
                    </div>
                  </td>
                  {localMatrix.map((col) => {
                    const isSun = isColSunday(col);
                    return (
                      <td
                        key={col.id}
                        className={`p-1 text-center font-bold border-r ${
                          col.isMonthlyTotal
                            ? 'bg-purple-950 text-amber-300 font-black border-slate-200'
                            : col.isWeeklyTotal
                            ? 'bg-amber-400 text-purple-950 font-black border-slate-200'
                            : isSun
                            ? (col.tiLeHoanThanhKhsx >= 100 
                                ? 'bg-yellow-200/90 text-blue-950 font-black border-yellow-300' 
                                : 'bg-yellow-200/90 text-yellow-950 font-black border-yellow-300')
                            : col.tiLeHoanThanhKhsx >= 100
                            ? 'text-blue-700 font-extrabold bg-blue-50/40 border-slate-200'
                            : 'text-amber-700 font-bold border-slate-200'
                        }`}
                      >
                        {formatValue(col.tiLeHoanThanhKhsx)}%
                      </td>
                    );
                  })}
                </tr>

                {/* Row 8: TỔNG NHÂN SỰ LINE ĐI LÀM */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    TỔNG NHÂN SỰ LINE ĐI LÀM
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-purple-950">{formatValue(col.tongNhanSuLine)}</span>
                      ) : (
                        <input
                          type="number"
                          value={col.tongNhanSuLine}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'tongNhanSuLine', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 9: TỔNG NHÂN SỰ NGHỈ */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    TỔNG NHÂN SỰ NGHỈ
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-purple-950">{formatValue(col.nhanSuNghi)}</span>
                      ) : (
                        <input
                          type="number"
                          value={col.nhanSuNghi}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'nhanSuNghi', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 10: TỈ LỆ ĐI LÀM */}
                <tr className="hover:bg-purple-50/50 bg-purple-50/20">
                  <td className="py-2 px-3 font-black text-purple-950 sticky left-0 bg-purple-100 border-r border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span>TỈ LỆ ĐI LÀM</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 font-bold border border-purple-300" title="Công thức: =+(B10-B11)/100%/B10">
                        = (TổngNS - Nghỉ)/TổngNS
                      </span>
                    </div>
                  </td>
                  {localMatrix.map((col) => {
                    const isSun = isColSunday(col);
                    return (
                      <td
                        key={col.id}
                        className={`p-1 text-center font-bold border-r ${
                          col.isMonthlyTotal
                            ? 'bg-purple-950 text-amber-300 font-black border-slate-200'
                            : col.isWeeklyTotal
                            ? 'bg-amber-400 text-purple-950 font-black border-slate-200'
                            : isSun
                            ? (col.tiLeDiLam >= 92 ? 'bg-yellow-100 text-purple-900 font-bold border-yellow-200' : 'bg-yellow-100 text-rose-800 font-bold border-yellow-200')
                            : col.tiLeDiLam >= 92
                            ? 'text-purple-700 border-slate-200'
                            : 'text-rose-700 border-slate-200'
                        }`}
                      >
                        {formatValue(col.tiLeDiLam)}%
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: 4 CHARTS FOR RO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              4 Đồ Thị So Sánh Nhóm RO (Lắp Ráp - Tháng {selectedMonthIndex0 + 1}/{selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Đồ thị tổng hợp theo các tuần và các ngày trong tháng hiện hữu
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {weeklyColsInMatrix.length} tuần tổng hợp
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Chart 1: NSLĐ */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  NSLĐ THEO TUẦN/NGÀY RO (%)
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                  Mục tiêu 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Năng suất lao động theo tuần (vạch đỏ 100% mục tiêu)
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataNSLD} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis domain={[0, 140]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'NSLĐ']} contentStyle={{ borderRadius: '12px' }} />
                  <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" />
                  <Bar dataKey="nsld" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="nsldFormatted" position="top" fill="#4c1d95" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Sản lượng Line Chính vs KHSX */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  SẢN LƯỢNG LINE CHÍNH VS KHSX NGÀY
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  Sản phẩm
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Đối chiếu sản lượng thực tế và kế hoạch sản xuất
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSanLuongVsKHSX} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip formatter={(v: any, name: any) => [`${v} sp`, name === 'sanLuong' ? 'Sản lượng' : 'KHSX']} contentStyle={{ borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  <Bar dataKey="sanLuong" name="Thực Hiện" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="khsx" name="Kế Hoạch (KHSX)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Cơ cấu công */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  CƠ CẤU CÔNG CHÍNH THỨC & THỜI VỤ
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  Nhân lực
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Tỷ lệ công chính thức và thời vụ theo tuần/ngày
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataCong} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  <Bar dataKey="chinhThuc" name="Chính thức" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="thoiVu" name="Thời vụ" stackId="a" fill="#c084fc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Tỉ lệ đi làm */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  TỈ LỆ ĐI LÀM (%) NHÓM RO
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                  Chuyên cần
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Tỉ lệ đi làm chuyên cần (vạch đỏ 95% chuẩn)
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataTiLeDiLam} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis domain={[75, 105]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Đi làm']} contentStyle={{ borderRadius: '12px' }} />
                  <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" />
                  <Bar dataKey="tiLe" fill="#9333ea" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="tiLeFormatted" position="top" fill="#581c87" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Week Cutoff Modal */}
      <WeekCutoffModal
        isOpen={isCutoffModalOpen}
        onClose={() => setIsCutoffModalOpen(false)}
        year={selectedYear}
        monthIndex0={selectedMonthIndex0}
        currentCutoffs={currentCutoffs}
        onApplyCutoffs={handleApplyCutoffs}
        lineName="ĐC R.O"
        themeColor="purple"
      />
    </div>
  );
};

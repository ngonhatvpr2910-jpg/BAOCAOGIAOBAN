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
  ReferenceLine
} from 'recharts';
import { 
  Table, 
  BarChart3, 
  Save, 
  RotateCcw, 
  Check, 
  Sliders, 
  Flame, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Info,
  Flag,
  Plus,
  X,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { 
  recalculateBGMatrix, 
  generateMonthBGMatrix,
  getCutoffDaysFromMatrix,
  getDayNumberFromCol,
  applyWeekCutoffsToBGMatrix,
  isColumnSunday,
  calculateRecurringCutoffs,
  getCutoffsByDayOfWeek,
  getDaysInMonth,
  WeekLabelMode,
  MONTH_NAMES_SHORT,
} from './matrixGenerator';
import { ExcelMatrixBGColumn, ExcelMatrixROColumn } from './types';
import { WeekCutoffModal } from './WeekCutoffModal';
import { exportProductionTemplate, importProductionExcel } from './excelProductionService';

export const DCBGExcelDashboard: React.FC = () => {
  const {
    weeklyDCBG,
    updateWeeklyDCBG,
    resetWeeklyDCBG,
    monthlyNSLDDCBG,
    updateMonthlyNSLDDCBG,
    resetMonthlyNSLDDCBG,
    dailyNSLDRMA,
    updateDailyNSLDRMA,
    resetDailyNSLDRMA,
    updateMatrixBGForMonth,
    updateMatrixROForMonth,
    isDateLocked
  } = useProduction();

  const { canEditDCBG } = useAuth();
  const [importing, setImporting] = useState(false);

  const canEditCell = (col: ExcelMatrixBGColumn) => {
    if (!canEditDCBG) return false;
    if (col.dateStr && isDateLocked(col.dateStr)) return false;
    return true;
  };

  // ... (rest of imports and component setup)

  // Current system month/year (September 2026 in environment, monthIndex0 = 8)
  const now = new Date();
  const sysYear = now.getFullYear() || 2026;
  const sysMonthIndex0 = now.getMonth() >= 0 && now.getMonth() <= 11 ? now.getMonth() : 8;

  // Selected Month State
  const [selectedYear, setSelectedYear] = useState<number>(sysYear);
  const [selectedMonthIndex0, setSelectedMonthIndex0] = useState<number>(sysMonthIndex0);

  // Local matrix data for the chosen month
  const [localMatrix, setLocalMatrix] = useState<ExcelMatrixBGColumn[]>(() => {
    return StorageService.getMatrixBGForMonth(sysYear, sysMonthIndex0);
  });

  // UI view toggles
  const [showMatrixEditor, setShowMatrixEditor] = useState<boolean>(true);
  const [showSummaryTableEditor, setShowSummaryTableEditor] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
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

  // Editable local copies of summary tables
  const [localWeekly, setLocalWeekly] = useState(weeklyDCBG);
  const [localMonthly, setLocalMonthly] = useState(monthlyNSLDDCBG);
  const [localRMA, setLocalRMA] = useState(dailyNSLDRMA);

  // Load matrix whenever selected month changes or when external update occurs
  useEffect(() => {
    const refreshData = () => {
      const data = StorageService.getMatrixBGForMonth(selectedYear, selectedMonthIndex0);
      setLocalMatrix(data);
    };

    refreshData();

    const handleUpdate = (e: any) => {
      if (e.detail?.type === 'matrix-bg' && e.detail?.year === selectedYear && e.detail?.monthIndex0 === selectedMonthIndex0) {
        refreshData();
      }
    };

    window.addEventListener('production-data-updated', handleUpdate);
    return () => window.removeEventListener('production-data-updated', handleUpdate);
  }, [selectedYear, selectedMonthIndex0]);

  // Sync external changes for summary tables
  useEffect(() => {
    setLocalWeekly(weeklyDCBG);
  }, [weeklyDCBG]);

  useEffect(() => {
    setLocalMonthly(monthlyNSLDDCBG);
  }, [monthlyNSLDDCBG]);

  useEffect(() => {
    setLocalRMA(dailyNSLDRMA);
  }, [dailyNSLDRMA]);

  // Recalculate Matrix dynamically when days are edited
  const handleMatrixCellChange = (colId: string, field: keyof ExcelMatrixBGColumn, val: string) => {
    const numVal = parseFloat(val) || 0;
    setLocalMatrix(prev => {
      const next = prev.map(col => {
        if (col.id === colId) {
          const updated = { ...col, [field]: numVal };
          // If editing công (Bếp Ga, Thời Vụ, RMA), auto update ĐỊNH MỨC SL THEO NS: = SUM(Công) * 9.03
          if (field === 'congBepGa' || field === 'congThoiVu' || field === 'congRma') {
            const sumCong = (Number(updated.congBepGa) || 0) + (Number(updated.congThoiVu) || 0) + (Number(updated.congRma) || 0);
            updated.dinhMucSlTheoNs = Number((sumCong * 9.03).toFixed(1));
          }
          // If editing SL, công, or định mức, auto update NSLĐ
          if (
            field === 'sanLuongBepGa' || 
            field === 'sanLuongRma' || 
            field === 'dinhMucSlTheoNs' ||
            field === 'congBepGa' || 
            field === 'congThoiVu' || 
            field === 'congRma'
          ) {
            const totalSL = (Number(updated.sanLuongBepGa) || 0) + (Number(updated.sanLuongRma) || 0);
            const dm = Number(updated.dinhMucSlTheoNs) || 1;
            updated.nsldTheoNgay = dm > 0 ? Number(((totalSL / dm) * 100).toFixed(1)) : 0;
          }
          // If editing Tổng nhân sự or Nghỉ, auto update Tỉ Lệ Đi Làm: =+(B10-B11)/100%/B10
          if (field === 'tongNhanSuLine' || field === 'nhanSuNghi') {
            const tongNS = Number(updated.tongNhanSuLine) || 0;
            const nghi = Number(updated.nhanSuNghi) || 0;
            updated.tiLeDiLam = tongNS > 0 ? Number((((tongNS - nghi) / tongNS) * 100).toFixed(1)) : 100;
          }
          // If editing khsxNgay, update rate if rate was 0 or recalculating
          if (field === 'khsxNgay') {
            const khsx = Number(updated.khsxNgay) || 0;
            const totalSL = (Number(updated.sanLuongBepGa) || 0) + (Number(updated.sanLuongRma) || 0);
            if (khsx > 0 && (!updated.tiLeHoanThanhKhsx || updated.tiLeHoanThanhKhsx === 0)) {
              updated.tiLeHoanThanhKhsx = Number(((totalSL / khsx) * 100).toFixed(1));
            }
          }
          return updated;
        }
        return col;
      });

      const recalculated = recalculateBGMatrix(next);
      // Tự động lưu tức thời vào StorageService để đồng bộ số liệu sang Slide 1 & PXLR
      StorageService.saveMatrixBGForMonth(selectedYear, selectedMonthIndex0, recalculated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('production-data-updated', {
          detail: { type: 'matrix-bg', year: selectedYear, monthIndex0: selectedMonthIndex0 }
        }));
      }
      return recalculated;
    });
  };

  const handleSaveMatrix = () => {
    StorageService.saveMatrixBGForMonth(selectedYear, selectedMonthIndex0, localMatrix);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('production-data-updated', {
        detail: { type: 'matrix-bg', year: selectedYear, monthIndex0: selectedMonthIndex0 }
      }));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetCurrentMonth = () => {
    const fresh = generateMonthBGMatrix(selectedYear, selectedMonthIndex0);
    setLocalMatrix(fresh);
    StorageService.saveMatrixBGForMonth(selectedYear, selectedMonthIndex0, fresh);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('production-data-updated', {
        detail: { type: 'matrix-bg', year: selectedYear, monthIndex0: selectedMonthIndex0 }
      }));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveSummaryTables = () => {
    updateWeeklyDCBG(localWeekly);
    updateMonthlyNSLDDCBG(localMonthly);
    updateDailyNSLDRMA(localRMA);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState(false);
  const currentCutoffs = useMemo(() => getCutoffDaysFromMatrix(localMatrix), [localMatrix]);

  const handleApplyCutoffs = (newCutoffs: number[], weekLabelMode?: WeekLabelMode) => {
    const mode = weekLabelMode || StorageService.getWeekLabelMode();
    const updated = applyWeekCutoffsToBGMatrix(localMatrix, newCutoffs, selectedYear, selectedMonthIndex0, mode);
    setLocalMatrix(updated);
    StorageService.saveMatrixBGForMonth(selectedYear, selectedMonthIndex0, updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Quick 1-click apply recurring Thursdays (User exact example: Thứ 5 tuần này -> W38)
  const handleQuickPresetThursday = () => {
    if (!canEditDCBG) return;
    const thuCutoffs = getCutoffsByDayOfWeek(selectedYear, selectedMonthIndex0, 4);
    handleApplyCutoffs(thuCutoffs, 'year');
  };

  // When clicking cutoff on a day: apply recurring 7-day cycle starting from that day!
  const handleApplyRecurringCutoffFromDay = (dayNum: number) => {
    if (!canEditDCBG) return;
    const totalDays = getDaysInMonth(selectedYear, selectedMonthIndex0);
    const recurring = calculateRecurringCutoffs(dayNum, totalDays);
    handleApplyCutoffs(recurring);
  };

  const handleToggleDayCutoff = (dayNum: number) => {
    if (!canEditDCBG) return;
    let newCutoffs: number[];
    if (currentCutoffs.includes(dayNum)) {
      newCutoffs = currentCutoffs.filter(d => d !== dayNum);
    } else {
      newCutoffs = [...currentCutoffs, dayNum].sort((a, b) => a - b);
    }
    handleApplyCutoffs(newCutoffs);
  };

  const handleRemoveCutoffByWeeklyCol = (colId: string) => {
    if (!canEditDCBG) return;
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

  const isColSunday = (col: ExcelMatrixBGColumn) => isColumnSunday(col, selectedYear, selectedMonthIndex0);
  
  const formatValue = (val: any): string => {
    const n = Number(val);
    if (isNaN(n)) return '0';
    return n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  };

  const getCellBgClass = (col: ExcelMatrixBGColumn) => {
    if (col.isMonthlyTotal) return 'bg-slate-100 font-bold text-slate-900 border-r border-slate-200';
    if (col.isWeeklyTotal) return 'bg-blue-50/70 font-bold text-blue-900 border-r border-slate-200';
    if (isColSunday(col)) {
      return 'bg-amber-100/75 font-semibold text-amber-950 border-r border-amber-200/90 shadow-2xs';
    }
    return 'bg-white border-r border-slate-200';
  };

  const getInputClass = (col: ExcelMatrixBGColumn) => {
    const isSun = isColSunday(col);
    return `w-full text-center border-0 font-medium rounded py-1 ${
      isSun
        ? 'bg-transparent text-amber-950 focus:bg-white focus:ring-1 focus:ring-amber-500 font-semibold'
        : 'bg-transparent text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500'
    }`;
  };

  // Derive charts directly from the active month's matrix weekly columns!
  const weeklyColsInMatrix = useMemo(() => {
    return localMatrix.filter(c => c.isWeeklyTotal);
  }, [localMatrix]);

  const chartDataNSLDTuan = useMemo(() => {
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(w => ({
        tuan: w.weekRange ? `${w.label} (${w.weekRange})` : w.label,
        nsldTuan: w.nsldTheoNgay,
        nsldFormatted: `${w.nsldTheoNgay}%`,
      }));
    }
    return localWeekly.map(item => ({
      tuan: item.tuan,
      nsldTuan: item.nsldTuan,
      nsldFormatted: `${item.nsldTuan}%`,
    }));
  }, [weeklyColsInMatrix, localWeekly]);

  const chartDataTongCong = useMemo(() => {
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(w => {
        const total = Number(((w.congBepGa || 0) + (w.congThoiVu || 0) + (w.congRma || 0)).toFixed(2));
        return {
          tuan: w.weekRange ? `${w.label} (${w.weekRange})` : w.label,
          tongCong: total,
        };
      });
    }
    return localWeekly.map(item => ({
      tuan: item.tuan,
      tongCong: item.tongCongTuan,
    }));
  }, [weeklyColsInMatrix, localWeekly]);

  const chartDataTiLeDiLam = useMemo(() => {
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(w => ({
        tuan: w.weekRange ? `${w.label} (${w.weekRange})` : w.label,
        tiLeDiLam: w.tiLeDiLam,
        tiLeFormatted: `${w.tiLeDiLam}%`,
      }));
    }
    return localWeekly.map(item => ({
      tuan: item.tuan,
      tiLeDiLam: item.tiLeDiLamTuan,
      tiLeFormatted: `${item.tiLeDiLamTuan}%`,
    }));
  }, [weeklyColsInMatrix, localWeekly]);

  const chartDataSanLuong = useMemo(() => {
    if (weeklyColsInMatrix.length > 0) {
      return weeklyColsInMatrix.map(w => ({
        tuan: w.weekRange ? `${w.label} (${w.weekRange})` : w.label,
        sanLuong: (w.sanLuongBepGa || 0) + (w.sanLuongRma || 0),
      }));
    }
    return localWeekly.map(item => ({
      tuan: item.tuan,
      sanLuong: item.tongSanLuongQuyDoiTuan,
    }));
  }, [weeklyColsInMatrix, localWeekly]);

  const chartDataRMA = useMemo(() => {
    // Show last 5 non-off working days from current month
    const workingDays = localMatrix.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal && !c.isOff);
    if (workingDays.length > 0) {
      const slice = workingDays.slice(-6);
      return slice.map(d => ({
        date: d.label,
        nsld: d.nsldTheoNgay,
        nsldFormatted: `${d.nsldTheoNgay}%`,
      }));
    }
    return localRMA.map(item => ({
      date: item.date,
      nsld: item.nsld,
      nsldFormatted: `${item.nsld}%`,
    }));
  }, [localMatrix, localRMA]);

  const isCurrentMonth = selectedYear === sysYear && selectedMonthIndex0 === sysMonthIndex0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Month Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              THÁNG HIỆN HỮU: THÁNG {selectedMonthIndex0 + 1}/{selectedYear}
            </span>
            {isCurrentMonth && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Tháng Hiện Tại
              </span>
            )}
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-600" />
              Bảng Nhập Dữ Liệu & Hệ Thống Đồ Thị Nhóm BG
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bảng hiển thị theo tháng hiện hữu ({selectedMonthIndex0 + 1}/{selectedYear}) với đầy đủ các ngày trong tháng để nhập liệu. Nhập dữ liệu ngày sẽ tự động tính NSLĐ & vẽ lại 6 đồ thị so sánh.
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
                  ? 'bg-emerald-600 text-white shadow-xs'
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
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng 6 (Mẫu Excel)
            </button>

            {/* Dropdown for any month */}
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
            <Table className="w-4 h-4 text-blue-600" />
            <span>{showMatrixEditor ? 'Ẩn Ma Trận' : 'Hiện Ma Trận'}</span>
            {showMatrixEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowSummaryTableEditor(!showSummaryTableEditor)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>{showSummaryTableEditor ? 'Đóng Sửa Bảng Tuần' : 'Sửa Bảng Tuần'}</span>
            {showSummaryTableEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                    if (result.bgMatrix) {
                      updateMatrixBGForMonth(result.year, result.monthIndex0, result.bgMatrix);
                      // Update local state if the month matches
                      if (result.year === selectedYear && result.monthIndex0 === selectedMonthIndex0) {
                        setLocalMatrix(result.bgMatrix);
                      }
                    }
                    if (result.roMatrix) {
                      updateMatrixROForMonth(result.year, result.monthIndex0, result.roMatrix);
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

      {/* SECTION 1: EXCEL MATRIX SPREADSHEET */}
      {showMatrixEditor && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                  BẢNG THÁNG HIỆN HỮU
                </span>
                <h3 className="text-base font-black tracking-wide">
                  Nhóm BG – BẢNG THEO DÕI NĂNG SUẤT & CÔNG (THÁNG {selectedMonthIndex0 + 1}/{selectedYear})
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-300 text-amber-950 border border-amber-400 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>Cột Chủ Nhật (Tô màu vàng)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-300 text-blue-950 border border-blue-400 shadow-2xs">
                  ⭐ KHSX Ngày & Tỉ Lệ Hoàn Thành
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Các ô ngày trong tháng có thể nhập liệu trực tiếp. Các cột tuần (W1, W2, W3...) và TỔNG THÁNG tự động tổng hợp & tính NSLĐ. Cột ngày Chủ Nhật được tô vàng nổi bật để dễ theo dõi.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleQuickPresetThursday}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Chốt 1 ngày Thứ 5 làm mốc, các tuần tiếp theo tự động cách đều 6 ngày (mỗi 7 ngày). Tuần hiện hữu là W38!"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⭐ Chốt Thứ 5 (W38)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCutoffModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Chọn ngày chốt tuần (chốt 1 ngày lặp lại mỗi 7 ngày hoặc tùy chọn)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Cài đặt ngày chốt tuần</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-800 text-white text-[10px] font-mono">
                  {currentCutoffs.length} tuần
                </span>
              </button>
              <button
                onClick={handleResetCurrentMonth}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục gốc T{selectedMonthIndex0 + 1}
              </button>
              <button
                onClick={handleSaveMatrix}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
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
                            ? 'bg-slate-900 text-amber-300 font-black border-slate-300'
                            : col.isWeeklyTotal
                            ? 'bg-blue-700 text-white font-black border-slate-300'
                            : isSun
                            ? 'bg-amber-300 text-amber-950 font-black border-amber-400 border-r-2 shadow-xs'
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
                              <span className="text-[9px] text-blue-200 font-medium whitespace-nowrap">
                                {col.weekRange}
                              </span>
                            )}
                            {canEditDCBG && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCutoffByWeeklyCol(col.id)}
                                title="Xóa mốc chốt tuần này"
                                className="opacity-0 group-hover/week:opacity-100 transition-opacity mt-0.5 text-[9px] px-1 py-0.2 rounded bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-0.5 shadow-2xs cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" /> Hủy
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center group/day">
                            <div className="flex items-center gap-1">
                              {col.dateStr && isDateLocked(col.dateStr) && (
                                <Lock className="w-2.5 h-2.5 text-amber-600" />
                              )}
                              <span className={`font-bold text-xs ${isSun ? 'font-black text-amber-950' : ''}`}>
                                {col.label}
                              </span>
                            </div>
                            {isSun && (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-amber-400/90 text-amber-950 mt-0.5 border border-amber-500/40 shadow-2xs">
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
                              canEditDCBG && (
                                <div className="opacity-0 group-hover/day:opacity-100 transition-opacity mt-0.5 flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApplyRecurringCutoffFromDay(dayNum)}
                                    title={`Chốt định kỳ mỗi 7 ngày bắt đầu từ ngày ${col.label} (cách 6 ngày)`}
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shadow-2xs ${
                                      isSun 
                                        ? 'bg-amber-400 text-amber-950 hover:bg-amber-500' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
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
                {/* Row 1: CÔNG BẾP GA */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    CÔNG Bếp GA
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-blue-800">{formatValue(col.congBepGa)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          value={col.congBepGa}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'congBepGa', e.target.value)}
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
                        <span className="font-bold text-blue-800">{formatValue(col.congThoiVu)}</span>
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

                {/* Row 3: CÔNG RMA */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    CÔNG RMA
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-blue-800">{formatValue(col.congRma)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          value={col.congRma}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'congRma', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 4: SẢN LƯỢNG QUY ĐỔI Bếp Ga */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    SẢN LƯỢNG QUY ĐỔI Bếp Ga
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-blue-800">{formatValue(col.sanLuongBepGa)}</span>
                      ) : (
                        <input
                          type="number"
                          value={col.sanLuongBepGa}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'sanLuongBepGa', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 5: SẢN LƯỢNG QUY ĐỔI RMA */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    SẢN LƯỢNG QUY ĐỔI RMA
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-blue-800">{formatValue(col.sanLuongRma)}</span>
                      ) : (
                        <input
                          type="number"
                          value={col.sanLuongRma}
                          disabled={!canEditCell(col)}
                          onChange={(e) => handleMatrixCellChange(col.id, 'sanLuongRma', e.target.value)}
                          className={getInputClass(col)}
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 6: ĐỊNH MỨC SL THEO NS */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span>ĐỊNH MỨC SL THEO NS</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200" title="Công thức: = SUM(Công Bếp Ga + Thời Vụ + RMA) * 9.03">
                        = SUM(Công)*9.03
                      </span>
                    </div>
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-blue-800">{formatValue(col.dinhMucSlTheoNs)}</span>
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

                {/* Row 7: NSLĐ THEO NGÀY */}
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/70">
                  <td className="py-2.5 px-3 font-black text-emerald-950 sticky left-0 bg-emerald-100 border-r border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span>NSLĐ THEO NGÀY</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold border border-emerald-300" title="Công thức: =+IFERROR(((B6+B7)/B8),0)">
                        = IFERROR((SL/ĐịnhMức), 0)
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
                            ? 'bg-slate-900 text-amber-300 font-black border-slate-200'
                            : col.isWeeklyTotal
                            ? 'bg-blue-700 text-white font-black border-slate-200'
                            : isSun
                            ? (col.nsldTheoNgay >= 100 
                                ? 'bg-amber-200/90 text-emerald-950 font-black border-amber-300' 
                                : 'bg-amber-200/90 text-amber-950 font-black border-amber-300')
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

                {/* Row 8: KHSX NGÀY */}
                <tr className="bg-slate-50/40 hover:bg-slate-50/80 border-t border-slate-200">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-slate-100 border-r border-slate-200 shadow-xs">
                    KHSX NGÀY
                  </td>
                  {localMatrix.map((col) => {
                    const isSun = isColSunday(col);
                    return (
                      <td
                        key={col.id}
                        className={`p-1 text-center font-bold border-r ${
                          col.isMonthlyTotal
                            ? 'bg-slate-900 text-amber-300 font-black border-slate-200'
                            : col.isWeeklyTotal
                            ? 'bg-amber-100 text-purple-950 font-black border-slate-200'
                            : isSun
                            ? 'bg-amber-100/70 text-amber-950 font-bold border-amber-200'
                            : 'text-slate-800 border-slate-200'
                        }`}
                      >
                        {col.isWeeklyTotal || col.isMonthlyTotal ? (
                          formatValue(col.khsxNgay || 0)
                        ) : (
                          <input
                            type="number"
                            step="1"
                            disabled={!canEditCell(col)}
                            value={col.khsxNgay ?? ''}
                            onChange={(e) => handleMatrixCellChange(col.id, 'khsxNgay', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded py-0.5 text-xs font-semibold text-slate-900"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Row 9: TỈ LỆ HOÀN THÀNH KHSX */}
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
                            : 'text-amber-800 font-bold border-slate-200'
                        }`}
                      >
                        {col.isWeeklyTotal || col.isMonthlyTotal ? (
                          `${formatValue(col.tiLeHoanThanhKhsx)}%`
                        ) : canEditDCBG ? (
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              step="0.1"
                              value={col.tiLeHoanThanhKhsx ?? ''}
                              onChange={(e) => handleMatrixCellChange(col.id, 'tiLeHoanThanhKhsx', e.target.value)}
                              className="w-12 text-center bg-transparent focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded py-0.5 text-xs font-bold"
                            />
                            <span className="text-[11px] font-bold">%</span>
                          </div>
                        ) : (
                          `${formatValue(col.tiLeHoanThanhKhsx)}%`
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Row 10: Tổng nhân sự Line */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    Tổng nhân sự Line
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-blue-800">{formatValue(col.tongNhanSuLine)}</span>
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

                {/* Row 9: Nhân sự nghỉ */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-xs">
                    Nhân sự nghỉ
                  </td>
                  {localMatrix.map((col) => (
                    <td
                      key={col.id}
                      className={`p-1 text-center ${getCellBgClass(col)}`}
                    >
                      {col.isWeeklyTotal || col.isMonthlyTotal ? (
                        <span className="font-bold text-blue-800">{formatValue(col.nhanSuNghi)}</span>
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
                <tr className="hover:bg-blue-50/50 bg-blue-50/20">
                  <td className="py-2 px-3 font-black text-blue-900 sticky left-0 bg-blue-100 border-r border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span>TỈ LỆ ĐI LÀM</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 font-bold border border-blue-300" title="Công thức: =+(B10-B11)/100%/B10">
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
                            ? 'bg-slate-900 text-amber-300 font-black border-slate-200'
                            : col.isWeeklyTotal
                            ? 'bg-blue-700 text-white font-black border-slate-200'
                            : isSun
                            ? (col.tiLeDiLam >= 90 ? 'bg-amber-100 text-blue-900 font-bold border-amber-200/90' : 'bg-amber-100 text-rose-800 font-bold border-amber-200/90')
                            : col.tiLeDiLam >= 90
                            ? 'text-blue-700 border-slate-200'
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

      {/* SECTION 2: EDITABLE SUMMARY TABLES (IMAGE 3) */}
      {showSummaryTableEditor && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                Cập Nhật Trực Tiếp Bảng Số Liệu Tuần & Tháng (Image 3)
              </h3>
              <p className="text-xs text-slate-500">
                Sửa trực tiếp các ô bên dưới, bấm "Lưu Bảng Tuần/Tháng" để cập nhật ngay vào 6 biểu đồ!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetWeeklyDCBG();
                  resetMonthlyNSLDDCBG();
                  resetDailyNSLDRMA();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Khôi phục gốc
              </button>
              <button
                onClick={handleSaveSummaryTables}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Lưu Bảng Tuần/Tháng
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Table 1: NĂNG SUẤT LAO ĐỘNG TUẦN DCBG */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <h4 className="text-xs font-black uppercase text-slate-800 mb-2">
                1. Năng Suất Lao Động Tuần DCBG (%)
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {localWeekly.map((item, idx) => (
                  <div key={item.tuan} className="text-center">
                    <span className="block text-[11px] font-bold text-slate-600 mb-1">{item.tuan}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.nsldTuan}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setLocalWeekly(prev => prev.map((w, i) => i === idx ? { ...w, nsldTuan: val } : w));
                      }}
                      className="w-full text-center bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-blue-700"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Table 2: Tổng Công sản xuất DCBG */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <h4 className="text-xs font-black uppercase text-slate-800 mb-2">
                2. Tổng Công Sản Xuất Tuần DCBG
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {localWeekly.map((item, idx) => (
                  <div key={item.tuan} className="text-center">
                    <span className="block text-[11px] font-bold text-slate-600 mb-1">{item.tuan}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.tongCongTuan}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setLocalWeekly(prev => prev.map((w, i) => i === idx ? { ...w, tongCongTuan: val } : w));
                      }}
                      className="w-full text-center bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Table 3: Tỉ lệ đi làm (%) */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <h4 className="text-xs font-black uppercase text-slate-800 mb-2">
                3. Tỉ Lệ Đi Làm Tuần DCBG (%)
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {localWeekly.map((item, idx) => (
                  <div key={item.tuan} className="text-center">
                    <span className="block text-[11px] font-bold text-slate-600 mb-1">{item.tuan}</span>
                    <input
                      type="number"
                      step="1"
                      value={item.tiLeDiLamTuan}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setLocalWeekly(prev => prev.map((w, i) => i === idx ? { ...w, tiLeDiLamTuan: val } : w));
                      }}
                      className="w-full text-center bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-blue-700"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Table 4: Tổng Sản Lượng Quy Đổi */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <h4 className="text-xs font-black uppercase text-slate-800 mb-2">
                4. Tổng Sản Lượng Quy Đổi Tuần
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {localWeekly.map((item, idx) => (
                  <div key={item.tuan} className="text-center">
                    <span className="block text-[11px] font-bold text-slate-600 mb-1">{item.tuan}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.tongSanLuongQuyDoiTuan}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setLocalWeekly(prev => prev.map((w, i) => i === idx ? { ...w, tongSanLuongQuyDoiTuan: val } : w));
                      }}
                      className="w-full text-center bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: EXACT 6 CHARTS FROM EXCEL IMAGES 3 & 4 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              6 Đồ Thị So Sánh Trực Quan Nhóm BG (Tháng {selectedMonthIndex0 + 1}/{selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Biểu đồ tự động vẽ lại ngay khi bạn nhập dữ liệu ngày hoặc sửa bảng tuần
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {weeklyColsInMatrix.length} tuần tổng hợp
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* CHART 1: NSLĐ TUẦN DCBG */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  NSLĐ TUẦN DCBG (%)
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  Mục tiêu 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Năng suất lao động theo tuần (vạch đỏ 100% định mức)
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataNSLDTuan} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tuan" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                  <YAxis domain={[0, 120]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'NSLĐ']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" />
                  <Bar dataKey="nsldTuan" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="nsldFormatted" position="top" fill="#1e3a8a" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: TỔNG CÔNG SẢN XUẤT DCBG */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  TỔNG CÔNG SẢN XUẤT DCBG
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  Công
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Số công nhân sự thực tế theo tuần
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataTongCong} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tuan" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} công`, 'Tổng công']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="tongCong" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="tongCong" position="top" fill="#1e3a8a" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 3: TỈ LỆ ĐI LÀM DCBG */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  TỈ LỆ ĐI LÀM DCBG T{selectedMonthIndex0 + 1} (%)
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  Chuyên cần
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Tỉ lệ chuyên cần theo tuần
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataTiLeDiLam} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tuan" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                  <YAxis domain={[70, 105]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Tỉ lệ đi làm']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="tiLeDiLam" fill="#1d4ed8" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="tiLeFormatted" position="top" fill="#1e3a8a" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 4: % NSLĐ THÁNG DCBG */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  % NSLĐ THÁNG DCBG
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Năm {selectedYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Diễn biến năng suất lao động qua các tháng
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localMonthly} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="thang" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis domain={[0, 130]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'NSLĐ']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="nsld" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="nsld" position="top" formatter={(v: any) => `${v}%`} fill="#1e3a8a" fontSize={9} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 5: TỔNG SẢN LƯỢNG QUY ĐỔI DCBG */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  TỔNG SẢN LƯỢNG QUY ĐỔI DCBG
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Sản phẩm
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Sản lượng quy đổi theo tuần
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSanLuong} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tuan" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} sản phẩm`, 'Sản lượng']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="sanLuong" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="sanLuong" position="top" fill="#1e3a8a" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 6: % NSLĐ NGÀY BẾP GA - RMA */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  % NSLĐ NGÀY BẾP GA - RMA
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                  Theo ngày
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Chi tiết năng suất các ngày làm việc gần nhất
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataRMA} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                  <YAxis domain={[90, 115]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'NSLĐ']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="nsld" fill="#1d4ed8" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="nsldFormatted" position="top" fill="#1e3a8a" fontSize={10} fontWeight="bold" />
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
        lineName="ĐC Bếp Ga"
        themeColor="blue"
      />
    </div>
  );
};

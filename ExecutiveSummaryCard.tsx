import React, { useState, useMemo } from 'react';
import { useProduction } from './ProductionContext';
import { StorageService } from './storage';
import { 
  getExecutiveSummaryData, 
  AVAILABLE_WEEKS, 
  AVAILABLE_MONTHS 
} from './executiveSummaryService';
import { 
  BarChart3, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Table, 
  HelpCircle,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ExecutiveSummaryCardProps {
  isSlideView?: boolean;
  isFullscreen?: boolean;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  isSlideView = false,
  isFullscreen = false
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [timeFrame, setTimeFrame] = useState<'week' | 'month'>('week');
  const [selectedWeek, setSelectedWeek] = useState<string>('W39');
  const [selectedMonth, setSelectedMonth] = useState<string>('Tháng 9');

  const { monthlyHistory, slide2Quality } = useProduction();

  // Đọc dữ liệu chi phí hư hỏng thực tế từ Storage
  const defectCostData = useMemo(() => {
    return StorageService.getSlide3DefectCost();
  }, []);

  const slide1Data = useMemo(() => {
    return StorageService.getSlide1NSLD();
  }, []);

  // Tổng hợp dữ liệu điều hành theo tuần hoặc theo tháng dựa trên data
  const summaryData = useMemo(() => {
    const periodKey = timeFrame === 'week' ? selectedWeek : selectedMonth;
    return getExecutiveSummaryData(
      timeFrame, 
      periodKey, 
      defectCostData, 
      monthlyHistory,
      slide1Data,
      slide2Quality || StorageService.getSlide2Quality()
    );
  }, [timeFrame, selectedWeek, selectedMonth, defectCostData, monthlyHistory, slide1Data, slide2Quality]);

  const activePeriodLabel = timeFrame === 'week' ? selectedWeek : selectedMonth;

  return (
    <div 
      className={`bg-white transition-all duration-300 flex flex-col justify-between ${
        isSlideView 
          ? isFullscreen 
            ? 'w-full h-full max-w-[calc(95vh*16/9)] max-h-[95vh] aspect-[16/9] border-0 rounded-none mx-auto shadow-2xl' 
            : 'w-full border border-slate-300 rounded-lg overflow-hidden shadow-xl'
          : 'bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6'
      }`}
      style={{ minHeight: isSlideView ? (isFullscreen ? 'auto' : '680px') : 'auto' }}
    >
      {/* 1. SLIDE TOP BANNER: Red Box + Dark Teal Header (When in Slide View) */}
      {isSlideView ? (
        <div className="w-full flex items-stretch h-10 sm:h-12 border-b border-teal-900 select-none shrink-0">
          <div className="w-10 sm:w-16 bg-[#cc0000] flex-shrink-0" />
          <div className="flex-1 bg-[#006064] flex items-center justify-between px-4 sm:px-6">
            <h1 className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wider uppercase font-['Times_New_Roman',Times,serif]">
              BÁO CÁO SẢN XUẤT DCLR
            </h1>
            <span className="text-cyan-200 text-xs sm:text-sm font-bold tracking-wide">
              Báo Cáo Tổng Thể Toàn Xưởng ({activePeriodLabel})
            </span>
          </div>
        </div>
      ) : null}

      {/* 2. Controls & Period Filter Bar */}
      <div className={`px-4 sm:px-6 py-3 bg-gradient-to-r ${
        isSlideView ? 'from-slate-900 via-slate-800 to-blue-950 border-b border-slate-700/80' : 'from-slate-900 to-blue-950'
      } text-white flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0`}>
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/40 border border-blue-400/30 flex items-center justify-center font-black text-sm text-blue-300">
            1
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>BÁO CÁO TỔNG THỂ - EXECUTIVE SUMMARY ({activePeriodLabel})</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Chuẩn Định Mức & Mục Tiêu
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Bảng số liệu điều hành then chốt: Kế hoạch, Thực hiện, NSLĐ, Tỉ lệ đi làm, Tỉ lệ lỗi và Chi phí hư hỏng theo {timeFrame === 'week' ? 'tuần' : 'tháng'}.
            </p>
          </div>
        </div>

        {/* Dynamic Controls: Week/Month Switcher, Periods, View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TimeFrame Toggle (Tuần / Tháng) */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setTimeFrame('week')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                timeFrame === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3 text-cyan-300" />
              <span>Theo Tuần</span>
            </button>
            <button
              onClick={() => setTimeFrame('month')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                timeFrame === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 text-amber-300" />
              <span>Theo Tháng</span>
            </button>
          </div>

          {/* Period Selector (W37, W38, W39 / Tháng 6, 7, 8, 9) */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs">
            {timeFrame === 'week' ? (
              AVAILABLE_WEEKS.map(w => {
                const isSelected = selectedWeek === w;
                const isLatest = w === 'W39';
                return (
                  <button
                    key={`btn-week-${w}`}
                    onClick={() => setSelectedWeek(w)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{w}</span>
                    {isLatest && (
                      <span className="text-[9px] px-1 py-0.1 bg-rose-600 text-white rounded font-sans">
                        Mới
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              AVAILABLE_MONTHS.map(m => {
                const isSelected = selectedMonth === m;
                const isLatest = m === 'Tháng 9';
                return (
                  <button
                    key={`btn-month-${m}`}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{m.replace('Tháng ', 'T')}</span>
                    {isLatest && (
                      <span className="text-[9px] px-1 py-0.1 bg-rose-600 text-white rounded font-sans">
                        Mới
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Display Mode (Thẻ Giao Ban / Bảng Định Mức) */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Dạng Thẻ Giao Ban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Bảng Định Mức Chuẩn
            </button>
          </div>
        </div>
      </div>

      {/* 2. View 1: Exact Card Grid matching user's executive summary image */}
      {viewMode === 'cards' ? (
        <div className="p-4 sm:p-6 space-y-4 overflow-x-auto">
          <div className="min-w-[920px] space-y-3">
            {summaryData.units.map((item) => {
              const isRO = item.unitKey === 'RO';
              const isBG = item.unitKey === 'BG';
              const isRMA = item.unitKey === 'RMA';
              const isPXLR = item.unitKey === 'PXLR';

              const isZeroDefect = item.defectCostActual === 0;

              // Pass / Fail evaluations against target benchmarks
              const isCompletionPass = (item.completionRate || 0) >= 100;
              const isRmaNoPlan = isRMA && (item.khsxLabel === '0 SP' || item.khsxLabel === '0' || !item.actualOutput);

              const isNsldPass = isRMA && item.nsldActual === 0 
                ? true 
                : item.nsldActual >= item.nsldTarget;

              const isAttendancePass = item.attendanceActual >= item.attendanceTarget;
              const isErrorPass = (item.errorRateActual || 0) <= (item.errorRateQuota || 0);
              const isCostPass = (item.defectCostActual || 0) <= (item.defectCostTarget || 0);

              // Dynamic status labels (clean without formula parentheses)
              const nsldSubline = isRmaNoPlan
                ? 'Không phát sinh sản xuất'
                : isNsldPass
                  ? `Mục tiêu ≥ ${item.nsldTarget}%`
                  : `Mục tiêu ≥ ${item.nsldTarget}%`;

              const attendanceSubline = isAttendancePass
                ? `Mục tiêu ≥ ${item.attendanceTarget}%`
                : `Mục tiêu ≥ ${item.attendanceTarget}%`;

              // Clean completion percentage text (hide formulas in parentheses)
              const cleanCompletionNote = isRmaNoPlan
                ? 'Không có KHSX RMA'
                : (item.completionNote || '')
                    .replace(/\s*\([^)]*\)/g, '')
                    .trim();

              return (
                <div key={item.id} className="grid grid-cols-6 gap-2.5 items-stretch">
                  {/* Col 1: KHSX */}
                  <div className="rounded-2xl border-2 border-blue-400 bg-blue-50/20 p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase">
                        KHSX {item.unitKey} {activePeriodLabel}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 uppercase">
                        Kế hoạch
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xl sm:text-2xl font-black text-blue-700">
                        {item.khsxLabel || 'SP'}
                      </span>
                      <div className="text-xs sm:text-[13px] mt-1 font-black tracking-tight text-blue-700/90">
                        Kế hoạch giao
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Thực hiện */}
                  <div className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between shadow-2xs transition ${
                    isRmaNoPlan 
                      ? 'border-slate-300 bg-slate-50/50' 
                      : isCompletionPass 
                        ? 'border-emerald-500 bg-emerald-50/25' 
                        : 'border-rose-400 bg-rose-50/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase">
                        THỰC HIỆN {item.unitKey} {activePeriodLabel}
                      </span>
                      {isRmaNoPlan ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-200 text-slate-700">
                          Không KHSX
                        </span>
                      ) : isCompletionPass ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          ✓ Đạt 100%
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                          ⚠ Chưa Đạt
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className={`text-xl sm:text-2xl font-black ${
                        isRmaNoPlan
                          ? 'text-slate-600'
                          : isCompletionPass
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                      }`}>
                        {item.actualOutputLabel || (isRmaNoPlan ? '0 SP' : (item.khsxLabel || 'SP'))}
                      </span>
                      <div className={`text-xs sm:text-[13px] mt-1 font-black tracking-tight ${
                        isRmaNoPlan ? 'text-slate-500' : isCompletionPass ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {cleanCompletionNote}
                      </div>
                    </div>
                  </div>

                  {/* Col 3: NSLĐ */}
                  <div className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between shadow-2xs transition ${
                    isRmaNoPlan
                      ? 'border-slate-300 bg-slate-50/50'
                      : isNsldPass
                        ? 'border-emerald-500 bg-emerald-50/25'
                        : 'border-rose-400 bg-rose-50/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase">
                        NSLĐ {item.unitKey} {activePeriodLabel}
                      </span>
                      {isRmaNoPlan ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-200 text-slate-700">
                          0%
                        </span>
                      ) : isNsldPass ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          ✓ Đạt MT ≥{item.nsldTarget}%
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                          ⚠ Chưa Đạt MT {item.nsldTarget}%
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className={`text-xl sm:text-2xl font-black ${
                        isRmaNoPlan
                          ? 'text-slate-600'
                          : isNsldPass
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                      }`}>
                        {item.nsldActual}%
                      </span>
                      <div className={`text-xs sm:text-[13px] mt-1 font-black tracking-tight ${
                        isRmaNoPlan
                          ? 'text-slate-500'
                          : isNsldPass
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                      }`}>
                        {nsldSubline}
                      </div>
                    </div>
                  </div>

                  {/* Col 4: Đi làm */}
                  <div className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between shadow-2xs transition ${
                    isAttendancePass
                      ? 'border-emerald-500 bg-emerald-50/25'
                      : 'border-rose-400 bg-rose-50/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase">
                        ĐI LÀM {item.unitKey} {activePeriodLabel}
                      </span>
                      {isAttendancePass ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          ✓ Đạt MT ≥{item.attendanceTarget}%
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                          ⚠ Chưa Đạt MT {item.attendanceTarget}%
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className={`text-xl sm:text-2xl font-black ${
                        isAttendancePass ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {item.attendanceActual}%
                      </span>
                      <div className={`text-xs sm:text-[13px] mt-1 font-black tracking-tight ${
                        isAttendancePass ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {attendanceSubline}
                      </div>
                    </div>
                  </div>

                  {/* Col 5 & 6: Tỉ Lệ Lỗi & Hư Hỏng (Hoặc BOM note cho RMA) */}
                  {isRMA ? (
                    <div className="col-span-2 rounded-2xl border-2 border-emerald-400 bg-emerald-50/25 p-3.5 flex flex-col justify-center items-center text-center shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          ✓ Đạt Chuẩn BOM
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-emerald-700 mt-1">
                        {item.bomNote || 'Không phát sinh linh kiện ngoài BOM'}
                      </div>
                      <div className="text-xs sm:text-[13px] text-slate-600 mt-0.5 font-bold">
                        Kiểm soát định mức vật tư theo BOM
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Col 5: Tỉ Lệ Lỗi */}
                      <div className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between shadow-2xs transition ${
                        isErrorPass 
                          ? 'border-emerald-500 bg-emerald-50/25' 
                          : 'border-rose-400 bg-rose-50/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase">
                            TỈ LỆ LỖI {item.unitKey} {activePeriodLabel}
                          </span>
                          {isErrorPass ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                              ✓ Đạt ĐM
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                              ⚠ Vượt ĐM
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className={`text-xl sm:text-2xl font-black ${
                            isErrorPass ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {item.errorRateActual}%
                          </span>
                          <div className={`text-xs sm:text-[13px] mt-1 font-black tracking-tight ${
                            isErrorPass ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            Định mức ≤ {item.errorRateQuota}%
                          </div>
                        </div>
                      </div>

                      {/* Col 6: Hư hỏng */}
                      <div className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between shadow-2xs transition ${
                        isZeroDefect
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-emerald-100'
                          : isCostPass 
                            ? 'border-emerald-500 bg-emerald-50/25' 
                            : 'border-rose-400 bg-rose-50/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase">
                            HƯ HỎNG {item.unitKey} {activePeriodLabel}
                          </span>
                          {isZeroDefect ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-200 text-emerald-900 flex items-center gap-0.5">
                              ⭐ Zero Defect
                            </span>
                          ) : isCostPass ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                              ✓ Đạt MT
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                              ⚠ Vượt MT
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          {isZeroDefect ? (
                            <div className="flex flex-col">
                              <span className="text-lg sm:text-xl font-black text-emerald-600 leading-tight">
                                0 VNĐ
                              </span>
                              <span className="text-xs sm:text-[13px] text-emerald-700 font-black mt-1">
                                Zero Defect (0 lỗi)
                              </span>
                            </div>
                          ) : (
                            <>
                              <span className={`text-base sm:text-lg font-black leading-tight block ${
                                isCostPass ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {item.defectCostActual?.toLocaleString('vi-VN')}
                              </span>
                              <div className={`text-xs sm:text-[13px] mt-1 font-black tracking-tight ${
                                isCostPass ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                Mục tiêu ≤ {item.defectCostTarget ? (item.defectCostTarget / 1000000) + ' triệu' : ''}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3. Action Items / Countermeasures Banner from Executive slide */}
          <div className="mt-3 bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-200 text-amber-900 rounded-lg font-bold">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900">{summaryData.actionItemTitle}: </span>
                <span className="text-slate-700">
                  {summaryData.actionItemContent}
                </span>
              </div>
            </div>
            <span className={`font-extrabold shrink-0 px-2.5 py-1 rounded-md border text-xs ${
              summaryData.isUrgentAction 
                ? 'text-rose-800 bg-rose-100 border-rose-300' 
                : 'text-amber-800 bg-amber-100 border-amber-300'
            }`}>
              {summaryData.isUrgentAction ? 'Hành động khẩn' : 'Kế hoạch trọng điểm'}
            </span>
          </div>
        </div>
      ) : (
        /* View 2: Structured Benchmark and Target Reference Table */
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold">
                <th className="border border-slate-200 p-2.5">Bộ Phận / Line</th>
                <th className="border border-slate-200 p-2.5 text-center">Tiến Độ KHSX ({activePeriodLabel})</th>
                <th className="border border-slate-200 p-2.5 text-center bg-blue-50/50">MỤC TIÊU NSLĐ</th>
                <th className="border border-slate-200 p-2.5 text-center">NSLĐ THỰC TẾ</th>
                <th className="border border-slate-200 p-2.5 text-center bg-emerald-50/50">MỤC TIÊU ĐI LÀM</th>
                <th className="border border-slate-200 p-2.5 text-center">ĐI LÀM THỰC TẾ</th>
                <th className="border border-slate-200 p-2.5 text-center bg-amber-50/50">ĐỊNH MỨC TỈ LỆ LỖI</th>
                <th className="border border-slate-200 p-2.5 text-center">LỖI THỰC TẾ</th>
                <th className="border border-slate-200 p-2.5 text-center bg-rose-50/50">MỤC TIÊU HƯ HỎNG</th>
                <th className="border border-slate-200 p-2.5 text-center">HƯ HỎNG THỰC TẾ</th>
                <th className="border border-slate-200 p-2.5 text-center">ĐÁNH GIÁ</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.units.map((u) => {
                const isErrorOver = (u.errorRateActual || 0) > (u.errorRateQuota || 0);
                const isCostOver = (u.defectCostActual || 0) > (u.defectCostTarget || 0);
                const isNsldPass = u.nsldActual >= u.nsldTarget;

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="border border-slate-200 p-2.5 font-bold text-slate-900">
                      {u.unitName}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-medium">
                      <span className={`font-bold ${
                        (u.completionRate || 0) >= 100 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {(u.completionNote || '').replace(/\s*\([^)]*\)/g, '').trim()}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-extrabold text-blue-900 bg-blue-50/30">
                      ≥ {u.nsldTarget}%
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-bold">
                      <span className={isNsldPass ? 'text-emerald-600' : 'text-amber-600'}>
                        {u.nsldActual}%
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-extrabold text-emerald-900 bg-emerald-50/30">
                      ≥ {u.attendanceTarget}%
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-bold text-emerald-600">
                      {u.attendanceActual}%
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-extrabold text-amber-900 bg-amber-50/30">
                      {u.errorRateQuota ? `≤ ${u.errorRateQuota}%` : 'BOM chuẩn'}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-bold">
                      {u.errorRateActual !== undefined ? (
                        <span className={isErrorOver ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}>
                          {u.errorRateActual}%
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">0% ngoài BOM</span>
                      )}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-extrabold text-rose-900 bg-rose-50/30">
                      {u.defectCostTarget ? `≤ ${(u.defectCostTarget / 1000000)} triệu` : 'Theo BOM'}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-bold">
                      {u.defectCostActual !== undefined ? (
                        u.defectCostActual === 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                            0 đ (Zero Defect)
                          </span>
                        ) : (
                          <span className={isCostOver ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}>
                            {u.defectCostActual.toLocaleString('vi-VN')} đ
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center">
                      {isErrorOver || isCostOver ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Báo Động Đỏ
                        </span>
                      ) : !isNsldPass ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Chưa Đạt NSLĐ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Đạt & Vượt Chỉ Tiêu
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

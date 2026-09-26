import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Flag, Check, RotateCcw, X, Info, Sparkles, Clock, Sliders, CalendarDays } from 'lucide-react';
import { 
  getDaysInMonth, 
  getDefaultSundayCutoffs, 
  calculateRecurringCutoffs, 
  getCutoffsByDayOfWeek,
  getWeekOfYear,
  WeekLabelMode,
} from './matrixGenerator';
import { StorageService } from './storage';

interface WeekCutoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  monthIndex0: number;
  currentCutoffs: number[];
  onApplyCutoffs: (newCutoffs: number[], weekLabelMode: WeekLabelMode) => void;
  lineName?: string;
  themeColor?: 'blue' | 'purple';
}

const DAY_NAMES_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const FULL_DAY_NAMES_VN = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export const WeekCutoffModal: React.FC<WeekCutoffModalProps> = ({
  isOpen,
  onClose,
  year,
  monthIndex0,
  currentCutoffs,
  onApplyCutoffs,
  lineName = 'ĐC Bếp Ga',
  themeColor = 'blue',
}) => {
  const [selectedCutoffs, setSelectedCutoffs] = useState<number[]>([]);
  const [cutoffMode, setCutoffMode] = useState<'recurring' | 'manual'>('recurring');
  const [weekLabelMode, setWeekLabelMode] = useState<WeekLabelMode>(() => StorageService.getWeekLabelMode());
  const [anchorDay, setAnchorDay] = useState<number | null>(null);

  const totalDays = useMemo(() => getDaysInMonth(year, monthIndex0), [year, monthIndex0]);
  const monthFormatted = String(monthIndex0 + 1).padStart(2, '0');

  useEffect(() => {
    if (isOpen) {
      const savedMode = StorageService.getWeekLabelMode();
      setWeekLabelMode(savedMode);

      if (currentCutoffs && currentCutoffs.length > 0) {
        setSelectedCutoffs([...currentCutoffs].sort((a, b) => a - b));
        setAnchorDay(currentCutoffs[0] || null);
      } else {
        // Default to Thursdays if Month 9, or Sundays
        if (monthIndex0 === 8) { // September
          const thuCutoffs = getCutoffsByDayOfWeek(year, monthIndex0, 4); // Thursday
          setSelectedCutoffs(thuCutoffs);
          setAnchorDay(17);
        } else {
          setSelectedCutoffs(getDefaultSundayCutoffs(year, monthIndex0));
          setAnchorDay(null);
        }
      }
    }
  }, [isOpen, currentCutoffs, year, monthIndex0]);

  if (!isOpen) return null;

  // Handler for clicking a specific day in the month calendar
  const handleDayClick = (day: number) => {
    if (cutoffMode === 'recurring') {
      // User picks 1 anchor day -> system calculates all cutoffs spaced 7 days apart (cách 6 ngày)
      const recurring = calculateRecurringCutoffs(day, totalDays);
      setSelectedCutoffs(recurring);
      setAnchorDay(day);
    } else {
      // Manual individual toggle
      if (selectedCutoffs.includes(day)) {
        setSelectedCutoffs(prev => prev.filter(d => d !== day));
      } else {
        setSelectedCutoffs(prev => [...prev, day].sort((a, b) => a - b));
      }
      setAnchorDay(day);
    }
  };

  // Preset: By day of week (e.g. all Thursdays, all Sundays...)
  const handleSelectDayOfWeek = (dayOfWeekIdx: number) => {
    const cutoffs = getCutoffsByDayOfWeek(year, monthIndex0, dayOfWeekIdx);
    setSelectedCutoffs(cutoffs);
    // Find representative anchor day (nearest to current date)
    const today = new Date();
    let bestAnchor = cutoffs[0] || null;
    if (year === today.getFullYear() && monthIndex0 === today.getMonth()) {
      const todayDate = today.getDate();
      const match = cutoffs.find(d => Math.abs(d - todayDate) <= 3) || cutoffs[0];
      bestAnchor = match;
    }
    setAnchorDay(bestAnchor);
  };

  // Preset: Thursday anchor (User exact example: Thứ 5 tuần này -> W38)
  const handlePresetThursday = () => {
    handleSelectDayOfWeek(4); // Thursday = 4
  };

  // Preset: Sunday default
  const handlePresetSundays = () => {
    handleSelectDayOfWeek(0); // Sunday = 0
  };

  // Calculate simulated week ranges based on selected cutoffs
  const sortedCutoffs = [...selectedCutoffs].sort((a, b) => a - b);
  const weekBreakdowns: { 
    weekIndex: number; 
    fromDay: number; 
    toDay: number; 
    daysCount: number;
    cutoffDate: Date;
    yearWeek: number;
    weekLabel: string;
    isCurrentWeek: boolean;
  }[] = [];

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && monthIndex0 === now.getMonth();
  const currentDay = now.getDate();

  let prevDay = 0;
  sortedCutoffs.forEach((cutoff, idx) => {
    if (cutoff > prevDay && cutoff <= totalDays) {
      const fromDay = prevDay + 1;
      const toDay = cutoff;
      const cutoffDate = new Date(year, monthIndex0, toDay);
      const yearWeek = getWeekOfYear(cutoffDate);
      
      let weekLabel = `W${yearWeek}`;
      if (weekLabelMode === 'month') {
        weekLabel = `W${idx + 1}`;
      } else if (weekLabelMode === 'year_month') {
        weekLabel = `W${yearWeek} (T${idx + 1})`;
      }

      const isCurrentWeek = isCurrentMonth && currentDay >= fromDay && currentDay <= toDay;

      weekBreakdowns.push({
        weekIndex: idx + 1,
        fromDay,
        toDay,
        daysCount: toDay - fromDay + 1,
        cutoffDate,
        yearWeek,
        weekLabel,
        isCurrentWeek,
      });
      prevDay = cutoff;
    }
  });

  // Remainder days of the month after the last cutoff
  if (prevDay < totalDays && sortedCutoffs.length > 0) {
    const fromDay = prevDay + 1;
    const toDay = totalDays;
    const cutoffDate = new Date(year, monthIndex0, toDay);
    const yearWeek = getWeekOfYear(cutoffDate);
    const idx = sortedCutoffs.length;

    let weekLabel = `W${yearWeek}`;
    if (weekLabelMode === 'month') {
      weekLabel = `W${idx + 1}`;
    } else if (weekLabelMode === 'year_month') {
      weekLabel = `W${yearWeek} (T${idx + 1})`;
    }

    const isCurrentWeek = isCurrentMonth && currentDay >= fromDay && currentDay <= toDay;

    weekBreakdowns.push({
      weekIndex: idx + 1,
      fromDay,
      toDay,
      daysCount: toDay - fromDay + 1,
      cutoffDate,
      yearWeek,
      weekLabel,
      isCurrentWeek,
    });
  }

  const handleApply = () => {
    StorageService.saveWeekLabelMode(weekLabelMode);
    onApplyCutoffs(sortedCutoffs, weekLabelMode);
    onClose();
  };

  const isBlue = themeColor === 'blue';
  const primaryBg = isBlue ? 'bg-blue-600' : 'bg-purple-600';
  const primaryHover = isBlue ? 'hover:bg-blue-700' : 'hover:bg-purple-700';
  const primaryText = isBlue ? 'text-blue-700' : 'text-purple-700';
  const primaryBorder = isBlue ? 'border-blue-500' : 'border-purple-500';
  const primaryLightBg = isBlue ? 'bg-blue-50' : 'bg-purple-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 text-white ${primaryBg} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                Chốt Ngày Dữ Liệu Tuần (Cutoff Date)
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
                  {lineName}
                </span>
              </h2>
              <p className="text-xs text-white/80">
                Tháng {monthFormatted}/{year} • Chỉ cần chốt 1 ngày mốc, các tuần tiếp theo tự động cách đều 6 ngày (mỗi 7 ngày)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* User Request Guidance Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-slate-800 flex items-start gap-3 shadow-2xs">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-amber-950">Quy tắc chốt tuần thông minh: </span>
              Chỉ cần chốt <strong>1 ngày</strong> làm mốc data tuần, các tuần khác cứ cách tuần đầu là <strong>6 ngày</strong> (chu kỳ 7 ngày).
              Ví dụ chốt <strong>Thứ 5</strong> tuần này làm data tuần 1 thì <strong>Thứ 5</strong> tuần tiếp theo là tuần 2, tuần hiện hữu là <strong>W38</strong> tính theo năm.
            </div>
          </div>

          {/* Quick Select By Day of Week Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Chốt 1 ngày theo Thứ trong tuần (Tự động lặp lại mỗi 7 ngày):
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Nhấp để áp dụng ngay chu kỳ
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
              {[
                { idx: 4, name: 'Thứ 5 (W38)', short: 'T5', highlight: true, note: 'Khuyên dùng' },
                { idx: 0, name: 'Chủ nhật', short: 'CN', highlight: false, note: 'Mặc định' },
                { idx: 1, name: 'Thứ 2', short: 'T2', highlight: false },
                { idx: 2, name: 'Thứ 3', short: 'T3', highlight: false },
                { idx: 3, name: 'Thứ 4', short: 'T4', highlight: false },
                { idx: 5, name: 'Thứ 6', short: 'T6', highlight: false },
                { idx: 6, name: 'Thứ 7', short: 'T7', highlight: false },
              ].map(d => {
                const isSelected = selectedCutoffs.length > 0 && selectedCutoffs.every(day => {
                  const dt = new Date(year, monthIndex0, day);
                  return dt.getDay() === d.idx;
                });

                return (
                  <button
                    key={d.idx}
                    type="button"
                    onClick={() => handleSelectDayOfWeek(d.idx)}
                    className={`p-2 rounded-xl text-center border transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? `${primaryBg} text-white font-black shadow-md ring-2 ring-offset-1 ring-blue-400`
                        : d.highlight
                        ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950 font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 font-semibold'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black">{d.name}</span>
                    {d.note && (
                      <span className={`text-[9px] px-1 py-0.2 rounded mt-0.5 font-bold ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : d.highlight 
                          ? 'bg-amber-400 text-amber-950' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {d.note}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Switch & Week Labeling Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Setting 1: Interaction Mode */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Chế độ chọn ngày trên lịch:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCutoffMode('recurring')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cutoffMode === 'recurring'
                      ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Chốt 1 ngày định kỳ ⭐</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-normal">
                    Click 1 ngày, hệ thống tự lặp lại mỗi 7 ngày (cách 6 ngày).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCutoffMode('manual')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cutoffMode === 'manual'
                      ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Chọn thủ công</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-normal">
                    Tùy ý bật/tắt từng ngày riêng lẻ theo nhu cầu.
                  </p>
                </button>
              </div>
            </div>

            {/* Setting 2: Week Labeling Mode (Annual W38 vs Monthly W1) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                Cách đánh số thứ tự tuần (W):
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setWeekLabelMode('year')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    weekLabelMode === 'year'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-black text-amber-900">Theo năm (W38)</div>
                  <span className="text-[9px] text-slate-500">Chuẩn theo năm ⭐</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWeekLabelMode('year_month')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    weekLabelMode === 'year_month'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-black text-amber-900">Năm & Tháng</div>
                  <span className="text-[9px] text-slate-500">W38 (Tuần 3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWeekLabelMode('month')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    weekLabelMode === 'month'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-black text-amber-900">Theo tháng</div>
                  <span className="text-[9px] text-slate-500">W1, W2, W3...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Day Grid */}
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Lịch ngày trong tháng {monthFormatted}/{year} ({totalDays} ngày):</span>
              <span className="text-[11px] font-normal text-slate-500">
                {cutoffMode === 'recurring' ? '⚡ Nhấp vào 1 ngày để tạo chu kỳ lặp lại mỗi 7 ngày' : 'Nhấp để bật/tắt từng ngày chốt'}
              </span>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                const dateObj = new Date(year, monthIndex0, day);
                const dayOfWeekIdx = dateObj.getDay();
                const dayOfWeekName = DAY_NAMES_VN[dayOfWeekIdx];
                const isSunday = dayOfWeekIdx === 0;
                const isSelected = selectedCutoffs.includes(day);
                const isAnchor = anchorDay === day;

                // Corresponding week label in preview
                const weekInfo = weekBreakdowns.find(w => w.toDay === day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`p-2 rounded-xl text-center border transition-all relative flex flex-col items-center justify-center min-h-[58px] cursor-pointer ${
                      isSelected
                        ? `${primaryBg} text-white font-black shadow-md ring-2 ring-offset-1 ring-blue-400`
                        : isSunday
                        ? 'bg-amber-100/80 border-amber-300 text-amber-950 hover:border-amber-500 font-bold'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 font-medium'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-mono font-bold">
                      {String(day).padStart(2, '0')}
                    </span>
                    <span className={`text-[10px] uppercase ${isSelected ? 'text-white/80' : isSunday ? 'text-amber-900 font-black' : 'text-slate-400'}`}>
                      {dayOfWeekName}
                    </span>

                    {weekInfo && (
                      <span className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                        <Flag className="w-2.5 h-2.5 fill-current" />
                        {weekInfo.weekLabel}
                      </span>
                    )}

                    {isAnchor && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white font-black text-[8px] px-1 rounded-full shadow-2xs">
                        Mốc
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Resulting Weeks Breakdown Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-blue-600" />
                Xem trước các cột tuần sau khi áp dụng ({weekBreakdowns.length} tuần):
              </span>
              <span className="text-slate-500 font-normal text-[11px]">
                {selectedCutoffs.length} mốc chốt • Cách nhau 6 ngày (chu kỳ 7 ngày)
              </span>
            </div>

            {weekBreakdowns.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-3 text-center">
                Chưa chọn mốc chốt tuần nào.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {weekBreakdowns.map((wb) => {
                  const toDate = new Date(year, monthIndex0, wb.toDay);
                  const dayName = FULL_DAY_NAMES_VN[toDate.getDay()];

                  return (
                    <div
                      key={wb.weekIndex}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        wb.isCurrentWeek || wb.yearWeek === 38
                          ? 'bg-amber-50/90 border-amber-300 shadow-sm ring-1 ring-amber-400'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black shadow-2xs ${
                          wb.isCurrentWeek || wb.yearWeek === 38
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : `${primaryBg} text-white`
                        }`}>
                          {wb.weekLabel}
                        </span>

                        {(wb.isCurrentWeek || wb.yearWeek === 38) && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-300">
                            ⭐ Tuần Hiện Hữu
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900">
                        {String(wb.fromDay).padStart(2, '0')}/{monthFormatted} – {String(wb.toDay).padStart(2, '0')}/{monthFormatted}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
                        <span>Gồm {wb.daysCount} ngày</span>
                        <span className="font-semibold text-emerald-700">
                          Chốt {dayName}, {String(wb.toDay).padStart(2, '0')}/{monthFormatted}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePresetThursday}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>⭐ Mẫu Thứ 5 (W38)</span>
            </button>
            <button
              type="button"
              onClick={handlePresetSundays}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Theo Chủ nhật</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCutoffs([])}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa hết</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={`px-5 py-2 text-xs sm:text-sm font-bold text-white ${primaryBg} ${primaryHover} rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer`}
            >
              <Check className="w-4 h-4" />
              <span>Áp dụng ngày chốt tuần</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

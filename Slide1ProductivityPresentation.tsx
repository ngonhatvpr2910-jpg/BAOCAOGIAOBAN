import React, { useState, useEffect, useMemo } from 'react';
import { Slide1NSLDData, SlideBarItem } from './types';
import { PowerPointBarChart } from './PowerPointBarChart';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Activity, 
  Edit3, 
  Plus, 
  Calendar,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { getWeekNumber } from './productivityFormulas';

interface Slide1ProductivityPresentationProps {
  data: Slide1NSLDData;
  isFullscreen?: boolean;
  onOpenEditor?: () => void;
  onAddWeek?: (weekLabel: string) => void;
}

export const Slide1ProductivityPresentation: React.FC<Slide1ProductivityPresentationProps> = ({
  data,
  isFullscreen = false,
  onOpenEditor,
  onAddWeek
}) => {
  // Operational current week of the manufacturing plant is Tuần 41 (W41 - Tháng 10/2026)
  const OPERATIONAL_CURRENT_WEEK = 41;

  // Selected week for highlighting and focus (defaults to Tuần 41)
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(OPERATIONAL_CURRENT_WEEK);

  // Slider state for Week view - configurable window
  const [weeksToShow, setWeeksToShow] = useState<number>(4);
  const [weekStartIndex, setWeekStartIndex] = useState<number>(0);

  const totalWeeks = data.pxlr.weekly.length;
  const maxStartIndex = Math.max(0, totalWeeks - weeksToShow);

  // Detect current ISO week (fall back to 41 if outside the active factory season [32..44])
  const currentWeekNum = useMemo(() => {
    const detected = getWeekNumber(new Date());
    if (detected < 32 || detected > 44) {
      return OPERATIONAL_CURRENT_WEEK;
    }
    return detected;
  }, []);

  // Find index of the active week or nearest (prioritizes selectedWeekNum, then currentWeekNum, then W41)
  const currentWeekIndex = useMemo(() => {
    const target = selectedWeekNum || currentWeekNum || OPERATIONAL_CURRENT_WEEK;
    const idx = data.pxlr.weekly.findIndex(w => {
      const match = w.label.match(/\d+/);
      return match && parseInt(match[0], 10) === target;
    });
    if (idx >= 0) return idx;
    const idx41 = data.pxlr.weekly.findIndex(w => w.label.includes('41'));
    return idx41 >= 0 ? idx41 : 0;
  }, [data.pxlr.weekly, selectedWeekNum, currentWeekNum]);

  // Initialize slider to position Tuần 41 prominently in view
  useEffect(() => {
    if (totalWeeks > weeksToShow) {
      const target = Math.max(0, Math.min(maxStartIndex, currentWeekIndex - weeksToShow + 1));
      setWeekStartIndex(target);
    } else {
      setWeekStartIndex(0);
    }
  }, [totalWeeks, weeksToShow, currentWeekIndex, maxStartIndex]);

  // Jump to latest weeks
  const jumpToLatest = () => {
    setWeekStartIndex(maxStartIndex);
  };

  // Jump to a specific week by number and highlight it
  const jumpToWeekNum = (targetWeekNum: number) => {
    setSelectedWeekNum(targetWeekNum);
    const idx = data.pxlr.weekly.findIndex(w => {
      const match = w.label.match(/\d+/);
      return match && parseInt(match[0], 10) === targetWeekNum;
    });
    if (idx >= 0) {
      const target = Math.max(0, Math.min(maxStartIndex, idx - weeksToShow + 1));
      setWeekStartIndex(target);
    }
  };

  // Jump to current week (W41)
  const jumpToCurrentWeek = () => {
    jumpToWeekNum(OPERATIONAL_CURRENT_WEEK);
  };

  // Add next week
  const handleAddNewWeek = () => {
    const lastItem = data.pxlr.weekly[data.pxlr.weekly.length - 1];
    let nextNum = 41;
    if (lastItem) {
      const match = lastItem.label.match(/\d+/);
      if (match) nextNum = parseInt(match[0], 10) + 1;
    }
    const newLabel = `Tuần ${nextNum}`;
    if (onAddWeek) {
      onAddWeek(newLabel);
    }
  };

  // Sliced data for charts with highlighted week
  const slicedWeekly = (items: SlideBarItem[]) => {
    return items.slice(weekStartIndex, weekStartIndex + weeksToShow).map(item => {
      const match = item.label.match(/\d+/);
      const isMatch = match ? parseInt(match[0], 10) === selectedWeekNum : false;
      return {
        ...item,
        isHighlighted: isMatch || (selectedWeekNum === 41 && item.label.includes('41')),
      };
    });
  };

  // Filter monthly items to display months up to Tháng 10 (or later months if they have data)
  const filterActiveMonthly = (items: SlideBarItem[]) => {
    return items.filter(m => {
      const num = parseInt(m.label.replace(/\D/g, ''), 10) || 0;
      return num <= 10 || m.value > 0;
    });
  };

  // Week range labels for display
  const startWeekLabel = data.pxlr.weekly[weekStartIndex]?.label || '';
  const endWeekLabel = data.pxlr.weekly[Math.min(totalWeeks - 1, weekStartIndex + weeksToShow - 1)]?.label || '';
  const startWeekCode = startWeekLabel.replace('Tuần ', 'W');
  const endWeekCode = endWeekLabel.replace('Tuần ', 'W');

  return (
    <div 
      className={`bg-white shadow-xl transition-all duration-300 flex flex-col justify-between ${
        isFullscreen 
          ? 'w-full h-full max-w-[calc(95vh*16/9)] max-h-[95vh] aspect-[16/9] border-0 rounded-none mx-auto' 
          : 'w-full border border-slate-300 rounded-lg overflow-hidden'
      }`}
      style={{ minHeight: isFullscreen ? 'auto' : '680px' }}
    >
      {/* SLIDE TOP BANNER: Red Box + Dark Teal Header */}
      <div className="w-full flex items-stretch h-10 sm:h-12 border-b border-teal-900 select-none">
        {/* Left Red Square Block */}
        <div className="w-10 sm:w-16 bg-[#cc0000] flex-shrink-0" />

        {/* Dark Teal / Cyan Banner */}
        <div className="flex-1 bg-[#006064] flex items-center justify-between px-4 sm:px-6">
          <h1 className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wider uppercase font-['Times_New_Roman',Times,serif] truncate">
            {data.title || 'BÁO CÁO SẢN XUẤT DCLR'} ({startWeekCode} ➜ {endWeekCode})
          </h1>

          {/* Quick Edit button in Banner */}
          {!isFullscreen && onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="ml-3 p-1.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Chỉnh sửa số liệu Slide 1"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Chỉnh Sửa Slide 1</span>
            </button>
          )}
        </div>
      </div>

      {/* SLIDE BODY */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3 font-['Times_New_Roman',Times,serif]">
        
        {/* SUBHEADER PILL & COMPREHENSIVE WEEK NAVIGATION TOOLBAR */}
        <div className="flex flex-col gap-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
          
          {/* Top Row: Subheader Pill + Quick Month & Range Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* SUBHEADER PILL: "2 Năng Suất" */}
            <div className="bg-white border border-slate-300 rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 shadow-2xs shrink-0">
              <span className="text-[#0284c7] font-black text-xl sm:text-2xl leading-none font-['Times_New_Roman',Times,serif]">
                2
              </span>
              <span className="text-slate-900 font-bold text-base sm:text-lg tracking-tight font-['Times_New_Roman',Times,serif]">
                {data.subTitle || 'Năng Suất'}
              </span>
            </div>

            {/* Quick Month & Quarter Presets */}
            <div className="flex flex-wrap items-center gap-1.5 font-sans">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-0.5 hidden md:inline">
                Chuyển nhanh:
              </span>

              {/* Prominent dedicated Tuần 41 (Hiện Tại) button */}
              <button
                type="button"
                onClick={() => jumpToWeekNum(41)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  selectedWeekNum === 41
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                    : 'bg-emerald-50 border border-emerald-400 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Xem ngay Tuần 41 (Tuần hiện tại)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Tuần 41 (Hiện Tại)</span>
              </button>

              {/* Direct week pills for individual weeks W36..W44 */}
              <div className="flex items-center gap-0.5 bg-white border border-slate-300 rounded-lg p-0.5">
                <span className="text-[10px] font-bold text-slate-400 px-1 hidden xl:inline">Tuần:</span>
                {[36, 37, 38, 39, 40, 41, 42, 43, 44].map(wNum => {
                  const isSelected = selectedWeekNum === wNum;
                  const isCurrent = wNum === 41;
                  return (
                    <button
                      key={`w-pill-${wNum}`}
                      type="button"
                      onClick={() => jumpToWeekNum(wNum)}
                      className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                        isSelected
                          ? isCurrent
                            ? 'bg-emerald-600 text-white font-black shadow-2xs ring-1 ring-emerald-400'
                            : 'bg-teal-700 text-white font-black shadow-2xs'
                          : isCurrent
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 font-black'
                            : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      title={`Xem Tuần ${wNum} ${isCurrent ? '(Hiện tại)' : ''}`}
                    >
                      <span>W{wNum}</span>
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Month Presets */}
              <button
                type="button"
                onClick={() => jumpToWeekNum(37)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Tháng 9 (W36-40)
              </button>

              <button
                type="button"
                onClick={() => jumpToWeekNum(41)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedWeekNum >= 40 && selectedWeekNum <= 44
                    ? 'bg-teal-50 border border-teal-500 text-teal-800'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Tháng 10 (W40-44)
              </button>

              <button
                type="button"
                onClick={() => jumpToWeekNum(44)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Tháng 11 (W44-48)
              </button>

              <button
                type="button"
                onClick={() => jumpToWeekNum(48)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Tháng 12 (W48-52)
              </button>

              {/* Number of weeks selector (3, 4, 5, 6) */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 ml-1">
                <span className="text-[10px] font-bold text-slate-400 px-1">Hiển thị:</span>
                {[3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setWeeksToShow(num)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                      weeksToShow === num 
                        ? 'bg-teal-700 text-white' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {num} tuần
                  </button>
                ))}
              </div>

              {/* Add next week button */}
              {onAddWeek && (
                <button
                  type="button"
                  onClick={handleAddNewWeek}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1 shadow-2xs ml-1"
                  title="Thêm tuần tiếp theo vào danh sách"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Tuần</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Slider & Navigation Controls */}
          {totalWeeks > 1 && (
            <div className="bg-white border border-slate-300 rounded-xl px-3 py-2 flex items-center gap-3 shadow-xs font-sans">
              
              {/* Previous / Next buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setWeekStartIndex(Math.max(0, weekStartIndex - 1))}
                  disabled={weekStartIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs group cursor-pointer"
                  title="Lùi 1 tuần"
                >
                  <ChevronLeft className="w-5 h-5 text-teal-700 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => setWeekStartIndex(Math.min(maxStartIndex, weekStartIndex + 1))}
                  disabled={weekStartIndex >= maxStartIndex}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs group cursor-pointer"
                  title="Tiến 1 tuần"
                >
                  <ChevronRight className="w-5 h-5 text-teal-700 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Slider & Label */}
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">
                    {data.pxlr.weekly[0]?.label}
                  </span>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 bg-teal-600 px-3 py-0.5 rounded-full border border-teal-700 shadow-xs flex-wrap">
                    <Activity className="w-3 h-3 text-teal-50 animate-pulse" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                      ĐANG XEM {startWeekLabel} ➜ {endWeekLabel}
                    </span>
                    {(weekStartIndex <= 9 && 9 < weekStartIndex + weeksToShow) && (
                      <span className="ml-1 px-1.5 py-0.2 bg-emerald-300 text-emerald-950 text-[10px] font-black rounded-full shadow-2xs">
                        Có Tuần 41 (Hiện tại)
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-extrabold text-slate-500 uppercase text-right">
                    {data.pxlr.weekly[totalWeeks - 1]?.label}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={maxStartIndex}
                    value={weekStartIndex}
                    onChange={(e) => setWeekStartIndex(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-700 transition-colors"
                  />
                </div>
              </div>

              {/* Quick Jump Dropdown */}
              <div className="relative shrink-0 flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 hidden sm:inline">Từ:</label>
                <select
                  value={weekStartIndex}
                  onChange={(e) => setWeekStartIndex(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {data.pxlr.weekly.map((w, idx) => {
                    if (idx > maxStartIndex) return null;
                    return (
                      <option key={w.id} value={idx}>
                        {w.label} {w.label.includes('41') ? '(Hiện tại)' : ''}
                      </option>
                    );
                  })}
                </select>

                <button
                  onClick={jumpToLatest}
                  className="px-2.5 py-1 rounded-lg bg-teal-700 text-white text-[11px] font-black hover:bg-teal-800 transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Xem các tuần mới nhất"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">MỚI NHẤT</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* 3 COLUMNS OF CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 flex-1 items-stretch">
          
          {/* ================= COLUMN 1: NSLĐ THÁNG PXLR ================= */}
          <div className="flex flex-col justify-between space-y-2.5">
            {/* Top Chart: Weekly PXLR */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={slicedWeekly(data.pxlr.weekly)}
                height={160}
                maxScaleCustom={140}
                highlightWeek={`W${selectedWeekNum}`}
              />
            </div>

            {/* Bottom Chart: Monthly PXLR (with Legend) */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={filterActiveMonthly(data.pxlr.monthly)}
                showLegend={true}
                legendLabel="NSLĐ (%)"
                height={175}
                maxScaleCustom={155}
              />
            </div>

            {/* Bottom Section Label Pill */}
            <div className="pt-0.5 flex justify-center">
              <div className="w-4/5 py-1 px-3 bg-white border border-[#0284c7]/40 rounded-xl text-center shadow-2xs">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                  NSLĐ THÁNG PXLR
                </span>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2: NSLĐ THÁNG RO ================= */}
          <div className="flex flex-col justify-between space-y-2.5">
            {/* Top Chart: Weekly RO */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={slicedWeekly(data.ro.weekly)}
                height={160}
                maxScaleCustom={140}
                highlightWeek={`W${selectedWeekNum}`}
              />
            </div>

            {/* Bottom Chart: Monthly RO */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={filterActiveMonthly(data.ro.monthly)}
                height={175}
                maxScaleCustom={155}
              />
            </div>

            {/* Bottom Section Label Pill */}
            <div className="pt-0.5 flex justify-center">
              <div className="w-4/5 py-1 px-3 bg-white border border-[#0284c7]/40 rounded-xl text-center shadow-2xs">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                  NSLĐ THÁNG RO
                </span>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3: NSLĐ THÁNG BẾP GA ================= */}
          <div className="flex flex-col justify-between space-y-2.5">
            {/* Top Chart: Weekly Bếp Ga */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={slicedWeekly(data.bg.weekly)}
                height={160}
                maxScaleCustom={140}
                highlightWeek={`W${selectedWeekNum}`}
              />
            </div>

            {/* Bottom Chart: Monthly Bếp Ga */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={filterActiveMonthly(data.bg.monthly)}
                height={175}
                maxScaleCustom={155}
              />
            </div>

            {/* Bottom Section Label Pill */}
            <div className="pt-0.5 flex justify-center">
              <div className="w-4/5 py-1 px-3 bg-white border border-[#0284c7]/40 rounded-xl text-center shadow-2xs">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                  NSLĐ THÁNG BẾP GA
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* SLIDE FOOTER */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-500 select-none">
          <span className="font-sans font-bold">Phân Xưởng Lắp Ráp - Báo Cáo Giao Ban Tuần & Tháng</span>
          <span className="font-sans font-bold text-slate-600">Font chữ chuẩn Times New Roman • Slide 1</span>
        </div>
      </div>
    </div>
  );
};

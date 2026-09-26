import React, { useState, useMemo, useEffect } from 'react';
import { Slide2QualityData, QualityGroupCharts, Slide2QualityItem } from './types';
import { PowerPointQualityChart } from './PowerPointQualityChart';
import { Calendar, Layers, Activity, Sparkles, Edit3, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Slide2QualityPresentationProps {
  data: Slide2QualityData;
  isFullscreen?: boolean;
  onTimeFrameChange?: (timeFrame: 'month' | 'week' | 'day') => void;
  onOpenEditor?: () => void;
}

export const Slide2QualityPresentation: React.FC<Slide2QualityPresentationProps> = ({
  data,
  isFullscreen = false,
  onTimeFrameChange,
  onOpenEditor,
}) => {
  const [internalTimeFrame, setInternalTimeFrame] = useState<'month' | 'week' | 'day'>(
    data.activeTimeFrame || 'month'
  );

  const activeFrame = data.activeTimeFrame || internalTimeFrame;

  // Slider state for Day view
  const [dayStartIndex, setDayStartIndex] = useState<number>(0);
  // Slider state for Week view
  const [weekStartIndex, setWeekStartIndex] = useState<number>(0);

  // Initialize slider to show the most recent 7 days / 4 weeks
  useEffect(() => {
    if (activeFrame === 'day' && data.daily) {
      const totalDays = data.daily.pxlr.items.length;
      if (totalDays > 7) {
        setDayStartIndex(totalDays - 7);
      } else {
        setDayStartIndex(0);
      }
    } else if (activeFrame === 'week' && data.weekly) {
      const totalWeeks = data.weekly.pxlr.items.length;
      if (totalWeeks > 4) {
        setWeekStartIndex(totalWeeks - 4);
      } else {
        setWeekStartIndex(0);
      }
    }
  }, [activeFrame, data.daily?.pxlr.items.length, data.weekly?.pxlr.items.length]);

  const handleToggleFrame = (frame: 'month' | 'week' | 'day') => {
    setInternalTimeFrame(frame);
    if (onTimeFrameChange) {
      onTimeFrameChange(frame);
    }
  };

  const jumpToLatest = () => {
    if (activeFrame === 'day' && data.daily) {
      const totalDays = data.daily.pxlr.items.length;
      setDayStartIndex(Math.max(0, totalDays - 7));
    } else if (activeFrame === 'week' && data.weekly) {
      const totalWeeks = data.weekly.pxlr.items.length;
      setWeekStartIndex(Math.max(0, totalWeeks - 4));
    }
  };

  // Determine which dataset to display for PXLR, RO, BG
  const currentCharts: QualityGroupCharts = useMemo(() => {
    let base: QualityGroupCharts = {
      pxlr: data.pxlr,
      ro: data.ro,
      bg: data.bg,
    };

    if (activeFrame === 'day' && data.daily) {
      base = data.daily;
      // Slice the items for the 7-day window
      const sliceItems = (items: Slide2QualityItem[]) => {
        return items.slice(dayStartIndex, dayStartIndex + 7);
      };

      return {
        pxlr: { ...base.pxlr, items: sliceItems(base.pxlr.items) },
        ro: { ...base.ro, items: sliceItems(base.ro.items) },
        bg: { ...base.bg, items: sliceItems(base.bg.items) },
      };
    } else if (activeFrame === 'week' && data.weekly) {
      base = data.weekly;
      // Slice the items for the 4-week window
      const sliceItems = (items: Slide2QualityItem[]) => {
        return items.slice(weekStartIndex, weekStartIndex + 4);
      };

      return {
        pxlr: { ...base.pxlr, items: sliceItems(base.pxlr.items) },
        ro: { ...base.ro, items: sliceItems(base.ro.items) },
        bg: { ...base.bg, items: sliceItems(base.bg.items) },
      };
    } else if (activeFrame === 'month' && data.monthly) {
      return data.monthly;
    }

    return base;
  }, [activeFrame, data, dayStartIndex, weekStartIndex]);

  const totalDaysAvailable = data.daily?.pxlr.items.length || 0;
  const maxStartIndex = Math.max(0, totalDaysAvailable - 7);

  const totalWeeksAvailable = data.weekly?.pxlr.items.length || 0;
  const maxWeekStartIndex = Math.max(0, totalWeeksAvailable - 4);

  return (
    <div 
      className={`bg-white shadow-xl transition-all duration-300 flex flex-col justify-between ${
        isFullscreen 
          ? 'w-full h-full max-w-[calc(95vh*16/9)] max-h-[95vh] aspect-[16/9] border-0 rounded-none mx-auto' 
          : 'w-full border border-slate-300 rounded-lg overflow-hidden'
      }`}
      style={{ minHeight: isFullscreen ? 'auto' : '720px', fontFamily: '"Times New Roman", Times, serif' }}
    >
      {/* 1. SLIDE TOP BANNER: Red Box + Dark Teal Header */}
      <div className="w-full flex items-stretch h-11 sm:h-13 border-b border-teal-900 select-none">
        {/* Left Red Square Block */}
        <div className="w-12 sm:w-16 bg-[#cc0000] flex-shrink-0" />

        {/* Dark Teal / Cyan Banner */}
        <div className="flex-1 bg-[#006064] flex items-center justify-between px-4 sm:px-6">
          <h1 className="text-white font-black text-base sm:text-lg md:text-xl tracking-wider uppercase font-['Times_New_Roman',Times,serif]">
            {data.headerBarText || 'BÁO CÁO SẢN XUẤT DCLR'}
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-800/80 text-teal-100 text-xs font-sans font-medium border border-teal-700">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Tự Động Đồng Bộ Dữ Liệu Ngày ➔ Tuần ➔ Tháng
          </span>
        </div>
      </div>

      {/* 2. SLIDE BODY */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-4 font-['Times_New_Roman',Times,serif]">
        {/* SUBHEADER PILL & TIMEFRAME SELECTOR (Standardized from Slide 1) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Standard Pill Box */}
          <div className="w-full xl:w-auto bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200/70 border border-slate-300 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-2xs">
            <span className="text-[#0284c7] font-black text-2xl sm:text-3xl leading-none">
              {data.slideNumber || '3'}
            </span>
            <span className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight">
              {data.title || 'Chất Lượng'}
            </span>
          </div>
          {/* Timeframe View Mode Selector & Quick Daily Input */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenEditor && (
              <button
                onClick={onOpenEditor}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Nhập dữ liệu hàng ngày (Tự động tính tỷ lệ lỗi PXLR, tuần và tháng chạy theo)"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>Nhập Dữ Liệu Ngày</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 font-sans shadow-2xs">
              <button
                onClick={() => handleToggleFrame('month')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFrame === 'month'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Xem tỷ lệ lỗi tổng hợp theo Tháng (T6 - T9)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Theo Tháng (T6-T9)</span>
              </button>

              <button
                onClick={() => handleToggleFrame('week')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFrame === 'week'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Xem tỷ lệ lỗi tổng hợp theo Tuần"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Theo Tuần</span>
              </button>

              <button
                onClick={() => handleToggleFrame('day')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFrame === 'day'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Xem tỷ lệ lỗi 7 ngày gần nhất (tương đương 1 tuần)"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Theo Ngày (7 ngày)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Three Quality Charts Grid */}
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* NAVIGATION SLIDER (For Day View and Week View) */}
          {(activeFrame === 'day' && totalDaysAvailable > 7) || (activeFrame === 'week' && totalWeeksAvailable > 4) ? (
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center gap-6 shadow-md border-b-4 border-b-teal-600/20">
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    if (activeFrame === 'day') setDayStartIndex(Math.max(0, dayStartIndex - 1));
                    else setWeekStartIndex(Math.max(0, weekStartIndex - 1));
                  }}
                  disabled={activeFrame === 'day' ? dayStartIndex === 0 : weekStartIndex === 0}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-teal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm group active:scale-95"
                  title={activeFrame === 'day' ? "Xem ngày trước" : "Xem tuần trước"}
                >
                  <ChevronLeft className="w-6 h-6 text-teal-700 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => {
                    if (activeFrame === 'day') setDayStartIndex(Math.min(maxStartIndex, dayStartIndex + 1));
                    else setWeekStartIndex(Math.min(maxWeekStartIndex, weekStartIndex + 1));
                  }}
                  disabled={activeFrame === 'day' ? dayStartIndex >= maxStartIndex : weekStartIndex >= maxWeekStartIndex}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-teal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm group active:scale-95"
                  title={activeFrame === 'day' ? "Xem ngày sau" : "Xem tuần sau"}
                >
                  <ChevronRight className="w-6 h-6 text-teal-700 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 w-full flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Bắt đầu từ</span>
                    <span className="text-xs font-bold text-slate-700">
                      {activeFrame === 'day' 
                        ? data.daily?.pxlr.items[dayStartIndex]?.month 
                        : data.weekly?.pxlr.items[weekStartIndex]?.month}
                    </span>
                  </div>
                  <div className="bg-teal-100/50 px-3 py-1 rounded-full border border-teal-200 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                    <span className="text-[11px] font-black text-teal-800 uppercase tracking-widest">
                      {activeFrame === 'day' ? 'Đang xem 7 ngày' : 'Đang xem 4 tuần'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Đến ngày</span>
                    <span className="text-xs font-bold text-slate-700">
                      {activeFrame === 'day' 
                        ? data.daily?.pxlr.items[Math.min(totalDaysAvailable - 1, dayStartIndex + 6)]?.month 
                        : data.weekly?.pxlr.items[Math.min(totalWeeksAvailable - 1, weekStartIndex + 3)]?.month}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 group">
                  <input
                    type="range"
                    min="0"
                    max={activeFrame === 'day' ? maxStartIndex : maxWeekStartIndex}
                    value={activeFrame === 'day' ? dayStartIndex : weekStartIndex}
                    onChange={(e) => {
                      if (activeFrame === 'day') setDayStartIndex(parseInt(e.target.value));
                      else setWeekStartIndex(parseInt(e.target.value));
                    }}
                    className="absolute inset-0 w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-teal-600 z-10 opacity-100"
                  />
                  <div 
                    className="absolute top-0 h-full bg-teal-500/20 rounded-lg transition-all pointer-events-none"
                    style={{ 
                      left: `${((activeFrame === 'day' ? dayStartIndex : weekStartIndex) / Math.max(1, activeFrame === 'day' ? maxStartIndex : maxWeekStartIndex)) * 100}%`,
                      width: `${((activeFrame === 'day' ? 7 / totalDaysAvailable : 4 / totalWeeksAvailable)) * 100}%`
                    }}
                  />
                </div>
              </div>

              <button
                onClick={jumpToLatest}
                className="px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-black hover:bg-teal-800 flex items-center gap-2 shadow-lg shadow-teal-900/20 transition-all shrink-0 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>VỀ HIỆN TẠI</span>
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 flex-1 items-stretch">
            {/* Chart 1: TỶ LỆ LỖI PHÂN XƯỞNG LẮP RÁP */}
            <div className="flex flex-col justify-between">
              <PowerPointQualityChart
                title={currentCharts.pxlr.title}
                items={currentCharts.pxlr.items}
                benchmarkDmLoi={currentCharts.pxlr.benchmarkDmLoi}
                benchmarkColor={currentCharts.pxlr.benchmarkColor || 'green'}
                lineColor={currentCharts.pxlr.lineColor || 'blue'}
                height={180}
              />
            </div>

            {/* Chart 2: TỶ LỆ LỖI LINE RO */}
            <div className="flex flex-col justify-between">
              <PowerPointQualityChart
                title={currentCharts.ro.title}
                items={currentCharts.ro.items}
                benchmarkDmLoi={currentCharts.ro.benchmarkDmLoi}
                benchmarkColor={currentCharts.ro.benchmarkColor || 'purple'}
                lineColor={currentCharts.ro.lineColor || 'red'}
                height={180}
              />
            </div>

            {/* Chart 3: TỶ LỆ LỖI LINE BG */}
            <div className="flex flex-col justify-between">
              <PowerPointQualityChart
                title={currentCharts.bg.title}
                items={currentCharts.bg.items}
                benchmarkDmLoi={currentCharts.bg.benchmarkDmLoi}
                benchmarkColor={currentCharts.bg.benchmarkColor || 'green'}
                lineColor={currentCharts.bg.lineColor || 'blue'}
                height={180}
              />
            </div>
          </div>
        </div>

        {/* 4. Bottom Commentary Cards: Các lỗi trọng điểm & Đối sách tháng 9 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-1">
          {/* Left Card: Các lỗi Trọng điểm (Red border & text) */}
          <div className="bg-white border-2 border-[#C00000] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-start">
            <h4 className="text-[#C00000] font-black text-base sm:text-lg md:text-[20px] mb-3 leading-snug">
              {data.keyDefects?.title || 'Các lỗi Trọng điểm :'}
            </h4>
            <ol className="space-y-3 text-[#C00000] font-bold text-sm sm:text-base md:text-[16px] leading-relaxed list-none pl-0">
              {(data.keyDefects?.items || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="shrink-0 font-black">{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Right Card: Các đối sách giảm tỉ lệ lỗi trong tháng 9 (Green text) */}
          <div className="bg-white border-2 border-[#C00000] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-start">
            <h4 className="text-[#008000] font-black text-base sm:text-lg md:text-[20px] mb-3 leading-snug">
              {data.countermeasures?.title || 'Các đối sách giảm tỉ lệ lỗi trong tháng 9:'}
            </h4>
            <ol className="space-y-3 text-[#008000] font-bold text-sm sm:text-base md:text-[16px] leading-relaxed list-none pl-0">
              {(data.countermeasures?.items || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="shrink-0 font-black">{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* 5. SLIDE FOOTER */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-500 select-none">
          <span className="font-sans font-medium">
            Phân Xưởng Lắp Ráp • {activeFrame === 'month' ? 'Chế độ xem Tháng (T5 - T9)' : activeFrame === 'week' ? 'Chế độ xem Tuần (W35 - W38)' : 'Chế độ xem Ngày (Chi tiết)'}
          </span>
          <span className="font-sans font-medium text-slate-600">Font chữ chuẩn Times New Roman • Cỡ chữ to rõ trình chiếu</span>
        </div>
      </div>
    </div>
  );
};


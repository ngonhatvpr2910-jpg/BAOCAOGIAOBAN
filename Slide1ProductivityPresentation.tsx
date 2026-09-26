import React, { useState, useEffect } from 'react';
import { Slide1NSLDData, SlideBarItem } from './types';
import { PowerPointBarChart } from './PowerPointBarChart';
import { ChevronLeft, ChevronRight, RotateCcw, Activity } from 'lucide-react';

interface Slide1ProductivityPresentationProps {
  data: Slide1NSLDData;
  isFullscreen?: boolean;
}

export const Slide1ProductivityPresentation: React.FC<Slide1ProductivityPresentationProps> = ({
  data,
  isFullscreen = false,
}) => {
  // Slider state for Week view
  const [weekStartIndex, setWeekStartIndex] = useState<number>(0);
  const weeksToShow = 4;

  const totalWeeks = data.pxlr.weekly.length;
  const maxStartIndex = Math.max(0, totalWeeks - weeksToShow);

  // Initialize slider to show the most recent weeks
  useEffect(() => {
    if (totalWeeks > weeksToShow) {
      setWeekStartIndex(totalWeeks - weeksToShow);
    } else {
      setWeekStartIndex(0);
    }
  }, [totalWeeks]);

  const jumpToLatest = () => {
    setWeekStartIndex(maxStartIndex);
  };

  // Sliced data for charts
  const slicedWeekly = (items: SlideBarItem[]) => {
    return items.slice(weekStartIndex, weekStartIndex + weeksToShow);
  };

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
        <div className="flex-1 bg-[#006064] flex items-center px-4 sm:px-6">
          <h1 className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wider uppercase font-['Times_New_Roman',Times,serif]">
            {data.title || 'BÁO CÁO SẢN XUẤT DCLR'}
          </h1>
        </div>
      </div>

      {/* SLIDE BODY */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-4 font-['Times_New_Roman',Times,serif]">
        
        {/* SUBHEADER PILL & WEEK NAVIGATION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-200/50 shadow-xs">
          {/* SUBHEADER PILL: "2 Năng Suất" */}
          <div className="w-full lg:w-auto bg-white border border-slate-300 rounded-lg px-4 py-2 flex items-center gap-3 shadow-2xs shrink-0">
            <span className="text-[#0284c7] font-black text-2xl sm:text-3xl leading-none font-['Times_New_Roman',Times,serif]">
              2
            </span>
            <span className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight font-['Times_New_Roman',Times,serif]">
              {data.subTitle || 'Năng Suất'}
            </span>
          </div>

          {/* WEEK NAVIGATION SLIDER - Always show if more than 1 week */}
          {totalWeeks > 1 && (
            <div className="flex-1 max-w-3xl bg-white border border-slate-300 rounded-xl px-4 py-2.5 flex items-center gap-4 shadow-sm font-sans">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setWeekStartIndex(Math.max(0, weekStartIndex - 1))}
                  disabled={weekStartIndex === 0}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs group"
                  title="Xem tuần trước"
                >
                  <ChevronLeft className="w-6 h-6 text-teal-700 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => setWeekStartIndex(Math.min(maxStartIndex, weekStartIndex + 1))}
                  disabled={weekStartIndex >= maxStartIndex}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs group"
                  title="Xem tuần sau"
                >
                  <ChevronRight className="w-6 h-6 text-teal-700 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">
                    {data.pxlr.weekly[0]?.label}
                  </span>
                  <div className="flex items-center gap-2 bg-teal-600 px-3 py-1 rounded-full border border-teal-700 shadow-xs">
                    <Activity className="w-3.5 h-3.5 text-teal-50 animate-pulse" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                      ĐANG XEM {data.pxlr.weekly[weekStartIndex]?.label} ➜ {data.pxlr.weekly[Math.min(totalWeeks - 1, weekStartIndex + weeksToShow - 1)]?.label}
                    </span>
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
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-700 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={jumpToLatest}
                className="px-4 py-2 rounded-lg bg-teal-700 text-white text-[11px] font-black hover:bg-teal-800 transition-all shrink-0 flex items-center gap-2 shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">HIỆN TẠI</span>
              </button>
            </div>
          )}
        </div>

        {/* 3 COLUMNS OF CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5 flex-1 items-stretch">
          
          {/* ================= COLUMN 1: NSLĐ THÁNG PXLR ================= */}
          <div className="flex flex-col justify-between space-y-3">
            {/* Top Chart: Weekly PXLR */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={slicedWeekly(data.pxlr.weekly)}
                height={160}
                maxScaleCustom={140}
              />
            </div>

            {/* Bottom Chart: Monthly PXLR (with Legend) */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={data.pxlr.monthly}
                showLegend={true}
                legendLabel="NSLĐ (%)"
                height={175}
                maxScaleCustom={155}
              />
            </div>

            {/* Bottom Section Label Pill */}
            <div className="pt-1 flex justify-center">
              <div className="w-4/5 py-1.5 px-3 bg-white border border-[#0284c7]/40 rounded-xl text-center shadow-2xs">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                  NSLĐ THÁNG PXLR
                </span>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2: NSLĐ THÁNG RO ================= */}
          <div className="flex flex-col justify-between space-y-3">
            {/* Top Chart: Weekly RO */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={slicedWeekly(data.ro.weekly)}
                height={160}
                maxScaleCustom={140}
              />
            </div>

            {/* Bottom Chart: Monthly RO */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={data.ro.monthly}
                height={175}
                maxScaleCustom={155}
              />
            </div>

            {/* Bottom Section Label Pill */}
            <div className="pt-1 flex justify-center">
              <div className="w-4/5 py-1.5 px-3 bg-white border border-[#0284c7]/40 rounded-xl text-center shadow-2xs">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                  NSLĐ THÁNG RO
                </span>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3: NSLĐ THÁNG BẾP GA ================= */}
          <div className="flex flex-col justify-between space-y-3">
            {/* Top Chart: Weekly Bếp Ga */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={slicedWeekly(data.bg.weekly)}
                height={160}
                maxScaleCustom={140}
              />
            </div>

            {/* Bottom Chart: Monthly Bếp Ga */}
            <div className="flex-1 flex flex-col">
              <PowerPointBarChart
                items={data.bg.monthly}
                height={175}
                maxScaleCustom={155}
              />
            </div>

            {/* Bottom Section Label Pill */}
            <div className="pt-1 flex justify-center">
              <div className="w-4/5 py-1.5 px-3 bg-white border border-[#0284c7]/40 rounded-xl text-center shadow-2xs">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                  NSLĐ THÁNG BẾP GA
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* SLIDE FOOTER */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-500 select-none">
          <span className="font-sans font-bold">Phân Xưởng Lắp Ráp - Báo Cáo Giao Ban Tuần & Tháng</span>
          <span className="font-sans font-bold text-slate-600">Font chữ chuẩn Times New Roman • Slide 1</span>
        </div>
      </div>
    </div>
  );
};

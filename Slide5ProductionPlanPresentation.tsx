import React, { useState, useEffect } from 'react';
import { Slide5ProductionPlanData, Slide5WeekPlan, Slide5PlanRow } from './types';
import { Calendar, Users, Edit3, ClipboardList, Plus, ChevronLeft, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { StorageService } from './storage';

interface Slide5ProductionPlanPresentationProps {
  data: Slide5ProductionPlanData;
  isFullscreen?: boolean;
  onOpenEditor?: () => void;
  showNotes?: boolean;
  onUpdateData?: (newData: Slide5ProductionPlanData) => void;
}

// Utility to calculate the next 7 days given the last date string "DD/MM/YYYY"
function generateNextWeekDates(lastDateStr: string): string[] {
  let baseDate = new Date();
  if (lastDateStr && lastDateStr.includes('/')) {
    const [d, m, y] = lastDateStr.split('/').map(Number);
    baseDate = new Date(y, m - 1, d);
  }
  
  const dates: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const nextD = new Date(baseDate);
    nextD.setDate(baseDate.getDate() + i);
    const day = String(nextD.getDate()).padStart(2, '0');
    const month = String(nextD.getMonth() + 1).padStart(2, '0');
    const year = nextD.getFullYear();
    dates.push(`${day}/${month}/${year}`);
  }
  return dates;
}

export const Slide5ProductionPlanPresentation: React.FC<Slide5ProductionPlanPresentationProps> = ({
  data,
  isFullscreen = false,
  onOpenEditor,
  showNotes = false,
  onUpdateData,
}) => {
  // Ensure weeks list exists
  const weeksList: Slide5WeekPlan[] = data.weeks && data.weeks.length > 0 
    ? data.weeks 
    : [
        {
          id: 'w-default',
          weekHeader: data.weekHeader || 'Tuần 38',
          weekTitle: 'Tuần kế hoạch',
          dateRange: data.rows?.[0]?.date && data.rows?.[data.rows.length - 1]?.date 
            ? `${data.rows[0].date.slice(0, 5)} – ${data.rows[data.rows.length - 1].date.slice(0, 5)}`
            : '',
          manpowerSummary: data.manpowerSummary || '53/57 NS Line',
          rmaSummary: data.rmaSummary || 'RMA 12/14NS',
          rows: data.rows || []
        }
      ];

  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(() => {
    if (typeof data.activeWeekIndex === 'number' && data.activeWeekIndex >= 0 && data.activeWeekIndex < weeksList.length) {
      return data.activeWeekIndex;
    }
    return 0;
  });

  // Sync active week if external data changes
  useEffect(() => {
    if (typeof data.activeWeekIndex === 'number' && data.activeWeekIndex >= 0 && data.activeWeekIndex < weeksList.length) {
      setActiveWeekIndex(data.activeWeekIndex);
    }
  }, [data.activeWeekIndex, weeksList.length]);

  const currentWeek = weeksList[activeWeekIndex] || weeksList[0];

  const handleSelectWeek = (idx: number) => {
    setActiveWeekIndex(idx);
    const updatedData: Slide5ProductionPlanData = {
      ...data,
      activeWeekIndex: idx,
      weekHeader: weeksList[idx].weekHeader,
      manpowerSummary: weeksList[idx].manpowerSummary,
      rmaSummary: weeksList[idx].rmaSummary,
      rows: weeksList[idx].rows,
      weeks: weeksList,
    };
    StorageService.saveSlide5ProductionPlan(updatedData);
    if (onUpdateData) {
      onUpdateData(updatedData);
    }
  };

  const handleAddNextWeek = () => {
    const lastWeek = weeksList[weeksList.length - 1];
    let nextNum = 39;
    if (lastWeek?.weekHeader) {
      const match = lastWeek.weekHeader.match(/\d+/);
      if (match) nextNum = parseInt(match[0], 10) + 1;
    }

    const lastDateStr = lastWeek?.rows?.[lastWeek.rows.length - 1]?.date || '27/09/2026';
    const nextDates = generateNextWeekDates(lastDateStr);

    const newRows: Slide5PlanRow[] = nextDates.map(date => ({
      date,
      planDCLR: 'BLOCK + DCLR',
      rmaBg: 'RMA + BG',
      manpowerLine: lastWeek?.rows?.[0]?.manpowerLine || '54 NS CT + 14TV',
      manpowerRma: lastWeek?.rows?.[0]?.manpowerRma || '12 NS CT + 2TV',
    }));

    const newWeek: Slide5WeekPlan = {
      id: `w-${nextNum}`,
      weekHeader: `Tuần ${nextNum}`,
      weekTitle: `Kế hoạch tuần tiếp theo (${nextDates[0].slice(0, 5)} - ${nextDates[6].slice(0, 5)})`,
      dateRange: `${nextDates[0].slice(0, 5)} – ${nextDates[6].slice(0, 5)}`,
      manpowerSummary: lastWeek?.manpowerSummary || '54/57 NS Line',
      rmaSummary: lastWeek?.rmaSummary || 'RMA 12/14NS',
      rows: newRows,
    };

    const newWeeks = [...weeksList, newWeek];
    const newIndex = newWeeks.length - 1;

    const updatedData: Slide5ProductionPlanData = {
      ...data,
      activeWeekIndex: newIndex,
      weekHeader: newWeek.weekHeader,
      manpowerSummary: newWeek.manpowerSummary,
      rmaSummary: newWeek.rmaSummary,
      rows: newWeek.rows,
      weeks: newWeeks,
    };

    setActiveWeekIndex(newIndex);
    StorageService.saveSlide5ProductionPlan(updatedData);
    if (onUpdateData) {
      onUpdateData(updatedData);
    }
  };

  return (
    <div className={`relative bg-white shadow-xl transition-all duration-300 flex flex-col justify-between ${
      isFullscreen 
        ? 'w-full h-full max-w-[calc(95vh*16/9)] max-h-[95vh] aspect-[16/9] border-0 rounded-none mx-auto' 
        : 'w-full border border-slate-300 rounded-lg overflow-hidden'
    }`}
    style={{ minHeight: isFullscreen ? 'auto' : '680px' }}>
      {/* SLIDE TOP BANNER: Red Box + Dark Teal Header (Standardized from Slide 1) */}
      <div className="w-full flex items-stretch h-10 sm:h-12 border-b border-teal-900 select-none shrink-0">
        <div className="w-10 sm:w-16 bg-[#cc0000] flex-shrink-0" />
        <div className="flex-1 bg-[#006064] flex items-center px-4 sm:px-6">
          <h1 className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wider uppercase truncate">
            BÁO CÁO SẢN XUẤT DCLR ({currentWeek.weekHeader?.toUpperCase() || `TUẦN ${data.weekHeader}`})
          </h1>
          {!isFullscreen && onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="ml-auto p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer group flex items-center gap-1.5"
              title="Chỉnh sửa chi tiết kế hoạch sản xuất tuần"
            >
              <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">Chỉnh Sửa</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 p-4 sm:p-6 bg-white flex flex-col gap-3.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        {/* Top Row: Subheader Pill + Interactive Week Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
          {/* SUBHEADER PILL: Standardized from Slide 1 style */}
          <div className="w-full lg:w-auto bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200/60 border border-slate-300 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-2xs">
            <span className="text-[#0284c7] font-black text-2xl sm:text-3xl leading-none">
              6
            </span>
            <span className="text-slate-900 font-bold text-base sm:text-lg tracking-tight uppercase">
              {data.title || 'KẾ HOẠCH SẢN XUẤT TUẦN TIẾP THEO'}
            </span>
          </div>

          {/* Interactive Week Switcher Tabs (Linh hoạt các tuần tiếp theo) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1.5 bg-slate-100/90 border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Tuần:</span>
            </span>

            {/* Previous Week Arrow */}
            <button
              type="button"
              onClick={() => handleSelectWeek(Math.max(0, activeWeekIndex - 1))}
              disabled={activeWeekIndex === 0}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Xem tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Week Tab Buttons */}
            {weeksList.map((w, idx) => {
              const isActive = idx === activeWeekIndex;
              return (
                <button
                  key={w.id || idx}
                  type="button"
                  onClick={() => handleSelectWeek(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-black ring-2 ring-blue-400 ring-offset-1'
                      : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{w.weekHeader}</span>
                  {w.dateRange && (
                    <span className={`text-[10px] font-normal px-1 py-0.2 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'text-slate-500 bg-slate-100'
                    }`}>
                      {w.dateRange}
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}

            {/* Next Week Arrow */}
            <button
              type="button"
              onClick={() => handleSelectWeek(Math.min(weeksList.length - 1, activeWeekIndex + 1))}
              disabled={activeWeekIndex >= weeksList.length - 1}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Xem tuần kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Add Next Week Button (+ Thêm Tuần Tiếp Theo) */}
            <button
              type="button"
              onClick={handleAddNextWeek}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer ml-1"
              title="Thêm kế hoạch tuần tiếp theo với ngày kế tiếp tự động"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tuần Tiếp Theo</span>
            </button>
          </div>
        </div>

        {/* Summary Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border-l-4 border-blue-500 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                Nhân lực Line ({currentWeek.weekHeader})
              </p>
              <p className="text-xl font-black text-blue-900">{currentWeek.manpowerSummary}</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-xl border-l-4 border-indigo-500 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                Nhân lực RMA ({currentWeek.weekHeader})
              </p>
              <p className="text-xl font-black text-indigo-900">{currentWeek.rmaSummary}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border-l-4 border-emerald-500 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                Thời gian thực hiện
              </p>
              <p className="text-base font-black text-emerald-900">
                {currentWeek.rows?.[0]?.date || ''} ➜ {currentWeek.rows?.[currentWeek.rows.length - 1]?.date || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Table */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="bg-blue-900/90 text-white px-4 py-2 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-bold uppercase tracking-widest">
                Chi tiết kế hoạch {currentWeek.weekHeader}
              </span>
              {currentWeek.dateRange && (
                <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full font-medium">
                  {currentWeek.dateRange}
                </span>
              )}
            </div>
            <span className="text-xs text-blue-200 font-medium hidden sm:inline">
              Hiển thị {currentWeek.rows.length} ngày sản xuất
            </span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-blue-50 sticky top-0 z-10">
                <tr className="border-b border-blue-200 text-[11px] sm:text-xs font-black text-blue-900 uppercase tracking-wider">
                  <th className="px-4 py-3 border-r border-blue-100">Ngày sản xuất</th>
                  <th className="px-4 py-3 border-r border-blue-100">Kế hoạch chi tiết DCLR</th>
                  <th className="px-4 py-3 border-r border-blue-100 text-center">RMA/BG</th>
                  <th className="px-4 py-3 border-r border-blue-100 text-center">Nhân lực Line</th>
                  <th className="px-4 py-3 text-center">Nhân lực RMA</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {currentWeek.rows.map((row, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/20'} hover:bg-blue-50 transition-colors border-b border-blue-50 last:border-0`}>
                    <td className="px-4 py-2.5 border-r border-blue-50 font-bold text-slate-700 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-2.5 border-r border-blue-50 font-black text-blue-800">{row.planDCLR}</td>
                    <td className="px-4 py-2.5 border-r border-blue-50 text-center font-bold text-indigo-700">{row.rmaBg}</td>
                    <td className="px-4 py-2.5 border-r border-blue-50 text-center font-bold text-slate-700">{row.manpowerLine}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-700">{row.manpowerRma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        {showNotes && (
          <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-widest shrink-0">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              <span>Kế hoạch nhân sự và sản xuất dự kiến: {currentWeek.weekHeader}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-blue-700 font-black">PXLR Production Management</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ClipboardList, Edit3, CheckCircle2, AlertCircle, Clock, Timer, ChevronRight, Plus, Calendar, ChevronLeft, Sparkles } from 'lucide-react';
import { Slide6TaskPlanData, Slide6WeekTaskPlan, Slide6TaskRow } from './types';
import { StorageService } from './storage';

interface Slide6TaskPlanPresentationProps {
  data: Slide6TaskPlanData;
  isFullscreen?: boolean;
  onOpenEditor?: () => void;
  onUpdateData?: (newData: Slide6TaskPlanData) => void;
}

export const Slide6TaskPlanPresentation: React.FC<Slide6TaskPlanPresentationProps> = ({
  data,
  isFullscreen = false,
  onOpenEditor,
  onUpdateData,
}) => {
  // Ensure weeks list exists
  const weeksList: Slide6WeekTaskPlan[] = data.weeks && data.weeks.length > 0
    ? data.weeks
    : [
        {
          id: 'w-default',
          weekHeader: data.weekHeader || 'Tuần 38',
          weekTitle: data.title || 'Kế hoạch công việc trọng điểm',
          rows: data.rows || []
        }
      ];

  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(() => {
    if (typeof data.activeWeekIndex === 'number' && data.activeWeekIndex >= 0 && data.activeWeekIndex < weeksList.length) {
      return data.activeWeekIndex;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof data.activeWeekIndex === 'number' && data.activeWeekIndex >= 0 && data.activeWeekIndex < weeksList.length) {
      setActiveWeekIndex(data.activeWeekIndex);
    }
  }, [data.activeWeekIndex, weeksList.length]);

  const currentWeek = weeksList[activeWeekIndex] || weeksList[0];

  const handleSelectWeek = (idx: number) => {
    setActiveWeekIndex(idx);
    const updatedData: Slide6TaskPlanData = {
      ...data,
      activeWeekIndex: idx,
      weekHeader: weeksList[idx].weekHeader,
      title: weeksList[idx].weekTitle || data.title,
      rows: weeksList[idx].rows,
      weeks: weeksList,
    };
    StorageService.saveSlide6TaskPlan(updatedData);
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

    const newRows: Slide6TaskRow[] = [
      {
        task: `Kế hoạch trọng điểm Tuần ${nextNum}`,
        detail: `Triển khai các hạng mục nâng cao NSLĐ và kiểm soát 4M Tuần ${nextNum}`,
        deadline: `Đang lập kế hoạch\nTuần ${nextNum}`,
        status: 'pending',
      },
      {
        task: 'Kiểm soát tỷ lệ lỗi ngoài BOM & tồn trạm',
        detail: 'Họp giao ban tổ trưởng line RO và line Bếp Ga hàng ngày',
        deadline: 'Hàng ngày',
        status: 'in_progress',
      }
    ];

    const newWeek: Slide6WeekTaskPlan = {
      id: `w-${nextNum}`,
      weekHeader: `Tuần ${nextNum}`,
      weekTitle: `Kế hoạch công việc trọng điểm Tuần ${nextNum}`,
      rows: newRows,
    };

    const newWeeks = [...weeksList, newWeek];
    const newIdx = newWeeks.length - 1;
    setActiveWeekIndex(newIdx);

    const updatedData: Slide6TaskPlanData = {
      ...data,
      activeWeekIndex: newIdx,
      weekHeader: newWeek.weekHeader,
      title: newWeek.weekTitle || data.title,
      rows: newWeek.rows,
      weeks: newWeeks,
    };

    StorageService.saveSlide6TaskPlan(updatedData);
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
      {/* SLIDE TOP BANNER: Red Box + Dark Teal Header */}
      <div className="w-full flex items-stretch h-10 sm:h-12 border-b border-teal-900 select-none shrink-0">
        <div className="w-10 sm:w-16 bg-[#cc0000] flex-shrink-0" />
        <div className="flex-1 bg-[#006064] flex items-center px-4 sm:px-6">
          <h1 className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wider uppercase flex items-center gap-2">
            <span>BÁO CÁO SẢN XUẤT DCLR ({currentWeek.weekHeader.toUpperCase()})</span>
            {currentWeek.dateRange && (
              <span className="text-teal-200 text-xs font-normal lowercase">({currentWeek.dateRange})</span>
            )}
          </h1>
          {!isFullscreen && onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="ml-auto p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer group"
              title="Chỉnh sửa nội dung slide"
            >
              <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 p-4 sm:p-6 bg-white flex flex-col gap-3 overflow-y-auto">
        {/* SUBHEADER & WEEK SELECTOR BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-auto bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200/60 border border-slate-300 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-2xs">
            <span className="text-[#0284c7] font-black text-2xl sm:text-3xl leading-none">
              7
            </span>
            <span className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight">
              {currentWeek.weekTitle || data.title || 'KẾ HOẠCH CÔNG VIỆC TRỌNG ĐIỂM'}
            </span>
          </div>

          {/* Week tabs for flexible upcoming weeks */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-2xs overflow-x-auto max-w-full">
            <span className="text-slate-500 font-bold text-xs px-2 flex items-center gap-1 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5" /> Tuần:
            </span>
            {weeksList.map((w, idx) => {
              const isSelected = idx === activeWeekIndex;
              return (
                <button
                  key={w.id || idx}
                  onClick={() => handleSelectWeek(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#4472c4] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{w.weekHeader}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />}
                </button>
              );
            })}
            <button
              onClick={handleAddNextWeek}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-300 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shadow-2xs"
              title="Thêm tuần kế hoạch tiếp theo"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm tuần</span>
            </button>
          </div>
        </div>

        {/* Task Table */}
        <div className="border-[3px] border-[#4472c4] rounded-sm overflow-hidden bg-white shadow-lg flex-1 min-h-[360px]">
          <table className="w-full border-collapse table-fixed h-full">
            <thead>
              <tr className="bg-[#4472c4] text-white">
                <th className="w-[30%] border border-[#4472c4] py-3 px-6 text-center font-bold text-lg uppercase tracking-widest">
                  CÔNG VIỆC
                </th>
                <th className="w-[42%] border border-[#4472c4] py-3 px-6 text-center font-bold text-lg uppercase tracking-widest">
                  CHI TIẾT
                </th>
                <th className="w-[28%] border border-[#4472c4] py-3 px-6 text-center font-bold text-lg uppercase tracking-widest">
                  DEADLINE
                </th>
              </tr>
            </thead>
            <tbody>
              {currentWeek.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="border border-[#4472c4] p-4 font-bold text-slate-900 text-base sm:text-[17px] align-middle leading-tight text-left">
                    {row.task}
                  </td>
                  <td className="border border-[#4472c4] p-4 text-slate-800 text-sm sm:text-base align-middle leading-snug text-left">
                    {row.detail}
                  </td>
                  <td className="border border-[#4472c4] p-4 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {row.deadline.split('\n').map((line, lIdx) => {
                        const isHighlighted = row.highlightedText && line.includes(row.highlightedText);
                        const isOverdue = line.includes('Trễ') || (line.includes('Gia hạn') && !line.includes('Hoàn thành'));
                        const isCompleted = line.includes('Hoàn thành') || line.includes('Đúng tiến độ');

                        return (
                          <div 
                            key={lIdx} 
                            className={`
                              px-1 text-sm sm:text-base font-bold leading-tight
                              ${isHighlighted ? 'text-blue-900 bg-blue-50/80 rounded px-2 py-0.5' : ''}
                              ${isOverdue && !isCompleted ? 'text-[#c00000] line-through decoration-[2px]' : ''}
                              ${isCompleted ? 'text-[#00b050]' : ''}
                              ${!isOverdue && !isCompleted && !isHighlighted ? 'text-slate-900' : ''}
                            `}
                          >
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {/* Fill remaining space if few rows */}
              {currentWeek.rows.length < 4 && (
                <tr className="flex-1">
                  <td colSpan={3} className="border border-[#4472c4] bg-white"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="h-8 bg-[#0070c0] flex items-center px-6 justify-between shrink-0">
        <span className="text-white text-xs font-bold opacity-90">
          Kế hoạch công việc {currentWeek.weekHeader} • {weeksList.length} tuần kế hoạch được thiết lập
        </span>
        <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase opacity-75">
          PXLR Production Report System v2.0
        </span>
      </div>
    </div>
  );
};

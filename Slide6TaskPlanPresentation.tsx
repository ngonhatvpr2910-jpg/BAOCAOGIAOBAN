import React from 'react';
import { ClipboardList, Edit3, CheckCircle2, AlertCircle, Clock, Timer, ChevronRight } from 'lucide-react';
import { Slide6TaskPlanData } from './types';

interface Slide6TaskPlanPresentationProps {
  data: Slide6TaskPlanData;
  isFullscreen?: boolean;
  onOpenEditor?: () => void;
}

export const Slide6TaskPlanPresentation: React.FC<Slide6TaskPlanPresentationProps> = ({
  data,
  isFullscreen = false,
  onOpenEditor,
}) => {
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
          <h1 className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wider uppercase">
            BÁO CÁO SẢN XUẤT DCLR
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
      <div className="flex-1 p-4 sm:p-6 bg-white flex flex-col gap-4 overflow-y-auto">
        {/* SUBHEADER PILL: Standardized from Slide 1 style */}
        <div className="w-full sm:w-2/3 md:w-3/5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200/60 border border-slate-300 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-2xs">
          <span className="text-[#0284c7] font-black text-2xl sm:text-3xl leading-none">
            {data.weekHeader || '7'}
          </span>
          <span className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight">
            {data.title || 'Công việc W38 và KHCV W39'}
          </span>
        </div>        <div className="border-[3px] border-[#4472c4] rounded-sm overflow-hidden bg-white shadow-lg h-full">
          <table className="w-full border-collapse table-fixed h-full">
            <thead>
              <tr className="bg-[#4472c4] text-white">
                <th className="w-[30%] border border-[#4472c4] py-4 px-6 text-center font-bold text-xl uppercase tracking-widest">
                  CÔNG VIỆC
                </th>
                <th className="w-[38%] border border-[#4472c4] py-4 px-6 text-center font-bold text-xl uppercase tracking-widest">
                  CHI TIẾT
                </th>
                <th className="w-[32%] border border-[#4472c4] py-4 px-6 text-center font-bold text-xl uppercase tracking-widest">
                  DEADLINE
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors h-1">
                  <td className="border border-[#4472c4] p-6 font-bold text-slate-900 text-[19px] align-middle leading-tight text-left">
                    {row.task}
                  </td>
                  <td className="border border-[#4472c4] p-6 text-slate-800 text-[19px] align-middle leading-snug text-left">
                    {row.detail}
                  </td>
                  <td className="border border-[#4472c4] p-6 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      {row.deadline.split('\n').map((line, lIdx) => {
                        const isHighlighted = row.highlightedText && line.includes(row.highlightedText);
                        const isOverdue = (line.includes('05/09') || line.includes('20/09')) && !line.includes('Hoàn thành');
                        const isCompleted = line.includes('Hoàn thành');

                        return (
                          <div 
                            key={lIdx} 
                            className={`
                              px-1 text-[19px] font-bold leading-tight
                              ${isHighlighted ? 'text-blue-900 bg-blue-50/80 rounded px-2 py-0.5' : ''}
                              ${isOverdue && !isCompleted ? 'text-[#c00000] line-through decoration-[3px]' : ''}
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
              {data.rows.length < 5 && (
                <tr className="flex-1">
                  <td colSpan={3} className="border border-[#4472c4] bg-white"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="h-8 bg-[#0070c0] flex items-center px-6 justify-end shrink-0">
        <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase opacity-75">
          PXLR Production Report System v2.0
        </span>
      </div>
    </div>
  );
};

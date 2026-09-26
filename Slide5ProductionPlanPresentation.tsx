import React from 'react';
import { Slide5ProductionPlanData } from './types';
import { Calendar, Users, Edit3, ClipboardList } from 'lucide-react';

interface Slide5ProductionPlanPresentationProps {
  data: Slide5ProductionPlanData;
  isFullscreen?: boolean;
  onOpenEditor?: () => void;
  showNotes?: boolean;
}

export const Slide5ProductionPlanPresentation: React.FC<Slide5ProductionPlanPresentationProps> = ({
  data,
  isFullscreen = false,
  onOpenEditor,
  showNotes = true,
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
      <div className="flex-1 p-4 sm:p-6 bg-white flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        {/* SUBHEADER PILL: Standardized from Slide 1 style */}
        <div className="w-full sm:w-2/3 md:w-3/5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200/60 border border-slate-300 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-2xs">
          <span className="text-[#0284c7] font-black text-2xl sm:text-3xl leading-none">
            {data.weekHeader || '6'}
          </span>
          <span className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight">
            {data.title || 'KẾ HOẠCH SẢN XUẤT TUẦN TIẾP THEO'}
          </span>
        </div>        {/* Summary Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border-l-4 border-blue-500 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Nhân lực Line</p>
              <p className="text-xl font-black text-blue-900">{data.manpowerSummary}</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-xl border-l-4 border-indigo-500 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Nhân lực RMA</p>
              <p className="text-xl font-black text-indigo-900">{data.rmaSummary}</p>
            </div>
          </div>
        </div>

        {/* Plan Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-900/90 text-white px-4 py-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-300" />
            <span className="text-sm font-bold uppercase tracking-widest">Chi tiết kế hoạch tuần {data.weekHeader}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-blue-50">
                <tr className="border-b border-blue-200 text-[11px] sm:text-xs font-black text-blue-900 uppercase tracking-wider">
                  <th className="px-4 py-3 border-r border-blue-100">Ngày sản xuất</th>
                  <th className="px-4 py-3 border-r border-blue-100">Kế hoạch chi tiết DCLR</th>
                  <th className="px-4 py-3 border-r border-blue-100 text-center">RMA/BG</th>
                  <th className="px-4 py-3 border-r border-blue-100 text-center">Nhân lực ({data.manpowerSummary})</th>
                  <th className="px-4 py-3 text-center">({data.rmaSummary})</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {data.rows.map((row, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/20'} hover:bg-blue-50 transition-colors border-b border-blue-50 last:border-0`}>
                    <td className="px-4 py-2.5 border-r border-blue-50 font-bold text-slate-700">{row.date}</td>
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
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              <span>Kế hoạch nhân sự và sản xuất dự kiến tuần tiếp theo</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-blue-700 font-black">PXLR Report System</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

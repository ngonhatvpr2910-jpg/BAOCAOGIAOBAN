import React from 'react';
import { Slide4ProductionTargetData } from './types';
import { Edit3, TrendingUp, Users, Target, Calendar, Info, Layers } from 'lucide-react';

interface Slide4ProductionTargetPresentationProps {
  data: Slide4ProductionTargetData;
  isFullscreen?: boolean;
  onOpenEditor?: () => void;
  showNotes?: boolean;
}

export const Slide4ProductionTargetPresentation: React.FC<Slide4ProductionTargetPresentationProps> = ({
  data,
  isFullscreen = false,
  onOpenEditor,
  showNotes = true
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
              title="Chỉnh sửa nội dung Slide 4"
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
            {data.slideNumber || '5'}
          </span>
          <span className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight">
            {data.title || 'MỤC TIÊU SẢN XUẤT TIẾP THEO'}
          </span>
        </div>        {/* Summary Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border-l-4 border-blue-500 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Lũy kế NSLĐ 2025</p>
              <p className="text-xl font-black text-blue-900">{data.luyKe2025}%</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-xl border-l-4 border-emerald-500 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Lũy kế NSLĐ 2026 (Mục tiêu)</p>
              <p className="text-xl font-black text-emerald-900">{data.luyKe2026}%</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border-l-4 border-amber-500 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Định biên nhân sự</p>
              <p className="text-xl font-black text-amber-900">{data.dinhBienNhanSu} người</p>
            </div>
          </div>
        </div>

        {/* Targets Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 text-white px-4 py-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold uppercase tracking-widest">Kế hoạch năng suất 12 tháng</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm">
                <tr className="border-b border-slate-300 text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wider">
                  <th className="px-4 py-3 border-r border-slate-200">Tháng</th>
                  <th className="px-4 py-3 border-r border-slate-200 text-center">NSLĐ (%)</th>
                  <th className="px-4 py-3 border-r border-slate-200 text-center">SP Quy đổi</th>
                  <th className="px-4 py-3 text-center">Tổng công</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-mono font-bold">
                {data.monthlyTargets.map((row, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-emerald-50/30 transition-colors border-b border-slate-100 last:border-0`}>
                    <td className={`px-4 py-2 border-r border-slate-100 font-black text-slate-700 ${row.month ? 'bg-amber-50/30' : ''}`}>{row.month}</td>
                    <td className={`px-4 py-2 border-r border-slate-100 text-center font-black ${row.cong / (row.tonThat || 1) / 9.03 > 0 ? 'bg-yellow-100/50' : ''} ${((row.cong / (row.tonThat || 1)) / 9.03) * 100 >= 110 ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {row.tonThat > 0 ? `${(((row.cong / row.tonThat) / 9.03) * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td className={`px-4 py-2 border-r border-slate-100 text-center font-black ${row.cong > 0 ? 'bg-yellow-100/50 text-blue-800' : 'text-slate-400'}`}>
                      {row.cong > 0 ? row.cong.toLocaleString() : '-'}
                    </td>
                    <td className={`px-4 py-2 text-center font-bold ${row.tonThat > 0 ? 'bg-yellow-100/50 text-slate-700' : 'text-slate-400'}`}>
                      {row.tonThat > 0 ? row.tonThat.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Footer Total Row */}
              <tfoot className="sticky bottom-0 z-20 bg-emerald-50 border-t-2 border-emerald-700 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
                <tr className="text-xs sm:text-sm font-black text-emerald-900 uppercase">
                  <td className="px-4 py-3 border-r border-emerald-200">TỔNG CỘNG</td>
                  <td className="px-4 py-3 border-r border-emerald-200 text-center text-teal-700 bg-emerald-100/50">
                    {((data.monthlyTargets.reduce((acc, curr) => acc + curr.cong, 0) / 
                       (data.monthlyTargets.reduce((acc, curr) => acc + curr.tonThat, 0) || 1) / 9.03) * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 border-r border-emerald-200 text-center text-blue-800 bg-emerald-100/50">
                    {data.monthlyTargets.reduce((acc, curr) => acc + curr.cong, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700 bg-emerald-100/50">
                    {data.monthlyTargets.reduce((acc, curr) => acc + curr.tonThat, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        {showNotes && (
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500" />
              <span>Dữ liệu dựa trên báo cáo thực tế tháng 1 - tháng 9 và kế hoạch dự kiến tháng 10 - tháng 12</span>
            </div>
            <div className="flex items-center gap-4">
              <span>PowerPoint Slide {data.slideNumber || '5'}</span>
              <span className="text-emerald-700 font-black">PXLR Report System</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

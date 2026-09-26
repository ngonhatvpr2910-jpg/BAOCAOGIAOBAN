import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { MonthlyHistoryRecord } from './types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList 
} from 'recharts';
import { BarChart3, TrendingUp, Edit3, RotateCcw, Save, Check, Calendar, Layers, ChevronDown, ChevronUp, Sliders, Sparkles, Upload, Download } from 'lucide-react';
import { NSLDComparisonChart } from './NSLDComparisonChart';
import { ExcelImportModal } from './ExcelImportModal';
import { exportDefectCostTemplate } from './excelDefectService';
import { SlideDefectCostData } from './types';
import { StorageService } from './storage';

export const ExcelComparisonCharts: React.FC = () => {
  const { 
    monthlyHistory, 
    cumulativeNSLD, 
    updateMonthlyRecord, 
    updateAllMonthlyRecords, 
    resetMonthlyHistory 
  } = useProduction();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<MonthlyHistoryRecord[]>(monthlyHistory);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleApplyImport = (importedDefectData: Partial<SlideDefectCostData>, importedProdData?: MonthlyHistoryRecord[]) => {
    if (importedProdData && importedProdData.length > 0) {
      updateAllMonthlyRecords(importedProdData);
      setSaveSuccessMsg(`Đã nạp thành công ${importedProdData.length} tháng dữ liệu Năng suất & Công từ file Excel!`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Sync state if monthlyHistory changed externally
  React.useEffect(() => {
    setEditingData(monthlyHistory);
  }, [monthlyHistory]);

  const handleCellChange = (monthNum: number, field: keyof MonthlyHistoryRecord, value: number) => {
    setEditingData(prev => 
      prev.map(m => m.monthNum === monthNum ? { ...m, [field]: value } : m)
    );
  };

  const handleSaveAll = () => {
    updateAllMonthlyRecords(editingData);
    setSaveSuccessMsg('Đã cập nhật dữ liệu thành công! 4 đồ thị so sánh đã tự động vẽ lại.');
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 2500);
  };

  const handleReset = () => {
    if (window.confirm('Khôi phục lại dữ liệu chuẩn từ các biểu đồ Excel ban đầu?')) {
      resetMonthlyHistory();
      setSaveSuccessMsg('Đã khôi phục dữ liệu chuẩn thành công!');
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    }
  };

  // Formatters
  const percentFormatter = (val: any) => `${Number(val || 0).toFixed(1)}%`;
  const numberFormatter = (val: any) => Number(val || 0).toLocaleString('vi-VN');

  return (
    <div className="space-y-6">
      {/* 1. Exact "Biểu đồ So sánh NSLĐ" requested by user */}
      <NSLDComparisonChart />

      {/* 2. Top Bar with Title and Data Update Button for 4 NMBD Charts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Hệ Thống Đồ Thị So Sánh Vận Hành NMBD (2025 vs 2026)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tự động tổng hợp và vẽ lại 4 đồ thị so sánh khi cập nhật số liệu: Năng suất tháng, NSLĐ lũy kế, Công thao tác và Tỉ lệ đi làm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDefectCostTemplate(undefined, monthlyHistory)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl border border-slate-300 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Tải File Mẫu</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Up Dữ Liệu</span>
          </button>

          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            id="btn-toggle-editor"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">{isEditorOpen ? 'Đóng Bảng' : 'Sửa Thủ Công'}</span>
            <span className="sm:hidden">{isEditorOpen ? 'Đóng' : 'Sửa'}</span>
            {isEditorOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>

      {isImportModalOpen && (
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          currentData={StorageService.getSlide3DefectCost()}
          onApplyImport={handleApplyImport}
          productivityHistory={monthlyHistory}
        />
      )}

      {/* Slide-out Data Editor Table when user clicks "Cập Nhật Data Dữ Liệu" */}
      {isEditorOpen && (
        <div className="bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                Bảng Nhập Dữ Liệu Tháng (Tháng 1 - Tháng 12)
              </h4>
              <p className="text-xs text-slate-500">
                Chỉnh sửa số liệu từng tháng tại đây. Bấm <b>"Lưu & Vẽ Lại Đồ Thị"</b> để 4 biểu đồ phía dưới cập nhật tức thời!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi Phục Gốc Excel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                id="btn-save-monthly-data"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-4 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu & Vẽ Lại Đồ Thị</span>
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Responsive Editable Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 p-2 text-center w-16">Tháng</th>
                  <th className="border border-slate-300 p-2 text-center bg-blue-50/60 text-blue-900">NSLĐ 2025 (%)</th>
                  <th className="border border-slate-300 p-2 text-center bg-orange-50/60 text-orange-900">NSLĐ 2026 (%)</th>
                  <th className="border border-slate-300 p-2 text-center bg-blue-50/30 text-blue-900">Công 2025</th>
                  <th className="border border-slate-300 p-2 text-center bg-orange-50/30 text-orange-900">Công 2026</th>
                  <th className="border border-slate-300 p-2 text-center bg-slate-100">Đi Làm Lũy Kế (%)</th>
                </tr>
              </thead>
              <tbody>
                {editingData.map((m) => (
                  <tr key={m.monthNum} className="hover:bg-slate-50/80 transition">
                    <td className="border border-slate-300 p-2 text-center font-bold text-slate-800 bg-slate-50">
                      T{m.monthNum}
                    </td>
                    {/* NSLĐ 2025 */}
                    <td className="border border-slate-300 p-1.5 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={m.nsld2025}
                        onChange={(e) => handleCellChange(m.monthNum, 'nsld2025', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center font-semibold text-blue-700 bg-blue-50/30 border border-blue-200 rounded px-1.5 py-1 focus:bg-white focus:outline-hidden"
                      />
                    </td>
                    {/* NSLĐ 2026 */}
                    <td className="border border-slate-300 p-1.5 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={m.nsld2026}
                        onChange={(e) => handleCellChange(m.monthNum, 'nsld2026', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center font-bold text-orange-700 bg-orange-50/30 border border-orange-200 rounded px-1.5 py-1 focus:bg-white focus:outline-hidden"
                      />
                    </td>
                    {/* Công 2025 */}
                    <td className="border border-slate-300 p-1.5 text-center">
                      <input
                        type="number"
                        step="1"
                        value={m.cong2025}
                        onChange={(e) => handleCellChange(m.monthNum, 'cong2025', parseInt(e.target.value) || 0)}
                        className="w-20 text-center font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:bg-white focus:outline-hidden"
                      />
                    </td>
                    {/* Công 2026 */}
                    <td className="border border-slate-300 p-1.5 text-center">
                      <input
                        type="number"
                        step="1"
                        value={m.cong2026}
                        onChange={(e) => handleCellChange(m.monthNum, 'cong2026', parseInt(e.target.value) || 0)}
                        className="w-20 text-center font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:bg-white focus:outline-hidden"
                      />
                    </td>
                    {/* Đi làm lũy kế */}
                    <td className="border border-slate-300 p-1.5 text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={m.tiLeDiLam}
                        onChange={(e) => handleCellChange(m.monthNum, 'tiLeDiLam', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:bg-white focus:outline-hidden"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4 EXACT EXCEL COMPARISON CHARTS (Grid 2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Năng suất Lao Động Tháng NMBD (Top Left - Spans 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-center mb-3">
            <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Năng suất Lao Động Tháng NMBD
            </h4>
            <div className="flex items-center justify-center gap-4 text-xs font-bold mt-1">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 bg-[#3b82f6] rounded-xs inline-block"></span> 2025
              </span>
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-3 h-3 bg-[#f97316] rounded-xs inline-block"></span> 2026
              </span>
            </div>
          </div>

          <div className="h-[280px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHistory} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} 
                  interval={0}
                />
                <YAxis 
                  domain={[0, 140]} 
                  ticks={[0, 20, 40, 60, 80, 100, 120, 140]}
                  tickFormatter={(v) => `${v}.00%`}
                  tick={{ fontSize: 9, fill: '#64748b' }} 
                />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val).toFixed(2)}%`, '']}
                  contentStyle={{ borderRadius: '10px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                />
                <Bar dataKey="nsld2025" name="2025" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                  <LabelList 
                    dataKey="nsld2025" 
                    position="top" 
                    formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                    style={{ fontSize: '11px', fill: '#1e3a8a', fontWeight: 800 }}
                    offset={6}
                  />
                </Bar>
                <Bar dataKey="nsld2026" name="2026" fill="#f97316" radius={[2, 2, 0, 0]}>
                  <LabelList 
                    dataKey="nsld2026" 
                    position="top" 
                    formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                    style={{ fontSize: '11px', fill: '#9a3412', fontWeight: 800 }}
                    offset={6}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: NSLĐ Lũy Kế Cả Năm (Top Right - Spans 4 cols, 3D style Column matching user image) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-center mb-2">
            <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              NSLĐ LŨY KẾ CẢ NĂM
            </h4>
            <div className="flex items-center justify-center gap-4 text-xs font-bold mt-1">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 bg-[#3b82f6] rounded-xs inline-block"></span> 2025
              </span>
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-3 h-3 bg-[#ea580c] rounded-xs inline-block"></span> 2026
              </span>
            </div>
          </div>

          {/* 3D-effect comparison blocks matching the Excel isometric view */}
          <div className="flex-1 flex items-end justify-center gap-6 sm:gap-8 pb-4 pt-6 px-4">
            {/* 2025 Column */}
            <div className="flex flex-col items-center">
              <span className="text-sm sm:text-base font-black text-blue-900 mb-1.5">
                {cumulativeNSLD.nsld2025.toFixed(2)}%
              </span>
              <div 
                className="w-16 sm:w-20 bg-gradient-to-t from-blue-700 via-blue-500 to-blue-400 rounded-t-md shadow-md border-t-2 border-r-2 border-blue-300 relative group transition-all"
                style={{ height: `${Math.max(60, Math.min(180, (cumulativeNSLD.nsld2025 - 90) * 8))}px` }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition rounded-t-md"></div>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">2025</span>
            </div>

            {/* 2026 Column */}
            <div className="flex flex-col items-center">
              <span className="text-sm sm:text-base font-black text-orange-900 mb-1.5">
                {cumulativeNSLD.nsld2026.toFixed(2)}%
              </span>
              <div 
                className="w-16 sm:w-20 bg-gradient-to-t from-orange-700 via-orange-500 to-orange-400 rounded-t-md shadow-md border-t-2 border-r-2 border-orange-300 relative group transition-all"
                style={{ height: `${Math.max(60, Math.min(220, (cumulativeNSLD.nsld2026 - 90) * 8))}px` }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition rounded-t-md"></div>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">2026</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-xs">
            <span className="text-slate-600 font-medium">Tăng trưởng NSLĐ: </span>
            <span className="font-black text-emerald-600 text-sm">
              +{Number(cumulativeNSLD.nsld2026 - cumulativeNSLD.nsld2025).toFixed(2)}%
            </span>
            <span className="text-slate-500 ml-1 font-semibold">(Vượt mục tiêu 120%)</span>
          </div>
        </div>

        {/* CHART 3: Công Thao Tác Theo Tháng (Bottom Left - Spans 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-center mb-3">
            <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Công Thao Tác Theo Tháng
            </h4>
            <div className="flex items-center justify-center gap-4 text-xs font-bold mt-1">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 bg-[#3b82f6] rounded-xs inline-block"></span> 2025
              </span>
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-3 h-3 bg-[#f97316] rounded-xs inline-block"></span> 2026
              </span>
            </div>
          </div>

          <div className="h-[280px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHistory} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="monthNum" 
                  tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 700 }} 
                />
                <YAxis 
                  domain={[0, 3000]} 
                  ticks={[0, 500, 1000, 1500, 2000, 2500, 3000]}
                  tickFormatter={(v) => v === 0 ? '-' : v.toLocaleString('vi-VN')}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} công`, '']}
                  contentStyle={{ borderRadius: '10px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                />
                <Bar dataKey="cong2025" name="2025" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                  <LabelList 
                    dataKey="cong2025" 
                    position="top" 
                    formatter={(v: any) => Number(v) > 0 ? Number(v).toLocaleString('vi-VN') : ''}
                    style={{ fontSize: '10px', fill: '#1e3a8a', fontWeight: 800 }}
                    offset={5}
                  />
                </Bar>
                <Bar dataKey="cong2026" name="2026" fill="#f97316" radius={[2, 2, 0, 0]}>
                  <LabelList 
                    dataKey="cong2026" 
                    position="top" 
                    formatter={(v: any) => Number(v) > 0 ? Number(v).toLocaleString('vi-VN') : ''}
                    style={{ fontSize: '10px', fill: '#9a3412', fontWeight: 800 }}
                    offset={5}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: TỈ LỆ ĐI LÀM LŨY KẾ THÁNG (Bottom Right - Spans 5 cols, Dark background matching user image) */}
        <div className="lg:col-span-5 bg-[#1e2530] text-white rounded-2xl border border-slate-800 shadow-md p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-center mb-3">
            <h4 className="text-sm sm:text-base font-black text-slate-100 tracking-wider uppercase">
              TỈ LỆ ĐI LÀM LŨY KẾ THÁNG
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Theo dõi biến động chuyên cần qua 12 tháng (Năm 2026)
            </p>
          </div>

          <div className="h-[280px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHistory} margin={{ top: 25, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#cbd5e1', fontWeight: 700 }} 
                  interval={0}
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val)}%`, 'Tỉ lệ đi làm']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="tiLeDiLam" fill="#38bdf8" radius={[3, 3, 0, 0]}>
                  <LabelList 
                    dataKey="tiLeDiLam" 
                    position="top" 
                    formatter={(v: any) => Number(v) > 0 ? `${Number(v)}%` : '0.0%'}
                    style={{ fontSize: '11px', fill: '#7dd3fc', fontWeight: 800 }}
                    offset={6}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

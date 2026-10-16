import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  Sliders, 
  Edit3, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Calendar
} from 'lucide-react';

export interface LRROColumnData {
  key: string;
  label: string;
  slsx: number;
  ok: number;
  ngConNguoi: number;
  ngMayMoc: number;
  ngPhuongPhap: number;
  ngVatTu: number;
  ngKhac: number;
  dmVatTu: number;
  dmLoi4M: number;
}

// Initial Data matching exact numbers from user's Excel sheet (image.png)
export const INITIAL_LRRO_DATA: LRROColumnData[] = [
  { key: '2025', label: '2025', slsx: 70738, ok: 66182, ngConNguoi: 2318, ngMayMoc: 85, ngPhuongPhap: 39, ngVatTu: 2114, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 1.8 },
  { key: '2026', label: '2026', slsx: 76985, ok: 73766, ngConNguoi: 2249, ngMayMoc: 47, ngPhuongPhap: 57, ngVatTu: 866, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'T7', label: 'T7', slsx: 7090, ok: 6822, ngConNguoi: 205, ngMayMoc: 6, ngPhuongPhap: 0, ngVatTu: 57, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'T8', label: 'T8', slsx: 8526, ok: 8256, ngConNguoi: 199, ngMayMoc: 4, ngPhuongPhap: 0, ngVatTu: 67, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'T9', label: 'T9', slsx: 8917, ok: 8623, ngConNguoi: 187, ngMayMoc: 5, ngPhuongPhap: 6, ngVatTu: 96, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'T10', label: 'T10', slsx: 6577, ok: 6372, ngConNguoi: 123, ngMayMoc: 2, ngPhuongPhap: 0, ngVatTu: 80, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'W39', label: 'W39', slsx: 2704, ok: 2601, ngConNguoi: 63, ngMayMoc: 2, ngPhuongPhap: 6, ngVatTu: 32, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'W40', label: 'W40', slsx: 3030, ok: 2943, ngConNguoi: 52, ngMayMoc: 1, ngPhuongPhap: 0, ngVatTu: 34, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'W41', label: 'W41', slsx: 3087, ok: 2988, ngConNguoi: 61, ngMayMoc: 2, ngPhuongPhap: 0, ngVatTu: 36, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: 'W42', label: 'W42', slsx: 1624, ok: 1567, ngConNguoi: 35, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 22, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: '9-Oct', label: '9-Oct', slsx: 500, ok: 483, ngConNguoi: 10, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 7, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: '10-Oct', label: '10-Oct', slsx: 520, ok: 502, ngConNguoi: 7, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 11, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: '11-Oct', label: '11-Oct', slsx: 330, ok: 320, ngConNguoi: 9, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 1, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: '12-Oct', label: '12-Oct', slsx: 325, ok: 311, ngConNguoi: 9, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 5, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: '13-Oct', label: '13-Oct', slsx: 401, ok: 384, ngConNguoi: 7, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 10, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: '14-Oct', label: '14-Oct', slsx: 448, ok: 434, ngConNguoi: 12, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 2, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
  { key: '15-Oct', label: '15-Oct', slsx: 450, ok: 438, ngConNguoi: 7, ngMayMoc: 0, ngPhuongPhap: 0, ngVatTu: 5, ngKhac: 0, dmVatTu: 2.4, dmLoi4M: 5.2 },
];

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

export const LRRODetailView: React.FC = () => {
  const [columns, setColumns] = useState<LRROColumnData[]>(INITIAL_LRRO_DATA);
  const [selectedColKey, setSelectedColKey] = useState<string>('W42');
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Compute calculated metrics for each column
  const calculatedColumns = useMemo(() => {
    return columns.map(col => {
      const ngTotal = col.ngConNguoi + col.ngMayMoc + col.ngPhuongPhap + col.ngVatTu + col.ngKhac;
      const slsx = col.slsx > 0 ? col.slsx : 1;
      const ok = col.slsx - ngTotal;

      const pConNguoi = (col.ngConNguoi / slsx) * 100;
      const pMayMoc = (col.ngMayMoc / slsx) * 100;
      const pPhuongPhap = (col.ngPhuongPhap / slsx) * 100;
      const pVatTu = (col.ngVatTu / slsx) * 100;

      const pTotal3M = pConNguoi + pMayMoc + pPhuongPhap;
      const pTotal4M = (ngTotal / slsx) * 100;

      return {
        ...col,
        ok,
        ngTotal,
        pConNguoi: Number(pConNguoi.toFixed(1)),
        pMayMoc: Number(pMayMoc.toFixed(1)),
        pPhuongPhap: Number(pPhuongPhap.toFixed(1)),
        pVatTu: Number(pVatTu.toFixed(1)),
        pTotal3M: Number(pTotal3M.toFixed(1)),
        pTotal4M: Number(pTotal4M.toFixed(1)),
      };
    });
  }, [columns]);

  // Selected column for pie chart breakdown
  const selectedCol = useMemo(() => {
    return calculatedColumns.find(c => c.key === selectedColKey) || calculatedColumns[9];
  }, [calculatedColumns, selectedColKey]);

  // Pie chart data (% breakdown of 4M NG)
  const pieData = useMemo(() => {
    const totalNG = selectedCol.ngTotal > 0 ? selectedCol.ngTotal : 1;
    const pConNguoi = Math.round((selectedCol.ngConNguoi / totalNG) * 100);
    const pVatTu = Math.round((selectedCol.ngVatTu / totalNG) * 100);
    const pMayMoc = Math.round((selectedCol.ngMayMoc / totalNG) * 100);
    const pPhuongPhap = Math.round((selectedCol.ngPhuongPhap / totalNG) * 100);
    const pKhac = Math.max(0, 100 - (pConNguoi + pVatTu + pMayMoc + pPhuongPhap));

    return [
      { name: 'Con người (Thao tác)', value: pConNguoi, count: selectedCol.ngConNguoi, color: '#3b82f6' },
      { name: 'Vật tư', value: pVatTu, count: selectedCol.ngVatTu, color: '#8b5cf6' },
      { name: 'Máy móc', value: pMayMoc, count: selectedCol.ngMayMoc, color: '#ec4899' },
      { name: 'Phương pháp', value: pPhuongPhap, count: selectedCol.ngPhuongPhap, color: '#f97316' },
      { name: 'Khác', value: pKhac, count: selectedCol.ngKhac, color: '#64748b' },
    ].filter(item => item.value > 0 || item.name === 'Con người (Thao tác)' || item.name === 'Vật tư');
  }, [selectedCol]);

  // Chart data for ComposedChart (Bars + Line)
  const chartData = useMemo(() => {
    return calculatedColumns.map(c => ({
      name: c.label,
      dmVatTu: c.dmVatTu,
      vatTu: c.pVatTu,
      total4M: c.pTotal4M,
      dmLoi4M: c.dmLoi4M,
    }));
  }, [calculatedColumns]);

  const handleValueChange = (key: string, field: keyof LRROColumnData, val: number) => {
    setColumns(prev => prev.map(col => {
      if (col.key === key) {
        return { ...col, [field]: val };
      }
      return col;
    }));
  };

  const handleReset = () => {
    setColumns(INITIAL_LRRO_DATA);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6 font-sans">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-sm">LRRO</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Báo Cáo Tỷ Lệ Lỗi 4M / 3M Line RO Chuẩn Excel
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Công thức tự động: Total % lỗi 4M = NG / SLSX = Total % 3M + % Vật tư. Bấm vào bất kỳ cột tuần nào để xem biểu đồ tròn phân bổ 4M!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Gốc Excel</span>
          </button>
          <button
            onClick={() => setIsEditable(!isEditable)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditable ? 'Xác Nhận Sửa' : 'Sửa Số Liệu'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Đã cập nhật công thức và số liệu chuẩn thành công!</span>
        </div>
      )}

      {/* Grid for 2 Main Charts matching image.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: TỶ LỆ LỖI LINE RO (Bar & Line Composed Chart) */}
        <div className="lg:col-span-8 bg-slate-50/50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
          <div className="text-center mb-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              TỶ LỆ LỖI LINE RO
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold mt-1 text-slate-700">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#1e3a8a] rounded-xs inline-block" /> ĐM vật tư
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#f97316] rounded-xs inline-block" /> Vật tư
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-[#dc2626] inline-block" /> Total % lỗi 4M
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 border-t-2 border-dashed border-[#8b5cf6] inline-block" /> ĐM % lỗi 4M
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 700 }} interval={0} />
                <YAxis domain={[0, 7.0]} ticks={[0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]} tickFormatter={(v) => `${v.toFixed(1)}%`} tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']} contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                
                <Bar dataKey="dmVatTu" name="ĐM vật tư" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
                <Bar dataKey="vatTu" name="Vật tư" fill="#f97316" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="total4M" name="Total % lỗi 4M" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3, fill: '#dc2626' }} />
                <Line type="monotone" dataKey="dmLoi4M" name="ĐM % lỗi 4M" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: TỶ LỆ 4M LINE RO TRONG TUẦN (Pie Chart) */}
        <div className="lg:col-span-4 bg-slate-50/50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
          <div className="text-center mb-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              TỶ LỆ 4M LINE RO TRONG TUẦN ({selectedCol.label})
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold">
              Tổng số lỗi 4M: <strong>{selectedCol.ngTotal} SP</strong>
            </span>
          </div>

          <div className="h-[220px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name.split(' ')[0]}: ${value}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any, name: any, item: any) => [`${val}% (${item.payload.count} SP)`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] font-bold">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 truncate">{item.name}:</span>
                <span className="text-slate-900 ml-auto font-black">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dual Data Table matching image.png */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            Bảng Số Liệu Chi Tiết LRRO & Công Thức Tỷ Lệ Lỗi 4M/3M
          </h4>
          <span className="text-xs font-semibold text-slate-500">
            Click vào tên cột để chọn xem Biểu Đồ Tròn 4M
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-2xl shadow-xs">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              {/* Header Row */}
              <tr className="bg-amber-100/80 text-slate-900 font-black">
                <th colSpan={2} className="p-2 border border-slate-300 text-left bg-amber-200/90 text-amber-950 font-black">
                  LRRO - Dây chuyền: RO
                </th>
                {calculatedColumns.map(c => {
                  const isSelected = c.key === selectedColKey;
                  return (
                    <th 
                      key={c.key} 
                      onClick={() => setSelectedColKey(c.key)}
                      className={`p-2 border border-slate-300 min-w-[55px] cursor-pointer transition ${
                        isSelected ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 font-black shadow-xs' : 'hover:bg-amber-200/60'
                      }`}
                    >
                      {c.label}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* UPPER TABLE: QUANTITY BREAKDOWN */}
            <tbody>
              {/* SLSX */}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="p-2 border border-slate-300 text-left font-black text-slate-900 bg-slate-100">
                  SLSX (Sản Lượng Sản Xuất)
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-black text-slate-900">
                    {isEditable ? (
                      <input 
                        type="number" 
                        value={c.slsx} 
                        onChange={e => handleValueChange(c.key, 'slsx', parseInt(e.target.value) || 0)} 
                        className="w-full text-center bg-white border border-slate-300 rounded py-0.5 font-bold"
                      />
                    ) : c.slsx.toLocaleString('vi-VN')}
                  </td>
                ))}
              </tr>

              {/* OK */}
              <tr className="bg-white">
                <td colSpan={2} className="p-2 border border-slate-300 text-left font-semibold text-emerald-800 bg-emerald-50/30">
                  OK (Sản Phẩm Đạt)
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-semibold text-emerald-700">
                    {c.ok.toLocaleString('vi-VN')}
                  </td>
                ))}
              </tr>

              {/* NG */}
              <tr className="bg-red-50/30 font-bold">
                <td colSpan={2} className="p-2 border border-slate-300 text-left font-black text-red-900 bg-red-100/50">
                  NG (Tổng Sản Phẩm Lỗi)
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-black text-red-700">
                    {c.ngTotal.toLocaleString('vi-VN')}
                  </td>
                ))}
              </tr>

              {/* NG Breakdown rows */}
              <tr>
                <td rowSpan={5} className="p-2 border border-slate-300 font-black text-slate-700 bg-slate-100 w-12 text-center">
                  NG
                </td>
                <td className="p-2 border border-slate-300 text-left font-medium text-slate-800 bg-white">
                  Con người ( Thao tác)
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-medium">
                    {isEditable ? (
                      <input 
                        type="number" 
                        value={c.ngConNguoi} 
                        onChange={e => handleValueChange(c.key, 'ngConNguoi', parseInt(e.target.value) || 0)} 
                        className="w-full text-center bg-white border border-slate-300 rounded py-0.5 font-medium"
                      />
                    ) : (c.ngConNguoi > 0 ? c.ngConNguoi : '-')}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-slate-300 text-left font-medium text-slate-800 bg-white">
                  Máy móc
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-medium">
                    {isEditable ? (
                      <input 
                        type="number" 
                        value={c.ngMayMoc} 
                        onChange={e => handleValueChange(c.key, 'ngMayMoc', parseInt(e.target.value) || 0)} 
                        className="w-full text-center bg-white border border-slate-300 rounded py-0.5 font-medium"
                      />
                    ) : (c.ngMayMoc > 0 ? c.ngMayMoc : '-')}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-slate-300 text-left font-medium text-slate-800 bg-white">
                  Phương pháp
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-medium">
                    {isEditable ? (
                      <input 
                        type="number" 
                        value={c.ngPhuongPhap} 
                        onChange={e => handleValueChange(c.key, 'ngPhuongPhap', parseInt(e.target.value) || 0)} 
                        className="w-full text-center bg-white border border-slate-300 rounded py-0.5 font-medium"
                      />
                    ) : (c.ngPhuongPhap > 0 ? c.ngPhuongPhap : '-')}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-slate-300 text-left font-medium text-slate-800 bg-white">
                  Vật tư
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-medium">
                    {isEditable ? (
                      <input 
                        type="number" 
                        value={c.ngVatTu} 
                        onChange={e => handleValueChange(c.key, 'ngVatTu', parseInt(e.target.value) || 0)} 
                        className="w-full text-center bg-white border border-slate-300 rounded py-0.5 font-medium"
                      />
                    ) : (c.ngVatTu > 0 ? c.ngVatTu : '-')}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-slate-300 text-left font-medium text-slate-800 bg-white">
                  Khác
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-medium">
                    {isEditable ? (
                      <input 
                        type="number" 
                        value={c.ngKhac} 
                        onChange={e => handleValueChange(c.key, 'ngKhac', parseInt(e.target.value) || 0)} 
                        className="w-full text-center bg-white border border-slate-300 rounded py-0.5 font-medium"
                      />
                    ) : (c.ngKhac > 0 ? c.ngKhac : '-')}
                  </td>
                ))}
              </tr>

              {/* LOWER TABLE: PERCENTAGE BREAKDOWN & FORMULAS */}
              {/* Table Header 2 */}
              <tr className="bg-amber-100/80 text-slate-900 font-black">
                <th colSpan={2} className="p-2 border border-slate-300 text-left bg-amber-200/90 text-amber-950 font-black">
                  Dây chuyền: RO (Tỷ Lệ %)
                </th>
                {calculatedColumns.map(c => (
                  <th key={c.key} className="p-2 border border-slate-300">
                    {c.label}
                  </th>
                ))}
              </tr>

              {/* Total % lỗi 4M */}
              <tr className="bg-red-100/60 font-black text-red-800">
                <td colSpan={2} className="p-2 border border-slate-300 text-left font-black text-red-900 bg-red-200/50">
                  Total % lỗi 4M
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-black text-red-700 text-sm">
                    {c.pTotal4M.toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Total % lỗi 3M */}
              <tr className="bg-blue-100/50 font-bold text-blue-900">
                <td colSpan={2} className="p-2 border border-slate-300 text-left font-bold text-blue-950 bg-blue-200/40">
                  Total % lỗi 3M
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-bold text-blue-800">
                    {c.pTotal3M.toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Percentage Rows Breakdown */}
              <tr>
                <td rowSpan={4} className="p-2 border border-slate-300 font-bold text-slate-700 bg-slate-100 text-center">
                  % NG
                </td>
                <td className="p-2 border border-slate-300 text-left font-semibold text-slate-800 bg-white">
                  Con người ( Thao tác)
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-semibold">
                    {c.pConNguoi.toFixed(1)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-slate-300 text-left font-semibold text-slate-800 bg-white">
                  Máy móc
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-semibold">
                    {c.pMayMoc.toFixed(1)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-slate-300 text-left font-semibold text-slate-800 bg-white">
                  Phương pháp
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-semibold">
                    {c.pPhuongPhap.toFixed(1)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-slate-300 text-left font-semibold text-slate-800 bg-white">
                  Vật tư
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-semibold">
                    {c.pVatTu.toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Benchmarks / Quotas */}
              <tr className="bg-slate-50">
                <td colSpan={2} className="p-2 border border-slate-300 text-left font-bold text-slate-800 bg-slate-100">
                  ĐM vật tư
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-bold text-blue-900">
                    {c.dmVatTu.toFixed(1)}%
                  </td>
                ))}
              </tr>

              <tr className="bg-slate-50">
                <td colSpan={2} className="p-2 border border-slate-300 text-left font-bold text-slate-800 bg-slate-100">
                  ĐM % lỗi 4M
                </td>
                {calculatedColumns.map(c => (
                  <td key={c.key} className="p-2 border border-slate-300 font-bold text-purple-900">
                    {c.dmLoi4M.toFixed(1)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

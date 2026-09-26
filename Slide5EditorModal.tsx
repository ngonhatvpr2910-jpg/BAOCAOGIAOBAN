import React, { useState } from 'react';
import { X, Save, RotateCcw, Plus, Trash2, Calendar, Users, ClipboardList } from 'lucide-react';
import { Slide5ProductionPlanData } from './types';

interface Slide5EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Slide5ProductionPlanData;
  onSave: (newData: Slide5ProductionPlanData) => void;
  onReset: () => void;
}

// Utility to convert DD/MM/YYYY to YYYY-MM-DD for <input type="date">
const toIsoDate = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('/')) return '';
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

// Utility to convert YYYY-MM-DD to DD/MM/YYYY
const fromIsoDate = (isoStr: string) => {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
};

export const Slide5EditorModal: React.FC<Slide5EditorModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<Slide5ProductionPlanData>(JSON.parse(JSON.stringify(data)));

  if (!isOpen) return null;

  const handleUpdateRow = (index: number, field: string, value: string) => {
    const updated = [...formData.rows];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-increment dates for all subsequent rows if the first row's date is changed
    if (index === 0 && field === 'date') {
      const iso = toIsoDate(value);
      if (iso) {
        const baseDate = new Date(iso);
        for (let i = 1; i < updated.length; i++) {
          const nextDate = new Date(baseDate);
          nextDate.setDate(baseDate.getDate() + i);
          const d = String(nextDate.getDate()).padStart(2, '0');
          const m = String(nextDate.getMonth() + 1).padStart(2, '0');
          const y = nextDate.getFullYear();
          updated[i].date = `${d}/${m}/${y}`;
        }
      }
    }

    // Auto-fill product type for all subsequent rows if the first row is changed
    if (index === 0 && field === 'planDCLR') {
      for (let i = 1; i < updated.length; i++) {
        updated[i].planDCLR = value;
      }
    }

    // Auto-fill manpower for all subsequent rows if the first row is changed
    if (index === 0 && (field === 'manpowerLine' || field === 'manpowerRma')) {
      for (let i = 1; i < updated.length; i++) {
        updated[i][field as 'manpowerLine' | 'manpowerRma'] = value;
      }
    }
    
    setFormData({ ...formData, rows: updated });
  };

  const handleAddRow = () => {
    setFormData({
      ...formData,
      rows: [
        ...formData.rows,
        { date: '', planDCLR: '', rmaBg: '', manpowerLine: '', manpowerRma: '' }
      ]
    });
  };

  const handleRemoveRow = (index: number) => {
    const updated = formData.rows.filter((_, i) => i !== index);
    setFormData({ ...formData, rows: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-blue-800 p-4 sm:p-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Chỉnh Sửa Kế Hoạch Sản Xuất Slide 5</h2>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Cập nhật kế hoạch & nhân lực tuần tiếp theo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          {/* Base Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3" />
                Tiêu đề slide
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Mã Tuần (Ví dụ: W39)
              </label>
              <input
                type="text"
                value={formData.weekHeader}
                onChange={e => setFormData({ ...formData, weekHeader: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                Nhân lực Line Summary
              </label>
              <input
                type="text"
                value={formData.manpowerSummary}
                onChange={e => setFormData({ ...formData, manpowerSummary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                Nhân lực RMA Summary
              </label>
              <input
                type="text"
                value={formData.rmaSummary}
                onChange={e => setFormData({ ...formData, rmaSummary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Rows Table Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Chi tiết kế hoạch theo ngày
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all border border-emerald-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Ngày
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="px-3 py-2 border-r border-slate-200">Ngày</th>
                    <th className="px-3 py-2 border-r border-slate-200">KH Chi Tiết DCLR</th>
                    <th className="px-3 py-2 border-r border-slate-200 text-center">RMA/BG</th>
                    <th className="px-3 py-2 border-r border-slate-200 text-center">Nhân Lực Line</th>
                    <th className="px-3 py-2 border-r border-slate-200 text-center">Nhân Lực RMA</th>
                    <th className="px-3 py-2 text-center w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {formData.rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-1.5 border-r border-slate-100">
                        <div className="flex items-center gap-1 relative group/date">
                          <input
                            type="text"
                            value={row.date}
                            onChange={e => handleUpdateRow(idx, 'date', e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center pointer-events-none text-slate-400 group-hover/date:text-blue-500 transition-colors">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="date"
                            value={toIsoDate(row.date)}
                            onChange={e => handleUpdateRow(idx, 'date', fromIsoDate(e.target.value))}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                            title="Chọn ngày nhanh"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100">
                        <select
                          value={row.planDCLR}
                          onChange={e => handleUpdateRow(idx, 'planDCLR', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 font-bold text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="BLOCK">BLOCK</option>
                          <option value="CHÍP">CHÍP</option>
                          <option value="THƯỜNG">THƯỜNG</option>
                        </select>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                        <input
                          type="text"
                          value={row.rmaBg}
                          onChange={e => handleUpdateRow(idx, 'rmaBg', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                        <input
                          type="text"
                          value={row.manpowerLine}
                          onChange={e => handleUpdateRow(idx, 'manpowerLine', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                        <input
                          type="text"
                          value={row.manpowerRma}
                          onChange={e => handleUpdateRow(idx, 'manpowerRma', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn khôi phục số liệu gốc theo mẫu PowerPoint?')) {
                onReset();
                onClose();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Khôi phục mặc định
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={() => onSave(formData)}
              className="flex items-center gap-2 px-8 py-2.5 text-sm font-black text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-200 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu Thay Đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

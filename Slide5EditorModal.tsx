import React, { useState } from 'react';
import { X, Save, RotateCcw, Plus, Trash2, Calendar, Users, ClipboardList, Copy, ChevronRight, Layers } from 'lucide-react';
import { Slide5ProductionPlanData, Slide5WeekPlan, Slide5PlanRow } from './types';

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

// Utility to calculate the next 7 consecutive dates
function generateNextDates(lastDateStr: string): string[] {
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

export const Slide5EditorModal: React.FC<Slide5EditorModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onReset,
}) => {
  // Initialize weeks array from data
  const initialWeeks: Slide5WeekPlan[] = data.weeks && data.weeks.length > 0 
    ? JSON.parse(JSON.stringify(data.weeks)) 
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
          rows: JSON.parse(JSON.stringify(data.rows || []))
        }
      ];

  const [weeks, setWeeks] = useState<Slide5WeekPlan[]>(initialWeeks);
  const [activeWeekIdx, setActiveWeekIdx] = useState<number>(() => {
    if (typeof data.activeWeekIndex === 'number' && data.activeWeekIndex >= 0 && data.activeWeekIndex < initialWeeks.length) {
      return data.activeWeekIndex;
    }
    return 0;
  });
  const [slideTitle, setSlideTitle] = useState<string>(data.title || 'KHSX – Nhân Lực');

  if (!isOpen) return null;

  const currentWeek = weeks[activeWeekIdx] || weeks[0];

  const updateCurrentWeek = (fields: Partial<Slide5WeekPlan>) => {
    setWeeks(prev => {
      const copy = [...prev];
      copy[activeWeekIdx] = { ...copy[activeWeekIdx], ...fields };
      return copy;
    });
  };

  const handleUpdateRow = (index: number, field: string, value: string) => {
    const updated = [...currentWeek.rows];
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
    
    // Calculate new dateRange
    let dateRange = currentWeek.dateRange;
    if (updated.length > 0 && updated[0].date && updated[updated.length - 1].date) {
      dateRange = `${updated[0].date.slice(0, 5)} – ${updated[updated.length - 1].date.slice(0, 5)}`;
    }

    updateCurrentWeek({ rows: updated, dateRange });
  };

  const handleAddRow = () => {
    const lastRow = currentWeek.rows[currentWeek.rows.length - 1];
    let nextDate = '';
    if (lastRow?.date) {
      const iso = toIsoDate(lastRow.date);
      if (iso) {
        const d = new Date(iso);
        d.setDate(d.getDate() + 1);
        nextDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }
    }

    const updated = [
      ...currentWeek.rows,
      {
        date: nextDate,
        planDCLR: lastRow?.planDCLR || 'BLOCK',
        rmaBg: lastRow?.rmaBg || 'RMA + BG',
        manpowerLine: lastRow?.manpowerLine || '53 NS CT + 15TV',
        manpowerRma: lastRow?.manpowerRma || '12 NS CT + 2TV',
      }
    ];

    updateCurrentWeek({ rows: updated });
  };

  const handleRemoveRow = (index: number) => {
    const updated = currentWeek.rows.filter((_, i) => i !== index);
    updateCurrentWeek({ rows: updated });
  };

  // Add new upcoming week
  const handleAddNewWeek = () => {
    const lastWeek = weeks[weeks.length - 1];
    let nextNum = 39;
    if (lastWeek?.weekHeader) {
      const match = lastWeek.weekHeader.match(/\d+/);
      if (match) nextNum = parseInt(match[0], 10) + 1;
    }

    const lastDate = lastWeek?.rows?.[lastWeek.rows.length - 1]?.date || '27/09/2026';
    const nextDates = generateNextDates(lastDate);

    const newRows: Slide5PlanRow[] = nextDates.map(date => ({
      date,
      planDCLR: lastWeek?.rows?.[0]?.planDCLR || 'BLOCK',
      rmaBg: 'RMA + BG',
      manpowerLine: lastWeek?.rows?.[0]?.manpowerLine || '54 NS CT + 14TV',
      manpowerRma: lastWeek?.rows?.[0]?.manpowerRma || '12 NS CT + 2TV',
    }));

    const newWeek: Slide5WeekPlan = {
      id: `w-${nextNum}-${Date.now()}`,
      weekHeader: `Tuần ${nextNum}`,
      weekTitle: `Kế hoạch tuần tiếp theo`,
      dateRange: `${nextDates[0].slice(0, 5)} – ${nextDates[6].slice(0, 5)}`,
      manpowerSummary: lastWeek?.manpowerSummary || '54/57 NS Line',
      rmaSummary: lastWeek?.rmaSummary || 'RMA 12/14NS',
      rows: newRows,
    };

    const nextWeeks = [...weeks, newWeek];
    setWeeks(nextWeeks);
    setActiveWeekIdx(nextWeeks.length - 1);
  };

  // Clone current week into a new week
  const handleCloneCurrentWeek = () => {
    let nextNum = 40;
    const match = currentWeek.weekHeader.match(/\d+/);
    if (match) nextNum = parseInt(match[0], 10) + 1;

    const lastDate = currentWeek.rows?.[currentWeek.rows.length - 1]?.date || '27/09/2026';
    const nextDates = generateNextDates(lastDate);

    const newRows: Slide5PlanRow[] = currentWeek.rows.map((r, i) => ({
      ...r,
      date: nextDates[i] || r.date,
    }));

    const clonedWeek: Slide5WeekPlan = {
      ...JSON.parse(JSON.stringify(currentWeek)),
      id: `w-clone-${Date.now()}`,
      weekHeader: `Tuần ${nextNum}`,
      dateRange: nextDates[0] && nextDates[6] ? `${nextDates[0].slice(0, 5)} – ${nextDates[6].slice(0, 5)}` : currentWeek.dateRange,
      rows: newRows,
    };

    const nextWeeks = [...weeks, clonedWeek];
    setWeeks(nextWeeks);
    setActiveWeekIdx(nextWeeks.length - 1);
  };

  const handleDeleteWeek = (idxToDelete: number) => {
    if (weeks.length <= 1) {
      alert('Không thể xóa vì phải giữ lại ít nhất 1 tuần kế hoạch!');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa kế hoạch ${weeks[idxToDelete]?.weekHeader}?`)) {
      const nextWeeks = weeks.filter((_, i) => i !== idxToDelete);
      setWeeks(nextWeeks);
      setActiveWeekIdx(Math.max(0, idxToDelete - 1));
    }
  };

  const handleSaveAll = () => {
    const cur = weeks[activeWeekIdx] || weeks[0];
    const finalData: Slide5ProductionPlanData = {
      title: slideTitle,
      weekHeader: cur.weekHeader,
      manpowerSummary: cur.manpowerSummary,
      rmaSummary: cur.rmaSummary,
      rows: cur.rows,
      activeWeekIndex: activeWeekIdx,
      weeks,
    };
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-blue-800 p-4 sm:p-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Chỉnh Sửa Kế Hoạch Sản Xuất Slide 5</h2>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">
                Linh hoạt các tuần tiếp theo • Thêm, sao chép & điều chỉnh nhân lực
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Week Selector Bar (Linh hoạt chọn & quản lý các tuần tiếp theo) */}
        <div className="bg-slate-100 p-3 sm:px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Chọn tuần:</span>
            </span>
            {weeks.map((w, idx) => {
              const isSelected = idx === activeWeekIdx;
              return (
                <button
                  key={w.id || idx}
                  type="button"
                  onClick={() => setActiveWeekIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-400 ring-offset-1 font-black'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  <span>{w.weekHeader}</span>
                  {w.dateRange && (
                    <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                      isSelected ? 'bg-white/20 text-white' : 'text-slate-500 bg-slate-100'
                    }`}>
                      {w.dateRange}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddNewWeek}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Tự động tính ngày cho tuần kế tiếp và thêm vào danh sách"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Tuần Tiếp Theo</span>
            </button>
            <button
              type="button"
              onClick={handleCloneCurrentWeek}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="Nhân bản tuần đang chọn sang tuần kế tiếp"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Nhân bản</span>
            </button>
            {weeks.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteWeek(activeWeekIdx)}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                title="Xóa tuần đang chọn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Base Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3 text-blue-600" />
                Tiêu đề slide
              </label>
              <input
                type="text"
                value={slideTitle}
                onChange={e => setSlideTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-blue-600" />
                Tên Tuần (VD: Tuần 39 / W39)
              </label>
              <input
                type="text"
                value={currentWeek.weekHeader}
                onChange={e => updateCurrentWeek({ weekHeader: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3 text-blue-600" />
                Nhân lực Line Summary
              </label>
              <input
                type="text"
                value={currentWeek.manpowerSummary}
                onChange={e => updateCurrentWeek({ manpowerSummary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3 text-indigo-600" />
                Nhân lực RMA Summary
              </label>
              <input
                type="text"
                value={currentWeek.rmaSummary}
                onChange={e => updateCurrentWeek({ rmaSummary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Rows Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Chi tiết ngày sản xuất ({currentWeek.weekHeader})
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  ({currentWeek.rows.length} ngày)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all border border-emerald-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Ngày
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
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
                <tbody className="text-xs">
                  {currentWeek.rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-1.5 border-r border-slate-100">
                        <div className="flex items-center gap-1 relative group/date">
                          <input
                            type="text"
                            value={row.date}
                            onChange={e => handleUpdateRow(idx, 'date', e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center pointer-events-none text-slate-400 group-hover/date:text-blue-500 transition-colors">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="date"
                            value={toIsoDate(row.date)}
                            onChange={e => handleUpdateRow(idx, 'date', fromIsoDate(e.target.value))}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                            title="Chọn ngày nhanh trên lịch"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100">
                        <input
                          type="text"
                          value={row.planDCLR}
                          onChange={e => handleUpdateRow(idx, 'planDCLR', e.target.value)}
                          placeholder="BLOCK / CHÍP / MODEL MỚI..."
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 font-black text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
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
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                        <input
                          type="text"
                          value={row.manpowerRma}
                          onChange={e => handleUpdateRow(idx, 'manpowerRma', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button
                          type="button"
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
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn khôi phục số liệu gốc theo mẫu PowerPoint?')) {
                onReset();
                onClose();
              }
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Khôi phục mặc định
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-6 py-2 text-xs font-black text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-200 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu Thay Đổi ({weeks.length} Tuần)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

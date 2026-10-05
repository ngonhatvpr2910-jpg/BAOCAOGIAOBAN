import React, { useState } from 'react';
import { X, Save, RotateCcw, Plus, Trash2, Calendar, ClipboardList, CheckCircle2, AlertCircle, Clock, Copy, ChevronRight, Layers } from 'lucide-react';
import { Slide6TaskPlanData, Slide6WeekTaskPlan, Slide6TaskRow } from './types';

interface Slide6EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Slide6TaskPlanData;
  onSave: (newData: Slide6TaskPlanData) => void;
  onReset: () => void;
}

export const Slide6EditorModal: React.FC<Slide6EditorModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onReset,
}) => {
  // Initialize formData with weeks list
  const [formData, setFormData] = useState<Slide6TaskPlanData>(() => {
    const copy = JSON.parse(JSON.stringify(data));
    if (!copy.weeks || copy.weeks.length === 0) {
      copy.weeks = [
        {
          id: 'w-default',
          weekHeader: copy.weekHeader || 'Tuần 38',
          weekTitle: copy.title || 'Kế hoạch công việc trọng điểm',
          rows: copy.rows || []
        }
      ];
    }
    return copy;
  });

  const [activeWeekIdx, setActiveWeekIdx] = useState<number>(() => {
    if (typeof formData.activeWeekIndex === 'number' && formData.activeWeekIndex >= 0 && formData.activeWeekIndex < (formData.weeks?.length || 1)) {
      return formData.activeWeekIndex;
    }
    return 0;
  });

  if (!isOpen) return null;

  const currentWeeks = formData.weeks && formData.weeks.length > 0 ? formData.weeks : [];
  const currentActiveWeek: Slide6WeekTaskPlan = currentWeeks[activeWeekIdx] || {
    id: 'w-fallback',
    weekHeader: formData.weekHeader || 'Tuần 38',
    weekTitle: formData.title || 'Kế hoạch công việc',
    rows: formData.rows || []
  };

  const updateCurrentWeek = (updatedFields: Partial<Slide6WeekTaskPlan>) => {
    const updatedWeeks = [...currentWeeks];
    const merged = { ...currentActiveWeek, ...updatedFields };
    updatedWeeks[activeWeekIdx] = merged;
    setFormData({
      ...formData,
      weeks: updatedWeeks,
      weekHeader: merged.weekHeader,
      title: merged.weekTitle || formData.title,
      rows: merged.rows,
    });
  };

  const handleUpdateRow = (rowIndex: number, field: keyof Slide6TaskRow, value: string) => {
    const updatedRows = [...currentActiveWeek.rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [field]: value };
    updateCurrentWeek({ rows: updatedRows });
  };

  const handleAddRow = () => {
    const newRow: Slide6TaskRow = {
      task: '',
      detail: '',
      deadline: '',
      status: 'pending',
    };
    updateCurrentWeek({ rows: [...currentActiveWeek.rows, newRow] });
  };

  const handleRemoveRow = (rowIndex: number) => {
    const updatedRows = currentActiveWeek.rows.filter((_, i) => i !== rowIndex);
    updateCurrentWeek({ rows: updatedRows });
  };

  const handleAddNewWeek = () => {
    const lastWeek = currentWeeks[currentWeeks.length - 1];
    let nextNum = 39;
    if (lastWeek?.weekHeader) {
      const match = lastWeek.weekHeader.match(/\d+/);
      if (match) nextNum = parseInt(match[0], 10) + 1;
    }

    const newWeek: Slide6WeekTaskPlan = {
      id: `w-${nextNum}`,
      weekHeader: `Tuần ${nextNum}`,
      weekTitle: `Kế hoạch công việc trọng điểm Tuần ${nextNum}`,
      rows: [
        {
          task: `Kế hoạch công việc Tuần ${nextNum}`,
          detail: 'Triển khai công việc trọng điểm tuần tiếp theo',
          deadline: `Tuần ${nextNum}`,
          status: 'pending',
        }
      ]
    };

    const newWeeks = [...currentWeeks, newWeek];
    const newIdx = newWeeks.length - 1;
    setActiveWeekIdx(newIdx);
    setFormData({
      ...formData,
      activeWeekIndex: newIdx,
      weeks: newWeeks,
      weekHeader: newWeek.weekHeader,
      title: newWeek.weekTitle || formData.title,
      rows: newWeek.rows,
    });
  };

  const handleDuplicateWeek = (idx: number) => {
    const sourceWeek = currentWeeks[idx];
    if (!sourceWeek) return;

    let nextNum = 39;
    const match = sourceWeek.weekHeader.match(/\d+/);
    if (match) nextNum = parseInt(match[0], 10) + 1;

    const duplicatedWeek: Slide6WeekTaskPlan = {
      id: `w-${Date.now()}`,
      weekHeader: `Tuần ${nextNum} (Bản sao)`,
      weekTitle: sourceWeek.weekTitle || `Kế hoạch Tuần ${nextNum}`,
      rows: JSON.parse(JSON.stringify(sourceWeek.rows)),
    };

    const newWeeks = [...currentWeeks, duplicatedWeek];
    const newIdx = newWeeks.length - 1;
    setActiveWeekIdx(newIdx);
    setFormData({
      ...formData,
      activeWeekIndex: newIdx,
      weeks: newWeeks,
      weekHeader: duplicatedWeek.weekHeader,
      title: duplicatedWeek.weekTitle || formData.title,
      rows: duplicatedWeek.rows,
    });
  };

  const handleDeleteWeek = (idx: number) => {
    if (currentWeeks.length <= 1) {
      alert('Phải giữ lại ít nhất 1 tuần kế hoạch!');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa ${currentWeeks[idx]?.weekHeader}?`)) {
      const newWeeks = currentWeeks.filter((_, i) => i !== idx);
      const newIdx = Math.max(0, activeWeekIdx >= newWeeks.length ? newWeeks.length - 1 : activeWeekIdx);
      setActiveWeekIdx(newIdx);
      setFormData({
        ...formData,
        activeWeekIndex: newIdx,
        weeks: newWeeks,
        weekHeader: newWeeks[newIdx].weekHeader,
        title: newWeeks[newIdx].weekTitle || formData.title,
        rows: newWeeks[newIdx].rows,
      });
    }
  };

  const handleSaveAll = () => {
    const finalData: Slide6TaskPlanData = {
      ...formData,
      activeWeekIndex: activeWeekIdx,
      weekHeader: currentActiveWeek.weekHeader,
      title: currentActiveWeek.weekTitle || formData.title,
      rows: currentActiveWeek.rows,
      weeks: currentWeeks,
    };
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#4472c4] p-4 sm:p-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Chỉnh Sửa Kế Hoạch Công Việc (Đa Tuần Linh Hoạt)</h2>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">
                Linh hoạt thiết lập kế hoạch cho các tuần tiếp theo (Tuần 38, Tuần 39, Tuần 40...)
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

        {/* WEEK SELECTION BAR */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#4472c4]" />
              Chọn tuần:
            </span>
            {currentWeeks.map((w, idx) => {
              const isSelected = idx === activeWeekIdx;
              return (
                <div key={w.id || idx} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWeekIdx(idx);
                      setFormData(prev => ({
                        ...prev,
                        activeWeekIndex: idx,
                        weekHeader: w.weekHeader,
                        title: w.weekTitle || prev.title,
                        rows: w.rows,
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#4472c4] text-white shadow-sm ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>{w.weekHeader}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />}
                  </button>
                  {isSelected && currentWeeks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteWeek(idx)}
                      title={`Xóa ${w.weekHeader}`}
                      className="ml-1 p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDuplicateWeek(activeWeekIdx)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
              title="Sao chép tuần này sang tuần tiếp theo"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>Nhân bản tuần</span>
            </button>

            <button
              type="button"
              onClick={handleAddNewWeek}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              title="Thêm tuần kế hoạch mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm tuần mới</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
          {/* Active Week Metadata */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#4472c4]" />
                Tên tuần hiển thị
              </label>
              <input
                type="text"
                value={currentActiveWeek.weekHeader}
                onChange={e => updateCurrentWeek({ weekHeader: e.target.value })}
                placeholder="Ví dụ: Tuần 39, Tuần 40"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4472c4]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3 text-[#4472c4]" />
                Tiêu đề tuần
              </label>
              <input
                type="text"
                value={currentActiveWeek.weekTitle || ''}
                onChange={e => updateCurrentWeek({ weekTitle: e.target.value })}
                placeholder="Ví dụ: Kế hoạch công việc trọng điểm Tuần 39"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4472c4]"
              />
            </div>
          </div>

          {/* Rows Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#4472c4]" />
                <span>Danh sách công việc ({currentActiveWeek.weekHeader})</span>
                <span className="text-xs font-normal text-slate-500">({currentActiveWeek.rows.length} mục)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Dòng Công Việc</span>
              </button>
            </div>

            <div className="space-y-3">
              {currentActiveWeek.rows.map((row, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs relative group hover:border-blue-300 transition-colors">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="absolute -right-2 -top-2 w-7 h-7 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm border border-rose-200 opacity-80 hover:opacity-100 cursor-pointer z-10"
                    title="Xóa công việc này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* Task Name */}
                    <div className="lg:col-span-4 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Tên công việc</label>
                      <textarea
                        value={row.task}
                        onChange={e => handleUpdateRow(idx, 'task', e.target.value)}
                        rows={2}
                        placeholder="Nhập tên hạng mục công việc..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4472c4] resize-none"
                      />
                    </div>

                    {/* Detail */}
                    <div className="lg:col-span-5 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Chi tiết triển khai</label>
                      <textarea
                        value={row.detail}
                        onChange={e => handleUpdateRow(idx, 'detail', e.target.value)}
                        rows={2}
                        placeholder="Mô tả cụ thể hành động..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#4472c4] resize-none"
                      />
                    </div>

                    {/* Deadline */}
                    <div className="lg:col-span-3 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Deadline & Tiến độ</label>
                      <textarea
                        value={row.deadline}
                        onChange={e => handleUpdateRow(idx, 'deadline', e.target.value)}
                        rows={2}
                        placeholder="Ví dụ:&#10;30/09/2026&#10;Hoàn thành"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4472c4] resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn khôi phục số liệu gốc Slide 6?')) {
                onReset();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
          
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-8 py-2 text-xs font-black text-white bg-[#4472c4] hover:bg-[#35589c] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Kế Hoạch Các Tuần</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

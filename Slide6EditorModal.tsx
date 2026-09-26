import React, { useState } from 'react';
import { X, Save, RotateCcw, Plus, Trash2, Calendar, ClipboardList, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Slide6TaskPlanData, Slide6TaskRow } from './types';

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
  const [formData, setFormData] = useState<Slide6TaskPlanData>(JSON.parse(JSON.stringify(data)));

  if (!isOpen) return null;

  const handleUpdateRow = (index: number, field: keyof Slide6TaskRow, value: string) => {
    const updated = [...formData.rows];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, rows: updated });
  };

  const handleAddRow = () => {
    setFormData({
      ...formData,
      rows: [
        ...formData.rows,
        { task: '', detail: '', deadline: '', status: 'pending' }
      ]
    });
  };

  const handleRemoveRow = (index: number) => {
    const updated = formData.rows.filter((_, i) => i !== index);
    setFormData({ ...formData, rows: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#4472c4] p-4 sm:p-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Chỉnh Sửa Kế Hoạch Công Việc Slide 6</h2>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Cập nhật danh sách công việc & tiến độ</p>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-50">
          {/* Base Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3" />
                Tiêu đề slide
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4472c4]/20 focus:border-[#4472c4] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Số Slide (Chỉ số hiển thị góc trái)
              </label>
              <input
                type="text"
                value={formData.weekHeader}
                onChange={e => setFormData({ ...formData, weekHeader: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4472c4]/20 focus:border-[#4472c4] transition-all w-24"
              />
            </div>
          </div>

          {/* Rows Table Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4472c4]" />
                Danh sách công việc chi tiết
              </h3>
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Công Việc
              </button>
            </div>

            <div className="space-y-4">
              {formData.rows.map((row, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative group">
                  <button
                    onClick={() => handleRemoveRow(idx)}
                    className="absolute -right-2 -top-2 w-8 h-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm border border-rose-100 opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Task Name */}
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Công việc</label>
                      <textarea
                        value={row.task}
                        onChange={e => handleUpdateRow(idx, 'task', e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4472c4] resize-none"
                      />
                    </div>

                    {/* Detail */}
                    <div className="lg:col-span-5 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Chi tiết triển khai</label>
                      <textarea
                        value={row.detail}
                        onChange={e => handleUpdateRow(idx, 'detail', e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#4472c4] resize-none"
                      />
                    </div>

                    {/* Deadline & Highlighting */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Deadline & Ghi chú (Mỗi dòng 1 ý)</label>
                        <textarea
                          value={row.deadline}
                          onChange={e => handleUpdateRow(idx, 'deadline', e.target.value)}
                          rows={3}
                          placeholder="Ví dụ:&#10;20/09/2026&#10;Hoàn thành"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4472c4] resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Văn bản cần highlight vàng</label>
                        <input
                          type="text"
                          value={row.highlightedText || ''}
                          onChange={e => handleUpdateRow(idx, 'highlightedText', e.target.value)}
                          placeholder="Ví dụ: 21/09/2026 sơn về"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 focus:outline-none focus:border-[#4472c4]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 sm:p-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn khôi phục số liệu gốc Slide 6?')) {
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
              className="flex items-center gap-2 px-10 py-2.5 text-sm font-black text-white bg-[#4472c4] hover:bg-[#35589c] rounded-xl shadow-lg transition-all cursor-pointer"
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

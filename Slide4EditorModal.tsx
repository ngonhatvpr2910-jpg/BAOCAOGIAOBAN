import React, { useState, useEffect } from 'react';
import { Slide4ProductionTargetData } from './types';
import { X, Check, RotateCcw, Edit3, Target, Calendar, TrendingUp, Users } from 'lucide-react';

interface Slide4EditorModalProps {
  isOpen: boolean;
  initialData: Slide4ProductionTargetData;
  onClose: () => void;
  onSave: (data: Slide4ProductionTargetData) => void;
  onReset: () => void;
}

export const Slide4EditorModal: React.FC<Slide4EditorModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
  onReset
}) => {
  const [formData, setFormData] = useState<Slide4ProductionTargetData>(initialData);

  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleUpdateMonth = (index: number, field: string, value: number) => {
    const updated = [...formData.monthlyTargets];
    const currentRow = { ...updated[index], [field]: value };
    
    // Recalculate NSLĐ automatically: ((SP Quy đổi / Tổng công) / 9.03) * 100
    // SP Quy đổi is currentRow.cong, Tổng công is currentRow.tonThat
    const spQuyDoi = currentRow.cong;
    const tongCong = currentRow.tonThat;
    
    if (tongCong > 0) {
      currentRow.nsld = parseFloat(((spQuyDoi / tongCong / 9.03) * 100).toFixed(2));
    } else {
      currentRow.nsld = 0;
    }
    
    updated[index] = currentRow;
    setFormData({ ...formData, monthlyTargets: updated });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Chỉnh Sửa Mục Tiêu Sản Xuất Slide 4</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-100 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                Lũy kế NSLĐ 2025 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.luyKe2025}
                onChange={e => setFormData({ ...formData, luyKe2025: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-600" />
                Lũy kế NSLĐ 2026 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.luyKe2026}
                onChange={e => setFormData({ ...formData, luyKe2026: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-600" />
                Định biên nhân sự
              </label>
              <input
                type="number"
                value={formData.dinhBienNhanSu}
                onChange={e => setFormData({ ...formData, dinhBienNhanSu: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Targets Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Kế hoạch 12 tháng
              </h4>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="px-3 py-2 border-r border-slate-200">Tháng</th>
                    <th className="px-3 py-2 border-r border-slate-200 text-center">NSLĐ (%)</th>
                    <th className="px-3 py-2 border-r border-slate-200 text-center">SP Quy đổi</th>
                    <th className="px-3 py-2 text-center">Tổng công</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {formData.monthlyTargets.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-1.5 border-r border-slate-100 font-bold text-slate-700 whitespace-nowrap">{row.month}</td>
                      <td className="px-3 py-1.5 border-r border-slate-100">
                        <input
                          type="number"
                          step="0.01"
                          value={row.nsld}
                          readOnly
                          className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-center font-bold text-emerald-700 focus:outline-none"
                          title="Tự động tính từ SP Quy đổi / Tổng công"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100">
                        <input
                          type="number"
                          value={row.cong}
                          onChange={e => handleUpdateMonth(idx, 'cong', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-blue-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.001"
                          value={row.tonThat}
                          onChange={e => handleUpdateMonth(idx, 'tonThat', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Khôi phục dữ liệu Slide 4 về mặc định?')) {
                onReset();
                onClose();
              }
            }}
            className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" /> Lưu Thay Đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

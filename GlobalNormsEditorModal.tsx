import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { 
  X, 
  Save, 
  Target, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Coins,
  ShieldCheck,
  Flame,
  Droplets,
  Layers,
  RotateCcw
} from 'lucide-react';
import { GlobalNormsConfig } from './types';
import { DEFAULT_GLOBAL_NORMS } from './initialData';

interface GlobalNormsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalNormsEditorModal: React.FC<GlobalNormsEditorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { globalNorms, updateGlobalNorms } = useProduction();
  const { canManageSettings } = useAuth();

  const [form, setForm] = useState<GlobalNormsConfig>({ ...globalNorms });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) {
      alert('Bạn không có quyền thay đổi các cài đặt này.');
      return;
    }

    setIsSaving(true);
    updateGlobalNorms(form);
    
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ định mức về mặc định của hệ thống?')) {
      setForm({ ...DEFAULT_GLOBAL_NORMS });
    }
  };

  const updateField = (
    category: keyof GlobalNormsConfig, 
    unit: 'pxlr' | 'ro' | 'bg', 
    value: number
  ) => {
    setForm(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [unit]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                Thiết Lập Định Mức & Mục Tiêu
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                Cấu hình tiêu chuẩn toàn hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section: NSLD Targets */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">1. Mục Tiêu Năng Suất Lao Động (NSLĐ %)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NormInput 
                label="Toàn Phân Xưởng (PXLR)" 
                icon={<Layers className="w-3.5 h-3.5" />}
                value={form.nsldTarget.pxlr} 
                onChange={(v) => updateField('nsldTarget', 'pxlr', v)} 
                unit="%"
              />
              <NormInput 
                label="Line Lắp Ráp (RO)" 
                icon={<Droplets className="w-3.5 h-3.5 text-blue-500" />}
                value={form.nsldTarget.ro} 
                onChange={(v) => updateField('nsldTarget', 'ro', v)} 
                unit="%"
              />
              <NormInput 
                label="Line Bếp Gas (BG)" 
                icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}
                value={form.nsldTarget.bg} 
                onChange={(v) => updateField('nsldTarget', 'bg', v)} 
                unit="%"
              />
            </div>
          </section>

          {/* Section: Attendance Targets */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">2. Mục Tiêu Tỉ Lệ Đi Làm (%)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NormInput 
                label="Toàn Phân Xưởng" 
                value={form.attendanceTarget.pxlr} 
                onChange={(v) => updateField('attendanceTarget', 'pxlr', v)} 
                unit="%"
              />
              <NormInput 
                label="Nhóm RO" 
                value={form.attendanceTarget.ro} 
                onChange={(v) => updateField('attendanceTarget', 'ro', v)} 
                unit="%"
              />
              <NormInput 
                label="Nhóm Bếp Gas" 
                value={form.attendanceTarget.bg} 
                onChange={(v) => updateField('attendanceTarget', 'bg', v)} 
                unit="%"
              />
            </div>
          </section>

          {/* Section: Error Rate Quotas */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">3. Định Mức Tỉ Lệ Lỗi Thao Tác (%)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NormInput 
                label="ĐM Lỗi PXLR" 
                value={form.errorRateQuota.pxlr} 
                onChange={(v) => updateField('errorRateQuota', 'pxlr', v)} 
                unit="%"
              />
              <NormInput 
                label="ĐM Lỗi RO" 
                value={form.errorRateQuota.ro} 
                onChange={(v) => updateField('errorRateQuota', 'ro', v)} 
                unit="%"
              />
              <NormInput 
                label="ĐM Lỗi Bếp Gas" 
                value={form.errorRateQuota.bg} 
                onChange={(v) => updateField('errorRateQuota', 'bg', v)} 
                unit="%"
              />
            </div>
          </section>

          {/* Section: Defect Cost Targets */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Coins className="w-4 h-4 text-rose-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">4. Mục Tiêu Chi Phí Hư Hỏng (VNĐ)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NormInput 
                label="Mục tiêu PXLR" 
                value={form.defectCostTarget.pxlr} 
                onChange={(v) => updateField('defectCostTarget', 'pxlr', v)} 
                unit="đ"
                step={100000}
              />
              <NormInput 
                label="Mục tiêu RO" 
                value={form.defectCostTarget.ro} 
                onChange={(v) => updateField('defectCostTarget', 'ro', v)} 
                unit="đ"
                step={100000}
              />
              <NormInput 
                label="Mục tiêu Bếp Gas" 
                value={form.defectCostTarget.bg} 
                onChange={(v) => updateField('defectCostTarget', 'bg', v)} 
                unit="đ"
                step={100000}
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * Chi phí hư hỏng được tính toán và đồng bộ từ Slide 4 (Báo cáo tổn thất chi tiết).
            </p>
          </section>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            {canManageSettings ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Bạn có quyền thay đổi cấu hình
              </span>
            ) : (
              <span className="text-rose-500 font-bold">Bạn không có quyền thay đổi</span>
            )}
          </div>
          <div className="flex gap-3">
            {canManageSettings && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer mr-2 border border-transparent hover:border-rose-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={!canManageSettings || isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-200 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NormInputProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  unit: string;
  step?: number;
}

const NormInput: React.FC<NormInputProps> = ({ label, icon, value, onChange, unit, step = 0.1 }) => {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-sm font-black text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400 pointer-events-none">
          {unit}
        </div>
      </div>
    </div>
  );
};

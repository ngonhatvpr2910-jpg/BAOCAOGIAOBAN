import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { StorageService } from './storage';
import { DEFAULT_GLOBAL_NORMS } from './initialData';
import { Sliders, X, Save, RotateCcw, Download, Upload, Check, Bell, Clock, FileDown, Target } from 'lucide-react';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { thresholds, updateThresholds, globalNorms, updateGlobalNorms } = useProduction();
  const { canManageSettings } = useAuth();

  const [form, setForm] = useState({ ...thresholds });
  const [normsForm, setNormsForm] = useState({ ...globalNorms });
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(form);
    updateGlobalNorms(normsForm);
    setMsg('Đã cập nhật cấu hình thành công!');
    setTimeout(() => {
      setMsg('');
      onClose();
    }, 1000);
  };

  const handleResetNorms = () => {
    if (window.confirm('Khôi phục toàn bộ định mức về mặc định của nhà máy?')) {
      setNormsForm({ ...DEFAULT_GLOBAL_NORMS });
    }
  };

  const updateNormField = (category: keyof typeof globalNorms, unit: 'pxlr' | 'ro' | 'bg', value: number) => {
    setNormsForm(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [unit]: value
      }
    }));
  };

  const handleExportJSON = () => {
    const data = StorageService.exportFullBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_pxlr_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const success = StorageService.importBackup(json);
        if (success) {
          alert('Đã phục hồi dữ liệu thành công! Trang sẽ tải lại.');
          window.location.reload();
        } else {
          alert('Tệp JSON không đúng định dạng dữ liệu PXLR.');
        }
      } catch {
        alert('Lỗi đọc tệp JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold uppercase tracking-tight">
              Cài Đặt Hệ Thống & Định Mức
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-300">
          {/* Section 0: KPI & Mục Tiêu Sản Xuất (SLIDE 1 & SLIDE 4) */}
          <div className="space-y-4 bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <h4 className="text-sm font-black uppercase tracking-tight text-blue-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600" />
                Cập Nhật Định Mức & Mục Tiêu (KPI)
              </h4>
              <button
                type="button"
                onClick={handleResetNorms}
                className="text-[10px] font-bold text-blue-600 hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Khôi phục mặc định
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* NSLD Targets */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">1. Mục tiêu NSLĐ (%)</label>
                <div className="grid grid-cols-3 gap-2">
                  <CompactNormInput label="PXLR" value={normsForm.nsldTarget.pxlr} onChange={v => updateNormField('nsldTarget', 'pxlr', v)} unit="%" />
                  <CompactNormInput label="Nhóm RO" value={normsForm.nsldTarget.ro} onChange={v => updateNormField('nsldTarget', 'ro', v)} unit="%" />
                  <CompactNormInput label="Bếp Gas" value={normsForm.nsldTarget.bg} onChange={v => updateNormField('nsldTarget', 'bg', v)} unit="%" />
                </div>
              </div>

              {/* Attendance Targets */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">2. Tỉ lệ đi làm (%)</label>
                <div className="grid grid-cols-3 gap-2">
                  <CompactNormInput label="PXLR" value={normsForm.attendanceTarget.pxlr} onChange={v => updateNormField('attendanceTarget', 'pxlr', v)} unit="%" />
                  <CompactNormInput label="Nhóm RO" value={normsForm.attendanceTarget.ro} onChange={v => updateNormField('attendanceTarget', 'ro', v)} unit="%" />
                  <CompactNormInput label="Bếp Gas" value={normsForm.attendanceTarget.bg} onChange={v => updateNormField('attendanceTarget', 'bg', v)} unit="%" />
                </div>
              </div>

              {/* Error Rate Quotas */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">3. Định mức tỉ lệ lỗi (%)</label>
                <div className="grid grid-cols-3 gap-2">
                  <CompactNormInput label="PXLR" value={normsForm.errorRateQuota.pxlr} onChange={v => updateNormField('errorRateQuota', 'pxlr', v)} unit="%" />
                  <CompactNormInput label="Line RO" value={normsForm.errorRateQuota.ro} onChange={v => updateNormField('errorRateQuota', 'ro', v)} unit="%" />
                  <CompactNormInput label="Bếp Gas" value={normsForm.errorRateQuota.bg} onChange={v => updateNormField('errorRateQuota', 'bg', v)} unit="%" />
                </div>
              </div>

              {/* Defect Cost Targets */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">4. Chi phí hư hỏng (VNĐ)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <CompactNormInput label="PXLR" value={normsForm.defectCostTarget.pxlr} onChange={v => updateNormField('defectCostTarget', 'pxlr', v)} unit="đ" step={100000} />
                  <CompactNormInput label="RO" value={normsForm.defectCostTarget.ro} onChange={v => updateNormField('defectCostTarget', 'ro', v)} unit="đ" step={100000} />
                  <CompactNormInput label="BG" value={normsForm.defectCostTarget.bg} onChange={v => updateNormField('defectCostTarget', 'bg', v)} unit="đ" step={100000} />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-blue-700/60 italic leading-tight">
              * Các định mức này được dùng để đánh giá trạng thái (Xanh/Đỏ) trên toàn bộ hệ thống Slide báo cáo.
            </p>
          </div>

          {/* Section 1: Ngưỡng cảnh báo biến động */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-400" />
              1. Ngưỡng Kích Hoạt Thông Báo Đẩy Biến Động
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỉ lệ đi làm tối thiểu (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.minAttendanceRate}
                  onChange={(e) => setForm({ ...form, minAttendanceRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Báo động khi &lt; ngưỡng này</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NSLĐ tối thiểu (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.minProductivityRate}
                  onChange={(e) => setForm({ ...form, minProductivityRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Mục tiêu chuẩn: 100%</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hàng hỏng tối đa (VNĐ)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={form.maxDefectCostPerDay}
                  onChange={(e) => setForm({ ...form, maxDefectCostPerDay: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Giới hạn tổn thất ngày</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lỗi thao tác tối đa (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.maxErrorRate}
                  onChange={(e) => setForm({ ...form, maxErrorRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Ngưỡng kiểm soát chất lượng</span>
              </div>
            </div>
          </div>

          {/* Section 2: Lịch xuất PDF tự động */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              2. Lập Lịch Xuất File PDF Cuối Ngày Tự Động
            </h4>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">Tự động xuất báo cáo</div>
                <div className="text-[11px] text-slate-500">Kích hoạt thông báo và tệp tải lúc cuối ca</div>
              </div>
              <input
                type="time"
                value={form.autoExportTime}
                onChange={(e) => setForm({ ...form, autoExportTime: e.target.value })}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Section 3: Sao lưu / Phục hồi dữ liệu */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Sao Lưu & Phục Hồi Dữ Liệu PXLR
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Sao Lưu JSON</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Phục Hồi JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Quản Trị Hệ Thống (Excel) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1.5">
              <FileDown className="w-4 h-4" />
              4. Quản Trị Hệ Thống Toàn Diện (Excel)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const { exportSystemExcel } = await import('./systemExcelService');
                  await exportSystemExcel();
                }}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Excel Hệ Thống</span>
              </button>

              <label className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Nhập Excel Hệ Thống</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { importSystemExcel } = await import('./systemExcelService');
                    const res = await importSystemExcel(file);
                    if (res.success) {
                      alert(res.message);
                      window.location.reload();
                    } else {
                      alert(res.message);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * Lưu ý: File Excel hệ thống bao gồm nhiều sheet (Nhật ký, Chất lượng, Vật tư hỏng...). Vui lòng không thay đổi tên sheet khi nhập lại.
            </p>
          </div>

          {msg && (
            <div className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
              <Check className="w-4 h-4" />
              <span>{msg}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              id="btn-save-thresholds"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CompactNormInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  step?: number;
}

const CompactNormInput: React.FC<CompactNormInputProps> = ({ label, value, onChange, unit, step = 0.1 }) => (
  <div className="space-y-1">
    <div className="text-[9px] font-black text-slate-400 uppercase truncate">{label}</div>
    <div className="relative">
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-white border border-slate-200 rounded-lg pl-2 pr-5 py-1.5 text-xs font-black text-slate-800 focus:border-blue-500 outline-hidden"
      />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 pointer-events-none">{unit}</span>
    </div>
  </div>
);

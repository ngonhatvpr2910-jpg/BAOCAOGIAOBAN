import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { StorageService } from './storage';
import { Sliders, X, Save, RotateCcw, Download, Upload, Check, Bell, Clock, FileDown } from 'lucide-react';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { thresholds, updateThresholds } = useProduction();
  const { canManageSettings } = useAuth();

  const [form, setForm] = useState({ ...thresholds });
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(form);
    setMsg('Đã cập nhật cấu hình ngưỡng thành công!');
    setTimeout(() => {
      setMsg('');
      onClose();
    }, 1000);
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
        {/* Top bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">
              Cài Đặt Ngưỡng Cảnh Báo & Tự Động Hóa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
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

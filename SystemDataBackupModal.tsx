import React, { useState } from 'react';
import { X, Download, Upload, Database, FileSpreadsheet, Check, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { exportSystemExcel, importSystemExcel } from './systemExcelService';
import { StorageService } from './storage';

interface SystemDataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDataBackupModal: React.FC<SystemDataBackupModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Handle Export Excel System Data
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      await exportSystemExcel();
      setStatusMsg({ type: 'success', text: 'Đã xuất file Excel dữ liệu hệ thống thành công!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Có lỗi khi xuất file Excel hệ thống.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Import Excel System Data
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await importSystemExcel(file);
      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Lỗi khi nhập file Excel hệ thống.' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Handle Export JSON
  const handleExportJSON = () => {
    try {
      const data = StorageService.exportFullBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pxlr_backup_json_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Đã sao lưu JSON thành công!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Lỗi sao lưu JSON: ' + err?.message });
    }
  };

  // Handle Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = StorageService.importBackup(json);
        if (success) {
          setStatusMsg({ type: 'success', text: 'Khôi phục dữ liệu từ file JSON thành công! Đang tải lại...' });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setStatusMsg({ type: 'error', text: 'Tệp JSON không đúng định dạng dữ liệu PXLR.' });
        }
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Lỗi đọc file JSON: ' + err?.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Database className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Quản Lý Dữ Liệu Hệ Thống</h3>
              <p className="text-xs text-teal-100/80 font-medium">
                Xuất file lưu trữ & Up / Phục hồi dữ liệu PXLR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-teal-100 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Option 1: Full System Excel Export / Import */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Dữ Liệu Hệ Thống (Excel Multi-Sheet)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bao gồm đầy đủ các sheet: Nhật ký BG, Nhật ký RO, Chất lượng hàng ngày (Slide 2), Vật tư hỏng (Slide 3), Lịch sử tháng & Ma trận cấu hình.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Xuất Excel Hệ Thống</span>
              </button>

              <label className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Up / Nhập Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Option 2: JSON Backup / Restore */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Sao Lưu & Phục Hồi Nhanh (JSON)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dành cho việc sao lưu dữ liệu dạng file cấu hình siêu nhẹ, khôi phục toàn bộ cài đặt & lịch sử nhanh chóng.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Xuất JSON</span>
              </button>

              <label className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Up / Nhập JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

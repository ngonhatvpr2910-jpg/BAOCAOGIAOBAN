import React, { useState, useRef } from 'react';
import { SlideDefectCostData, DamagedItemRecord, MonthlyHistoryRecord } from './types';
import { 
  exportDefectCostTemplate, 
  parseDefectCostExcelFile, 
  ExcelImportResult 
} from './excelDefectService';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Coins, 
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: SlideDefectCostData;
  onApplyImport: (importedData: Partial<SlideDefectCostData>, productivityData?: MonthlyHistoryRecord[]) => void;
  productivityHistory?: MonthlyHistoryRecord[];
}

const formatCurrency = (val: number | undefined): string => {
  if (val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onApplyImport,
  productivityHistory,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMsg('');
    setIsProcessing(true);

    try {
      const result = await parseDefectCostExcelFile(file);
      setImportResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi đọc file Excel.');
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleApply = () => {
    if (!importResult) return;

    let finalRO = importResult.itemsRO;
    let finalBG = importResult.itemsBG;

    if (importMode === 'merge') {
      finalRO = [...(currentData.itemsRO || []), ...importResult.itemsRO];
      finalBG = [...(currentData.itemsBG || []), ...importResult.itemsBG];
    }

    onApplyImport({
      itemsRO: finalRO,
      itemsBG: finalBG,
      weeklyData: importResult.weeklyData && importResult.weeklyData.length > 0 
        ? importResult.weeklyData 
        : currentData.weeklyData,
      monthlyData: importResult.monthlyData && importResult.monthlyData.length > 0 
        ? importResult.monthlyData 
        : currentData.monthlyData,
    }, importResult.productivityData);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in font-sans">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        id="excel-import-modal"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nhập & Cập Nhật Dữ Liệu Bằng File Excel / CSV</h2>
              <p className="text-xs text-emerald-200/90">
                Tải lên file bảng tính để tự động cập nhật danh sách hàng hỏng và biểu đồ Slide 3 & 4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportDefectCostTemplate(currentData, productivityHistory)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-emerald-100 border border-white/20 transition-all cursor-pointer shadow-xs"
              title="Tải file mẫu Excel có đầy đủ 17 mục mẫu và các sheet chuẩn"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Tải File Mẫu (.xlsx)</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {/* 1. Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]' 
                : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/20'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              {selectedFile ? selectedFile.name : 'Kéo thả file Excel vào đây hoặc click để chọn file'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Hỗ trợ định dạng <strong>.xlsx, .xls, .csv</strong>. Hệ thống tự động phân loại sheet Nhóm RO và Nhóm Bếp Gas.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                Sheet RO: <code className="text-emerald-700">Hang_Hong_RO</code>
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                Sheet Bếp Gas: <code className="text-amber-700">Hang_Hong_Bep_Gas</code>
              </span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-sm font-semibold">Đang đọc và phân tích dữ liệu bảng tính Excel...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block font-bold">Lỗi đọc file:</strong>
                <p>{errorMsg}</p>
                <button
                  onClick={() => exportDefectCostTemplate(currentData, productivityHistory)}
                  className="mt-2 text-rose-800 underline font-bold"
                >
                  Tải file mẫu chuẩn tại đây để điền lại
                </button>
              </div>
            </div>
          )}

          {/* 2. Parsed Data Preview */}
          {importResult && (
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs animate-fade-in">
              {/* Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Kết Quả Đọc File ({importResult.itemsRO.length + importResult.itemsBG.length} mục vật tư)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Line RO: <b>{importResult.itemsRO.length} mục</b> ({formatCurrency(importResult.totalRO)} đ) • Line Bếp Gas: <b>{importResult.itemsBG.length} mục</b> ({formatCurrency(importResult.totalBG)} đ)
                      {importResult.productivityData && importResult.productivityData.length > 0 && (
                        <span className="block text-emerald-600 font-bold mt-0.5">
                          + Nhận diện được {importResult.productivityData.length} tháng dữ liệu Năng suất & Công
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Chế độ nạp:</span>
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                    <button
                      onClick={() => setImportMode('replace')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        importMode === 'replace'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Thay thế toàn bộ
                    </button>
                    <button
                      onClick={() => setImportMode('merge')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        importMode === 'merge'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Gộp thêm vào
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Preview Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* RO Table Preview */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-800 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold">
                    <span>Nhóm RO ({importResult.itemsRO.length} mục)</span>
                    <span className="text-cyan-300 font-mono">{formatCurrency(importResult.totalRO)} đ</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-1">Tên VT</th>
                          <th className="p-1 text-right">SL</th>
                          <th className="p-1 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {importResult.itemsRO.map((item, i) => (
                          <tr key={i} className={item.isHighlighted ? 'bg-yellow-100 font-medium' : 'bg-white'}>
                            <td className="p-1 truncate max-w-[150px]">{item.itemName}</td>
                            <td className="p-1 text-right font-mono">{item.quantity}</td>
                            <td className="p-1 text-right font-mono font-bold">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BG Table Preview */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-800 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold">
                    <span>Nhóm Bếp Gas ({importResult.itemsBG.length} mục)</span>
                    <span className="text-amber-300 font-mono">{formatCurrency(importResult.totalBG)} đ</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-1">Tên VT</th>
                          <th className="p-1 text-right">SL</th>
                          <th className="p-1 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {importResult.itemsBG.map((item, i) => (
                          <tr key={i} className={item.isHighlighted ? 'bg-yellow-100 font-medium' : 'bg-white'}>
                            <td className="p-1 truncate max-w-[150px]">{item.itemName}</td>
                            <td className="p-1 text-right font-mono">{item.quantity}</td>
                            <td className="p-1 text-right font-mono font-bold">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Total Loss Display */}
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Tổng chi phí tổn thất nhận diện:
                </span>
                <span className="text-base font-black text-emerald-800 font-mono">
                  {formatCurrency(importResult.grandTotal)} VNĐ
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => exportDefectCostTemplate(currentData, productivityHistory)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Tải File Excel Mẫu (.xlsx)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleApply}
              disabled={!importResult}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                importResult 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' 
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Áp Dụng Vào Slide 3 Ngay</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { X, Clipboard, Check, AlertCircle, ArrowRight, Sparkles, FileSpreadsheet } from 'lucide-react';
import { ExcelMatrixBGColumn, ExcelMatrixROColumn } from './types';
import { recalculateBGMatrix, recalculateROMatrix } from './matrixGenerator';

interface ExcelPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'BG' | 'RO';
  matrix: (ExcelMatrixBGColumn | ExcelMatrixROColumn)[];
  year: number;
  monthIndex0: number;
  onApply: (updatedMatrix: any[]) => void;
}

const BG_METRIC_OPTIONS = [
  { key: 'auto', label: '⭐ Tự động nhận diện tất cả các dòng (Theo thứ tự hàng)' },
  { key: 'congBepGa', label: 'CÔNG Bếp GA (Hàng 1)' },
  { key: 'congThoiVu', label: 'CÔNG THỜI VỤ (Hàng 2)' },
  { key: 'congRma', label: 'CÔNG RMA (Hàng 3)' },
  { key: 'sanLuongBepGa', label: 'SẢN LƯỢNG QUY ĐỔI Bếp Ga (Hàng 4)' },
  { key: 'sanLuongRma', label: 'SẢN LƯỢNG QUY ĐỔI RMA (Hàng 5)' },
  { key: 'khsxNgay', label: 'KHSX NGÀY (Hàng 8)' },
  { key: 'tongNhanSuLine', label: 'Tổng nhân sự Line (Hàng 10)' },
  { key: 'nhanSuNghi', label: 'Nhân sự nghỉ (Hàng 11)' },
];

const RO_METRIC_OPTIONS = [
  { key: 'auto', label: '⭐ Tự động nhận diện tất cả các dòng (Theo thứ tự hàng)' },
  { key: 'congChinhThuc', label: 'CÔNG CHÍNH THỨC (Hàng 1)' },
  { key: 'congThoiVu', label: 'CÔNG THỜI VỤ (Hàng 2)' },
  { key: 'sanLuongLineChinh', label: 'SL QUY ĐỔI LINE CHÍNH (Hàng 3)' },
  { key: 'khsxNgay', label: 'KHSX NGÀY (Hàng 6)' },
  { key: 'tongNhanSuLine', label: 'TỔNG NHÂN SỰ LINE ĐI LÀM (Hàng 8)' },
  { key: 'nhanSuNghi', label: 'TỔNG NHÂN SỰ NGHỈ (Hàng 9)' },
];

export const ExcelPasteModal: React.FC<ExcelPasteModalProps> = ({
  isOpen,
  onClose,
  type,
  matrix,
  year,
  monthIndex0,
  onApply
}) => {
  const [pastedText, setPastedText] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('auto');
  const [startDayIndex, setStartDayIndex] = useState(0); // 0 = day 1

  if (!isOpen) return null;

  // Day columns only (excluding weekly totals and monthly totals)
  const dayCols = useMemo(() => {
    return matrix.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal);
  }, [matrix]);

  // Parse clipboard text
  const parsedData = useMemo(() => {
    if (!pastedText.trim()) return [];
    const lines = pastedText.split(/\r?\n/).filter(line => line.trim() !== '');
    return lines.map(line => {
      // Split by tab (Excel standard) or multiple spaces or comma/semicolon
      let cells = line.split('\t');
      if (cells.length === 1 && line.includes(';')) {
        cells = line.split(';');
      }
      return cells.map(c => c.trim());
    });
  }, [pastedText]);

  // Metric keys order
  const metricKeys = useMemo(() => {
    if (type === 'BG') {
      return ['congBepGa', 'congThoiVu', 'congRma', 'sanLuongBepGa', 'sanLuongRma', 'khsxNgay', 'tongNhanSuLine', 'nhanSuNghi'];
    } else {
      return ['congChinhThuc', 'congThoiVu', 'sanLuongLineChinh', 'khsxNgay', 'tongNhanSuLine', 'nhanSuNghi'];
    }
  }, [type]);

  // Helper to extract clean number
  const parseNum = (str: string): number | null => {
    if (!str) return null;
    const clean = str.replace(/%/g, '').replace(/,/g, '').trim();
    const val = parseFloat(clean);
    return isNaN(val) ? null : val;
  };

  const handleConfirmApply = () => {
    if (parsedData.length === 0) return;

    let updated = [...matrix];
    const availableDays = dayCols.slice(startDayIndex);

    if (selectedMetric === 'auto') {
      // Multiple rows mode
      parsedData.forEach((rowCells, rIdx) => {
        if (rIdx >= metricKeys.length) return;
        const targetMetric = metricKeys[rIdx];

        // Check if first cell is a label like "CÔNG BẾP GA"
        let cellValues = rowCells;
        if (isNaN(parseFloat(rowCells[0]?.replace(/,/g, '') || '')) && rowCells.length > 1) {
          cellValues = rowCells.slice(1);
        }

        cellValues.forEach((cVal, cIdx) => {
          if (cIdx >= availableDays.length) return;
          const targetDay = availableDays[cIdx];
          const num = parseNum(cVal);
          if (num !== null) {
            const mIdx = updated.findIndex(c => c.id === targetDay.id);
            if (mIdx !== -1) {
              updated[mIdx] = {
                ...updated[mIdx],
                [targetMetric]: num
              };
            }
          }
        });
      });
    } else {
      // Single specific metric mode
      const targetMetric = selectedMetric;
      // Flatten all numbers in case user pasted multi-line or single line
      const allCells = parsedData.flatMap(row => {
        if (isNaN(parseFloat(row[0]?.replace(/,/g, '') || '')) && row.length > 1) {
          return row.slice(1);
        }
        return row;
      });

      allCells.forEach((cVal, cIdx) => {
        if (cIdx >= availableDays.length) return;
        const targetDay = availableDays[cIdx];
        const num = parseNum(cVal);
        if (num !== null) {
          const mIdx = updated.findIndex(c => c.id === targetDay.id);
          if (mIdx !== -1) {
            updated[mIdx] = {
              ...updated[mIdx],
              [targetMetric]: num
            };
          }
        }
      });
    }

    const recalculated = type === 'BG' 
      ? recalculateBGMatrix(updated as ExcelMatrixBGColumn[])
      : recalculateROMatrix(updated as ExcelMatrixROColumn[]);

    onApply(recalculated);
    onClose();
  };

  const options = type === 'BG' ? BG_METRIC_OPTIONS : RO_METRIC_OPTIONS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Clipboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                Dán Dữ Liệu Trực Tiếp Từ Excel ({type === 'BG' ? 'Nhóm Bếp Ga' : 'Nhóm Máy Lọc RO'})
              </h3>
              <p className="text-[11px] text-slate-300">
                Tháng {monthIndex0 + 1}/{year} • Tự động khớp ngày & bỏ qua các cột tuần
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Quick Tip */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Cách copy-paste nhanh nhất:</div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Mở file Excel của bạn, quét chọn vùng dữ liệu (1 hàng 31 ngày hoặc cả bảng các dòng), bấm <b>Ctrl + C</b>, sau đó nhấp vào ô bên dưới và bấm <b>Ctrl + V</b>. Hệ thống tự động phân tách số liệu và điền vào các ngày!
              </p>
            </div>
          </div>

          {/* Controls: Target Metric & Start Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Chỉ số áp dụng:
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-hidden"
              >
                {options.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Bắt đầu từ ngày:
              </label>
              <select
                value={startDayIndex}
                onChange={(e) => setStartDayIndex(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-hidden"
              >
                {dayCols.map((col, idx) => (
                  <option key={col.id} value={idx}>
                    {col.label} (Cột số {idx + 1})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Vùng Dán Dữ Liệu (Paste Clipboard):
              </label>
              {pastedText && (
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="text-[10px] text-rose-600 hover:underline font-bold"
                >
                  Xóa nội dung
                </button>
              )}
            </div>
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Nhấp vào đây và nhấn Ctrl+V để dán dữ liệu đã sao chép từ Excel..."
              className="w-full p-3 font-mono text-xs bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden transition resize-y"
              autoFocus
            />
          </div>

          {/* Live Preview */}
          {parsedData.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  Đã nhận diện: {parsedData.length} dòng × {parsedData[0]?.length || 0} cột dữ liệu
                </span>
                <span className="text-slate-500 font-normal">
                  Sẽ điền vào từ ngày <b>{dayCols[startDayIndex]?.label}</b>
                </span>
              </div>

              <div className="overflow-x-auto max-h-36 border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-[10px] border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="p-1.5 text-left">Dòng</th>
                      {dayCols.slice(startDayIndex, startDayIndex + (parsedData[0]?.length || 0)).map((col, cIdx) => (
                        <th key={`hdr-${col.id}-${cIdx}`} className="p-1.5 text-center whitespace-nowrap min-w-[50px]">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, rIdx) => (
                      <tr key={`row-${rIdx}`} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-1.5 font-bold text-slate-500">#{rIdx + 1}</td>
                        {row.map((cell, cIdx) => (
                          <td key={`cell-${rIdx}-${cIdx}`} className="p-1.5 text-center text-slate-800">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <div className="text-[10px] text-slate-400 text-center italic">
                  ... và {parsedData.length - 5} dòng dữ liệu khác
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {parsedData.length > 0 ? (
              <span className="text-emerald-700 font-bold">
                ✓ Sẵn sàng cập nhật vào ma trận
              </span>
            ) : (
              <span>Vui lòng dán dữ liệu từ clipboard để tiếp tục</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0}
              onClick={handleConfirmApply}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Vào Ma Trận</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

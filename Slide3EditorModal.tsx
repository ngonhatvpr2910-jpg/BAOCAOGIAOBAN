import React, { useState, useEffect, useRef } from 'react';
import { SlideDefectCostData, DamagedItemRecord, DefectCostBarItem } from './types';
import { INITIAL_SLIDE3_DEFECT_COST } from './initialData';
import { exportDefectCostTemplate, parseDefectCostExcelFile } from './excelDefectService';
import { synchronizeSlide3Data } from './defectCostSyncService';
import { 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  TrendingDown, 
  BarChart2, 
  Layers, 
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';

interface Slide3EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: SlideDefectCostData;
  initialData?: SlideDefectCostData;
  onSave: (updatedData: SlideDefectCostData) => void;
  onReset: () => void;
}

const formatCurrency = (val: number | undefined): string => {
  if (val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(val);
};

export const Slide3EditorModal: React.FC<Slide3EditorModalProps> = ({
  isOpen,
  onClose,
  data,
  initialData,
  onSave,
  onReset,
}) => {
  const currentData = initialData || data || INITIAL_SLIDE3_DEFECT_COST;
  const [formData, setFormData] = useState<SlideDefectCostData>(() => JSON.parse(JSON.stringify(currentData)));
  const [activeTab, setActiveTab] = useState<'ro' | 'bg' | 'charts'>('ro');
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(initialData || data || INITIAL_SLIDE3_DEFECT_COST)));
    }
  }, [isOpen, data, initialData]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const result = await parseDefectCostExcelFile(file);
        setFormData(prev => ({
          ...prev,
          itemsRO: autoHighlightTop3(result.itemsRO),
          itemsBG: autoHighlightTop3(result.itemsBG),
          weeklyData: result.weeklyData && result.weeklyData.length > 0 ? result.weeklyData : prev.weeklyData,
          monthlyData: result.monthlyData && result.monthlyData.length > 0 ? result.monthlyData : prev.monthlyData,
        }));
        showNotification(`Đã nạp thành công ${result.itemsRO.length + result.itemsBG.length} mục vật tư từ file Excel!`);
      } catch (err: any) {
        alert(err?.message || 'Có lỗi khi đọc file Excel.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Function to automatically highlight top 3 items by amount
  const autoHighlightTop3 = (items: DamagedItemRecord[]): DamagedItemRecord[] => {
    // Clone and sort by amount descending
    const sorted = [...items].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    
    // Get the amount value of the 3rd item (if exists)
    const top3Count = Math.min(3, sorted.length);
    const threshold = top3Count > 0 ? sorted[top3Count - 1].amount : Infinity;

    // Map back to original items but update isHighlighted
    return items.map(item => ({
      ...item,
      isHighlighted: (item.amount || 0) >= threshold && (item.amount || 0) > 0
    }));
  };

  // RO Item Handlers
  const handleROChange = (idx: number, field: keyof DamagedItemRecord, val: any) => {
    const updated = [...formData.itemsRO];
    const item = { ...updated[idx], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : Number(item.quantity);
      const p = field === 'unitPrice' ? Number(val) : Number(item.unitPrice);
      item.amount = Number((q * p).toFixed(2));
    }
    updated[idx] = item;
    
    // Auto highlight if amount changed
    const withHighlights = (field === 'quantity' || field === 'unitPrice') 
      ? autoHighlightTop3(updated) 
      : updated;

    setFormData({ ...formData, itemsRO: withHighlights });
  };

  const handleAddROItem = () => {
    const newItem: DamagedItemRecord = {
      id: `ro-dam-${Date.now()}`,
      itemCode: '04-29-03-NEW-0001',
      itemName: 'Vật tư mới RO',
      quantity: 1,
      unitPrice: 50000,
      amount: 50000,
      category: 'RO',
      isHighlighted: false,
      week: 'W39',
    };
    const updated = [newItem, ...formData.itemsRO];
    setFormData({ ...formData, itemsRO: autoHighlightTop3(updated) });
    showNotification('Đã thêm 1 dòng vật tư hỏng RO mới');
  };

  const handleRemoveROItem = (idx: number) => {
    const updated = formData.itemsRO.filter((_, i) => i !== idx);
    setFormData({ ...formData, itemsRO: autoHighlightTop3(updated) });
    showNotification('Đã xóa dòng vật tư RO');
  };

  // BG Item Handlers
  const handleBGChange = (idx: number, field: keyof DamagedItemRecord, val: any) => {
    const updated = [...formData.itemsBG];
    const item = { ...updated[idx], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : Number(item.quantity);
      const p = field === 'unitPrice' ? Number(val) : Number(item.unitPrice);
      item.amount = Number((q * p).toFixed(2));
    }
    updated[idx] = item;
    
    // Auto highlight if amount changed
    const withHighlights = (field === 'quantity' || field === 'unitPrice') 
      ? autoHighlightTop3(updated) 
      : updated;

    setFormData({ ...formData, itemsBG: withHighlights });
  };

  const handleAddBGItem = () => {
    const newItem: DamagedItemRecord = {
      id: `bg-dam-${Date.now()}`,
      itemCode: '02-33-01-NEW-0001',
      itemName: 'Vật tư mới Bếp Gas',
      quantity: 1,
      unitPrice: 50000,
      amount: 50000,
      category: 'BG',
      isHighlighted: false,
      week: 'W39',
    };
    const updated = [newItem, ...formData.itemsBG];
    setFormData({ ...formData, itemsBG: autoHighlightTop3(updated) });
    showNotification('Đã thêm 1 dòng vật tư hỏng Bếp Gas mới');
  };

  const handleRemoveBGItem = (idx: number) => {
    const updated = formData.itemsBG.filter((_, i) => i !== idx);
    setFormData({ ...formData, itemsBG: autoHighlightTop3(updated) });
    showNotification('Đã xóa dòng vật tư Bếp Gas');
  };

  // Weekly Chart Handlers
  const handleWeeklyChange = (idx: number, val: number) => {
    const updated = [...formData.weeklyData];
    updated[idx] = {
      ...updated[idx],
      value: val,
      displayLabel: `${val}M`,
    };
    setFormData({ ...formData, weeklyData: updated });
  };

  const handleAddWeek = () => {
    const last = formData.weeklyData[formData.weeklyData.length - 1];
    let nextNum = 36;
    if (last && last.label.startsWith('W')) {
      nextNum = (parseInt(last.label.substring(1), 10) || 35) + 1;
    }
    const newBar: DefectCostBarItem = {
      id: `w-${nextNum}`,
      label: `W${nextNum}`,
      value: 1.5,
      displayLabel: '1.5M',
    };
    setFormData({ ...formData, weeklyData: [...formData.weeklyData, newBar] });
    showNotification(`Đã thêm cột tuần W${nextNum}`);
  };

  const handleRemoveWeek = (idx: number) => {
    const updated = formData.weeklyData.filter((_, i) => i !== idx);
    setFormData({ ...formData, weeklyData: updated });
  };

  // Monthly Chart Handlers
  const handleMonthlyChange = (idx: number, val: number) => {
    const updated = [...formData.monthlyData];
    updated[idx] = {
      ...updated[idx],
      value: val,
      displayLabel: `${val}M`,
    };
    setFormData({ ...formData, monthlyData: updated });
  };

  const handleAddMonth = () => {
    const nextNum = formData.monthlyData.length + 5;
    const newBar: DefectCostBarItem = {
      id: `m-${nextNum}`,
      label: `Tháng ${nextNum}`,
      value: 5.5,
      displayLabel: '5.5M',
    };
    setFormData({ ...formData, monthlyData: [...formData.monthlyData, newBar] });
    showNotification(`Đã thêm cột Tháng ${nextNum}`);
  };

  const handleRemoveMonth = (idx: number) => {
    const updated = formData.monthlyData.filter((_, i) => i !== idx);
    setFormData({ ...formData, monthlyData: updated });
  };

  // Total Calculations
  const totalRO = formData.itemsRO.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalBG = formData.itemsBG.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const grandTotal = totalRO + totalBG;

  // Tự động đồng bộ số liệu tuần và logic tháng từ toàn bộ danh sách vật tư chi tiết
  const handleSyncTotalsToCharts = () => {
    const { syncedData } = synchronizeSlide3Data(formData);
    setFormData(syncedData);
    showNotification('Đã tự động tính toán và đồng bộ 100% biểu đồ tuần & tháng từ danh sách vật tư!');
  };

  const handleSave = () => {
    const { syncedData } = synchronizeSlide3Data(formData);
    onSave(syncedData);
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu gốc ban đầu cho Slide Hư Hỏng?')) {
      onReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 font-sans"
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-white shadow-xs">
              4
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                Chỉnh Sửa Dữ Liệu: Tỉ Lệ Hàng Hư Hỏng & Chi Phí Vật Tư
              </h3>
              <p className="text-xs text-slate-400">
                Thêm bớt dòng vật tư, cập nhật đơn giá, số lượng và số liệu biểu đồ tuần/tháng
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION & SUMMARY HEADER */}
        <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
            <button
              onClick={() => setActiveTab('ro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ro' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hàng Hỏng RO ({formData.itemsRO.length})
            </button>
            <button
              onClick={() => setActiveTab('bg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bg' 
                  ? 'bg-amber-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hàng Hỏng Bếp Gas ({formData.itemsBG.length})
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'charts' 
                  ? 'bg-rose-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Biểu Đồ Tuần & Tháng
            </button>
          </div>

          {/* Quick Summary & Sync & Excel Buttons */}
          <div className="flex items-center gap-2">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleExcelUpload}
            />

            <button
              onClick={async () => {
                try {
                  await exportDefectCostTemplate(formData);
                } catch (err) {
                  alert('Có lỗi khi xuất file Excel.');
                }
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Tải về file mẫu Excel chuẩn để điền dữ liệu"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Mẫu Excel</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Nhập dữ liệu từ file Excel / CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upfile Excel</span>
            </button>

            <div className="text-right text-xs ml-2">
              <span className="text-slate-500">Tổng tổn thất: </span>
              <strong className="text-rose-600 font-mono text-sm font-black">
                {formatCurrency(grandTotal)} VNĐ
              </strong>
            </div>
            <button
              onClick={handleSyncTotalsToCharts}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="Cập nhật tổng tiền vào cột tuần/tháng mới nhất"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Đồng Bộ Biểu Đồ</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[60vh] space-y-4">
          
          {/* TAB 1: RO ITEMS */}
          {activeTab === 'ro' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Danh Sách Vật Tư Hư Hỏng Nhóm RO (Lọc Nước)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tổng cộng: <strong className="text-blue-700 font-mono">{formatCurrency(totalRO)} VNĐ</strong>
                  </p>
                </div>
                <button
                  onClick={handleAddROItem}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Dòng Vật Tư RO</span>
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2 w-20 text-center">Tuần</th>
                        <th className="p-2 w-40">Mã Vật Tư (item)</th>
                        <th className="p-2">Tên / Mô Tả Vật Tư</th>
                        <th className="p-2 text-right w-20">Số Lượng</th>
                        <th className="p-2 text-right w-28">Đơn Giá (VNĐ)</th>
                        <th className="p-2 text-right w-32">Thành Tiền (VNĐ)</th>
                        <th className="p-2 text-center w-16">Nổi Bật</th>
                        <th className="p-2 text-center w-10">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {formData.itemsRO.map((item, idx) => (
                        <tr 
                          key={item.id || idx} 
                          className={`transition-colors ${item.isHighlighted ? 'bg-yellow-100 hover:bg-yellow-200' : 'hover:bg-blue-50/40'}`}
                        >
                          <td className="p-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              placeholder="W39"
                              value={item.week || ''}
                              onChange={(e) => handleROChange(idx, 'week', e.target.value.toUpperCase())}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded text-xs text-center bg-white focus:ring-1 focus:ring-blue-500 font-bold text-indigo-700"
                              title="Gán mã tuần cho linh kiện (Ví dụ: W39, W38)"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleROChange(idx, 'itemCode', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                          </td>
                          <td className="p-1.5 font-sans">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleROChange(idx, 'itemName', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleROChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right bg-white focus:ring-1 focus:ring-blue-500 font-bold"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={item.unitPrice}
                              onChange={(e) => handleROChange(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!item.isHighlighted}
                              onChange={(e) => handleROChange(idx, 'isHighlighted', e.target.checked)}
                              className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                              title="Đánh dấu màu nổi bật"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              onClick={() => handleRemoveROItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Xóa dòng"
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
          )}

          {/* TAB 2: BG ITEMS */}
          {activeTab === 'bg' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Danh Sách Vật Tư Hư Hỏng Nhóm Bếp Gas (BG)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tổng cộng: <strong className="text-amber-700 font-mono">{formatCurrency(totalBG)} VNĐ</strong>
                  </p>
                </div>
                <button
                  onClick={handleAddBGItem}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Dòng Vật Tư BG</span>
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2 w-20 text-center">Tuần</th>
                        <th className="p-2 w-40">Mã Vật Tư (item)</th>
                        <th className="p-2">Tên / Mô Tả Vật Tư</th>
                        <th className="p-2 text-right w-20">Số Lượng</th>
                        <th className="p-2 text-right w-28">Đơn Giá (VNĐ)</th>
                        <th className="p-2 text-right w-32">Thành Tiền (VNĐ)</th>
                        <th className="p-2 text-center w-16">Nổi Bật</th>
                        <th className="p-2 text-center w-10">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {formData.itemsBG.map((item, idx) => (
                        <tr 
                          key={item.id || idx} 
                          className={`transition-colors ${item.isHighlighted ? 'bg-yellow-100 hover:bg-yellow-200' : 'hover:bg-amber-50/40'}`}
                        >
                          <td className="p-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              placeholder="W39"
                              value={item.week || ''}
                              onChange={(e) => handleBGChange(idx, 'week', e.target.value.toUpperCase())}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded text-xs text-center bg-white focus:ring-1 focus:ring-amber-500 font-bold text-indigo-700"
                              title="Gán mã tuần cho linh kiện (Ví dụ: W39, W38)"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleBGChange(idx, 'itemCode', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-amber-500 font-mono"
                            />
                          </td>
                          <td className="p-1.5 font-sans">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleBGChange(idx, 'itemName', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleBGChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right bg-white focus:ring-1 focus:ring-amber-500 font-bold"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={item.unitPrice}
                              onChange={(e) => handleBGChange(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right bg-white focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!item.isHighlighted}
                              onChange={(e) => handleBGChange(idx, 'isHighlighted', e.target.checked)}
                              className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                              title="Đánh dấu màu nổi bật"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              onClick={() => handleRemoveBGItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Xóa dòng"
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
          )}

          {/* TAB 3: CHARTS DATA */}
          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Weekly Data Editor */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-red-600" />
                    <span>Dữ Liệu Hàng Hỏng Theo Tuần (Triệu VNĐ)</span>
                  </h4>
                  <button
                    onClick={handleAddWeek}
                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Tuần</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {formData.weeklyData.map((bar, idx) => (
                    <div key={bar.id || idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="w-12 font-bold text-xs text-slate-700">{bar.label}:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={bar.value}
                        onChange={(e) => handleWeeklyChange(idx, Number(e.target.value))}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-bold text-red-700 text-right"
                      />
                      <span className="text-xs text-slate-500">Triệu VNĐ ({bar.displayLabel})</span>
                      <button
                        onClick={() => handleRemoveWeek(idx)}
                        className="ml-auto p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Data Editor */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-rose-700" />
                    <span>Dữ Liệu Hàng Hỏng Theo Tháng (Triệu VNĐ)</span>
                  </h4>
                  <button
                    onClick={handleAddMonth}
                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-700 text-white hover:bg-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Tháng</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {formData.monthlyData.map((bar, idx) => (
                    <div key={bar.id || idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="w-20 font-bold text-xs text-slate-700">{bar.label}:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={bar.value}
                        onChange={(e) => handleMonthlyChange(idx, Number(e.target.value))}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-bold text-rose-800 text-right"
                      />
                      <span className="text-xs text-slate-500">Triệu VNĐ ({bar.displayLabel})</span>
                      <button
                        onClick={() => handleRemoveMonth(idx)}
                        className="ml-auto p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đặt Lại Dữ Liệu Gốc</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Dữ Liệu Slide Hư Hỏng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

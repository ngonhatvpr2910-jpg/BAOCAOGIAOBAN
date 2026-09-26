import React, { useState } from 'react';
import { Slide2QualityData, Slide2QualityItem, QualityDailyRecord } from './types';
import { X, Check, RotateCcw, Edit3, ShieldAlert, Sparkles, Plus, Trash2, Calendar, Layers, Activity, Lock } from 'lucide-react';
import { INITIAL_SLIDE2_QUALITY } from './initialData';
import { calculatePXLRQuality, rollupDailyToQualityCharts, getNextQualityDateInfo } from './qualityFormulas';
import { isDateLocked } from './ProductionContext';

interface Slide2EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Slide2QualityData;
  currentData?: Slide2QualityData;
  onSave: (newData: Slide2QualityData) => void;
  onReset: () => void;
}

export const Slide2EditorModal: React.FC<Slide2EditorModalProps> = ({
  isOpen,
  onClose,
  initialData,
  currentData,
  onSave,
  onReset,
}) => {
  const dataToUse = initialData || currentData || INITIAL_SLIDE2_QUALITY;
  const [formData, setFormData] = useState<Slide2QualityData>(() => JSON.parse(JSON.stringify(dataToUse)));
  const [activeTab, setActiveTab] = useState<'daily_input' | 'monthly' | 'weekly' | 'text'>('daily_input');

  if (!isOpen) return null;

  // Xử lý thay đổi dữ liệu hàng ngày (Daily Records)
  const handleDailyRecordChange = (
    recId: string,
    fieldPath: 'date' | 'dayLabel' | 'week' | 'ro.dmVatTu' | 'ro.vatTu' | 'ro.totalLoi4M' | 'bg.dmVatTu' | 'bg.vatTu' | 'bg.totalLoi4M' | 'ro.sanLuong' | 'bg.sanLuong',
    val: string | number
  ) => {
    setFormData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as Slide2QualityData;
      const records = next.dailyRecords || [];
      const rec = records.find(r => r.id === recId);
      if (!rec) return next;

      if (fieldPath === 'date') rec.date = String(val);
      else if (fieldPath === 'dayLabel') rec.dayLabel = String(val);
      else if (fieldPath === 'week') rec.week = String(val);
      else {
        const num = parseFloat(String(val)) || 0;
        const [sub, prop] = fieldPath.split('.') as ['ro' | 'bg', string];
        if (sub === 'ro' || sub === 'bg') {
          (rec[sub] as any)[prop] = num;
        }
      }

      // Tự động tính toán PXLR cho bản ghi ngày này
      const pxlrCalc = calculatePXLRQuality(rec.ro, rec.bg);
      rec.pxlr = {
        dmVatTu: pxlrCalc.dmVatTu,
        vatTu: pxlrCalc.vatTu,
        totalLoi4M: pxlrCalc.totalLoi4M,
      };

      // Tự động Rollup cập nhật tuần và tháng nếu autoRollup = true
      if (next.autoRollup !== false) {
        const rolled = rollupDailyToQualityCharts(records, next.monthly, next.weekly);
        next.daily = rolled.daily;
        next.weekly = rolled.weekly;
        next.monthly = rolled.monthly;

        // Cập nhật view hiện tại
        if (next.activeTimeFrame === 'day') {
          next.pxlr = next.daily.pxlr;
          next.ro = next.daily.ro;
          next.bg = next.daily.bg;
        } else if (next.activeTimeFrame === 'week') {
          next.pxlr = next.weekly.pxlr;
          next.ro = next.weekly.ro;
          next.bg = next.weekly.bg;
        } else {
          next.pxlr = next.monthly.pxlr;
          next.ro = next.monthly.ro;
          next.bg = next.monthly.bg;
        }
      }

      return next;
    });
  };

  // Thêm một ngày mới vào bảng (Tự động tính ngày tiếp theo, ví dụ 17/09 -> 18/09)
  const handleAddNewDay = () => {
    setFormData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as Slide2QualityData;
      const records = next.dailyRecords || [];
      
      // Tính toán ngày tiếp theo tuần tự thông minh (VD: đang đến 17/09 thì ngày tiếp theo là 18/09)
      const nextDateInfo = getNextQualityDateInfo(records);

      const lastRec = records.length > 0 ? records[records.length - 1] : null;
      const defaultRoVatTu = lastRec ? lastRec.ro.vatTu : 0.8;
      const defaultRoLoi4M = lastRec ? lastRec.ro.totalLoi4M : 3.2;
      const defaultBgVatTu = lastRec ? lastRec.bg.vatTu : 2.5;
      const defaultBgLoi4M = lastRec ? lastRec.bg.totalLoi4M : 6.5;

      const pxlrCalc = calculatePXLRQuality(
        { dmVatTu: 2.4, vatTu: defaultRoVatTu, totalLoi4M: defaultRoLoi4M, sanLuong: 750 },
        { dmVatTu: 4.03, vatTu: defaultBgVatTu, totalLoi4M: defaultBgLoi4M, sanLuong: 60 }
      );

      const newRec: QualityDailyRecord = {
        id: `q-d-custom-${Date.now()}`,
        date: nextDateInfo.date,
        dayLabel: nextDateInfo.dayLabel,
        week: nextDateInfo.week,
        month: nextDateInfo.month,
        ro: { dmVatTu: 2.4, vatTu: defaultRoVatTu, totalLoi4M: defaultRoLoi4M, sanLuong: 750 },
        bg: { dmVatTu: 4.03, vatTu: defaultBgVatTu, totalLoi4M: defaultBgLoi4M, sanLuong: 60 },
        pxlr: { dmVatTu: pxlrCalc.dmVatTu, vatTu: pxlrCalc.vatTu, totalLoi4M: pxlrCalc.totalLoi4M },
      };
      records.push(newRec);
      next.dailyRecords = records;

      const rolled = rollupDailyToQualityCharts(records, next.monthly, next.weekly);
      next.daily = rolled.daily;
      next.weekly = rolled.weekly;
      next.monthly = rolled.monthly;

      return next;
    });
  };

  // Xóa một ngày
  const handleDeleteDay = (recId: string) => {
    setFormData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as Slide2QualityData;
      next.dailyRecords = (next.dailyRecords || []).filter(r => r.id !== recId);
      const rolled = rollupDailyToQualityCharts(next.dailyRecords, next.monthly, next.weekly);
      next.daily = rolled.daily;
      next.weekly = rolled.weekly;
      next.monthly = rolled.monthly;
      return next;
    });
  };

  const handleDefectItemChange = (index: number, value: string) => {
    setFormData(prev => {
      const newItems = [...(prev.keyDefects?.items || [])];
      newItems[index] = value;
      return {
        ...prev,
        keyDefects: { ...prev.keyDefects, items: newItems },
      };
    });
  };

  const handleAddDefectItem = () => {
    setFormData(prev => {
      const currentItems = prev.keyDefects?.items || [];
      return {
        ...prev,
        keyDefects: {
          ...prev.keyDefects,
          items: [...currentItems, ''],
        },
      };
    });
  };

  const handleRemoveDefectItem = (index: number) => {
    setFormData(prev => {
      const currentItems = prev.keyDefects?.items || [];
      const newItems = currentItems.filter((_, i) => i !== index);
      return {
        ...prev,
        keyDefects: {
          ...prev.keyDefects,
          items: newItems,
        },
      };
    });
  };

  const handleCountermeasureChange = (index: number, value: string) => {
    setFormData(prev => {
      const newItems = [...(prev.countermeasures?.items || [])];
      newItems[index] = value;
      return {
        ...prev,
        countermeasures: { ...prev.countermeasures, items: newItems },
      };
    });
  };

  const handleAddCountermeasureItem = () => {
    setFormData(prev => {
      const currentItems = prev.countermeasures?.items || [];
      return {
        ...prev,
        countermeasures: {
          ...prev.countermeasures,
          items: [...currentItems, ''],
        },
      };
    });
  };

  const handleRemoveCountermeasureItem = (index: number) => {
    setFormData(prev => {
      const currentItems = prev.countermeasures?.items || [];
      const newItems = currentItems.filter((_, i) => i !== index);
      return {
        ...prev,
        countermeasures: {
          ...prev.countermeasures,
          items: newItems,
        },
      };
    });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Khôi phục toàn bộ số liệu Slide 2 về mặc định theo ảnh PowerPoint?')) {
      setFormData(JSON.parse(JSON.stringify(INITIAL_SLIDE2_QUALITY)));
      onReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-teal-200" />
            <div>
              <h3 className="font-bold text-base">Cập Nhật Dữ Liệu Chất Lượng Slide 2 (Ngày • Tuần • Tháng)</h3>
              <p className="text-xs text-teal-200 font-sans">
                Nhập số liệu hàng ngày: Hệ thống tự động tính tỷ lệ lỗi PXLR và đồng bộ lên biểu đồ Tuần & Tháng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-teal-100 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 font-sans">
          {/* General Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tiêu Đề Dải Trên
              </label>
              <input
                type="text"
                value={formData.headerBarText}
                onChange={e => setFormData(prev => ({ ...prev, headerBarText: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Số Thứ Tự Slide
              </label>
              <input
                type="text"
                value={formData.slideNumber}
                onChange={e => setFormData(prev => ({ ...prev, slideNumber: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên Mục Báo Cáo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily_input')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'daily_input'
                  ? 'bg-teal-50 border-b-2 border-teal-700 text-teal-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-600" />
              1. Cập Nhật Hàng Ngày (Tự Động Chạy Tuần & Tháng)
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'monthly'
                  ? 'bg-teal-50 border-b-2 border-teal-700 text-teal-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              2. Xem Số Liệu Tháng (T6-T9)
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'weekly'
                  ? 'bg-teal-50 border-b-2 border-teal-700 text-teal-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-teal-600" />
              3. Xem Số Liệu Tuần (W35-W38)
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'text'
                  ? 'bg-teal-50 border-b-2 border-teal-700 text-teal-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              4. Lỗi Trọng Điểm & Đối Sách
            </button>
          </div>

          {/* Tab 1: Daily Quality Input Matrix */}
          {activeTab === 'daily_input' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-900 font-semibold">
                    Khi bạn nhập % lỗi của Line RO và Line BG từng ngày, hệ thống sẽ tự động tính tỷ lệ lỗi PXLR và cập nhật ngay vào biểu đồ Tuần & Tháng!
                  </span>
                </div>
                <button
                  onClick={handleAddNewDay}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Ngày Mới
                </button>
              </div>

              {/* Locked Benchmark Policy Alert */}
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong>Quy định Định Mức:</strong> Các cột <span className="text-rose-700 font-bold">ĐM VT (%)</span> và <span className="text-emerald-700 font-bold">ĐM % Lỗi 4M</span> là tiêu chuẩn cố định của nhà máy (RO: 2.4%, BG: 4.03%) — đã được <strong>khóa cố định, không cho phép chỉnh sửa</strong> để đảm bảo tính chuẩn xác.
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-white font-bold text-center">
                    <tr>
                      <th rowSpan={2} className="p-2 border-r border-slate-700">Ngày</th>
                      <th rowSpan={2} className="p-2 border-r border-slate-700">Tuần</th>
                      <th colSpan={3} className="p-2 bg-rose-900/90 border-r border-slate-700">LINE RO</th>
                      <th colSpan={3} className="p-2 bg-blue-900/90 border-r border-slate-700">LINE BG</th>
                      <th colSpan={3} className="p-2 bg-emerald-900/90 border-r border-slate-700">PXLR</th>
                      <th rowSpan={2} className="p-2">Xóa</th>
                    </tr>
                    <tr className="bg-slate-700 text-[11px]">
                      <th className="p-1.5 bg-rose-950/70 border-r border-slate-600 text-rose-300" title="Định mức cố định đã khóa">
                        <span className="flex items-center justify-center gap-0.5"><Lock className="w-2.5 h-2.5" /> ĐM VT</span>
                      </th>
                      <th className="p-1.5 bg-rose-950/70 border-r border-slate-600">VT (%)</th>
                      <th className="p-1.5 bg-rose-950/70 border-r border-slate-600">Lỗi 4M (%)</th>
                      
                      <th className="p-1.5 bg-blue-950/70 border-r border-slate-600 text-rose-300" title="Định mức cố định đã khóa">
                        <span className="flex items-center justify-center gap-0.5"><Lock className="w-2.5 h-2.5" /> ĐM VT</span>
                      </th>
                      <th className="p-1.5 bg-blue-950/70 border-r border-slate-600">VT (%)</th>
                      <th className="p-1.5 bg-blue-950/70 border-r border-slate-600">Lỗi 4M (%)</th>
                      
                      <th className="p-1.5 bg-emerald-950/70 border-r border-slate-600 text-rose-300" title="Định mức cố định đã khóa">
                        <span className="flex items-center justify-center gap-0.5"><Lock className="w-2.5 h-2.5" /> ĐM VT</span>
                      </th>
                      <th className="p-1.5 bg-emerald-950/70 border-r border-slate-600">VT (%)</th>
                      <th className="p-1.5 bg-emerald-950/70 border-r border-slate-600">Lỗi 4M (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {(formData.dailyRecords || []).map((rec, idx) => (
                      <tr key={rec.id || idx} className="hover:bg-slate-50">
                        {/* Ngày */}
                        <td className="p-2 text-center font-bold text-slate-800">
                          <input
                            type="text"
                            value={rec.dayLabel}
                            disabled={isDateLocked(rec.date)}
                            onChange={e => handleDailyRecordChange(rec.id, 'dayLabel', e.target.value)}
                            className={`w-14 border rounded px-1.5 py-1 text-center font-bold text-xs ${isDateLocked(rec.date) ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`}
                          />
                        </td>
                        {/* Tuần */}
                        <td className="p-2 text-center font-bold">
                          <select
                            value={rec.week}
                            disabled={isDateLocked(rec.date)}
                            onChange={e => handleDailyRecordChange(rec.id, 'week', e.target.value)}
                            className={`border rounded px-1 py-1 text-center font-bold text-xs text-teal-700 cursor-pointer ${isDateLocked(rec.date) ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`}
                          >
                            <option value="W35">W35 (Tuần 35)</option>
                            <option value="W36">W36 (Tuần 36)</option>
                            <option value="W37">W37 (Tuần 37)</option>
                            <option value="W38">W38 (Tuần 38)</option>
                            <option value="W39">W39 (Tuần 39)</option>
                            <option value="W40">W40 (Tuần 40)</option>
                            <option value="W41">W41 (Tuần 41)</option>
                            <option value="W42">W42 (Tuần 42)</option>
                          </select>
                        </td>

                        {/* RO Fields: ĐM VT is LOCKED */}
                        <td className="p-1.5 text-center bg-rose-50/40">
                          <div className="inline-flex items-center justify-center gap-1 font-bold text-xs text-rose-700 font-mono px-2 py-1 rounded bg-rose-100/80 border border-rose-200 select-none shadow-2xs" title="Định mức cố định của công ty (Đã khóa, không cho phép chỉnh sửa)">
                            <Lock className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                            <span>2.4%</span>
                          </div>
                        </td>
                        <td className="p-1.5 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={rec.ro.vatTu}
                            disabled={isDateLocked(rec.date)}
                            onChange={e => handleDailyRecordChange(rec.id, 'ro.vatTu', e.target.value)}
                            className={`w-16 border rounded px-1.5 py-1 text-right text-xs font-bold ${isDateLocked(rec.date) ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-blue-700'}`}
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={rec.ro.totalLoi4M}
                            disabled={isDateLocked(rec.date)}
                            onChange={e => handleDailyRecordChange(rec.id, 'ro.totalLoi4M', e.target.value)}
                            className={`w-16 border rounded px-1.5 py-1 text-right text-xs font-black ${isDateLocked(rec.date) ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-rose-800'}`}
                          />
                        </td>

                        {/* BG Fields: ĐM VT is LOCKED */}
                        <td className="p-1.5 text-center bg-blue-50/40">
                          <div className="inline-flex items-center justify-center gap-1 font-bold text-xs text-rose-700 font-mono px-2 py-1 rounded bg-rose-100/80 border border-rose-200 select-none shadow-2xs" title="Định mức cố định của công ty (Đã khóa, không cho phép chỉnh sửa)">
                            <Lock className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                            <span>4.03%</span>
                          </div>
                        </td>
                        <td className="p-1.5 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={rec.bg.vatTu}
                            disabled={isDateLocked(rec.date)}
                            onChange={e => handleDailyRecordChange(rec.id, 'bg.vatTu', e.target.value)}
                            className={`w-16 border rounded px-1.5 py-1 text-right text-xs font-bold ${isDateLocked(rec.date) ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-blue-700'}`}
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={rec.bg.totalLoi4M}
                            disabled={isDateLocked(rec.date)}
                            onChange={e => handleDailyRecordChange(rec.id, 'bg.totalLoi4M', e.target.value)}
                            className={`w-16 border rounded px-1.5 py-1 text-right text-xs font-black ${isDateLocked(rec.date) ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-blue-800'}`}
                          />
                        </td>

                        {/* PXLR (Auto Calculated & Locked Benchmark) */}
                        <td className="p-2 text-right font-bold text-rose-700 bg-emerald-50/50">
                          <div className="inline-flex items-center justify-end gap-1 font-bold font-mono">
                            <Lock className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                            <span>{rec.pxlr.dmVatTu}%</span>
                          </div>
                        </td>
                        <td className="p-2 text-right font-bold text-blue-700 bg-emerald-50/50">
                          {rec.pxlr.vatTu}%
                        </td>
                        <td className="p-2 text-right font-black text-emerald-800 bg-emerald-50/50">
                          {rec.pxlr.totalLoi4M}%
                        </td>

                        {/* Delete button */}
                        <td className="p-2 text-center">
                          {!isDateLocked(rec.date) && (
                            <button
                              onClick={() => handleDeleteDay(rec.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              title="Xóa ngày này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Monthly Data Review */}
          {activeTab === 'monthly' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong>Bảo lưu dữ liệu lịch sử:</strong> Toàn bộ dữ liệu <strong>Tháng 6, Tháng 7, Tháng 8</strong> được giữ lại cố định 100%. Riêng <strong>Tháng 9 (T9)</strong> được tự động tổng hợp trực tiếp từ các ngày trong Tháng 9 bạn đã nhập!
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PXLR Monthly */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase">PXLR (Tháng)</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-600 font-bold border-b border-slate-200">
                        <th className="text-left pb-1">Tháng</th>
                        <th className="text-right pb-1 text-rose-700">ĐM VT</th>
                        <th className="text-right pb-1 text-blue-700">VT</th>
                        <th className="text-right pb-1 text-slate-900">Lỗi 4M</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(formData.monthly?.pxlr.items || formData.pxlr.items).map(item => (
                        <tr key={item.id}>
                          <td className="py-1.5 font-bold font-sans">{item.month}</td>
                          <td className="py-1.5 text-right text-rose-700 font-bold">{item.dmVatTu}%</td>
                          <td className="py-1.5 text-right text-blue-700 font-bold">{item.vatTu}%</td>
                          <td className="py-1.5 text-right font-black text-slate-900">{item.totalLoi4M}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* RO Monthly */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase">Line RO (Tháng)</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-600 font-bold border-b border-slate-200">
                        <th className="text-left pb-1">Tháng</th>
                        <th className="text-right pb-1 text-rose-700">ĐM VT</th>
                        <th className="text-right pb-1 text-blue-700">VT</th>
                        <th className="text-right pb-1 text-slate-900">Lỗi 4M</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(formData.monthly?.ro.items || formData.ro.items).map(item => (
                        <tr key={item.id}>
                          <td className="py-1.5 font-bold font-sans">{item.month}</td>
                          <td className="py-1.5 text-right text-rose-700 font-bold">{item.dmVatTu}%</td>
                          <td className="py-1.5 text-right text-blue-700 font-bold">{item.vatTu}%</td>
                          <td className="py-1.5 text-right font-black text-slate-900">{item.totalLoi4M}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* BG Monthly */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase">Line BG (Tháng)</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-600 font-bold border-b border-slate-200">
                        <th className="text-left pb-1">Tháng</th>
                        <th className="text-right pb-1 text-rose-700">ĐM VT</th>
                        <th className="text-right pb-1 text-blue-700">VT</th>
                        <th className="text-right pb-1 text-slate-900">Lỗi 4M</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(formData.monthly?.bg.items || formData.bg.items).map(item => (
                        <tr key={item.id}>
                          <td className="py-1.5 font-bold font-sans">{item.month}</td>
                          <td className="py-1.5 text-right text-rose-700 font-bold">{item.dmVatTu}%</td>
                          <td className="py-1.5 text-right text-blue-700 font-bold">{item.vatTu}%</td>
                          <td className="py-1.5 text-right font-black text-slate-900">{item.totalLoi4M}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Weekly Data Review */}
          {activeTab === 'weekly' && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  <strong>Bảo lưu dữ liệu Tuần thuộc Tháng 8:</strong> <strong>Tuần 35 (W35)</strong> là tuần thuộc Tháng 8 được giữ lại cố định 100% (giống Slide 1). Các tuần của Tháng 9 (<strong>Tuần 36, Tuần 37, Tuần 38</strong>) được tính tự động dựa trên các ngày tương ứng trong tuần!
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PXLR Weekly */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase">PXLR (Theo Tuần)</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-600 font-bold border-b border-slate-200">
                        <th className="text-left pb-1">Tuần</th>
                        <th className="text-right pb-1 text-rose-700">ĐM VT</th>
                        <th className="text-right pb-1 text-blue-700">VT</th>
                        <th className="text-right pb-1 text-slate-900">Lỗi 4M</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(formData.weekly?.pxlr.items || []).map(item => (
                        <tr key={item.id}>
                          <td className="py-1.5 font-bold font-sans">{item.month}</td>
                          <td className="py-1.5 text-right text-rose-700 font-bold">{item.dmVatTu}%</td>
                          <td className="py-1.5 text-right text-blue-700 font-bold">{item.vatTu}%</td>
                          <td className="py-1.5 text-right font-black text-slate-900">{item.totalLoi4M}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* RO Weekly */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase">Line RO (Theo Tuần)</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-600 font-bold border-b border-slate-200">
                        <th className="text-left pb-1">Tuần</th>
                        <th className="text-right pb-1 text-rose-700">ĐM VT</th>
                        <th className="text-right pb-1 text-blue-700">VT</th>
                        <th className="text-right pb-1 text-slate-900">Lỗi 4M</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(formData.weekly?.ro.items || []).map(item => (
                        <tr key={item.id}>
                          <td className="py-1.5 font-bold font-sans">{item.month}</td>
                          <td className="py-1.5 text-right text-rose-700 font-bold">{item.dmVatTu}%</td>
                          <td className="py-1.5 text-right text-blue-700 font-bold">{item.vatTu}%</td>
                          <td className="py-1.5 text-right font-black text-slate-900">{item.totalLoi4M}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* BG Weekly */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase">Line BG (Theo Tuần)</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-600 font-bold border-b border-slate-200">
                        <th className="text-left pb-1">Tuần</th>
                        <th className="text-right pb-1 text-rose-700">ĐM VT</th>
                        <th className="text-right pb-1 text-blue-700">VT</th>
                        <th className="text-right pb-1 text-slate-900">Lỗi 4M</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(formData.weekly?.bg.items || []).map(item => (
                        <tr key={item.id}>
                          <td className="py-1.5 font-bold font-sans">{item.month}</td>
                          <td className="py-1.5 text-right text-rose-700 font-bold">{item.dmVatTu}%</td>
                          <td className="py-1.5 text-right text-blue-700 font-bold">{item.vatTu}%</td>
                          <td className="py-1.5 text-right font-black text-slate-900">{item.totalLoi4M}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Text Commentary */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              {/* Box 1: Các lỗi trọng điểm */}
              <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-red-200/70">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-red-700 uppercase">
                      Tiêu Đề Hộp Lỗi Trọng Điểm
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDefectItem}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-white hover:bg-red-100 border border-red-300 rounded-md transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Dòng Lỗi</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-red-800 mb-1">Tiêu đề nhóm:</label>
                  <input
                    type="text"
                    value={formData.keyDefects.title}
                    onChange={e => setFormData(prev => ({ ...prev, keyDefects: { ...prev.keyDefects, title: e.target.value } }))}
                    className="w-full bg-white border border-red-300 rounded-lg px-3 py-1.5 text-sm font-bold text-red-700 focus:ring-1 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-red-900">
                    <span>Danh sách các dòng lỗi trọng điểm:</span>
                    <span className="text-[10px] text-red-600">({(formData.keyDefects?.items || []).length} dòng)</span>
                  </div>

                  {(formData.keyDefects?.items || []).length === 0 ? (
                    <div className="text-center py-4 bg-white/70 border border-dashed border-red-200 rounded-lg">
                      <p className="text-xs text-red-500 mb-2">Chưa có dòng lỗi nào.</p>
                      <button
                        type="button"
                        onClick={handleAddDefectItem}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm dòng đầu tiên</span>
                      </button>
                    </div>
                  ) : (
                    (formData.keyDefects?.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <span className="w-6 text-center text-xs font-bold text-red-600 shrink-0 bg-red-100 py-1 rounded">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={item}
                          placeholder={`Nội dung lỗi trọng điểm dòng ${idx + 1}...`}
                          onChange={e => handleDefectItemChange(idx, e.target.value)}
                          className="flex-1 bg-white border border-red-200 rounded px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDefectItem(idx)}
                          title="Xóa / bớt dòng này"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Box 2: Các đối sách */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-200/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 uppercase">
                      Tiêu Đề Hộp Đối Sách Tháng 9
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCountermeasureItem}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Dòng Đối Sách</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Tiêu đề nhóm:</label>
                  <input
                    type="text"
                    value={formData.countermeasures.title}
                    onChange={e => setFormData(prev => ({ ...prev, countermeasures: { ...prev.countermeasures, title: e.target.value } }))}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
                    <span>Danh sách các dòng đối sách giảm tỉ lệ lỗi:</span>
                    <span className="text-[10px] text-emerald-600">({(formData.countermeasures?.items || []).length} dòng)</span>
                  </div>

                  {(formData.countermeasures?.items || []).length === 0 ? (
                    <div className="text-center py-4 bg-white/70 border border-dashed border-emerald-200 rounded-lg">
                      <p className="text-xs text-emerald-600 mb-2">Chưa có dòng đối sách nào.</p>
                      <button
                        type="button"
                        onClick={handleAddCountermeasureItem}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm dòng đầu tiên</span>
                      </button>
                    </div>
                  ) : (
                    (formData.countermeasures?.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <span className="w-6 text-center text-xs font-bold text-emerald-600 shrink-0 bg-emerald-100 py-1 rounded">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={item}
                          placeholder={`Nội dung đối sách dòng ${idx + 1}...`}
                          onChange={e => handleCountermeasureChange(idx, e.target.value)}
                          className="flex-1 bg-white border border-emerald-200 rounded px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCountermeasureItem(idx)}
                          title="Xóa / bớt dòng này"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi Phục Gốc Slide 2</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Dữ Liệu Slide 2</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

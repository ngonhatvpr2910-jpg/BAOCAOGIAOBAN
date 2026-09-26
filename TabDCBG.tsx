import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { Flame, Check, AlertTriangle, Users, TrendingUp, Save, Clock, HelpCircle, ShieldCheck, BarChart3, FileSpreadsheet, Edit3 } from 'lucide-react';
import { DCBGExcelDashboard } from './DCBGExcelDashboard';

export const TabDCBG: React.FC = () => {
  const { activeDCBGRecord, updateDCBGRecord, dcbgRecords, setSelectedDate, selectedDate, isDateLocked } = useProduction();
  const { canEditDCBG, currentUser } = useAuth();

  const isLocked = isDateLocked(selectedDate);
  const effectiveCanEdit = canEditDCBG && !isLocked;

  const [activeSubView, setActiveSubView] = useState<'excel' | 'form'>('excel');

  const [formData, setFormData] = useState({
    congBepGa: activeDCBGRecord.congBepGa,
    congThoiVu: activeDCBGRecord.congThoiVu,
    congRma: activeDCBGRecord.congRma,
    sanLuongBepGa: activeDCBGRecord.sanLuongBepGa,
    sanLuongRma: activeDCBGRecord.sanLuongRma,
    dinhMucSlTheoNs: activeDCBGRecord.dinhMucSlTheoNs,
    tongNhanSuLine: activeDCBGRecord.tongNhanSuLine,
    nhanSuNghi: activeDCBGRecord.nhanSuNghi,
    chiPhiHangHong: activeDCBGRecord.chiPhiHangHong,
    tiLeLoiThaoTac: activeDCBGRecord.tiLeLoiThaoTac,
    ghiChu: activeDCBGRecord.ghiChu || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync formData when activeDCBGRecord changes
  React.useEffect(() => {
    setFormData({
      congBepGa: activeDCBGRecord.congBepGa,
      congThoiVu: activeDCBGRecord.congThoiVu,
      congRma: activeDCBGRecord.congRma,
      sanLuongBepGa: activeDCBGRecord.sanLuongBepGa,
      sanLuongRma: activeDCBGRecord.sanLuongRma,
      dinhMucSlTheoNs: activeDCBGRecord.dinhMucSlTheoNs,
      tongNhanSuLine: activeDCBGRecord.tongNhanSuLine,
      nhanSuNghi: activeDCBGRecord.nhanSuNghi,
      chiPhiHangHong: activeDCBGRecord.chiPhiHangHong,
      tiLeLoiThaoTac: activeDCBGRecord.tiLeLoiThaoTac,
      ghiChu: activeDCBGRecord.ghiChu || '',
    });
  }, [activeDCBGRecord]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'ghiChu' ? (parseFloat(value) || 0) : value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCanEdit) return;
    updateDCBGRecord(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Preview live computed values
  const previewTongCong = (Number(formData.congBepGa) || 0) + (Number(formData.congThoiVu) || 0) + (Number(formData.congRma) || 0);
  const previewTongSanLuong = (Number(formData.sanLuongBepGa) || 0) + (Number(formData.sanLuongRma) || 0);
  const previewNsld = formData.dinhMucSlTheoNs > 0 ? ((previewTongSanLuong / formData.dinhMucSlTheoNs) * 100).toFixed(2) : '0';
  const previewDiLam = formData.tongNhanSuLine > 0 ? (((formData.tongNhanSuLine - formData.nhanSuNghi) / formData.tongNhanSuLine) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-600/60 rounded-xl">
                <Flame className="w-5 h-5 text-emerald-200" />
              </span>
              <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                Đơn Vị Trực Thuộc PXLR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              DC Bếp Gas (DCBG) - Line Lắp Ráp & RMA
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Cập nhật dữ liệu hàng ngày cho chuyền bếp ga. Dữ liệu sẽ tự động đồng bộ vào Báo cáo tổng hợp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-900/50 backdrop-blur border border-emerald-500/30 rounded-xl px-4 py-2 text-right">
              <div className="text-xs text-emerald-200">Trạng thái quyền hạn</div>
              <div className="text-sm font-semibold flex items-center justify-end gap-1.5 mt-0.5">
                {isLocked ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span className="text-amber-300">Dữ liệu đã khóa (trước 25/09)</span>
                  </>
                ) : effectiveCanEdit ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Có quyền nhập liệu</span>
                  </>
                ) : (
                  <span className="text-emerald-300/80">Chỉ xem ({currentUser.name})</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Excel Matrix & Charts vs Daily Form */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveSubView('excel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubView === 'excel'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>Ma Trận & 6 Đồ Thị So Sánh Excel (Ảnh 2, 3, 4)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Trọng tâm
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('form')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubView === 'form'
              ? 'bg-white text-blue-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-4 h-4 text-blue-600" />
          <span>Nhập Dữ Liệu Ngày & Lịch Sử DCBG</span>
        </button>
      </div>

      {activeSubView === 'excel' ? (
        <DCBGExcelDashboard />
      ) : (
        <>
          {/* Quick Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">TỔNG CÔNG NGÀY</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {previewTongCong} <span className="text-xs font-normal text-slate-500">công</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>Bếp Ga: {formData.congBepGa}</span>
            <span>Thời vụ: {formData.congThoiVu}</span>
            <span>RMA: {formData.congRma}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">TỔNG SẢN LƯỢNG QUY ĐỔI</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {previewTongSanLuong} <span className="text-xs font-normal text-slate-500">sản phẩm</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>Định mức NS: {formData.dinhMucSlTheoNs}</span>
            <span className={Number(previewNsld) >= 100 ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
              Đạt {previewNsld}%
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">TỈ LỆ ĐI LÀM</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {previewDiLam}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>Tổng NS: {formData.tongNhanSuLine}</span>
            <span className={Number(formData.nhanSuNghi) > 3 ? 'text-rose-600 font-medium' : 'text-slate-500'}>
              Nghỉ: {formData.nhanSuNghi} người
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">HÀNG HỎNG & LỖI THAO TÁC</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {(Number(formData.chiPhiHangHong) / 1e6).toFixed(2)} <span className="text-xs font-normal text-slate-500">tr VNĐ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>Lỗi thao tác:</span>
            <span className="font-semibold text-slate-700">{formData.tiLeLoiThaoTac}%</span>
          </div>
        </div>
      </div>

      {/* Main Form: Input Fields matching Image 1 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/75 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Nhập Liệu Chỉ Số DCBG (Ngày {selectedDate})
            </h3>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Đã lưu & Đồng bộ sang PXLR!
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
          {!effectiveCanEdit && (
            <div className={`border rounded-xl p-3 text-xs flex items-center gap-2 ${isLocked ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              {isLocked ? <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />}
              <span>
                {isLocked 
                  ? `Dữ liệu ngày ${selectedDate} đã được KHÓA chốt (trước 25/09/2026). Không thể chỉnh sửa thêm.` 
                  : `Tài khoản hiện tại chỉ có quyền xem. Hãy chuyển sang tài khoản Quản Đốc PXLR hoặc Trưởng Ca DCBG ở góc phải trên để nhập và lưu dữ liệu.`}
              </span>
            </div>
          )}

          {/* Section 1: Công nhân sự (Exact photo fields: CÔNG Bếp GA, CÔNG THỜI VỤ, CÔNG RMA) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              1. Phân Bổ Công Lao Động
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CÔNG Bếp GA <span className="text-slate-400 font-normal">(Chính thức)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  disabled={!effectiveCanEdit}
                  value={formData.congBepGa}
                  onChange={(e) => handleChange('congBepGa', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CÔNG THỜI VỤ
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  disabled={!effectiveCanEdit}
                  value={formData.congThoiVu}
                  onChange={(e) => handleChange('congThoiVu', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CÔNG RMA <span className="text-slate-400 font-normal">(Sửa chữa/bảo hành)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  disabled={!effectiveCanEdit}
                  value={formData.congRma}
                  onChange={(e) => handleChange('congRma', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sản lượng quy đổi & Định mức (Exact photo fields) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              2. Sản Lượng & Định Mức
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SẢN LƯỢNG QUY ĐỔI Bếp Ga
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!effectiveCanEdit}
                  value={formData.sanLuongBepGa}
                  onChange={(e) => handleChange('sanLuongBepGa', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SẢN LƯỢNG QUY ĐỔI RMA
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!effectiveCanEdit}
                  value={formData.sanLuongRma}
                  onChange={(e) => handleChange('sanLuongRma', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ĐỊNH MỨC SL THEO NS
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!effectiveCanEdit}
                  value={formData.dinhMucSlTheoNs}
                  onChange={(e) => handleChange('dinhMucSlTheoNs', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-blue-700 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Điểm danh & Nhân sự (Exact photo fields: Tổng nhân sự Line, Nhân sự nghĩ, TỈ LỆ ĐI LÀM) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              3. Điểm Danh & Kiểm Soát Chất Lượng
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tổng nhân sự Line <span className="text-slate-400 font-normal">(Định biên)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!effectiveCanEdit}
                  value={formData.tongNhanSuLine}
                  onChange={(e) => handleChange('tongNhanSuLine', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhân sự nghỉ <span className="text-slate-400 font-normal">(Vắng mặt)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!effectiveCanEdit}
                  value={formData.nhanSuNghi}
                  onChange={(e) => handleChange('nhanSuNghi', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 focus:bg-white focus:border-emerald-500 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chi Phí Hàng Hỏng (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  disabled={!effectiveCanEdit}
                  value={formData.chiPhiHangHong}
                  onChange={(e) => handleChange('chiPhiHangHong', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 focus:bg-white focus:border-emerald-500 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỉ lệ lỗi thao tác (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  disabled={!effectiveCanEdit}
                  value={formData.tiLeLoiThaoTac}
                  onChange={(e) => handleChange('tiLeLoiThaoTac', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Ghi chú vận hành & tồn đọng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi Chú Giao Ban DCBG (Sự cố line, thiếu linh kiện, đề xuất nhân lực)
            </label>
            <textarea
              rows={2}
              disabled={!effectiveCanEdit}
              value={formData.ghiChu}
              onChange={(e) => handleChange('ghiChu', e.target.value)}
              placeholder="Nhập diễn biến sản xuất, sự cố thiết bị hoặc đề xuất điều phối..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 outline-hidden transition resize-none"
            />
          </div>

          {/* Save Button */}
          {effectiveCanEdit && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="submit"
                id="btn-save-dcbg"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Dữ Liệu & Đồng Bộ Tự Động PXLR</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Lịch Sử Nhập Liệu DC Bếp Gas (DCBG)
          </h3>
          <span className="text-xs text-slate-500">Bấm vào ngày để xem và chỉnh sửa</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 sm:px-4 font-semibold">NGÀY</th>
                <th className="py-2.5 px-3 font-semibold">CÔNG BẾP GA</th>
                <th className="py-2.5 px-3 font-semibold">CÔNG THỜI VỤ</th>
                <th className="py-2.5 px-3 font-semibold">CÔNG RMA</th>
                <th className="py-2.5 px-3 font-semibold">TỔNG CÔNG</th>
                <th className="py-2.5 px-3 font-semibold">SL QUY ĐỔI</th>
                <th className="py-2.5 px-3 font-semibold">ĐỊNH MỨC</th>
                <th className="py-2.5 px-3 font-semibold">NSLĐ NGÀY</th>
                <th className="py-2.5 px-3 font-semibold">TỈ LỆ ĐI LÀM</th>
                <th className="py-2.5 px-3 font-semibold text-right">HÀNG HỎNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dcbgRecords.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedDate(r.date)}
                  className={`hover:bg-slate-50 cursor-pointer transition ${
                    r.date === selectedDate ? 'bg-emerald-50/70 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                    {r.date === selectedDate && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                    {r.date}
                  </td>
                  <td className="py-2.5 px-3">{r.congBepGa}</td>
                  <td className="py-2.5 px-3">{r.congThoiVu}</td>
                  <td className="py-2.5 px-3">{r.congRma}</td>
                  <td className="py-2.5 px-3 font-semibold">{r.tongCong}</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-semibold">{r.tongSanLuongQuyDoi}</td>
                  <td className="py-2.5 px-3 text-slate-600">{r.dinhMucSlTheoNs}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.nsldTheoNgay >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.nsldTheoNgay}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.tiLeDiLam >= 92 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {r.tiLeDiLam}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600 font-medium">
                    {(r.chiPhiHangHong / 1e6).toFixed(2)} tr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

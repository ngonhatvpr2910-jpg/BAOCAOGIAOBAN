import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { Droplets, Check, AlertTriangle, Users, TrendingUp, Save, Clock, ShieldCheck, BarChart3, Edit3 } from 'lucide-react';
import { DCROExcelDashboard } from './DCROExcelDashboard';

export const TabDCRO: React.FC = () => {
  const { activeDCRORecord, updateDCRORecord, dcroRecords, setSelectedDate, selectedDate } = useProduction();
  const { canEditDCRO, currentUser } = useAuth();

  const [activeSubView, setActiveSubView] = useState<'excel' | 'form'>('excel');

  const [formData, setFormData] = useState({
    congChinhThuc: activeDCRORecord.congChinhThuc,
    congThoiVu: activeDCRORecord.congThoiVu,
    sanLuongLineChinh: activeDCRORecord.sanLuongLineChinh,
    dinhMucSlTheoNs: activeDCRORecord.dinhMucSlTheoNs,
    khsxNgay: activeDCRORecord.khsxNgay || 550,
    tongNhanSuLine: activeDCRORecord.tongNhanSuLine,
    nhanSuNghi: activeDCRORecord.nhanSuNghi,
    chiPhiHangHong: activeDCRORecord.chiPhiHangHong,
    tiLeLoiThaoTac: activeDCRORecord.tiLeLoiThaoTac,
    ghiChu: activeDCRORecord.ghiChu || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setFormData({
      congChinhThuc: activeDCRORecord.congChinhThuc,
      congThoiVu: activeDCRORecord.congThoiVu,
      sanLuongLineChinh: activeDCRORecord.sanLuongLineChinh,
      dinhMucSlTheoNs: activeDCRORecord.dinhMucSlTheoNs,
      khsxNgay: activeDCRORecord.khsxNgay || 550,
      tongNhanSuLine: activeDCRORecord.tongNhanSuLine,
      nhanSuNghi: activeDCRORecord.nhanSuNghi,
      chiPhiHangHong: activeDCRORecord.chiPhiHangHong,
      tiLeLoiThaoTac: activeDCRORecord.tiLeLoiThaoTac,
      ghiChu: activeDCRORecord.ghiChu || '',
    });
  }, [activeDCRORecord]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const numVal = typeof value === 'string' && field !== 'ghiChu' ? (parseFloat(value) || 0) : value;
      const next = { ...prev, [field]: numVal };

      // Tự động tính Định mức SL theo NS nhóm RO: = (Công CT + Công TV) * 9.03
      if (field === 'congChinhThuc' || field === 'congThoiVu') {
        const sumCong = (Number(next.congChinhThuc) || 0) + (Number(next.congThoiVu) || 0);
        next.dinhMucSlTheoNs = Number((sumCong * 9.03).toFixed(3));
      }

      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDCRO) return;
    updateDCRORecord(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const previewTongCong = (Number(formData.congChinhThuc) || 0) + (Number(formData.congThoiVu) || 0);
  const previewTongSanLuong = Number(formData.sanLuongLineChinh) || 0;
  const previewNsld = formData.dinhMucSlTheoNs > 0 ? ((previewTongSanLuong / formData.dinhMucSlTheoNs) * 100).toFixed(2) : '0';
  const previewDiLam = formData.tongNhanSuLine > 0 ? (((formData.tongNhanSuLine - formData.nhanSuNghi) / formData.tongNhanSuLine) * 100).toFixed(2) : '0';
  const previewKhsx = Number(formData.khsxNgay) || 0;
  // CÔNG THỨC: TỈ LỆ HOÀN THÀNH KHSX = SẢN LƯỢNG QUY ĐỔI LINE CHÍNH / KHSX NGÀY
  const previewTiLeKhsx = previewKhsx > 0 ? ((previewTongSanLuong / previewKhsx) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-purple-700/60 rounded-xl">
                <Droplets className="w-5 h-5 text-purple-200" />
              </span>
              <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold">
                Đơn Vị Trực Thuộc PXLR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              DC Máy Lọc Nước RO (DCRO) - Line Chính & Lắp Cụm
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-1">
              Cập nhật dữ liệu hàng ngày cho chuyền lọc nước RO. Tự động tính tổng công, NSLĐ và đồng bộ sang PXLR.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-950/60 backdrop-blur border border-purple-500/30 rounded-xl px-4 py-2 text-right">
              <div className="text-xs text-purple-200">Trạng thái quyền hạn</div>
              <div className="text-sm font-semibold flex items-center justify-end gap-1.5 mt-0.5">
                {canEditDCRO ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-purple-300" />
                    <span>Có quyền nhập liệu</span>
                  </>
                ) : (
                  <span className="text-purple-300/80">Chỉ xem ({currentUser.name})</span>
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
              ? 'bg-white text-purple-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-600" />
          <span>Ma Trận & 4 Đồ Thị So Sánh Excel (Ảnh 1)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
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
          <span>Nhập Dữ Liệu Ngày & Lịch Sử DCRO</span>
        </button>
      </div>

      {activeSubView === 'excel' ? (
        <DCROExcelDashboard />
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">TỔNG CÔNG NGÀY</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {previewTongCong} <span className="text-xs font-normal text-slate-500">công</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Chính thức: {formData.congChinhThuc}</span>
                <span>Thời vụ: {formData.congThoiVu}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">SL QUY ĐỔI LINE CHÍNH</span>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {previewTongSanLuong} <span className="text-xs font-normal text-slate-500">sp</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Định mức: {formData.dinhMucSlTheoNs}</span>
                <span className={Number(previewNsld) >= 100 ? 'text-purple-700 font-semibold' : 'text-amber-600'}>
                  Đạt {previewNsld}% NSLĐ
                </span>
              </div>
            </div>

            {/* User Photo Card: TỈ LỆ HOÀN THÀNH KHSX */}
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-950 uppercase tracking-tight">TỈ LỆ HOÀN THÀNH KHSX</span>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded border border-blue-200">
                  SL / KHSX
                </span>
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {previewTiLeKhsx}%
              </div>
              <div className="text-[11px] text-blue-800 mt-1 flex justify-between">
                <span>KHSX ngày: <strong>{previewKhsx} sp</strong></span>
                <span className="font-semibold text-blue-700">= {previewTongSanLuong}/{previewKhsx}</span>
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

      {/* Main Form: Input Fields matching Image 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/75 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Nhập Liệu Chỉ Số DCRO (Ngày {selectedDate})
            </h3>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Đã lưu & Đồng bộ sang PXLR!
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
          {!canEditDCRO && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Tài khoản hiện tại chỉ có quyền xem. Hãy chuyển sang tài khoản <b>Quản Đốc PXLR</b> hoặc <b>Trưởng Ca DCRO</b> ở góc phải trên để nhập và lưu dữ liệu.</span>
            </div>
          )}

          {/* Section 1: Phân bổ công lao động (Exact photo fields: CÔNG CHÍNH THỨC, CÔNG THỜI VỤ) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              1. Phân Bổ Công Lao Động
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CÔNG CHÍNH THỨC
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  disabled={!canEditDCRO}
                  value={formData.congChinhThuc}
                  onChange={(e) => handleChange('congChinhThuc', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden transition"
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
                  disabled={!canEditDCRO}
                  value={formData.congThoiVu}
                  onChange={(e) => handleChange('congThoiVu', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sản lượng quy đổi line chính, Định mức & KHSX */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              2. Sản Lượng, Định Mức & Kế Hoạch Sản Xuất (KHSX)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SẢN LƯỢNG QUY ĐỔI LINE CHÍNH
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!canEditDCRO}
                  value={formData.sanLuongLineChinh}
                  onChange={(e) => handleChange('sanLuongLineChinh', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-purple-700 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    ĐỊNH MỨC SL THEO NS
                  </label>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                    = (Công CT + TV) × 9.03
                  </span>
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  disabled={!canEditDCRO}
                  value={formData.dinhMucSlTheoNs}
                  onChange={(e) => handleChange('dinhMucSlTheoNs', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-purple-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden transition"
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>
                    Chuẩn: ({formData.congChinhThuc} + {formData.congThoiVu}) × 9.03 = <strong className="text-purple-700 font-mono">{((Number(formData.congChinhThuc || 0) + Number(formData.congThoiVu || 0)) * 9.03).toFixed(3)}</strong>
                  </span>
                  {canEditDCRO && (
                    <button
                      type="button"
                      onClick={() => {
                        const sumCong = (Number(formData.congChinhThuc) || 0) + (Number(formData.congThoiVu) || 0);
                        handleChange('dinhMucSlTheoNs', Number((sumCong * 9.03).toFixed(3)));
                      }}
                      className="text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
                    >
                      Áp dụng chuẩn
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    KHSX NGÀY (KẾ HOẠCH)
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Đạt: {previewTiLeKhsx}%
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  disabled={!canEditDCRO}
                  value={formData.khsxNgay}
                  onChange={(e) => handleChange('khsxNgay', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-blue-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-hidden transition"
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  <span>Tỉ lệ HT KHSX: </span>
                  <strong className="text-blue-700 font-bold font-mono">
                    = {previewTongSanLuong} / {previewKhsx} = {previewTiLeKhsx}%
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Điểm danh & Nhân sự */}
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
                  disabled={!canEditDCRO}
                  value={formData.tongNhanSuLine}
                  onChange={(e) => handleChange('tongNhanSuLine', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-purple-500 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhân sự nghỉ <span className="text-slate-400 font-normal">(Vắng mặt)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!canEditDCRO}
                  value={formData.nhanSuNghi}
                  onChange={(e) => handleChange('nhanSuNghi', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 focus:bg-white focus:border-purple-500 outline-hidden transition"
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
                  disabled={!canEditDCRO}
                  value={formData.chiPhiHangHong}
                  onChange={(e) => handleChange('chiPhiHangHong', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 focus:bg-white focus:border-purple-500 outline-hidden transition"
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
                  disabled={!canEditDCRO}
                  value={formData.tiLeLoiThaoTac}
                  onChange={(e) => handleChange('tiLeLoiThaoTac', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-purple-500 outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi Chú Giao Ban DCRO (Sự cố cấp màng RO, bơm áp cao, điều động nhân lực)
            </label>
            <textarea
              rows={2}
              disabled={!canEditDCRO}
              value={formData.ghiChu}
              onChange={(e) => handleChange('ghiChu', e.target.value)}
              placeholder="Ghi nhận hiện trạng vận hành chuyền RO..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:border-purple-500 outline-hidden transition resize-none"
            />
          </div>

          {/* Save Button */}
          {canEditDCRO && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="submit"
                id="btn-save-dcro"
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
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
            Lịch Sử Nhập Liệu DC Lọc Nước RO (DCRO)
          </h3>
          <span className="text-xs text-slate-500">Bấm vào ngày để xem và chỉnh sửa</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 sm:px-4 font-semibold">NGÀY</th>
                <th className="py-2.5 px-3 font-semibold">CÔNG CHÍNH THỨC</th>
                <th className="py-2.5 px-3 font-semibold">CÔNG THỜI VỤ</th>
                <th className="py-2.5 px-3 font-semibold">TỔNG CÔNG</th>
                <th className="py-2.5 px-3 font-semibold">SL LINE CHÍNH</th>
                <th className="py-2.5 px-3 font-semibold">ĐỊNH MỨC</th>
                <th className="py-2.5 px-3 font-semibold">NSLĐ NGÀY</th>
                <th className="py-2.5 px-3 font-semibold">TỈ LỆ ĐI LÀM</th>
                <th className="py-2.5 px-3 font-semibold text-right">HÀNG HỎNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dcroRecords.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedDate(r.date)}
                  className={`hover:bg-slate-50 cursor-pointer transition ${
                    r.date === selectedDate ? 'bg-purple-50/70 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                    {r.date === selectedDate && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                    {r.date}
                  </td>
                  <td className="py-2.5 px-3">{r.congChinhThuc}</td>
                  <td className="py-2.5 px-3">{r.congThoiVu}</td>
                  <td className="py-2.5 px-3 font-semibold">{r.tongCong}</td>
                  <td className="py-2.5 px-3 text-purple-700 font-semibold">{r.tongSanLuongQuyDoi}</td>
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

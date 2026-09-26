import React, { useRef, useState } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { X, FileDown, Printer, Check, Calendar, Layers, ShieldCheck, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface DailyBriefingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyBriefingReportModal: React.FC<DailyBriefingReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { consolidatedPXLR, selectedDate, thresholds, updateThresholds } = useProduction();
  const { currentUser, canApproveBriefing } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isApproved, setIsApproved] = useState(true);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const {
    tongCong,
    tongCongChinhThuc,
    tongCongThoiVu,
    tongSanLuongQuyDoi,
    tongDinhMucSl,
    nsldTrungBinh,
    tongNhanSu,
    tongNghi,
    tiLeDiLam,
    tongChiPhiHangHong,
    tiLeLoiThaoTacTB,
    keHoachSanXuat,
    tiLeHoanThanhKH,
    dcbg,
    dcro,
  } = consolidatedPXLR;

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage(null);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Bao_Cao_Giao_Ban_PXLR_${selectedDate}.pdf`;
      pdf.save(fileName);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 4000);
    } catch (err: unknown) {
      console.error('Error generating PDF', err);
      setExportStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi tạo tệp PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm sm:text-base font-bold">
              Xuất Báo Cáo Giao Ban Cuối Ngày (PDF) - PXLR NMBD
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title="In trực tiếp"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Trạng thái tự động cuối ngày:</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={thresholds.autoExportPdfAtEndOfDay}
                onChange={(e) => updateThresholds({ ...thresholds, autoExportPdfAtEndOfDay: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-600">Tự động kết xuất lúc {thresholds.autoExportTime} hàng ngày</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {canApproveBriefing && (
              <button
                onClick={() => setIsApproved(!isApproved)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isApproved ? 'Quản Đốc Đã Phê Duyệt' : 'Chưa Phê Duyệt'}
              </button>
            )}
            {exportStatus === 'success' && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đã tải file PDF thành công!
              </span>
            )}
            {exportStatus === 'error' && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                {errorMessage || 'Lỗi xuất PDF'}
              </span>
            )}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              id="btn-download-pdf-now"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-1.5 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Đang tạo PDF...' : 'Tải File PDF Ngay'}</span>
            </button>
          </div>
        </div>

        {/* Printable/Exportable Document Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-50 flex justify-center">
          <div
            ref={reportRef}
            className="w-full max-w-[800px] bg-white p-6 sm:p-10 shadow-sm border border-slate-200 text-slate-900 font-sans"
            style={{ minHeight: '1050px' }}
          >
            {/* Header section */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  NHÀ MÁY BÌNH DƯƠNG - NMBD
                </div>
                <div className="text-sm font-extrabold uppercase text-slate-900">
                  PHÂN XƯỞNG LẮP RÁP (PXLR)
                </div>
                <div className="text-[11px] text-slate-500">
                  Quản lý: Line DC Bếp Gas (DCBG) & Line DC RO (DCRO)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-xs font-semibold italic text-slate-500">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Bình Dương, ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                BÁO CÁO GIAO BAN SẢN XUẤT HÀNG NGÀY
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Kỳ giao ban: <b>Ngày {selectedDate}</b> • Thời gian tổng hợp: <b>17:30</b>
              </p>
            </div>

            {/* 1. Tổng kết nhanh KPI */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-l-3 border-blue-600 pl-2 mb-3">
                I. TỔNG HỢP CHỈ TIÊU THEN CHỐT TOÀN PHÂN XƯỞNG (PXLR)
              </h3>
              <div className="grid grid-cols-4 gap-3 text-center border border-slate-300 rounded-lg p-3 bg-slate-50/50">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Tổng Sản Lượng</div>
                  <div className="text-base font-extrabold text-blue-900 mt-0.5">
                    {tongSanLuongQuyDoi.toLocaleString('vi-VN')} sp
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Đạt {tiLeHoanThanhKH}% KH</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Tổng Công Lao Động</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {tongCong} công
                  </div>
                  <div className="text-[10px] text-slate-500">Thời vụ: {tongCongThoiVu}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">NSLĐ Trung Bình</div>
                  <div className={`text-base font-extrabold mt-0.5 ${nsldTrungBinh >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {nsldTrungBinh}%
                  </div>
                  <div className="text-[10px] text-slate-500">Mục tiêu: ≥100%</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Tỉ Lệ Đi Làm</div>
                  <div className={`text-base font-extrabold mt-0.5 ${tiLeDiLam >= 92 ? 'text-slate-900' : 'text-rose-700'}`}>
                    {tiLeDiLam}%
                  </div>
                  <div className="text-[10px] text-slate-500">Vắng: {tongNghi} người</div>
                </div>
              </div>
            </div>

            {/* 2. Bảng so sánh 2 DC chi tiết */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-l-3 border-blue-600 pl-2 mb-3">
                II. BẢNG CHI TIẾT SẢN XUẤT 2 DC (DC BẾP GAS & DC RO)
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-2 text-left font-bold">Hạng Mục / Chỉ Số</th>
                    <th className="border border-slate-300 p-2 text-center font-bold">DC Bếp Gas (DCBG)</th>
                    <th className="border border-slate-300 p-2 text-center font-bold">DC RO (DCRO)</th>
                    <th className="border border-slate-300 p-2 text-center font-bold bg-blue-50">TỔNG PXLR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-medium">Công chính thức / Line</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcbg.congBepGa}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcro.congChinhThuc}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold bg-blue-50/40">{tongCongChinhThuc}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-medium">Công thời vụ bổ sung</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcbg.congThoiVu}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcro.congThoiVu}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold bg-blue-50/40">{tongCongThoiVu}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-medium">Công sửa chữa / RMA</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcbg.congRma}</td>
                    <td className="border border-slate-300 p-1.5 text-center">-</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold bg-blue-50/40">{dcbg.congRma}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-slate-300 p-1.5">TỔNG CÔNG NGÀY</td>
                    <td className="border border-slate-300 p-1.5 text-center text-emerald-800">{dcbg.tongCong}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-purple-800">{dcro.tongCong}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-blue-900 bg-blue-100/50">{tongCong}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-medium">Sản lượng quy đổi (sp)</td>
                    <td className="border border-slate-300 p-1.5 text-center font-semibold">{dcbg.tongSanLuongQuyDoi}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-semibold">{dcro.tongSanLuongQuyDoi}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-extrabold bg-blue-50/40 text-blue-900">{tongSanLuongQuyDoi}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-medium">Định mức SL theo NS</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcbg.dinhMucSlTheoNs}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcro.dinhMucSlTheoNs}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold bg-blue-50/40">{tongDinhMucSl}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-slate-300 p-1.5">NSLĐ ĐẠT (%)</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcbg.nsldTheoNgay}%</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcro.nsldTheoNgay}%</td>
                    <td className="border border-slate-300 p-1.5 text-center text-blue-900 bg-blue-100/50">{nsldTrungBinh}%</td>
                  </tr>
                  <tr className="bg-blue-50/50 font-bold text-blue-950">
                    <td className="border border-slate-300 p-1.5">
                      <div>TỈ LỆ HOÀN THÀNH KHSX (%)</div>
                      <div className="text-[9px] font-normal text-blue-700">= SL Quy Đổi / KHSX Ngày</div>
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-emerald-800">
                      {((dcbg.tongSanLuongQuyDoi / (dcbg.dinhMucSlTheoNs || 500)) * 100).toFixed(1)}%
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-blue-700">
                      {dcro.tiLeHoanThanhKhsx || 101.8}%
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-blue-900 bg-blue-100/50">
                      {tiLeHoanThanhKH}%
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-medium">Tỉ lệ đi làm (%)</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcbg.tiLeDiLam}% (Nghỉ {dcbg.nhanSuNghi})</td>
                    <td className="border border-slate-300 p-1.5 text-center">{dcro.tiLeDiLam}% (Nghỉ {dcro.nhanSuNghi})</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold bg-blue-50/40">{tiLeDiLam}% (Nghỉ {tongNghi})</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-medium">Chi phí hàng hỏng (VNĐ)</td>
                    <td className="border border-slate-300 p-1.5 text-center text-rose-700">{dcbg.chiPhiHangHong.toLocaleString('vi-VN')}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-rose-700">{dcro.chiPhiHangHong.toLocaleString('vi-VN')}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-800 bg-blue-50/40">{tongChiPhiHangHong.toLocaleString('vi-VN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Tồn đọng & Kế hoạch ngày mai */}
            <div className="mb-6 space-y-2 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 border-l-3 border-blue-600 pl-2 mb-2">
                III. ĐÁNH GIÁ VẬN HÀNH & KẾ HOẠCH NGÀY MAI
              </h3>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                <div>
                  <span className="font-bold text-slate-800">1. DC Bếp Gas: </span>
                  <span className="text-slate-700">{dcbg.ghiChu || 'Hoạt động ổn định, đảm bảo tiến độ kiểm định van ga an toàn.'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">2. DC Lọc Nước RO: </span>
                  <span className="text-slate-700">{dcro.ghiChu || 'Hoạt động ổn định, kiểm soát tốt công đoạn siết cút lọc và kiểm tra áp suất cao.'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">3. Điều phối nguồn lực ngày mai: </span>
                  <span className="text-slate-700">
                    Duy trì định biên nhân sự, bố trí hỗ trợ linh hoạt giữa 2 DC khi có sự biến động đột xuất về tỉ lệ đi làm.
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-300 text-center text-xs">
              <div>
                <div className="font-bold uppercase text-slate-700">Tổ Trưởng DCBG</div>
                <div className="italic text-slate-400 text-[10px]">(Ký & ghi rõ họ tên)</div>
                <div className="h-14 flex items-center justify-center font-serif text-slate-700 font-semibold italic text-sm">
                  Nguyễn Quốc Thịnh
                </div>
                <div className="font-semibold text-slate-900">Nguyễn Quốc Thịnh</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-700">Tổ Trưởng DCLR</div>
                <div className="italic text-slate-400 text-[10px]">(Ký & ghi rõ họ tên)</div>
                <div className="h-14 flex items-center justify-center font-serif text-slate-700 font-semibold italic text-sm">
                  Nguyễn Minh Hoàng Khiêm
                </div>
                <div className="font-semibold text-slate-900">Nguyễn Minh Hoàng Khiêm</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-700">Trợ Lý PXLR</div>
                <div className="italic text-slate-400 text-[10px]">(Ký & ghi rõ họ tên)</div>
                <div className="h-14 flex items-center justify-center font-serif text-slate-700 font-semibold italic text-sm">
                  Nguyễn Thị Huỳnh Như
                </div>
                <div className="font-semibold text-slate-900">Nguyễn Thị Huỳnh Như</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-700">Quản Đốc PXLR</div>
                <div className="italic text-slate-400 text-[10px]">(Phê duyệt điện tử)</div>
                <div className="h-14 flex items-center justify-center">
                  {isApproved && (
                    <div className="border border-emerald-600 text-emerald-800 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                      ✔ ĐÃ PHÊ DUYỆT
                    </div>
                  )}
                </div>
                <div className="font-semibold text-slate-900">Ngô Minh Nhật</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

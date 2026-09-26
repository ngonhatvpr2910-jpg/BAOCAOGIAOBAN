import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Award, 
  AlertCircle, 
  Flame, 
  Droplets, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2, 
  Layers,
  FileDown,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { ExcelComparisonCharts } from './ExcelComparisonCharts';

interface TabOverviewProps {
  onOpenReportModal: () => void;
  onNavigateToForecast: () => void;
}

export const TabOverviewPXLR: React.FC<TabOverviewProps> = ({
  onOpenReportModal,
  onNavigateToForecast,
}) => {
  const { consolidatedPXLR, monthlyHistory, weeklyHistory, selectedDate } = useProduction();
  const [chartViewMode, setChartViewMode] = useState<'output' | 'labor' | 'attendance' | 'defect'>('output');

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

  return (
    <div className="space-y-6">
      {/* Synchronization Status Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-blue-600/60 text-blue-200 text-xs font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> DCLR NMBD
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tự động tổng hợp đồng bộ từ 2 DC (DCBG & DCRO)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Báo cáo tổng hợp ngày {selectedDate}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Hệ thống trung tâm giám sát năng suất, điều phối nguồn lực nhân sự và phân tích chuỗi cung ứng sản xuất giữa line Bếp Gas (DCBG) và line Máy Lọc Nước (DCRO).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onNavigateToForecast}
              className="flex items-center gap-1.5 bg-indigo-700/60 hover:bg-indigo-700 active:bg-indigo-800 text-white border border-indigo-400/30 text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Dự Báo & Điều Phối Nguồn Lực</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Xuất PDF Cuối Ngày</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. EXECUTIVE SUMMARY CARD (Extracted benchmarks & targets from W37) */}
      <ExecutiveSummaryCard />

      {/* 4 Key KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Output */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>TỔNG SẢN LƯỢNG QUY ĐỔI</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {tongSanLuongQuyDoi.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-500 font-medium">sản phẩm</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">KHSX: {keHoachSanXuat.toLocaleString('vi-VN')}</span>
            <span className={`font-semibold flex items-center ${tiLeHoanThanhKH >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {tiLeHoanThanhKH >= 100 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              Đạt {tiLeHoanThanhKH.toFixed(1)}% KHSX
            </span>
          </div>
        </div>

        {/* Card 2: Total Labor */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>TỔNG CÔNG SẢN XUẤT</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {tongCong}
            </span>
            <span className="text-xs text-slate-500 font-medium">công nhân sự</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Chính thức: <b>{tongCongChinhThuc}</b></span>
            <span>Thời vụ: <b>{tongCongThoiVu}</b></span>
          </div>
        </div>

        {/* Card 3: Productivity NSLD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>NSLĐ BÌNH QUÂN PXLR</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              nsldTrungBinh >= 100 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {nsldTrungBinh.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 font-medium">(Mục tiêu: ≥100%)</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Định mức: {tongDinhMucSl}</span>
            <span className="text-emerald-700 font-medium">
              Lũy kế năm: 110.2%
            </span>
          </div>
        </div>

        {/* Card 4: Attendance & Quality */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>TỈ LỆ ĐI LÀM & CHẤT LƯỢNG</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              tiLeDiLam >= 92 ? 'text-slate-900' : 'text-rose-600'
            }`}>
              {tiLeDiLam.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (Vắng {tongNghi}/{tongNhanSu})
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-medium">Hàng hỏng: {(tongChiPhiHangHong / 1e6).toFixed(1)} tr</span>
            <span className="text-slate-600">Lỗi: {tiLeLoiThaoTacTB}%</span>
          </div>
        </div>
      </div>

      {/* Synchronized Comparison Table: DCBG vs DCRO vs Consolidated PXLR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Bảng Tổng Hợp So Sánh Đối Chiếu 2 DC & PXLR Toàn Xưởng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu được liên kết và cập nhật tức thời từ tab DCBG và DCRO
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            Đồng bộ 100%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider text-slate-500">Chỉ Số Giao Ban</th>
                <th className="py-3 px-4 font-bold text-emerald-800 bg-emerald-50/40">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-emerald-600" />
                    <span>DC BẾP GAS (DCBG)</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold text-purple-800 bg-purple-50/40">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-purple-600" />
                    <span>DC MÁY LỌC RO (DCRO)</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold text-blue-900 bg-blue-50/60">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>TỔNG PXLR (NMBD)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Row 1: Công chính thức */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">CÔNG CHÍNH THỨC / BẾP GA</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">{dcbg.congBepGa} công</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">{dcro.congChinhThuc} công</td>
                <td className="py-2.5 px-4 font-bold text-blue-900 bg-blue-50/30">{tongCongChinhThuc} công</td>
              </tr>
              {/* Row 2: Công thời vụ */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">CÔNG THỜI VỤ</td>
                <td className="py-2.5 px-4 text-slate-700">{dcbg.congThoiVu} công</td>
                <td className="py-2.5 px-4 text-slate-700">{dcro.congThoiVu} công</td>
                <td className="py-2.5 px-4 font-bold text-blue-900 bg-blue-50/30">{tongCongThoiVu} công</td>
              </tr>
              {/* Row 3: Công RMA */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">CÔNG RMA</td>
                <td className="py-2.5 px-4 text-slate-700">{dcbg.congRma} công</td>
                <td className="py-2.5 px-4 text-slate-400">-</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/30">{dcbg.congRma} công</td>
              </tr>
              {/* Row 4: TỔNG CÔNG */}
              <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                <td className="py-2.5 px-4 font-bold text-slate-900">TỔNG CÔNG LAO ĐỘNG</td>
                <td className="py-2.5 px-4 font-bold text-emerald-700">{dcbg.tongCong} công</td>
                <td className="py-2.5 px-4 font-bold text-purple-700">{dcro.tongCong} công</td>
                <td className="py-2.5 px-4 font-black text-blue-900 bg-blue-100/50 text-sm">{tongCong} công</td>
              </tr>
              {/* Row 5: SẢN LƯỢNG QUY ĐỔI */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">SẢN LƯỢNG QUY ĐỔI NGÀY</td>
                <td className="py-2.5 px-4 font-bold text-emerald-600">{dcbg.tongSanLuongQuyDoi} sp</td>
                <td className="py-2.5 px-4 font-bold text-purple-600">{dcro.tongSanLuongQuyDoi} sp</td>
                <td className="py-2.5 px-4 font-black text-blue-900 bg-blue-50/30 text-sm">
                  {tongSanLuongQuyDoi.toLocaleString('vi-VN')} sp
                </td>
              </tr>
              {/* Row 6: ĐỊNH MỨC SL */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">ĐỊNH MỨC SL THEO NS</td>
                <td className="py-2.5 px-4 text-slate-700">{dcbg.dinhMucSlTheoNs} sp</td>
                <td className="py-2.5 px-4 text-slate-700">
                  <div className="font-medium">{dcro.dinhMucSlTheoNs} sp</div>
                  <div className="text-[10px] text-purple-700 font-semibold font-mono tracking-tight">=(Công CT+TV)×9.03</div>
                </td>
                <td className="py-2.5 px-4 font-bold text-slate-900 bg-blue-50/30">{tongDinhMucSl} sp</td>
              </tr>
              {/* Row 7: NSLĐ THEO NGÀY */}
              <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                <td className="py-2.5 px-4 font-bold text-slate-900">NSLĐ THEO NGÀY (%)</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    dcbg.nsldTheoNgay >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {dcbg.nsldTheoNgay.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    dcro.nsldTheoNgay >= 100 ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {dcro.nsldTheoNgay.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-4 bg-blue-100/50">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    nsldTrungBinh >= 100 ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {nsldTrungBinh.toFixed(1)}%
                  </span>
                </td>
              </tr>
              {/* Row 7.1: TỈ LỆ HOÀN THÀNH KHSX */}
              <tr className="bg-blue-50/40 hover:bg-blue-50/70 transition border-y border-blue-200/50">
                <td className="py-2.5 px-4 font-bold text-blue-950">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-blue-950">TỈ LỆ HOÀN THÀNH KHSX</span>
                    <span className="text-[10px] text-blue-700 font-mono font-semibold">= SL Quy Đổi / KHSX Ngày</span>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="font-bold text-emerald-700">{((dcbg.tongSanLuongQuyDoi / (dcbg.dinhMucSlTheoNs || 500)) * 100).toFixed(1)}%</div>
                  <div className="text-[10px] text-slate-500 font-mono">KHSX: {dcbg.dinhMucSlTheoNs || 500} sp</div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="font-black text-blue-700">{(dcro.tiLeHoanThanhKhsx || 101.8).toFixed(1)}%</div>
                  <div className="text-[10px] text-purple-800 font-semibold font-mono tracking-tight">=SL Line Chính/KHSX ({dcro.khsxNgay || 550} sp)</div>
                </td>
                <td className="py-2.5 px-4 bg-blue-100/70">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    tiLeHoanThanhKH >= 100 ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {tiLeHoanThanhKH.toFixed(1)}%
                  </span>
                </td>
              </tr>
              {/* Row 8: TỈ LỆ ĐI LÀM */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">TỈ LỆ ĐI LÀM (%)</td>
                <td className="py-2.5 px-4 font-semibold text-slate-800">
                  {dcbg.tiLeDiLam.toFixed(1)}% <span className="text-xs text-slate-500 font-normal">({dcbg.tongNhanSuLine - dcbg.nhanSuNghi}/{dcbg.tongNhanSuLine})</span>
                </td>
                <td className="py-2.5 px-4 font-semibold text-slate-800">
                  {dcro.tiLeDiLam.toFixed(1)}% <span className="text-xs text-slate-500 font-normal">({dcro.tongNhanSuLine - dcro.nhanSuNghi}/{dcro.tongNhanSuLine})</span>
                </td>
                <td className="py-2.5 px-4 font-bold text-blue-900 bg-blue-50/30">
                  {tiLeDiLam.toFixed(1)}% <span className="text-xs text-slate-500 font-normal">({tongNhanSu - tongNghi}/{tongNhanSu})</span>
                </td>
              </tr>
              {/* Row 9: HÀNG HỎNG */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">BÁO CÁO HÀNG HỎNG (VNĐ)</td>
                <td className="py-2.5 px-4 text-rose-600 font-semibold">{dcbg.chiPhiHangHong.toLocaleString('vi-VN')} đ</td>
                <td className="py-2.5 px-4 text-rose-600 font-semibold">{dcro.chiPhiHangHong.toLocaleString('vi-VN')} đ</td>
                <td className="py-2.5 px-4 font-bold text-rose-700 bg-blue-50/30">{tongChiPhiHangHong.toLocaleString('vi-VN')} đ</td>
              </tr>
              {/* Row 10: TỈ LỆ LỖI THAO TÁC */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">TỈ LỆ LỖI THAO TÁC (%)</td>
                <td className="py-2.5 px-4 text-slate-800 font-semibold">{dcbg.tiLeLoiThaoTac.toFixed(1)}%</td>
                <td className="py-2.5 px-4 text-slate-800 font-semibold">{dcro.tiLeLoiThaoTac.toFixed(1)}%</td>
                <td className="py-2.5 px-4 font-bold text-slate-900 bg-blue-50/30">{tiLeLoiThaoTacTB.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 EXCEL COMPARISON CHARTS (Dynamic 2025 vs 2026 Comparison with Real-Time Data Updating) */}
      <ExcelComparisonCharts />

      {/* Visual Charts: Past & Trends (Matching User Excel Photo 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Phân Tích Xu Hướng Quá Khứ & Chu Kỳ Sản Xuất (2025 vs 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu tổng công, sản phẩm quy đổi và chất lượng theo dữ liệu PXLR NMBD
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setChartViewMode('output')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                chartViewMode === 'output' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sản Phẩm Quy Đổi
            </button>
            <button
              onClick={() => setChartViewMode('labor')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                chartViewMode === 'labor' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng Công Sản Xuất
            </button>
            <button
              onClick={() => setChartViewMode('attendance')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                chartViewMode === 'attendance' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tỉ Lệ Đi Làm Tuần
            </button>
            <button
              onClick={() => setChartViewMode('defect')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                chartViewMode === 'defect' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hàng Hỏng & Lỗi
            </button>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div className="h-[320px] sm:h-[380px] w-full pt-2">
          {chartViewMode === 'output' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} sp`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Bar dataKey="sanLuong2025" name="Năm 2025 (Thực tế)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sanLuong2026" name="Năm 2026 (Tăng trưởng)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartViewMode === 'labor' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} công`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Line type="monotone" dataKey="cong2025" name="Tổng Công 2025" stroke="#64748b" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cong2026" name="Tổng Công 2026" stroke="#9333ea" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartViewMode === 'attendance' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Tỉ lệ đi làm']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Area type="monotone" dataKey="tiLeDiLam" name="Tỉ Lệ Đi Làm Tuần (%)" stroke="#059669" fill="#10b981" fillOpacity={0.15} strokeWidth={3} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartViewMode === 'defect' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} VNĐ`, 'Hàng Hỏng']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Bar dataKey="hangHong" name="Chi Phí Hàng Hỏng Tuần (VNĐ)" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

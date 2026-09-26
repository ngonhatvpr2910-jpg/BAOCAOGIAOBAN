import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { 
  TrendingUp, 
  ArrowRightLeft, 
  Users, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Calendar,
  Flame,
  Droplets,
  Zap,
  Target
} from 'lucide-react';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export const TabForecastSimulator: React.FC = () => {
  const { consolidatedPXLR, simulateResourceTransfer, monthlyHistory } = useProduction();

  // Simulator controls
  const [transferDirection, setTransferDirection] = useState<'DCRO_TO_DCBG' | 'DCBG_TO_DCRO'>('DCRO_TO_DCBG');
  const [workerCount, setWorkerCount] = useState<number>(3);
  const [overtimeHours, setOvertimeHours] = useState<number>(1.5);
  const [workingDaysLeft, setWorkingDaysLeft] = useState<number>(12);

  const fromDC = transferDirection === 'DCRO_TO_DCBG' ? 'DCRO' : 'DCBG';
  const toDC = transferDirection === 'DCRO_TO_DCBG' ? 'DCBG' : 'DCRO';

  const simulationResult = simulateResourceTransfer(fromDC, toDC, workerCount);

  // Month-end run-rate forecast
  const currentDailyOutput = consolidatedPXLR.tongSanLuongQuyDoi;
  const currentDailyLabor = consolidatedPXLR.tongCong;
  const targetMonthlyOutput = 24000; // Target for month
  const actualAccumulatedMonth = 12450; // In-progress month to date
  const projectedMonthEnd = actualAccumulatedMonth + (currentDailyOutput * workingDaysLeft);
  const targetGap = projectedMonthEnd - targetMonthlyOutput;

  // Forecast chart data: 6 historical months + 6 projected future months
  const forecastChartData = [
    { period: 'T1 (Thực)', actual: 14577, forecast: 14577, plan: 13500 },
    { period: 'T2 (Thực)', actual: 11151, forecast: 11151, plan: 12000 },
    { period: 'T3 (Thực)', actual: 23503, forecast: 23503, plan: 20000 },
    { period: 'T4 (Thực)', actual: 20601, forecast: 20601, plan: 19500 },
    { period: 'T5 (Thực)', actual: 24456, forecast: 24456, plan: 22000 },
    { period: 'T6 (Thực)', actual: 21891, forecast: 21891, plan: 20167 },
    { period: 'T7 (Dự báo)', actual: null, forecast: 22400, plan: 21000 },
    { period: 'T8 (Dự báo)', actual: null, forecast: 22850, plan: 21500 },
    { period: 'T9 (Dự báo)', actual: null, forecast: 23100, plan: 22000 },
    { period: 'T10 (Dự báo)', actual: null, forecast: 23500, plan: 22500 },
    { period: 'T11 (Dự báo)', actual: null, forecast: 24000, plan: 23000 },
    { period: 'T12 (Dự báo)', actual: null, forecast: 25200, plan: 24000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-2 bg-amber-500/40 rounded-xl">
            <Compass className="w-5 h-5 text-amber-200" />
          </span>
          <span className="text-xs uppercase tracking-wider text-amber-200 font-semibold">
            Tối Ưu Hóa Kế Hoạch Vận Hành
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Phân Tích Quá Khứ, Dự Báo Tương Lai & Điều Phối Nguồn Lực
        </h2>
        <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-3xl">
          Công cụ hỗ trợ Quản đốc và Kế hoạch mô phỏng tình huống (What-If), điều chuyển nhân sự giữa DC Bếp Gas và DC Máy Lọc Nước để kịp thời xử lý biến động và đạt kế hoạch giao hàng.
        </p>
      </div>

      {/* Simulator Card: What-If Resource Allocation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              Bộ Công Cụ Mô Phỏng Điều Phối Nguồn Lực (What-If Labor Simulator)
            </h3>
          </div>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Mô phỏng tức thời
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Direction */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chiều Điều Chuyển Nguồn Lực
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransferDirection('DCRO_TO_DCBG')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    transferDirection === 'DCRO_TO_DCBG'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Droplets className="w-4 h-4 text-purple-600" />
                    <span>➔</span>
                    <Flame className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>DCRO sang DCBG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferDirection('DCBG_TO_DCRO')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    transferDirection === 'DCBG_TO_DCRO'
                      ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    <span>➔</span>
                    <Droplets className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>DCBG sang DCRO</span>
                </button>
              </div>
            </div>

            {/* Worker Count Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Số Nhân Sự Điều Động: <span className="text-blue-700 text-sm font-extrabold">{workerCount} người</span>
                </label>
                <span className="text-xs text-slate-400">1 - 15 công</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={workerCount}
                onChange={(e) => setWorkerCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>1 người</span>
                <span>5 người</span>
                <span>10 người</span>
                <span>15 người</span>
              </div>
            </div>

            {/* Overtime or Contingency Days */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Số Ngày Sản Xuất Còn Lại Của Tháng
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={workingDaysLeft}
                  onChange={(e) => setWorkingDaysLeft(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-hidden"
                />
                <span className="text-xs text-slate-500 font-medium shrink-0">ngày làm việc</span>
              </div>
            </div>
          </div>

          {/* Simulation Outcome Display */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Kết Quả Dự Báo Sau Khi Điều Phối
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Box 1: DCBG */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-600" />
                  Sản Lượng Dự Phóng DCBG
                </div>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {simulationResult.projectedDCBGOutput}{' '}
                  <span className="text-xs font-normal text-slate-500">sp</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Hiện tại: {consolidatedPXLR.dcbg.tongSanLuongQuyDoi} sp
                </div>
              </div>

              {/* Box 2: DCRO */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-purple-600" />
                  Sản Lượng Dự Phóng DCRO
                </div>
                <div className="text-xl font-bold text-purple-700 mt-1">
                  {simulationResult.projectedDCROOutput}{' '}
                  <span className="text-xs font-normal text-slate-500">sp</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Hiện tại: {consolidatedPXLR.dcro.tongSanLuongQuyDoi} sp
                </div>
              </div>

              {/* Box 3: Total Output */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20">
                <div className="text-xs text-blue-900 font-bold">
                  TỔNG SẢN LƯỢNG PXLR MỚI
                </div>
                <div className="text-xl font-black text-blue-900 mt-1">
                  {simulationResult.projectedTotalOutput}{' '}
                  <span className="text-xs font-normal text-slate-600">sp</span>
                </div>
                <div className={`text-[11px] font-semibold mt-0.5 ${simulationResult.projectedDelta >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Chênh lệch: {simulationResult.projectedDelta >= 0 ? `+${simulationResult.projectedDelta}` : simulationResult.projectedDelta} sp/ngày
                </div>
              </div>
            </div>

            {/* Smart Recommendation Banner */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đánh giá khuyến nghị vận hành: </span>
                <span>{simulationResult.recommendation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month-End Run-Rate Forecast & Gap Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Dự Phóng Về Đích Tháng Này</span>
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {projectedMonthEnd.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">sp</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dựa trên nhịp độ {currentDailyOutput} sp/ngày trong {workingDaysLeft} ngày còn lại.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Kế hoạch tháng: <b>{targetMonthlyOutput.toLocaleString('vi-VN')} sp</b></span>
            <span className={`font-bold ${targetGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {targetGap >= 0 ? `Vượt +${targetGap.toLocaleString('vi-VN')} sp` : `Thiếu hụt ${Math.abs(targetGap).toLocaleString('vi-VN')} sp`}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Kế Hoạch Bổ Sung Nguồn Lực</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-2">
              {targetGap < 0 ? Math.ceil(Math.abs(targetGap) / (9.3 * workingDaysLeft)) : 0}{' '}
              <span className="text-xs font-normal text-slate-500">công thời vụ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Số nhân sự thời vụ cần tuyển thêm hoặc tăng ca để bù đắp chỉ tiêu nếu thiếu hụt.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-600">
            Năng suất bình quân: <b>~9.3 sp / công lao động</b>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Chỉ Tiêu NSLĐ Lũy Kế 2026</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
              110.19% <span className="text-xs font-normal text-slate-500">(Mục tiêu 110%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Duy trì trạng thái hoàn thành vượt định mức năng suất đề ra cho Nhà Máy Bình Dương.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đang đạt và vượt kế hoạch lũy kế năm 2026!
          </div>
        </div>
      </div>

      {/* Forecast Trend Chart: Actual vs Forecast vs Plan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Biểu Đồ Dự Báo Sản Lượng Tháng 2026 (Thực Tế & Dự Phóng Kế Hoạch)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Từ Tháng 1 đến Tháng 6 là số liệu thực tế; Từ Tháng 7 đến Tháng 12 là số liệu dự báo theo mô hình hồi quy.
            </p>
          </div>
        </div>

        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                formatter={(val: any) => [val ? `${Number(val).toLocaleString('vi-VN')} sp` : '-', '']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="actual" name="Thực Hiện (Đã đạt)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="forecast" name="Dự Báo (Forecast)" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
              <Line type="monotone" dataKey="plan" name="Kế Hoạch Gốc (Target)" stroke="#94a3b8" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
} from 'recharts';
import {
  SlidersHorizontal,
  Flame,
  Droplets,
  Calendar,
  Layers,
  ChevronDown,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import {
  RAW_DAILY_NSLD_DATA,
  RAW_WEEKLY_NSLD_DATA,
  RAW_MONTHLY_NSLD_DATA,
} from './nsldComparisonData';

type TimeGranularity = 'daily' | 'weekly' | 'monthly';
type LineScope = 'all' | 'bg' | 'ro' | 'compare';

export const NSLDComparisonChart: React.FC = () => {
  const [granularity, setGranularity] = useState<TimeGranularity>('daily');
  const [lineScope, setLineScope] = useState<LineScope>('bg'); // Default to Bếp Ga matching user's latest screenshot
  const [selectedMonth, setSelectedMonth] = useState<'all' | 'Jul' | 'Aug' | 'Sep'>('Sep'); // Default to Sep matching screenshot
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);
  const [colWidthMode, setColWidthMode] = useState<'wide' | 'compact'>('wide');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [canScroll, setCanScroll] = useState<boolean>(false);

  // Filter daily data based on selected month
  const filteredDailyData = useMemo(() => {
    if (selectedMonth === 'all') return RAW_DAILY_NSLD_DATA;
    return RAW_DAILY_NSLD_DATA.filter((d) => d.month === selectedMonth);
  }, [selectedMonth]);

  // Current active chart data based on granularity
  const chartData = useMemo(() => {
    if (granularity === 'daily') {
      return filteredDailyData.map((d) => ({
        key: d.date,
        label: d.date,
        fullDate: d.fullDate,
        nsld: d.nsld,
        nsldBG: d.nsldBG,
        nsldRO: d.nsldRO,
        week: d.week,
      }));
    } else if (granularity === 'weekly') {
      return RAW_WEEKLY_NSLD_DATA.map((w) => ({
        key: w.week,
        label: w.week,
        fullDate: w.label,
        nsld: w.nsld,
        nsldBG: w.nsldBG,
        nsldRO: w.nsldRO,
        daysCount: w.daysCount,
      }));
    } else {
      return RAW_MONTHLY_NSLD_DATA.map((m) => ({
        key: m.month,
        label: m.month,
        fullDate: m.monthLabel,
        nsld: m.nsld,
        nsldBG: m.nsldBG,
        nsldRO: m.nsldRO,
        nsld2025: m.nsld2025,
      }));
    }
  }, [granularity, filteredDailyData]);

  // Check scroll capability and track scroll position
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScroll(maxScroll > 10);
    if (maxScroll > 0) {
      setScrollProgress((el.scrollLeft / maxScroll) * 100);
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [chartData, colWidthMode]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrollProgress(val);
    const el = scrollContainerRef.current;
    if (el) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollLeft = (val / 100) * maxScroll;
    }
  };

  // Determine dynamic width for horizontal scroll
  const perColWidth = useMemo(() => {
    if (colWidthMode === 'wide') {
      return lineScope === 'compare' ? 120 : 85;
    }
    return lineScope === 'compare' ? 75 : 55;
  }, [colWidthMode, lineScope]);

  const minChartWidth = useMemo(() => {
    return Math.max(720, chartData.length * perColWidth);
  }, [chartData.length, perColWidth]);

  // Statistical calculations with separate targets: Bếp Ga = 100%, RO = 120%, Toàn Phân Xưởng (PXLR) = 120%
  const currentTarget = useMemo(() => {
    if (lineScope === 'bg') return 100;
    if (lineScope === 'ro') return 120;
    if (lineScope === 'all') return 120; // Mục tiêu toàn phân xưởng là 120%
    return 100;
  }, [lineScope]);

  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { 
        avg: 0, 
        max: 0, 
        min: 0, 
        count: 0, 
        aboveTargetCount: 0, 
        aboveTargetRate: 0,
        bgAboveCount: 0,
        bgAboveRate: 0,
        roAboveCount: 0,
        roAboveRate: 0
      };
    }

    const values = chartData.map((d) => {
      if (lineScope === 'bg') return d.nsldBG || d.nsld;
      if (lineScope === 'ro') return d.nsldRO || d.nsld;
      return d.nsld;
    });

    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Target for active scope
    const target = currentTarget;
    const aboveTargetCount = values.filter((v) => v >= target).length;
    const aboveTargetRate = (aboveTargetCount / values.length) * 100;

    // Separate counts for compare view
    const bgAboveCount = chartData.filter((d) => (d.nsldBG || 0) >= 100).length;
    const bgAboveRate = (bgAboveCount / chartData.length) * 100;
    const roAboveCount = chartData.filter((d) => (d.nsldRO || 0) >= 120).length;
    const roAboveRate = (roAboveCount / chartData.length) * 100;

    return {
      avg: Number(avg.toFixed(1)),
      max: Number(max.toFixed(1)),
      min: Number(min.toFixed(1)),
      count: values.length,
      aboveTargetCount,
      aboveTargetRate: Number(aboveTargetRate.toFixed(1)),
      bgAboveCount,
      bgAboveRate: Number(bgAboveRate.toFixed(1)),
      roAboveCount,
      roAboveRate: Number(roAboveRate.toFixed(1)),
    };
  }, [chartData, lineScope, currentTarget]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
      {/* 1. Header with Title, Subtitle, Target Badges, and Top-Right Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Biểu đồ So sánh NSLĐ
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-orange-100/80 text-orange-900 border border-orange-200">
                🎯 Bếp Ga: 100%
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-900 border border-purple-200">
                🎯 RO: 120%
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 border border-emerald-200">
                🎯 Toàn PXLR: 120%
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            So sánh năng suất lao động theo các mốc thời gian (Chữ số hiển thị to rõ ràng)
          </p>
        </div>

        {/* Top-Right Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative inline-block text-left">
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as TimeGranularity)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs sm:text-sm font-bold rounded-lg px-3.5 py-1.5 pr-8 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="daily">Hàng Ngày</option>
              <option value="weekly">Hàng Tuần</option>
              <option value="monthly">Hàng Tháng</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter & Comparison Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 text-xs">
        {/* Line Scope Selection */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Đối tượng:
          </span>

          <button
            type="button"
            onClick={() => setLineScope('bg')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              lineScope === 'bg'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" /> Bếp Ga (DCBG)
          </button>

          <button
            type="button"
            onClick={() => setLineScope('ro')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              lineScope === 'ro'
                ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-blue-400" /> Lắp Ráp RO (DCRO)
          </button>

          <button
            type="button"
            onClick={() => setLineScope('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              lineScope === 'all'
                ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Toàn Xưởng (PXLR)
          </button>

          <button
            type="button"
            onClick={() => setLineScope('compare')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              lineScope === 'compare'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> So Sánh 2 Chuyền
          </button>
        </div>

        {/* Month Filter (for Daily view) */}
        {granularity === 'daily' && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-bold px-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tháng:
            </span>
            {(['Sep', 'Aug', 'Jul', 'all'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {m === 'Sep' ? 'Tháng 9' : m === 'Aug' ? 'Tháng 8' : m === 'Jul' ? 'Tháng 7' : 'Tất cả (Cuộn)'}
              </button>
            ))}
          </div>
        )}

        {/* Display Toggles */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setColWidthMode(colWidthMode === 'wide' ? 'compact' : 'wide')}
            className={`px-2 py-1 rounded border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              colWidthMode === 'wide'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Độ giãn cột để số to rõ ràng"
          >
            <ZoomIn className="w-3 h-3 text-emerald-600" />
            <span>{colWidthMode === 'wide' ? 'Cột Rộng (Số To Rõ)' : 'Thu Gọn'}</span>
          </button>

          <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Hiện % trên cột</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showTargetLine}
              onChange={(e) => setShowTargetLine(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>
              {lineScope === 'bg'
                ? 'Mốc 100% (Bếp Ga)'
                : lineScope === 'ro'
                ? 'Mốc 120% (RO)'
                : lineScope === 'compare'
                ? 'Mốc (BG 100%, RO 120%)'
                : 'Mốc 120% (PXLR)'}
            </span>
          </label>

          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className="p-1 px-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded border border-transparent hover:border-slate-200 transition flex items-center gap-1 cursor-pointer"
          >
            <TableIcon className="w-3 h-3" />
            <span>{showDataTable ? 'Ẩn bảng' : 'Bảng số'}</span>
          </button>
        </div>
      </div>

      {/* 3. Quick KPI Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5">
          <span className="text-slate-600 text-[11px] font-medium">NSLĐ Trung Bình:</span>
          <div className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">
            {stats.avg}%
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5">
          <span className="text-slate-600 text-[11px] font-medium">NSLĐ Cao Nhất:</span>
          <div className="text-base sm:text-lg font-black text-blue-800 mt-0.5">
            {stats.max}%
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
          <span className="text-slate-600 text-[11px] font-medium">NSLĐ Thấp Nhất:</span>
          <div className="text-base sm:text-lg font-black text-amber-800 mt-0.5">
            {stats.min}%
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <span className="text-slate-600 text-[11px] font-medium">
            {lineScope === 'bg'
              ? 'Tỉ Lệ Đạt Mục Tiêu (≥100%):'
              : lineScope === 'ro'
              ? 'Tỉ Lệ Đạt Mục Tiêu (≥120%):'
              : lineScope === 'all'
              ? 'Tỉ Lệ Đạt Mục Tiêu (≥120%):'
              : 'Tỉ Lệ Đạt Mục Tiêu (BG 100%, RO 120%):'}
          </span>
          {lineScope === 'compare' ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] font-black">
                <span className="text-emerald-800">Bếp Ga (≥100%):</span>
                <span className="text-emerald-950 font-mono">
                  {stats.bgAboveRate}% ({stats.bgAboveCount}/{stats.count})
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-black">
                <span className="text-purple-800">RO (≥120%):</span>
                <span className="text-purple-950 font-mono">
                  {stats.roAboveRate}% ({stats.roAboveCount}/{stats.count})
                </span>
              </div>
            </div>
          ) : (
            <div className="text-base sm:text-lg font-black text-slate-800 mt-0.5 flex items-center gap-1.5">
              <span>{stats.aboveTargetRate}%</span>
              <span className="text-xs font-bold text-slate-500">
                ({stats.aboveTargetCount}/{stats.count} mốc)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Chart Visualization Container with Horizontal Scrollable Canvas */}
      <div className="relative bg-white border border-slate-100 rounded-xl p-2 pt-4">
        {/* Scrollable Area */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none' }} // Native scrollbar hidden because custom slider is right below
        >
          <div
            className="h-[360px] sm:h-[400px]"
            style={{ minWidth: `${minChartWidth}px` }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 35, right: 30, left: -10, bottom: 15 }}
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }}
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  dy={6}
                />
                <YAxis
                  domain={[0, 160]}
                  ticks={[0, 40, 80, 120, 160]}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const num = Number(value);
                    const label =
                      name === 'nsld'
                        ? 'NSLĐ Tổng Hợp'
                        : name === 'nsldBG'
                        ? 'NSLĐ Bếp Ga'
                        : name === 'nsldRO'
                        ? 'NSLĐ Lắp Ráp RO'
                        : name;
                    return [`${num.toFixed(1)}%`, label];
                  }}
                  labelFormatter={(label, payload) => {
                    const item = payload && payload[0]?.payload;
                    return item?.fullDate ? `${label} (${item.fullDate})` : label;
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />

                {/* Target Lines customized by Department: BG 100%, RO 120% */}
                {showTargetLine && lineScope === 'bg' && (
                  <ReferenceLine
                    y={100}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: 'Mục tiêu Bếp Ga: 100%',
                      position: 'right',
                      fill: '#dc2626',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  />
                )}

                {showTargetLine && lineScope === 'ro' && (
                  <ReferenceLine
                    y={120}
                    stroke="#7c3aed"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: 'Mục tiêu RO: 120%',
                      position: 'right',
                      fill: '#6d28d9',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  />
                )}

                {showTargetLine && lineScope === 'all' && (
                  <ReferenceLine
                    y={120}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: 'Mục tiêu PXLR: 120%',
                      position: 'right',
                      fill: '#dc2626',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  />
                )}

                {showTargetLine && lineScope === 'compare' && (
                  <>
                    <ReferenceLine
                      y={100}
                      stroke="#ea580c"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: 'Mục tiêu Bếp Ga: 100%',
                        position: 'insideBottomRight',
                        fill: '#c2410c',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    />
                    <ReferenceLine
                      y={120}
                      stroke="#7c3aed"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: 'Mục tiêu RO: 120%',
                        position: 'insideTopRight',
                        fill: '#6d28d9',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    />
                  </>
                )}

                {/* Scope-based Rendering with BIG, BOLD NUMBERS (13-14px) */}
                {lineScope === 'bg' && (
                  <Bar
                    dataKey="nsldBG"
                    name="NSLĐ Bếp Ga (%)"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  >
                    {showLabels && (
                      <LabelList
                        dataKey="nsldBG"
                        position="top"
                        formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                        style={{
                          fontSize: '13px',
                          fill: '#0f172a',
                          fontWeight: 800,
                        }}
                        offset={8}
                      />
                    )}
                  </Bar>
                )}

                {lineScope === 'ro' && (
                  <Bar
                    dataKey="nsldRO"
                    name="NSLĐ Lắp Ráp RO (%)"
                    fill="#7c3aed"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  >
                    {showLabels && (
                      <LabelList
                        dataKey="nsldRO"
                        position="top"
                        formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                        style={{
                          fontSize: '13px',
                          fill: '#3b0764',
                          fontWeight: 800,
                        }}
                        offset={8}
                      />
                    )}
                  </Bar>
                )}

                {lineScope === 'all' && (
                  <Bar
                    dataKey="nsld"
                    name="NSLĐ (%)"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  >
                    {showLabels && (
                      <LabelList
                        dataKey="nsld"
                        position="top"
                        formatter={(v: any) => {
                          const num = Number(v);
                          return num > 0 ? `${num.toFixed(1)}%` : '';
                        }}
                        style={{
                          fontSize: '13px',
                          fill: '#0f172a',
                          fontWeight: 800,
                        }}
                        offset={8}
                      />
                    )}
                  </Bar>
                )}

                {lineScope === 'compare' && (
                  <>
                    <Bar
                      dataKey="nsldBG"
                      name="Bếp Ga (DCBG)"
                      fill="#059669"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                    >
                      {showLabels && (
                        <LabelList
                          dataKey="nsldBG"
                          position="top"
                          formatter={(v: any) => `${Number(v).toFixed(0)}%`}
                          style={{ fontSize: '11px', fill: '#065f46', fontWeight: 800 }}
                          offset={6}
                        />
                      )}
                    </Bar>
                    <Bar
                      dataKey="nsldRO"
                      name="Lắp Ráp RO"
                      fill="#3b82f6"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                    >
                      {showLabels && (
                        <LabelList
                          dataKey="nsldRO"
                          position="top"
                          formatter={(v: any) => `${Number(v).toFixed(0)}%`}
                          style={{ fontSize: '11px', fill: '#1e40af', fontWeight: 800 }}
                          offset={6}
                        />
                      )}
                    </Bar>
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Pan & Scrollbar Control Bar (Matching the exact horizontal slider in user image) */}
        <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={handleScrollLeft}
            className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Range Slider / Track representing full date range */}
          <div className="flex-1 flex items-center px-1">
            <input
              type="range"
              min="0"
              max="100"
              value={scrollProgress}
              onChange={handleSliderChange}
              disabled={!canScroll}
              className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-600 disabled:opacity-40"
              title="Kéo để di chuyển mốc ngày"
            />
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={handleScrollRight}
            className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-bold text-slate-600 min-w-[70px] text-right">
            {chartData.length} mốc ngày
          </span>
        </div>
      </div>

      {/* 6. Bottom Legend (Matching screenshot) */}
      <div className="flex items-center justify-center gap-6 pt-1">
        {lineScope === 'compare' ? (
          <>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-3.5 h-3.5 bg-[#059669] rounded-xs inline-block"></span>
              <span>NSLĐ Bếp Ga (%)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-3.5 h-3.5 bg-[#3b82f6] rounded-xs inline-block"></span>
              <span>NSLĐ Lắp Ráp RO (%)</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span
              className={`w-3.5 h-3.5 rounded-xs inline-block ${
                lineScope === 'ro' ? 'bg-[#7c3aed]' : 'bg-[#059669]'
              }`}
            ></span>
            <span>
              {lineScope === 'bg'
                ? 'NSLĐ Bếp Ga (%)'
                : lineScope === 'ro'
                ? 'NSLĐ Lắp Ráp RO (%)'
                : 'NSLĐ (%)'}
            </span>
          </div>
        )}
      </div>

      {/* 7. Detailed Data Table for Inspection */}
      {showDataTable && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bảng Số Liệu Chi Tiết ({chartData.length} mốc thời gian)
            </h4>
            <span className="text-[11px] text-slate-500">Đơn vị tính: % Năng suất lao động</span>
          </div>
          <div className="max-h-60 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse bg-white">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="p-2 border-b border-slate-200">Mốc Ngày</th>
                  <th className="p-2 border-b border-slate-200 text-center">Tuần</th>
                  <th className="p-2 border-b border-slate-200 text-right text-emerald-800">NSLĐ Tổng Hợp</th>
                  <th className="p-2 border-b border-slate-200 text-right text-orange-800">NSLĐ Bếp Ga</th>
                  <th className="p-2 border-b border-slate-200 text-right text-purple-800">NSLĐ RO</th>
                  <th className="p-2 border-b border-slate-200 text-center">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {chartData.map((d, i) => {
                  const bgVal = d.nsldBG || 0;
                  const roVal = d.nsldRO || 0;
                  const bgPass = bgVal >= 100;
                  const roPass = roVal >= 120;
                  const allPass = d.nsld >= 120;

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="p-2 font-bold text-slate-800">{d.fullDate || d.label}</td>
                      <td className="p-2 text-center text-slate-500 font-mono">{d.week || '-'}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">{d.nsld.toFixed(1)}%</td>
                      <td className="p-2 text-right font-bold text-slate-800">
                        {d.nsldBG ? `${d.nsldBG.toFixed(1)}%` : '-'}
                      </td>
                      <td className="p-2 text-right font-bold text-slate-800">
                        {d.nsldRO ? `${d.nsldRO.toFixed(1)}%` : '-'}
                      </td>
                      <td className="p-2 text-center">
                        {lineScope === 'compare' ? (
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                bgPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              BG: {bgPass ? 'Đạt (100%)' : 'Chưa'}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                roPass ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              RO: {roPass ? 'Đạt (120%)' : 'Chưa'}
                            </span>
                          </div>
                        ) : lineScope === 'ro' ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              roPass ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {roPass ? 'Đạt (≥120%)' : 'Chưa Đạt'}
                          </span>
                        ) : lineScope === 'bg' ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              bgPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {bgPass ? 'Đạt (≥100%)' : 'Chưa Đạt'}
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              allPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {allPass ? 'Đạt (≥120%)' : 'Chưa Đạt'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

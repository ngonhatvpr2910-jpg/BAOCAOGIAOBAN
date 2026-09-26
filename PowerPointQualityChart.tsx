import React from 'react';
import { Slide2QualityItem } from './types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PowerPointQualityChartProps {
  title: string;
  items: Slide2QualityItem[];
  benchmarkDmLoi: number;
  benchmarkColor?: 'green' | 'purple';
  lineColor?: 'blue' | 'red';
  height?: number;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
}

export const PowerPointQualityChart: React.FC<PowerPointQualityChartProps> = ({
  title,
  items,
  benchmarkDmLoi,
  benchmarkColor = 'green',
  lineColor = 'blue',
  height = 200,
  onPrev,
  onNext,
  canPrev = false,
  canNext = false,
}) => {
  // SVG coordinate dimensions
  const svgWidth = 440;
  const svgHeight = 180;
  const padTop = 32;
  const padBottom = 24;
  const padLeft = 24;
  const padRight = 24;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Safe items
  const safeItems = items || [];
  const allValues = [
    benchmarkDmLoi,
    ...safeItems.map(i => Math.max(i.dmVatTu || 0, i.vatTu || 0, i.totalLoi4M || 0)),
  ];
  const maxVal = Math.max(...allValues, 6);
  const maxScale = Math.ceil(maxVal * 1.25);

  // Colors
  const darkNavyBar = '#1E3A8A';   // Deep Blue for ĐM vật tư
  const orangeBar = '#EA580C';     // Orange for Vật tư thực tế
  const benchmarkStroke = benchmarkColor === 'purple' ? '#7C3AED' : '#16A34A'; // Green/Purple
  const lineStroke = lineColor === 'red' ? '#DC2626' : '#2563EB';              // Red/Blue

  // Compute Y coordinate for a percentage value
  const getY = (val: number) => {
    const clamped = Math.max(0, val);
    return padTop + chartHeight * (1 - clamped / maxScale);
  };

  const benchmarkY = getY(benchmarkDmLoi);

  // Points for line series
  const linePoints = safeItems.map((item, idx) => {
    const slotWidth = chartWidth / (safeItems.length || 1);
    const centerX = padLeft + idx * slotWidth + slotWidth / 2;
    const y = getY(item.totalLoi4M);
    return { x: centerX, y, value: item.totalLoi4M, label: item.month };
  });

  return (
    <div 
      className="w-full bg-white flex flex-col justify-between rounded-xl overflow-hidden border border-slate-300 shadow-lg"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      {/* 1. Header with Title & Benchmark Pill */}
      <div className="bg-slate-900 px-3.5 py-2.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-white tracking-tight text-xs sm:text-sm md:text-[14px] uppercase leading-tight">
            {title}
          </h3>
          {(onPrev || onNext) && (
            <div className="flex items-center gap-0.5 bg-slate-800 rounded-md p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={onPrev}
                disabled={!canPrev}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Kéo về quá khứ"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Kéo về hiện tại"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <div 
          className="px-2.5 py-0.5 rounded-full text-white text-[10.5px] font-black shadow-md flex items-center gap-1.5 border border-white/20 shrink-0"
          style={{ backgroundColor: benchmarkStroke }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>MỐC ĐM: <b>{benchmarkDmLoi}%</b></span>
        </div>
      </div>

      {/* 2. Visual Graphic Canvas (SVG) */}
      <div className="w-full relative px-3 pt-3 bg-white" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {/* Subtle horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
            const y = padTop + chartHeight * (1 - ratio);
            return (
              <line
                key={idx}
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Benchmark Line across the whole width */}
          <line
            x1={padLeft}
            y1={benchmarkY}
            x2={svgWidth - padRight}
            y2={benchmarkY}
            stroke={benchmarkStroke}
            strokeWidth="3"
            strokeDasharray="8 4"
            opacity="0.8"
          />

          {/* Baseline X-axis */}
          <line
            x1={padLeft}
            y1={padTop + chartHeight}
            x2={svgWidth - padRight}
            y2={padTop + chartHeight}
            stroke="#475569"
            strokeWidth="2"
          />

          {/* Bar Pairs */}
          {safeItems.map((item, idx) => {
            const slotWidth = chartWidth / (safeItems.length || 1);
            const groupWidth = Math.min(slotWidth * 0.7, 72);
            const barGap = 4;
            const singleBarWidth = (groupWidth - barGap) / 2;
            const startX = padLeft + idx * slotWidth + (slotWidth - groupWidth) / 2;

            const h1 = Math.max(4, (item.dmVatTu / maxScale) * chartHeight);
            const x1 = startX;
            const y1 = padTop + chartHeight - h1;

            const h2 = Math.max(4, (item.vatTu / maxScale) * chartHeight);
            const x2 = startX + singleBarWidth + barGap;
            const y2 = padTop + chartHeight - h2;

            return (
              <g key={item.id || idx}>
                {/* Bar 1: ĐM vật tư */}
                <rect
                  x={x1}
                  y={y1}
                  width={singleBarWidth}
                  height={h1}
                  fill={darkNavyBar}
                  rx="1"
                />

                {/* Bar 2: Vật tư thực tế */}
                <rect
                  x={x2}
                  y={y2}
                  width={singleBarWidth}
                  height={h2}
                  fill={orangeBar}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Line Path: Total % lỗi 4M */}
          {linePoints.length > 1 && (
            <path
              d={linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke={lineStroke}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.1))"
            />
          )}

          {/* Line Points & Elevated Value Badges */}
          {linePoints.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill={lineStroke}
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              <text
                x={pt.x}
                y={pt.y - 12}
                textAnchor="middle"
                fill={lineStroke}
                fontSize="14"
                fontWeight="900"
                fontFamily='"Times New Roman", Times, serif'
              >
                {Number(pt.value.toFixed(1))}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* 3. Executive Structured Data Matrix */}
      <div className="border-t border-slate-300 bg-white relative overflow-hidden group">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <table className="w-full text-center border-collapse min-w-[340px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-300">
                <th className="py-2 px-2 text-left w-[110px] min-w-[105px] font-black text-xs uppercase tracking-tight sticky left-0 bg-slate-100 border-r border-slate-300 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  Chỉ Tiêu / Thời Gian
                </th>
                {safeItems.map((item, idx) => {
                  const isLatest = item.month.includes('39') || item.month.includes('W39');
                  return (
                    <th key={idx} className={`py-2 px-1.5 border-r border-slate-300 font-black text-xs whitespace-nowrap ${isLatest ? 'bg-amber-100/70 text-amber-950 font-black' : ''}`}>
                      {item.month}
                      {isLatest && <span className="block text-[8.5px] font-sans font-extrabold text-amber-700 leading-none mt-0.5">MỚI NHẤT</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Total % lỗi 4M */}
              <tr className="border-b border-slate-200 bg-blue-50/30">
                <td className="py-2.5 px-2 text-left font-black text-[12px] text-slate-900 flex items-center gap-1.5 sticky left-0 bg-[#f8fbff] border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-full">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border-2 border-white shadow-xs" style={{ backgroundColor: lineStroke }} />
                  <span>Total % lỗi 4M</span>
                </td>
                {safeItems.map((item, idx) => {
                  const isOverLimit = item.totalLoi4M > benchmarkDmLoi;
                  return (
                    <td 
                      key={idx} 
                      className={`py-2 px-1.5 border-r border-slate-200 font-black text-base transition-colors whitespace-nowrap ${
                        isOverLimit ? 'text-red-600 bg-red-50/50' : ''
                      }`}
                      style={!isOverLimit ? { color: lineStroke } : {}}
                    >
                      {Number(item.totalLoi4M.toFixed(1))}%
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: Vật tư thực tế (%) */}
              <tr className="border-b border-slate-200">
                <td className="py-2.5 px-2 text-left font-bold text-[12px] text-slate-800 flex items-center gap-1.5 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <span className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs" style={{ backgroundColor: orangeBar }} />
                  <span>Vật tư thực tế</span>
                </td>
                {safeItems.map((item, idx) => (
                  <td key={idx} className="py-2 px-1.5 border-r border-slate-200 font-bold text-orange-700 text-sm whitespace-nowrap">
                    {Number(item.vatTu.toFixed(1))}%
                  </td>
                ))}
              </tr>

              {/* Row 3: ĐM vật tư (%) */}
              <tr className="bg-slate-50/20">
                <td className="py-2.5 px-2 text-left font-bold text-[12px] text-slate-700 flex items-center gap-1.5 sticky left-0 bg-[#fcfdfe] border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <span className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs" style={{ backgroundColor: darkNavyBar }} />
                  <span>ĐM vật tư</span>
                </td>
                {safeItems.map((item, idx) => (
                  <td key={idx} className="py-2 px-1.5 border-r border-slate-200 font-bold text-slate-900 text-sm whitespace-nowrap">
                    {Number(item.dmVatTu.toFixed(1))}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Footer Legend */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[12px] font-bold text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-6 border-t-4 border-dashed rounded-full" style={{ borderColor: benchmarkStroke }} />
            <span className="text-slate-700">Mốc ĐM 4M</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lineStroke }} />
            <span className="text-slate-700">Tỉ lệ lỗi</span>
          </span>
        </div>
        <span className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Đơn vị: %</span>
      </div>
    </div>
  );
};

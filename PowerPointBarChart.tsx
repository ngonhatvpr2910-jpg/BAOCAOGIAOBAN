import React from 'react';
import { SlideBarItem } from './types';

interface PowerPointBarChartProps {
  items: SlideBarItem[];
  showLegend?: boolean;
  legendLabel?: string;
  maxScaleCustom?: number;
  highlightThreshold?: number; // e.g. 100%
  height?: number;
}

export const PowerPointBarChart: React.FC<PowerPointBarChartProps> = ({
  items,
  showLegend = false,
  legendLabel = 'NSLĐ (%)',
  maxScaleCustom,
  height = 220,
}) => {
  // Compute nice scale ceiling (with headroom for labels on top of bars)
  const maxVal = Math.max(...items.map(i => i.value), 100);
  const maxScale = maxScaleCustom || Math.max(140, Math.ceil((maxVal * 1.2) / 10) * 10);

  // SVG internal coordinate dimensions
  const svgWidth = 350;
  const svgHeight = 225;
  const padTop = 38;
  const padBottom = showLegend ? 46 : 36;
  const padLeft = 16;
  const padRight = 16;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Grid levels (e.g. 3-4 dashed lines)
  const gridTicks = [0.25, 0.5, 0.75, 1.0];

  return (
    <div 
      className="w-full bg-white border border-slate-300 rounded-sm p-2.5 flex flex-col justify-between shadow-2xs hover:border-slate-400 transition-colors"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <div className="w-full relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {/* Subtle horizontal dashed grid lines */}
          {gridTicks.map((ratio, idx) => {
            const y = padTop + chartHeight * (1 - ratio);
            return (
              <line
                key={idx}
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Baseline X-axis */}
          <line
            x1={padLeft}
            y1={padTop + chartHeight}
            x2={svgWidth - padRight}
            y2={padTop + chartHeight}
            stroke="#334155"
            strokeWidth="1.8"
          />

          {/* Bars and labels */}
          {items.map((item, idx) => {
            const slotWidth = chartWidth / items.length;
            const barWidth = Math.min(slotWidth * 0.76, 56);
            const isZero = item.value <= 0;
            const barHeight = isZero ? 0 : Math.max(4, (item.value / maxScale) * chartHeight);
            const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = padTop + chartHeight - barHeight;
            const centerX = x + barWidth / 2;

            // Tick mark on X-axis
            const tickY1 = padTop + chartHeight;
            const tickY2 = tickY1 + 5;

            return (
              <g key={item.id || idx} className="group cursor-default">
                {/* Bar */}
                {!isZero && (
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#00b074"
                    className="transition-all duration-300 hover:brightness-105"
                  />
                )}

                {/* Tick mark */}
                <line
                  x1={centerX}
                  y1={tickY1}
                  x2={centerX}
                  y2={tickY2}
                  stroke="#334155"
                  strokeWidth="1.5"
                />

                {/* Value on top of bar - Large font (17px) for projector */}
                <text
                  x={centerX}
                  y={y - 6}
                  textAnchor="middle"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                  fontSize="17"
                  fontWeight="bold"
                  className={`select-none tracking-tight ${
                    isZero ? 'fill-slate-400' : 'fill-slate-950 font-black'
                  }`}
                >
                  {isZero ? '0%' : `${Number(item.value.toFixed(1))}%`}
                </text>

                {/* Category label below X-axis - Large bold font (16px) for projector */}
                <text
                  x={centerX}
                  y={padTop + chartHeight + 22}
                  textAnchor="middle"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                  fontSize="16"
                  fontWeight="bold"
                  className="fill-slate-950 select-none"
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          {/* Optional Legend at bottom left */}
          {showLegend && (
            <g transform={`translate(${padLeft}, ${svgHeight - 10})`}>
              <rect x="0" y="-12" width="14" height="14" fill="#00b074" rx="2" />
              <text 
                x="18" 
                y="0" 
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                fontSize="13.5"
                fontWeight="bold"
                className="fill-slate-950 select-none"
              >
                {legendLabel}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

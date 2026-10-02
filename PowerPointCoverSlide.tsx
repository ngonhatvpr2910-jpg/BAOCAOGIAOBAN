import React from 'react';
import { getWeekNumber } from './productivityFormulas';

export const PowerPointCoverSlide: React.FC = () => {
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${currentYear}`;

  return (
    <div 
      id="powerpoint-slide-0"
      className="w-full aspect-[16/9] bg-white relative overflow-hidden flex flex-col font-['Times_New_Roman',Times,serif] shadow-2xl select-none"
    >
      {/* Top Red Section shifted upwards (0 36% to 100% 56%) to give generous clearance for title */}
      <div 
        className="absolute inset-0 bg-[#d31018] z-0" 
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 56%, 0 36%)' }}
      />
      
      {/* Teal Divider Stripe along the raised diagonal */}
      <div 
        className="absolute inset-0 bg-[#005b64] z-10 pointer-events-none" 
        style={{ clipPath: 'polygon(0 36%, 100% 56%, 100% 57.2%, 0 37.2%)' }}
      />

      {/* Official SUNHOUSE Logo Vector in Red Area */}
      <div className="absolute top-[4%] sm:top-[6%] left-[8%] sm:left-[14%] z-20">
        <svg
          viewBox="0 0 320 200"
          className="w-36 sm:w-48 md:w-56 lg:w-64 h-auto drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Teal Background Shield with Concave Bottom Arch */}
          <path
            d="M 52 32 C 52 20 62 10 74 10 L 246 10 C 258 10 268 20 268 32 L 268 152 C 268 162 260 170 250 170 C 205 158 115 158 70 170 C 60 170 52 162 52 152 Z"
            fill="#007982"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Red Horizontal Oval Pill (extends wider than teal shield) */}
          <rect
            x="16"
            y="62"
            width="288"
            height="76"
            rx="38"
            fill="#d31018"
            stroke="#ffffff"
            strokeWidth="6"
          />

          {/* SUNHOUSE Brand Text */}
          <text
            x="154"
            y="110"
            fill="#ffffff"
            fontFamily="Arial, 'Helvetica Neue', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="37"
            letterSpacing="-0.5"
            textAnchor="middle"
          >
            SUNHOUSE
          </text>

          {/* Registered Trademark ® */}
          <circle cx="277" cy="85" r="7" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <text
            x="277"
            y="88.5"
            fill="#ffffff"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize="9"
            textAnchor="middle"
          >
            R
          </text>
        </svg>
      </div>

      {/* Content Section (Bottom Left in White Area, with clear margin below the raised line) */}
      <div className="absolute left-[6%] sm:left-[8%] top-[60%] sm:top-[62%] z-20 max-w-[88%]">
        <h1 className="text-[#005b64] font-bold text-xl sm:text-2xl md:text-3xl lg:text-[40px] leading-tight tracking-tight font-['Times_New_Roman',Times,serif] whitespace-normal sm:whitespace-nowrap">
          BÁO CÁO SẢN XUẤT DCLR W{currentWeek}.{currentYear}
        </h1>
        
        <div className="mt-2.5 sm:mt-3.5 space-y-1 sm:space-y-1.5 text-[#005b64] text-base sm:text-lg md:text-xl italic font-['Times_New_Roman',Times,serif]">
          <div className="flex items-center gap-3">
            <span className="min-w-[110px] sm:min-w-[130px]">Phòng/ ban:</span>
            <span>QLSX</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="min-w-[110px] sm:min-w-[130px]">Trình bày:</span>
            <span>DCLR</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="min-w-[110px] sm:min-w-[130px]">Ngày:</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

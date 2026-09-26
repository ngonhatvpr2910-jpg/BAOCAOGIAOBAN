import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { useAuth } from './AuthContext';
import { 
  Calendar, 
  Bell, 
  FileDown, 
  Sliders, 
  UserCheck, 
  ShieldAlert, 
  Layers, 
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface HeaderProps {
  onOpenReportModal: () => void;
  onOpenAlertModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenReportModal,
  onOpenAlertModal,
  onOpenSettingsModal,
  onOpenAuthModal,
}) => {
  const { selectedDate, setSelectedDate, unreadAlertCount } = useProduction();
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Factory Unit */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              LR
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                  BÁO CÁO
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đồng bộ Real-time 2 DC
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate hidden xs:block">
                Phân Xưởng Lắp Ráp • NM Bình Dương (DCBG & DCRO)
              </p>
            </div>
          </div>

          {/* Controls: Date Picker & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Date selector */}
            <div className="relative flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2.5 py-1.5 transition-colors text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 mr-1.5 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-800 font-medium focus:outline-hidden cursor-pointer text-xs sm:text-sm"
                title="Chọn ngày giao ban"
              />
            </div>

            {/* Export PDF Button */}
            <button
              onClick={onOpenReportModal}
              id="btn-export-daily-pdf"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
              title="Xuất file PDF báo cáo giao ban cuối ngày"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden md:inline">Xuất Báo Cáo PDF</span>
              <span className="md:hidden">PDF</span>
            </button>

            {/* Push Alert Bell */}
            <button
              onClick={onOpenAlertModal}
              id="btn-open-alerts"
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Thông báo biến động chỉ số"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettingsModal}
              id="btn-open-settings"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:block"
              title="Cài đặt ngưỡng cảnh báo"
            >
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Auth / Profile Switcher */}
            <button
              onClick={onOpenAuthModal}
              id="btn-open-auth"
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
              title="Xác thực người dùng & Phân quyền"
            >
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-none truncate max-w-[120px]">
                  {currentUser.roleTitle}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

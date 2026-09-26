import React, { useState, useEffect } from 'react';
import { AuthProvider } from './AuthContext';
import { ProductionProvider, useProduction } from './ProductionContext';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { TabDCBG } from './TabDCBG';
import { TabDCRO } from './TabDCRO';
import { TabPowerPointPresentation } from './TabPowerPointPresentation';
import { DailyBriefingReportModal } from './DailyBriefingReportModal';
import { AlertCenterModal } from './AlertCenterModal';
import { LoginModal } from './LoginModal';
import { ThresholdSettingsModal } from './ThresholdSettingsModal';
import { 
  Flame, 
  Droplets, 
  Clock, 
  Tv,
  ShieldCheck
} from 'lucide-react';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<'presentation' | 'dcbg' | 'dcro'>('presentation');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { thresholds, sendManualPushNotification, selectedDate, isDateLocked } = useProduction();
  const isLocked = isDateLocked(selectedDate);

  // Automatic end-of-day trigger check (Runs every minute)
  useEffect(() => {
    if (!thresholds.autoExportPdfAtEndOfDay) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (currentTimeStr === thresholds.autoExportTime) {
        sendManualPushNotification(
          'Đã đến giờ xuất Báo cáo cuối ngày',
          `Hệ thống tự động kích hoạt tổng hợp dữ liệu 2 DC (DCBG & DCRO) lúc ${thresholds.autoExportTime}. Hãy kiểm tra và xuất PDF.`,
          'info'
        );
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [thresholds, sendManualPushNotification]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-20 sm:pb-8">
      {/* Top Header */}
      <Header
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Global Data Lock Alert */}
      {isLocked && activeTab !== 'presentation' && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold shadow-md animate-slide-down">
          <ShieldCheck className="w-5 h-5" />
          <span>Dữ liệu ngày {selectedDate} đã được KHÓA chốt (trước ngày 25/09/2026). Chỉ có thể xem, không thể thay đổi.</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 flex-1">
        {/* Desktop Tab Navigation */}
        <div className="hidden sm:flex items-center justify-between border-b border-slate-200 pb-3 mb-6 gap-4">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('presentation')}
              id="tab-presentation"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'presentation'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Tv className="w-4 h-4 text-teal-600" />
              <span>Báo Cáo Trình Chiếu</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                Slide 1-7 PPT
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dcbg')}
              id="tab-dcbg"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'dcbg'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Flame className="w-4 h-4 text-emerald-600" />
              <span>Nhóm BG (Bếp Ga)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Ma trận & 6 Đồ Thị
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dcro')}
              id="tab-dcro"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'dcro'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Droplets className="w-4 h-4 text-purple-600" />
              <span>Nhóm RO (Lắp Ráp)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                Ma trận & 4 Đồ Thị
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Tự động xuất PDF lúc: <b>{thresholds.autoExportTime}</b></span>
          </div>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'presentation' && <TabPowerPointPresentation />}

          {activeTab === 'dcbg' && <TabDCBG />}

          {activeTab === 'dcro' && <TabDCRO />}
        </div>

      </main>

      {/* Bottom Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Modals */}
      <DailyBriefingReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <AlertCenterModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />

      <LoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ThresholdSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductionProvider>
        <MainAppContent />
      </ProductionProvider>
    </AuthProvider>
  );
}

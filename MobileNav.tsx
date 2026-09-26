import React from 'react';
import { Flame, Droplets, Sliders, Tv } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'presentation' | 'dcbg' | 'dcro';
  setActiveTab: (tab: 'presentation' | 'dcbg' | 'dcro') => void;
  onOpenSettingsModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettingsModal,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around">
      <button
        onClick={() => setActiveTab('presentation')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'presentation' ? 'text-teal-700 font-bold bg-teal-50' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Tv className="w-4 h-4 mb-0.5 text-teal-600" />
        <span className="text-[10px]">Báo Cáo PPT</span>
      </button>

      <button
        onClick={() => setActiveTab('dcbg')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'dcbg' ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Flame className="w-4 h-4 mb-0.5 text-emerald-600" />
        <span className="text-[10px]">Nhóm BG (Bếp)</span>
      </button>

      <button
        onClick={() => setActiveTab('dcro')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'dcro' ? 'text-purple-700 font-bold bg-purple-50' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Droplets className="w-4 h-4 mb-0.5 text-purple-600" />
        <span className="text-[10px]">Nhóm RO (Lọc)</span>
      </button>

      <button
        onClick={onOpenSettingsModal}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <Sliders className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">Cài đặt</span>
      </button>
    </nav>
  );
};


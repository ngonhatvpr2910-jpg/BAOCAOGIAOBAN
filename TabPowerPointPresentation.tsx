import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Slide1NSLDData, SlideBarItem, Slide2QualityData, SlideDefectCostData, DamagedItemRecord, Slide4ProductionTargetData, Slide5ProductionPlanData, Slide6TaskPlanData, MonthlyHistoryRecord } from './types';
import { StorageService } from './storage';
import { INITIAL_SLIDE1_NSLD, INITIAL_SLIDE2_QUALITY, INITIAL_SLIDE3_DEFECT_COST, INITIAL_SLIDE4_PRODUCTION_TARGET, INITIAL_SLIDE5_PRODUCTION_PLAN, INITIAL_SLIDE6_TASK_PLAN } from './initialData';
import { PowerPointBarChart } from './PowerPointBarChart';
import { Slide1ProductivityPresentation } from './Slide1ProductivityPresentation';
import { Slide2QualityPresentation } from './Slide2QualityPresentation';
import { Slide2EditorModal } from './Slide2EditorModal';
import { Slide3DefectCostPresentation } from './Slide3DefectCostPresentation';
import { Slide3EditorModal } from './Slide3EditorModal';
import { Slide4ProductionTargetPresentation } from './Slide4ProductionTargetPresentation';
import { Slide4EditorModal } from './Slide4EditorModal';
import { Slide5ProductionPlanPresentation } from './Slide5ProductionPlanPresentation';
import { Slide5EditorModal } from './Slide5EditorModal';
import { Slide6TaskPlanPresentation } from './Slide6TaskPlanPresentation';
import { Slide6EditorModal } from './Slide6EditorModal';
import { ExcelImportModal } from './ExcelImportModal';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { exportDefectCostTemplate } from './excelDefectService';
import { useProduction } from './ProductionContext';
import { 
  isHistoricalItem, 
  isCurrentItem, 
  calculateAbsolutePXLR, 
  aggregateMonthlyReportData,
  syncSlideDataWithGroups,
  autoComputeSlideDataFromInputs
} from './productivityFormulas';
import { applyTimeFrameToSlide2Data } from './qualityFormulas';
import { synchronizeSlide3Data } from './defectCostSyncService';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Edit3, 
  RotateCcw, 
  Check, 
  X, 
  Printer, 
  Sliders, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Mouse,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Lock,
  RefreshCw,
  Clock,
  Calculator,
  Target,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
  Zap,
  Coins,
  AlertTriangle,
  Download,
  Upload,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';

export const TabPowerPointPresentation: React.FC = () => {
  const { 
    dcbgRecords, 
    dcroRecords, 
    activeDCBGRecord, 
    activeDCRORecord, 
    consolidatedPXLR,
    monthlyHistory,
    updateAllMonthlyRecords,
    slide2Quality,
    updateSlide2Quality
  } = useProduction();
  const [activeSlide, setActiveSlide] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [slideData, setSlideData] = useState<Slide1NSLDData>(() => StorageService.getSlide1NSLD());
  const [slide2Data, setSlide2Data] = useState<Slide2QualityData>(() => slide2Quality || StorageService.getSlide2Quality());
  
  useEffect(() => {
    if (slide2Quality) {
      setSlide2Data(slide2Quality);
    }
  }, [slide2Quality]);
  const [slide3Data, setSlide3Data] = useState<SlideDefectCostData>(() => StorageService.getSlide3DefectCost());
  const [slide4Data, setSlide4Data] = useState<Slide4ProductionTargetData>(() => StorageService.getSlide4ProductionTarget());
  const [slide5Data, setSlide5Data] = useState<Slide5ProductionPlanData>(() => StorageService.getSlide5ProductionPlan());
  const [slide6Data, setSlide6Data] = useState<Slide6TaskPlanData>(() => StorageService.getSlide6TaskPlan());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenToolbar, setShowFullscreenToolbar] = useState(true);
  const toolbarTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetToolbarTimer = () => {
    setShowFullscreenToolbar(true);
    if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
    toolbarTimerRef.current = setTimeout(() => {
      setShowFullscreenToolbar(false);
    }, 3000);
  };

  useEffect(() => {
    if (isFullscreen) {
      resetToolbarTimer();
      window.addEventListener('mousemove', resetToolbarTimer);
    } else {
      if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
      window.removeEventListener('mousemove', resetToolbarTimer);
    }
    return () => {
      if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
      window.removeEventListener('mousemove', resetToolbarTimer);
    };
  }, [isFullscreen]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSlide2EditorOpen, setIsSlide2EditorOpen] = useState(false);
  const [isSlide3EditorOpen, setIsSlide3EditorOpen] = useState(false);
  const [isSlide4EditorOpen, setIsSlide4EditorOpen] = useState(false);
  const [isSlide5EditorOpen, setIsSlide5EditorOpen] = useState(false);
  const [isSlide6EditorOpen, setIsSlide6EditorOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Slide1NSLDData>(slideData);
  const [activeEditSection, setActiveEditSection] = useState<'pxlr' | 'ro' | 'bg'>('pxlr');
  const [autoCalculatePXLR, setAutoCalculatePXLR] = useState(true);
  const [isAutoSyncActive, setIsAutoSyncActive] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showSyncDetail, setShowSyncDetail] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [syncVersion, setSyncVersion] = useState(0);
  const [summaryView, setSummaryView] = useState<'auto' | 'slide1' | 'slide2' | 'both'>('auto');
  
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const slide3Ref = useRef<HTMLDivElement>(null);
  const slide4Ref = useRef<HTMLDivElement>(null);
  const slide5Ref = useRef<HTMLDivElement>(null);
  const slide6Ref = useRef<HTMLDivElement>(null);
  const slide7Ref = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Lướt chuột chuyển slide mượt mà giống PowerPoint
  const scrollToSlide = (slideNum: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setActiveSlide(slideNum);
    let target: HTMLDivElement | null = null;
    if (slideNum === 1) target = slide1Ref.current;
    else if (slideNum === 2) target = slide2Ref.current;
    else if (slideNum === 3) target = slide3Ref.current;
    else if (slideNum === 4) target = slide4Ref.current;
    else if (slideNum === 5) target = slide5Ref.current;
    else if (slideNum === 6) target = slide6Ref.current;
    else if (slideNum === 7) target = slide7Ref.current;

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Tự động nhận diện slide đang hiển thị trên màn hình khi người dùng cuộn chuột
  useEffect(() => {
    if (isFullscreen) return;
    const handleScroll = () => {
      if (slide7Ref.current) {
        const rect7 = slide7Ref.current.getBoundingClientRect();
        if (rect7.top <= window.innerHeight * 0.45) {
          setActiveSlide(7);
          return;
        }
      }
      if (slide6Ref.current) {
        const rect6 = slide6Ref.current.getBoundingClientRect();
        if (rect6.top <= window.innerHeight * 0.45) {
          setActiveSlide(6);
          return;
        }
      }
      if (slide5Ref.current) {
        const rect5 = slide5Ref.current.getBoundingClientRect();
        if (rect5.top <= window.innerHeight * 0.45) {
          setActiveSlide(5);
          return;
        }
      }
      if (slide4Ref.current) {
        const rect4 = slide4Ref.current.getBoundingClientRect();
        if (rect4.top <= window.innerHeight * 0.45) {
          setActiveSlide(4);
          return;
        }
      }
      if (slide3Ref.current) {
        const rect3 = slide3Ref.current.getBoundingClientRect();
        if (rect3.top <= window.innerHeight * 0.45) {
          setActiveSlide(3);
          return;
        }
      }
      if (slide2Ref.current) {
        const rect2 = slide2Ref.current.getBoundingClientRect();
        if (rect2.top <= window.innerHeight * 0.45) {
          setActiveSlide(2);
          return;
        }
      }
      setActiveSlide(1);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFullscreen]);

  // Nhận diện cuộn chuột trong chế độ toàn màn hình
  const handleFullscreenScroll = () => {
    if (!fullscreenContainerRef.current) return;
    const containerTop = fullscreenContainerRef.current.scrollTop;
    
    if (slide7Ref.current) {
      const slide7Top = slide7Ref.current.offsetTop - 200;
      if (containerTop >= slide7Top) {
        setActiveSlide(7);
        return;
      }
    }
    if (slide6Ref.current) {
      const slide6Top = slide6Ref.current.offsetTop - 200;
      if (containerTop >= slide6Top) {
        setActiveSlide(6);
        return;
      }
    }
    if (slide5Ref.current) {
      const slide5Top = slide5Ref.current.offsetTop - 200;
      if (containerTop >= slide5Top) {
        setActiveSlide(5);
        return;
      }
    }
    if (slide4Ref.current) {
      const slide4Top = slide4Ref.current.offsetTop - 200;
      if (containerTop >= slide4Top) {
        setActiveSlide(4);
        return;
      }
    }
    if (slide3Ref.current) {
      const slide3Top = slide3Ref.current.offsetTop - 200;
      if (containerTop >= slide3Top) {
        setActiveSlide(3);
        return;
      }
    }
    if (slide2Ref.current) {
      const slide2Top = slide2Ref.current.offsetTop - 200;
      if (containerTop >= slide2Top) {
        setActiveSlide(2);
        return;
      }
    }
    setActiveSlide(1);
  };

  // Lắng nghe sự kiện đồng bộ tự động từ Ma trận DCRO & DCBG tức thời
  useEffect(() => {
    const handleUpdate = () => {
      setSyncVersion(v => v + 1);
    };
    window.addEventListener('production-data-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('production-data-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // TỰ ĐỘNG CHẠY SỐ LIỆU THÁNG 9 & CÁC TUẦN THÁNG 9 TỪ KẾT QUẢ NHẬP LIỆU:
  useEffect(() => {
    if (isAutoSyncActive) {
      setSlideData(prev => {
        const { updatedSlideData } = autoComputeSlideDataFromInputs(prev, dcbgRecords, dcroRecords);
        StorageService.saveSlide1NSLD(updatedSlideData);
        return updatedSlideData;
      });
    }
  }, [dcbgRecords, dcroRecords, isAutoSyncActive, syncVersion]);

  // Sync modal editing state when slideData changes
  useEffect(() => {
    setEditingData(slideData);
  }, [slideData]);

  // Tóm tắt kết quả tính toán tự động
  const liveSyncSummary = useMemo(() => {
    return autoComputeSlideDataFromInputs(slideData, dcbgRecords, dcroRecords).summary;
  }, [slideData, dcbgRecords, dcroRecords, syncVersion]);

  // Fullscreen keyboard listener and slide switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'ArrowDown') {
        setActiveSlide(curr => {
          const next = curr < 7 ? ((curr + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 7;
          scrollToSlide(next);
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp') {
        setActiveSlide(curr => {
          const prev = curr > 1 ? ((curr - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 1;
          scrollToSlide(prev);
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSaveSlide2 = (newData: Slide2QualityData) => {
    updateSlide2Quality(newData);
    setSlide2Data(newData);
    setIsSlide2EditorOpen(false);
    showToast('Đã lưu và đồng bộ thành công số liệu Slide 2: Chất Lượng sang PXLR Tổng Hợp!');
  };

  const handleTimeFrameChangeSlide2 = (timeFrame: 'month' | 'week' | 'day') => {
    const updated = applyTimeFrameToSlide2Data(slide2Data, timeFrame);
    setSlide2Data(updated);
    updateSlide2Quality(updated);
  };

  const handleResetSlide2 = () => {
    if (window.confirm('Khôi phục toàn bộ số liệu Slide 2 về mặc định theo ảnh PowerPoint?')) {
      const reset = StorageService.resetSlide2Quality();
      updateSlide2Quality(reset);
      setSlide2Data(reset);
      showToast('Đã khôi phục số liệu gốc Slide 2 theo ảnh PowerPoint và đồng bộ sang PXLR!');
    }
  };

  const handleSaveSlide3 = (newData: SlideDefectCostData) => {
    StorageService.saveSlide3DefectCost(newData);
    setSlide3Data(newData);
    setIsSlide3EditorOpen(false);
    showToast('Đã lưu thành công số liệu Slide 3: Tỉ Lệ Hư Hỏng & Tổn Thất Vật Tư!');
  };

  const handleResetSlide3 = () => {
    if (window.confirm('Khôi phục toàn bộ số liệu Slide 3 về mặc định theo ảnh PowerPoint?')) {
      const reset = StorageService.resetSlide3DefectCost();
      setSlide3Data(reset);
      showToast('Đã khôi phục số liệu gốc Slide 3 theo ảnh PowerPoint!');
    }
  };

  const handleSaveSlide4 = (newData: Slide4ProductionTargetData) => {
    StorageService.saveSlide4ProductionTarget(newData);
    setSlide4Data(newData);
    setIsSlide4EditorOpen(false);
    showToast('Đã lưu thành công số liệu Slide 4: Mục Tiêu Sản Xuất!');
  };

  const handleResetSlide4 = () => {
    if (window.confirm('Khôi phục toàn bộ số liệu Slide 4 về mặc định?')) {
      const reset = StorageService.resetSlide4ProductionTarget();
      setSlide4Data(reset);
      showToast('Đã khôi phục số liệu gốc Slide 4!');
    }
  };

  const handleSaveSlide5 = (newData: Slide5ProductionPlanData) => {
    StorageService.saveSlide5ProductionPlan(newData);
    setSlide5Data(newData);
    setIsSlide5EditorOpen(false);
    showToast('Đã lưu thành công số liệu Slide 5: Kế Hoạch Tuần Tiếp Theo!');
  };

  const handleResetSlide5 = () => {
    if (window.confirm('Khôi phục toàn bộ số liệu Slide 5 về mặc định theo ảnh PowerPoint?')) {
      const reset = StorageService.resetSlide5ProductionPlan();
      setSlide5Data(reset);
      showToast('Đã khôi phục số liệu gốc Slide 5!');
    }
  };

  const handleSaveSlide6 = (newData: Slide6TaskPlanData) => {
    StorageService.saveSlide6TaskPlan(newData);
    setSlide6Data(newData);
    setIsSlide6EditorOpen(false);
    showToast('Đã lưu thành công kế hoạch công việc Slide 6!');
  };

  const handleResetSlide6 = () => {
    if (window.confirm('Khôi phục toàn bộ số liệu Slide 6 về mặc định theo ảnh PowerPoint?')) {
      const reset = StorageService.resetSlide6TaskPlan();
      setSlide6Data(reset);
      showToast('Đã khôi phục số liệu gốc Slide 6!');
    }
  };

  const handleApplyExcelImport = (importedData: Partial<SlideDefectCostData>, productivityData?: MonthlyHistoryRecord[]) => {
    setSlide3Data(prev => {
      const historicalMonths: Record<string, number> = {
        'Tháng 6': 10.8,
        'Tháng 7': 7.1,
        'Tháng 8': 5.9,
      };
      const historicalWeeks: Record<string, number> = {
        'W32': 2.2,
        'W33': 0.6,
        'W34': 1.8,
        'W35': 1.4,
      };

      let newMonthly = importedData.monthlyData || prev.monthlyData;
      newMonthly = newMonthly.map(m => {
        const hist = historicalMonths[m.label];
        if (hist !== undefined && (!m.value || m.value <= 0)) {
          return { ...m, value: hist, displayLabel: `${hist}M` };
        }
        return m;
      });

      // Đảm bảo không bị thiếu Tháng 6, 7, 8
      Object.entries(historicalMonths).forEach(([mLabel, mVal]) => {
        if (!newMonthly.some(m => m.label === mLabel)) {
          newMonthly.push({ id: `m-${mLabel}`, label: mLabel, value: mVal, displayLabel: `${mVal}M` });
        }
      });

      const getNum = (label: string) => {
        const m = (label || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      };
      newMonthly.sort((a, b) => getNum(a.label) - getNum(b.label));

      let newWeekly = importedData.weeklyData || prev.weeklyData;
      newWeekly = newWeekly.map(w => {
        const hist = historicalWeeks[w.label];
        if (hist !== undefined && (!w.value || w.value <= 0)) {
          return { ...w, value: hist, displayLabel: `${hist}M` };
        }
        return w;
      });

      // Đảm bảo không bị thiếu tuần W32-W35
      Object.entries(historicalWeeks).forEach(([wLabel, wVal]) => {
        if (!newWeekly.some(w => w.label === wLabel)) {
          newWeekly.push({ id: `w-${wLabel.toLowerCase()}`, label: wLabel, value: wVal, displayLabel: `${wVal}M` });
        }
      });
      newWeekly.sort((a, b) => getNum(a.label) - getNum(b.label));

      const updated: SlideDefectCostData = {
        ...prev,
        ...importedData,
        monthlyData: newMonthly,
        weeklyData: newWeekly,
        itemsRO: (importedData.itemsRO && importedData.itemsRO.length > 0) ? importedData.itemsRO : prev.itemsRO,
        itemsBG: (importedData.itemsBG && importedData.itemsBG.length > 0) ? importedData.itemsBG : prev.itemsBG,
      };
      const { syncedData } = synchronizeSlide3Data(updated);
      StorageService.saveSlide3DefectCost(syncedData);
      return syncedData;
    });

    if (productivityData && productivityData.length > 0) {
      updateAllMonthlyRecords(productivityData);
    }

    const roCount = importedData.itemsRO?.length || 0;
    const bgCount = importedData.itemsBG?.length || 0;
    const prodMsg = (productivityData && productivityData.length > 0) ? ` và ${productivityData.length} tháng Năng suất & Công` : '';
    showToast(`Đã nạp thành công ${roCount + bgCount} mục vật tư${prodMsg} từ file Excel!`);
  };

  // Đồng bộ thủ công dữ liệu mới hiện hữu khi cần cưỡng bức làm mới
  const handleManualSyncWithLiveReports = () => {
    const { updatedSlideData, summary } = autoComputeSlideDataFromInputs(slideData, dcbgRecords, dcroRecords);
    StorageService.saveSlide1NSLD(updatedSlideData);
    setSlideData(updatedSlideData);
    setEditingData(updatedSlideData);
    showToast(`Đã tự động tính toán từ ${summary.recordCountRO} báo cáo RO & ${summary.recordCountBG} báo cáo BG Tháng 9: RO ${summary.month09.nsldRO}%, BG ${summary.month09.nsldBG}%, PXLR Tuyệt Đối ${summary.month09.nsldPXLR}%!`);
  };

  const handleSaveData = () => {
    StorageService.saveSlide1NSLD(editingData);
    setSlideData(editingData);
    setIsEditorOpen(false);
    showToast('Đã lưu dữ liệu Slide 1 thành công!');
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục dữ liệu Slide 1 về số liệu gốc ban đầu?')) {
      const initial = StorageService.resetSlide1NSLD();
      setSlideData(initial);
      setEditingData(initial);
      showToast('Đã khôi phục dữ liệu gốc Slide 1!');
    }
  };

  const handleValueChange = (
    section: 'pxlr' | 'ro' | 'bg',
    type: 'weekly' | 'monthly',
    id: string,
    newValue: number
  ) => {
    setEditingData(prev => {
      // 1. Cập nhật giá trị đang thay đổi
      const updatedSection = {
        ...prev[section],
        [type]: prev[section][type].map(item =>
          item.id === id ? { ...item, value: newValue } : item
        ),
      };

      let nextState: Slide1NSLDData = {
        ...prev,
        [section]: updatedSection,
      };

      // 2. TỰ ĐỘNG CHẠY CÔNG THỨC TUYỆT ĐỐI CHO PHÂN XƯỞNG LẮP RÁP (PXLR):
      // Khi thay đổi số liệu hiện hữu của nhóm RO hoặc nhóm BG:
      // Tự động tính toán lại PXLR theo đúng logic tỷ trọng định mức chuẩn:
      // NSLĐ PXLR = [ Σ(SL) / Σ(Định Mức) ] * 100
      if (autoCalculatePXLR && (section === 'ro' || section === 'bg')) {
        if (id === 'ro-m09' || id === 'bg-m09') {
          const valRO = id === 'ro-m09' ? newValue : (nextState.ro.monthly.find(m => m.id === 'ro-m09')?.value ?? 0);
          const valBG = id === 'bg-m09' ? newValue : (nextState.bg.monthly.find(m => m.id === 'bg-m09')?.value ?? 0);
          const pxlrM09 = calculateAbsolutePXLR(valRO, valBG, 'monthly_09');

          nextState.pxlr = {
            ...nextState.pxlr,
            monthly: nextState.pxlr.monthly.map(m =>
              m.id === 'pxlr-m09' ? { ...m, value: pxlrM09 } : m
            ),
          };
        } else if (id === 'ro-w37' || id === 'bg-w37') {
          const valRO = id === 'ro-w37' ? newValue : (nextState.ro.weekly.find(w => w.id === 'ro-w37')?.value ?? 0);
          const valBG = id === 'bg-w37' ? newValue : (nextState.bg.weekly.find(w => w.id === 'bg-w37')?.value ?? 0);
          const pxlrW37 = calculateAbsolutePXLR(valRO, valBG, 'weekly_37');

          nextState.pxlr = {
            ...nextState.pxlr,
            weekly: nextState.pxlr.weekly.map(w =>
              w.id === 'pxlr-w37' ? { ...w, value: pxlrW37 } : w
            ),
          };
        } else if (id === 'ro-w36' || id === 'bg-w36') {
          const valRO = id === 'ro-w36' ? newValue : (nextState.ro.weekly.find(w => w.id === 'ro-w36')?.value ?? 0);
          const valBG = id === 'bg-w36' ? newValue : (nextState.bg.weekly.find(w => w.id === 'bg-w36')?.value ?? 0);
          const pxlrW36 = calculateAbsolutePXLR(valRO, valBG, 'weekly_36');

          nextState.pxlr = {
            ...nextState.pxlr,
            weekly: nextState.pxlr.weekly.map(w =>
              w.id === 'pxlr-w36' ? { ...w, value: pxlrW36 } : w
            ),
          };
        }
      }

      return nextState;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Presentation Control Bar */}
      {!isPresentationMode && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30 backdrop-blur-md bg-white/95">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold shadow-xs transition-colors ${
              activeSlide === 1 ? 'bg-blue-600' : activeSlide === 2 ? 'bg-teal-600' : activeSlide === 3 ? 'bg-blue-600' : activeSlide === 4 ? 'bg-amber-600' : activeSlide === 5 ? 'bg-emerald-600' : activeSlide === 6 ? 'bg-blue-600' : 'bg-indigo-600'
            }`}>
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span>Báo Cáo PowerPoint:</span>
                  <span className={activeSlide === 1 ? 'text-blue-700 font-black' : activeSlide === 2 ? 'text-teal-700 font-bold' : activeSlide === 3 ? 'text-blue-700 font-bold' : activeSlide === 4 ? 'text-amber-700 font-bold' : activeSlide === 5 ? 'text-emerald-700 font-bold' : activeSlide === 6 ? 'text-blue-700 font-bold' : 'text-indigo-700 font-bold'}>
                    {activeSlide === 1 ? 'Slide 1 (Báo Cáo Tổng Thể)' : activeSlide === 2 ? 'Slide 2 (Năng Suất)' : activeSlide === 3 ? 'Slide 3 (Chất Lượng)' : activeSlide === 4 ? 'Slide 4 (Tỉ Lệ Hư Hỏng)' : activeSlide === 5 ? 'Slide 5 (Mục Tiêu)' : activeSlide === 6 ? 'Slide 6 (Kế Hoạch SX)' : 'Slide 7 (KH Công Việc)'}
                  </span>
                </h2>

                {/* Slide 1, 2, 3, 4, 5, 6 & 7 Switcher Tabs with Smooth Scroll */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-wrap gap-0.5">
                  <button
                    onClick={() => scrollToSlide(1)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeSlide === 1
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Cuộn đến Slide 1: Báo Cáo Tổng Thể (Executive Summary)"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>S1 Tổng Thể</span>
                  </button>
                  <button
                    onClick={() => scrollToSlide(2)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeSlide === 2
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Cuộn đến Slide 2: Năng Suất"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>S2 Năng Suất</span>
                  </button>
                  <button
                    onClick={() => scrollToSlide(3)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeSlide === 3
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Lăn chuột hoặc bấm để xem Slide 3: Chất Lượng"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>S3</span>
                  </button>
                  <button
                    onClick={() => scrollToSlide(4)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeSlide === 4
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Lăn chuột hoặc bấm để xem Slide 4: Tỉ Lệ Hàng Hư Hỏng & Tổn Thất"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>S4</span>
                  </button>
                  <button
                    onClick={() => scrollToSlide(5)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeSlide === 5
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Lăn chuột hoặc bấm để xem Slide 5: Mục Tiêu Sản Xuất"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>S5</span>
                  </button>
                  <button
                    onClick={() => scrollToSlide(6)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeSlide === 6
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Lăn chuột hoặc bấm để xem Slide 6: Kế Hoạch Sản Xuất"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>S6</span>
                  </button>
                  <button
                    onClick={() => scrollToSlide(7)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeSlide === 7
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Lăn chuột hoặc bấm để xem Slide 7: Kế Hoạch Công Việc"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>S7</span>
                  </button>
                </div>

                {/* Prev / Next Slide Quick Arrows */}
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => {
                      const prev = activeSlide > 1 ? ((activeSlide - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 1;
                      scrollToSlide(prev);
                    }}
                    disabled={activeSlide === 1}
                    className="p-1 hover:bg-slate-200/80 rounded disabled:opacity-30 text-slate-700 cursor-pointer"
                    title="Lên Slide trước (Phím ↑ hoặc ←)"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold font-mono px-1.5 text-slate-700">
                    {activeSlide} / 7
                  </span>
                  <button
                    onClick={() => {
                      const next = activeSlide < 7 ? ((activeSlide + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 7;
                      scrollToSlide(next);
                    }}
                    disabled={activeSlide === 7}
                    className="p-1 hover:bg-slate-200/80 rounded disabled:opacity-30 text-slate-700 cursor-pointer"
                    title="Xuống Slide tiếp theo (Phím ↓ hoặc →)"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mouse Scroll Hint Badge */}
                {showNotes && (
                  <button
                    onClick={() => {
                      const next = activeSlide === 1 ? 2 : activeSlide === 2 ? 3 : activeSlide === 3 ? 4 : 1;
                      scrollToSlide(next as 1 | 2 | 3 | 4);
                    }}
                    className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                    title="Dùng chuột lăn từ trên xuống hoặc bấm vào đây để chuyển slide"
                  >
                    <Mouse className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                    <span>Lăn chuột từ trên xuống để chuyển slide</span>
                    {activeSlide < 4 ? (
                      <ChevronDown className="w-3 h-3 text-amber-700" />
                    ) : (
                      <ChevronUp className="w-3 h-3 text-amber-700" />
                    )}
                  </button>
                )}

                {/* Auto Sync Active Pill (for Slide 1) */}
                <button
                  onClick={() => setIsAutoSyncActive(prev => !prev)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    isAutoSyncActive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isAutoSyncActive ? 'Bấm để tạm dừng tự động chạy số liệu' : 'Bấm để bật tự động chạy số liệu từ nhập liệu'}
                >
                  <Zap className={`w-3 h-3 ${isAutoSyncActive ? 'text-emerald-600 fill-emerald-500' : 'text-slate-400'}`} />
                  <span>{isAutoSyncActive ? 'Tự Động Chạy: BẬT' : 'Tự Động Chạy: TẮT'}</span>
                </button>
              </div>
              {showNotes && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Định dạng chuẩn trình chiếu 16:9 giống PowerPoint • Cuộn chuột dọc để xem liên tục 3 slide
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {toastMessage && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> {toastMessage}
              </span>
            )}

            <button
              onClick={() => setShowSyncDetail(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Xem chi tiết nguồn số liệu nhập liệu chạy vào Tháng 9"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Nguồn Nhập Liệu</span>
            </button>

            <button
              onClick={handleManualSyncWithLiveReports}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Đồng bộ ngay tức thì toàn bộ số liệu nhập liệu Tháng 9 và tính công thức tuyệt đối"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Làm Mới Số Liệu</span>
            </button>

            {/* Bảng Điều Hành Executive Summary */}
            <button
              onClick={() => scrollToSlide(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs border text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-300"
              title="Cuộn đến Slide 1: Báo Cáo Tổng Thể (Executive Summary) chuẩn định mức & mục tiêu theo tuần và tháng"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>S1 Tổng Thể</span>
            </button>

            {/* Xuất File Mẫu (.xlsx) */}
            <button
              onClick={async () => {
                try {
                  await exportDefectCostTemplate(slide3Data);
                } catch (err) {
                  alert('Có lỗi khi xuất file Excel.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Tải về file Excel mẫu chuẩn (.xlsx) có sẵn công thức và cấu trúc sheet cho 2 tuần 37-38 và các tuần trước"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất File Mẫu (.xlsx)</span>
            </button>

            {/* Upfile Excel */}
            <button
              onClick={() => setIsExcelImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Tải lên file Excel (.xlsx / .xls) hoặc CSV để nạp tự động dữ liệu hàng hỏng và biểu đồ"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-200" />
              <span>Upfile Excel</span>
            </button>

            {/* Sửa Slide 2 (Năng Suất) */}
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
              title="Chỉnh sửa các con số trên Slide 2: Năng Suất"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-700" />
              <span>Sửa Slide 2</span>
            </button>

            {/* Toggle Ghi Chú */}
            <button
              onClick={() => setShowNotes(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                showNotes 
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title={showNotes ? 'Ẩn các ghi chú & thông tin hướng dẫn' : 'Hiện các ghi chú & thông tin hướng dẫn'}
            >
              {showNotes ? <X className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
              <span>{showNotes ? 'Ẩn Ghi Chú' : 'Hiện Ghi Chú'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-all cursor-pointer ${
                activeSlide === 1 ? 'bg-teal-700 hover:bg-teal-800' : activeSlide === 2 ? 'bg-blue-700 hover:bg-blue-800' : activeSlide === 3 ? 'bg-amber-700 hover:bg-amber-800' : activeSlide === 4 ? 'bg-emerald-700 hover:bg-emerald-800' : activeSlide === 5 ? 'bg-blue-700 hover:bg-blue-800' : 'bg-[#4472c4] hover:bg-[#35589c]'
              }`}
              title="Chế độ chiếu toàn màn hình (F11 hoặc ESC để thoát)"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Thu Nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Chiếu Toàn Màn Hình</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Logic & Data Governance Info Banner */}
      {!isPresentationMode && showNotes && (
        <>
          {activeSlide === 1 ? (
            <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/40 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Mục 1: <strong>Báo Cáo Tổng Thể Toàn Xưởng (Executive Summary)</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tổng hợp 6 chỉ số: <strong>KHSX • THỰC HIỆN • NSLĐ • ĐI LÀM • TỈ LỆ LỖI • HƯ HỎNG</strong></span>
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Highlight chuẩn hóa: Đạt ≥ 100% (Xanh), Chưa đạt (Đỏ), Zero Defect (Xanh ngọc)</span>
              </div>
            </div>
          ) : activeSlide === 2 ? (
            <div className="bg-gradient-to-r from-slate-50 via-teal-50/40 to-blue-50/40 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Dữ liệu cũ (Tuần Tháng 8 & Tháng 6-8): <strong>Bảo lưu nguyên vẹn 100%</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tháng 9 & các tuần Tháng 9: <strong>Tự động chạy từ nhập liệu</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-900 font-medium">
                  <Calculator className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>PXLR: <strong>Công thức chuẩn: NSLĐ = [Σ(SL quy đổi) / Σ(ĐM theo nhân công)] × 100</strong></span>
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Thực tế Tháng 9: RO {liveSyncSummary.month09.nsldRO}% | BG {liveSyncSummary.month09.nsldBG}% ⇒ PXLR: <strong className="text-purple-700 font-bold">{liveSyncSummary.month09.nsldPXLR}%</strong>
              </div>
            </div>
          ) : activeSlide === 3 ? (
            <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-emerald-50/40 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Mục 3: <strong>Chất Lượng</strong> - Báo Cáo Sản Xuất DCLR (PXLR, Line RO, Line BG)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Định mức 4M: <strong>PXLR (7.38%) | Line RO (5.20%) | Line BG (7.74%)</strong></span>
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-2 bg-white/80 px-2.5 py-1 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Khảo sát T5 - T8 & Đối sách trọng điểm Tháng 9</span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-50 via-amber-50/40 to-rose-50/40 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                  <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Mục 4: <strong>Tỉ Lệ Hàng Hư Hỏng & Tổn Thất</strong> - Báo Cáo Chi Phí Vật Tư & Biểu Đồ Hư Hỏng</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-900 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    Tổng Chi Phí Tổn Thất:{' '}
                    <strong>
                      {new Intl.NumberFormat('vi-VN').format(
                        ((slide3Data?.itemsRO || []).concat(slide3Data?.itemsBG || [])).reduce(
                          (acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice)),
                          0
                        )
                      )}{' '}
                      VNĐ
                    </strong>{' '}
                    ({(slide3Data?.itemsRO?.length || 0) + (slide3Data?.itemsBG?.length || 0)} danh mục vật tư)
                  </span>
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-2 bg-white/80 px-2.5 py-1 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Theo dõi định mức & diễn biến chi phí từng tuần</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Presentation Mode Floating Controls */}
      {isPresentationMode && !isFullscreen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full flex items-center gap-4 shadow-2xl border border-slate-700/80">
          <button
            onClick={() => setIsPresentationMode(false)}
            className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors"
            title="Thoát chế độ trình chiếu"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = activeSlide > 1 ? ((activeSlide - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 1;
                scrollToSlide(prev);
              }}
              disabled={activeSlide === 1}
              className="p-1 disabled:opacity-30"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono w-10 text-center">{activeSlide} / 7</span>
            <button
              onClick={() => {
                const next = activeSlide < 7 ? ((activeSlide + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 7;
                scrollToSlide(next);
              }}
              disabled={activeSlide === 7}
              className="p-1 disabled:opacity-30"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 rounded-full text-[11px] font-bold transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Toàn màn hình</span>
          </button>
        </div>
      )}

      {/* Button to enter Presentation Mode */}
      {!isPresentationMode && !isFullscreen && (
        <div className="flex justify-center -mt-2 mb-4">
          <button
            onClick={() => setIsPresentationMode(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-sm font-bold shadow-lg transition-all transform hover:scale-105"
          >
            <Tv className="w-4 h-4 text-teal-400" />
            <span>Chế độ Trình Chiếu (Ẩn công cụ)</span>
          </button>
        </div>
      )}

      {/* Live Data Source Detail Drawer */}
      {showSyncDetail && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between font-bold text-indigo-900">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Minh Chứng Tự Động Chạy Số Liệu Từ Báo Cáo Nhập Liệu Thực Tế (Tháng 9)</span>
            </div>
            <button 
              onClick={() => setShowSyncDetail(false)}
              className="p-1 hover:bg-indigo-100 rounded text-indigo-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 space-y-1">
              <div className="font-bold text-slate-800">1. Nhóm Lắp Ráp RO (DCRO)</div>
              <div className="text-slate-600">Số bản ghi Tháng 9: <span className="font-bold text-indigo-700">{liveSyncSummary.recordCountRO} ngày</span></div>
              <div className="text-slate-600">Tổng công nhân sự: <span className="font-mono font-bold">{liveSyncSummary.month09.totalCong_RO ?? 0} công</span></div>
              <div className="text-slate-600">Tổng SL quy đổi: <span className="font-mono font-bold">{liveSyncSummary.month09.totalSL_RO.toLocaleString()} SP</span></div>
              <div className="text-slate-600">Tổng Định mức: <span className="font-mono font-bold">{liveSyncSummary.month09.totalDM_RO.toLocaleString()} SP</span></div>
              <div className="text-indigo-900 font-bold pt-1 border-t border-slate-100">
                NSLĐ Tự Động = ({liveSyncSummary.month09.totalSL_RO} / {liveSyncSummary.month09.totalDM_RO}) × 100 = <span className="text-teal-700 font-extrabold">{liveSyncSummary.month09.nsldRO}%</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 space-y-1">
              <div className="font-bold text-slate-800">2. Nhóm Lắp Ráp Bếp Gas (DCBG)</div>
              <div className="text-slate-600">Số bản ghi Tháng 9: <span className="font-bold text-indigo-700">{liveSyncSummary.recordCountBG} ngày</span></div>
              <div className="text-slate-600">Tổng công nhân sự: <span className="font-mono font-bold">{liveSyncSummary.month09.totalCong_BG ?? 0} công</span></div>
              <div className="text-slate-600">Tổng SL quy đổi: <span className="font-mono font-bold">{liveSyncSummary.month09.totalSL_BG.toLocaleString()} SP</span></div>
              <div className="text-slate-600">Tổng Định mức: <span className="font-mono font-bold">{liveSyncSummary.month09.totalDM_BG.toLocaleString()} SP</span></div>
              <div className="text-indigo-900 font-bold pt-1 border-t border-slate-100">
                NSLĐ Tự Động = ({liveSyncSummary.month09.totalSL_BG} / {liveSyncSummary.month09.totalDM_BG}) × 100 = <span className="text-emerald-700 font-extrabold">{liveSyncSummary.month09.nsldBG}%</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-purple-200 space-y-1">
              <div className="font-bold text-purple-900 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-purple-600" />
                <span>3. Toàn Phân Xưởng Lắp Ráp (PXLR)</span>
              </div>
              <div className="text-slate-600">Tổng nhân công toàn xưởng: <span className="font-mono font-bold">{liveSyncSummary.month09.totalCong_PXLR ?? 0} công</span></div>
              <div className="text-slate-600">Tổng SL quy đổi toàn xưởng: <span className="font-mono font-bold">{(liveSyncSummary.month09.totalSL_RO + liveSyncSummary.month09.totalSL_BG).toLocaleString()} SP</span></div>
              <div className="text-slate-600">Tổng ĐM theo nhân công: <span className="font-mono font-bold">{(liveSyncSummary.month09.totalDM_RO + liveSyncSummary.month09.totalDM_BG).toLocaleString()} SP</span></div>
              <div className="text-slate-600 text-[11px]">Công thức chuẩn: [Σ SL quy đổi / Σ ĐM theo nhân công] × 100</div>
              <div className="text-purple-950 font-bold pt-1 border-t border-purple-100 flex items-center justify-between">
                <span>PXLR Tháng 9:</span>
                <span className="text-purple-700 font-extrabold text-sm">{liveSyncSummary.month09.nsldPXLR}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN POWERPOINT PRESENTATION DECK ================= */}
      {/* 7 Slide được bố trí liên tục từ trên xuống để người dùng có thể lăn chuột hoặc phím mũi tên mượt mà giống PowerPoint */}
      <div className="w-full space-y-8 print:space-y-0">

        {/* ================= SLIDE 1 CONTAINER: BÁO CÁO TỔNG THỂ ================= */}
        <section id="powerpoint-slide-1" ref={slide1Ref} className="scroll-mt-32 print:break-after-page">
          {/* Header indicator bar above Slide 1 */}
          {showNotes && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-2 select-none print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  1
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Slide 1: Báo Cáo Tổng Thể - Executive Summary (Toàn Phân Xưởng)
                </span>
              </div>
              <button 
                onClick={() => scrollToSlide(2)}
                className="text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-full border border-teal-200"
              >
                <span>Lăn chuột xuống xem Slide 2</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Slide 1 Presentation Layout: Executive Summary */}
          <ExecutiveSummaryCard isSlideView={true} isFullscreen={false} />
        </section>

        {/* ================= POWERPOINT SLIDE CONNECTOR 1 -> 2 ================= */}
        {showNotes && (
          <div className="flex items-center justify-center gap-4 py-4 select-none print:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
            <button
              onClick={() => scrollToSlide(2)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-300 hover:border-teal-300 transition-all shadow-xs cursor-pointer group"
              title="Bấm hoặc lăn chuột từ trên xuống để chuyển sang Slide 2: Năng Suất"
            >
              <TrendingUp className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              <span>Lăn chuột từ trên xuống để xem Slide 2 (Năng Suất)</span>
              <ChevronDown className="w-4 h-4 text-teal-600 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
          </div>
        )}
        
        {/* ================= SLIDE 2 CONTAINER: NĂNG SUẤT ================= */}
        <section id="powerpoint-slide-2" ref={slide2Ref} className="scroll-mt-32 print:break-after-page">
          {/* Header indicator bar above Slide 2 */}
          {showNotes && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-2 select-none print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  2
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Slide 2: Báo Cáo Năng Suất (PXLR, DCRO, DCBG)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollToSlide(1)}
                  className="text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Cuộn lên Slide 1</span>
                </button>
                <button 
                  onClick={() => scrollToSlide(3)}
                  className="text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200"
                >
                  <span>Cuộn xuống Slide 3</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Slide 2 Presentation Layout */}
          <Slide1ProductivityPresentation data={slideData} isFullscreen={false} />
        </section>

        {/* ================= POWERPOINT SLIDE CONNECTOR 2 -> 3 ================= */}
        {showNotes && (
          <div className="flex items-center justify-center gap-4 py-4 select-none print:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
            <button
              onClick={() => scrollToSlide(3)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-300 transition-all shadow-xs cursor-pointer group"
              title="Bấm hoặc lăn chuột từ trên xuống để chuyển sang Slide 3: Chất Lượng"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Lăn chuột từ trên xuống để xem Slide 3 (Chất Lượng)</span>
              <ChevronDown className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
          </div>
        )}

        {/* ================= SLIDE 3 CONTAINER: CHẤT LƯỢNG ================= */}
        <section id="powerpoint-slide-3" ref={slide3Ref} className="scroll-mt-32 print:break-after-page">
          {/* Header indicator bar above Slide 3 */}
          {showNotes && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-2 select-none print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  3
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Slide 3: Báo Cáo Chất Lượng (Tỷ Lệ Lỗi 4M & Vật Tư)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollToSlide(2)}
                  className="text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-full border border-teal-200"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Cuộn lên Slide 2</span>
                </button>
                <button 
                  onClick={() => scrollToSlide(4)}
                  className="text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200"
                >
                  <span>Cuộn xuống Slide 4</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Slide 3 Presentation Layout */}
          <Slide2QualityPresentation 
            data={slide2Data} 
            isFullscreen={false} 
            onTimeFrameChange={handleTimeFrameChangeSlide2}
            onOpenEditor={() => setIsSlide2EditorOpen(true)}
          />
        </section>

        {/* ================= POWERPOINT SLIDE CONNECTOR 3 -> 4 ================= */}
        {showNotes && (
          <div className="flex items-center justify-center gap-4 py-4 select-none print:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
            <button
              onClick={() => scrollToSlide(4)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-300 hover:border-amber-300 transition-all shadow-xs cursor-pointer group"
              title="Bấm hoặc lăn chuột từ trên xuống để chuyển sang Slide 4: Tỉ Lệ Hàng Hư Hỏng & Tổn Thất"
            >
              <Coins className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Lăn chuột từ trên xuống để xem Slide 4 (Tỉ Lệ Hư Hỏng & Tổn Thất)</span>
              <ChevronDown className="w-4 h-4 text-amber-600 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
          </div>
        )}

        {/* ================= SLIDE 4 CONTAINER: HƯ HỎNG & TỔN THẤT ================= */}
        <section id="powerpoint-slide-4" ref={slide4Ref} className="scroll-mt-32">
          {/* Header indicator bar above Slide 4 */}
          {showNotes && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-2 select-none print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  4
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Slide 4: Tỉ Lệ Hàng Hư Hỏng & Chi Phí Tổn Thất Vật Tư
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollToSlide(3)}
                  className="text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Cuộn lên Slide 3</span>
                </button>
                <button 
                  onClick={() => scrollToSlide(5)}
                  className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200"
                >
                  <span>Cuộn xuống Slide 5</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Slide 4 Presentation Layout */}
          <Slide3DefectCostPresentation 
            data={slide3Data} 
            isFullscreen={false} 
            onOpenEditor={() => setIsSlide3EditorOpen(true)}
            onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
          />
        </section>

        {/* ================= POWERPOINT SLIDE CONNECTOR 4 -> 5 ================= */}
        {showNotes && (
          <div className="flex items-center justify-center gap-4 py-4 select-none print:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
            <button
              onClick={() => scrollToSlide(5)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300 hover:border-emerald-300 transition-all shadow-xs cursor-pointer group"
              title="Bấm hoặc lăn chuột từ trên xuống để chuyển sang Slide 5: Mục tiêu sản xuất tiếp theo"
            >
              <Target className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Lăn chuột từ trên xuống để xem Slide 5 (Mục tiêu sản xuất tiếp theo)</span>
              <ChevronDown className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
          </div>
        )}

        {/* ================= SLIDE 5 CONTAINER: MỤC TIÊU SẢN XUẤT ================= */}
        <section id="powerpoint-slide-5" ref={slide5Ref} className="scroll-mt-32">
          {/* Header indicator bar above Slide 5 */}
          {showNotes && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-2 select-none print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  5
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Slide 5: Mục Tiêu Sản Xuất Tiếp Theo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollToSlide(4)}
                  className="text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Cuộn lên Slide 4</span>
                </button>
                <button 
                  onClick={() => scrollToSlide(6)}
                  className="text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200"
                >
                  <span>Cuộn xuống Slide 6</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Slide 5 Presentation Layout */}
          <Slide4ProductionTargetPresentation 
            data={slide4Data} 
            isFullscreen={false} 
            onOpenEditor={() => setIsSlide4EditorOpen(true)}
            showNotes={showNotes}
          />
        </section>

        {/* ================= POWERPOINT SLIDE CONNECTOR 5 -> 6 ================= */}
        {showNotes && (
          <div className="flex items-center justify-center gap-4 py-4 select-none print:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
            <button
              onClick={() => scrollToSlide(6)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-300 transition-all shadow-xs cursor-pointer group"
              title="Bấm hoặc lăn chuột từ trên xuống để chuyển sang Slide 6: Kế hoạch sản xuất tuần tiếp theo"
            >
              <ClipboardList className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Lăn chuột từ trên xuống để xem Slide 6 (Kế hoạch sản xuất tuần tiếp theo)</span>
              <ChevronDown className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
          </div>
        )}

        {/* ================= SLIDE 6 CONTAINER: KẾ HOẠCH SẢN XUẤT ================= */}
        <section id="powerpoint-slide-6" ref={slide6Ref} className="scroll-mt-32">
          {/* Header indicator bar above Slide 6 */}
          {showNotes && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-2 select-none print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  6
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Slide 6: Kế Hoạch Sản Xuất Tuần Tiếp Theo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollToSlide(5)}
                  className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Cuộn lên Slide 5</span>
                </button>
                <button 
                  onClick={() => scrollToSlide(7)}
                  className="text-indigo-700 hover:text-indigo-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200"
                >
                  <span>Cuộn xuống Slide 7</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Slide 6 Presentation Layout */}
          <Slide5ProductionPlanPresentation 
            data={slide5Data} 
            isFullscreen={false} 
            onOpenEditor={() => setIsSlide5EditorOpen(true)}
            showNotes={showNotes}
          />
        </section>

        {/* ================= POWERPOINT SLIDE CONNECTOR 6 -> 7 ================= */}
        {showNotes && (
          <div className="flex items-center justify-center gap-4 py-4 select-none print:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
            <button
              onClick={() => scrollToSlide(7)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-300 hover:border-indigo-300 transition-all shadow-xs cursor-pointer group"
              title="Bấm hoặc lăn chuột từ trên xuống để chuyển sang Slide 7: Kế hoạch công việc chi tiết"
            >
              <Clock className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Lăn chuột từ trên xuống để xem Slide 7 (Kế hoạch công việc chi tiết)</span>
              <ChevronDown className="w-4 h-4 text-indigo-600 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-200 flex-1 max-w-sm" />
          </div>
        )}

        {/* ================= SLIDE 7 CONTAINER: KẾ HOẠCH CÔNG VIỆC ================= */}
        <section id="powerpoint-slide-7" ref={slide7Ref} className="scroll-mt-32">
          {/* Header indicator bar above Slide 7 */}
          {showNotes && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-2 select-none print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#4472c4] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  7
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Slide 7: Kế Hoạch Công Việc Chi Tiết
                </span>
              </div>
              <button 
                onClick={() => scrollToSlide(6)}
                className="text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Cuộn lên Slide 6</span>
              </button>
            </div>
          )}

          {/* Slide 7 Presentation Layout */}
          <Slide6TaskPlanPresentation 
            data={slide6Data} 
            isFullscreen={false} 
            onOpenEditor={() => setIsSlide6EditorOpen(true)}
          />
        </section>
      </div>

      {/* ================= FULLSCREEN PRESENTATION MODE ================= */}
      {isFullscreen && (
        <div 
          ref={fullscreenContainerRef}
          onScroll={handleFullscreenScroll}
          className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto snap-y snap-mandatory flex flex-col items-center select-none scroll-smooth"
        >
          {/* Close Button Top-Right */}
          <button
            onClick={() => setIsFullscreen(false)}
            className={`fixed top-4 right-4 z-50 p-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-full transition-all duration-500 cursor-pointer shadow-lg border border-slate-700 ${
              showFullscreenToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title="Thoát toàn màn hình (Phím ESC)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Bottom Floating Navigation Toolbar */}
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl border border-slate-700/80 select-none flex-wrap justify-center transition-all duration-500 ${
            showFullscreenToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
          }`}>
            <button
              onClick={() => {
                setActiveSlide(1);
                slide1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSlide === 1 ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S1 Tổng Thể</span>
            </button>
            <button
              onClick={() => {
                setActiveSlide(2);
                slide2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSlide === 2 ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S2 Năng Suất</span>
            </button>
            <button
              onClick={() => {
                setActiveSlide(3);
                slide3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSlide === 3 ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S3 Chất Lượng</span>
            </button>
            <button
              onClick={() => {
                setActiveSlide(4);
                slide4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSlide === 4 ? 'bg-amber-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S4 Hư Hỏng</span>
            </button>
            <button
              onClick={() => {
                setActiveSlide(5);
                slide5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSlide === 5 ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S5 Mục Tiêu</span>
            </button>
            <button
              onClick={() => {
                setActiveSlide(6);
                slide6Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSlide === 6 ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S6 Kế Hoạch</span>
            </button>
            <button
              onClick={() => {
                setActiveSlide(7);
                slide7Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSlide === 7 ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S7 Công Việc</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <button
              onClick={() => {
                const prev = activeSlide > 1 ? ((activeSlide - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 1;
                scrollToSlide(prev);
              }}
              disabled={activeSlide === 1}
              className="p-1 hover:bg-slate-800 rounded-full disabled:opacity-30 cursor-pointer"
              title="Lên Slide trước (Phím ↑)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-300 px-1">
              {activeSlide} / 7
            </span>
            <button
              onClick={() => {
                const next = activeSlide < 7 ? ((activeSlide + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7) : 7;
                scrollToSlide(next);
              }}
              disabled={activeSlide === 7}
              className="p-1 hover:bg-slate-800 rounded-full disabled:opacity-30 cursor-pointer"
              title="Xuống Slide tiếp (Phím ↓)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />
            <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1">
              <Mouse className="w-3 h-3 text-slate-400" />
              <span>Lăn chuột để chuyển • ESC thoát</span>
            </span>
          </div>

          {/* Fullscreen Slide 1 View: Executive Summary */}
          <div className="snap-start min-h-screen h-screen w-full flex items-center justify-center p-4 sm:p-8 shrink-0">
            <ExecutiveSummaryCard isSlideView={true} isFullscreen={true} />
          </div>

          {/* Fullscreen Slide 2 View: Productivity */}
          <div className="snap-start min-h-screen h-screen w-full flex items-center justify-center p-4 sm:p-8 shrink-0">
            <Slide1ProductivityPresentation data={slideData} isFullscreen={true} />
          </div>

          {/* Fullscreen Slide 3 View: Quality */}
          <div className="snap-start min-h-screen h-screen w-full flex items-center justify-center p-4 sm:p-8 shrink-0">
            <Slide2QualityPresentation 
              data={slide2Data} 
              isFullscreen={true} 
              onTimeFrameChange={handleTimeFrameChangeSlide2}
              onOpenEditor={() => setIsSlide2EditorOpen(true)}
            />
          </div>

          {/* Fullscreen Slide 4 View: Defect Cost */}
          <div className="snap-start min-h-screen h-screen w-full flex items-center justify-center p-4 sm:p-8 shrink-0">
            <Slide3DefectCostPresentation 
              data={slide3Data} 
              isFullscreen={true} 
              onOpenEditor={() => setIsSlide3EditorOpen(true)}
              onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
            />
          </div>

          {/* Fullscreen Slide 5 View: Production Target */}
          <div className="snap-start min-h-screen h-screen w-full flex items-center justify-center p-4 sm:p-8 shrink-0">
            <Slide4ProductionTargetPresentation 
              data={slide4Data} 
              isFullscreen={true} 
              onOpenEditor={() => setIsSlide4EditorOpen(true)}
              showNotes={showNotes}
            />
          </div>

          {/* Fullscreen Slide 6 View: Production Plan */}
          <div className="snap-start min-h-screen h-screen w-full flex items-center justify-center p-4 sm:p-8 shrink-0">
            <Slide5ProductionPlanPresentation 
              data={slide5Data} 
              isFullscreen={true} 
              onOpenEditor={() => setIsSlide5EditorOpen(true)}
              showNotes={showNotes}
            />
          </div>

          {/* Fullscreen Slide 7 View: Task Plan */}
          <div className="snap-start min-h-screen h-screen w-full flex items-center justify-center p-4 sm:p-8 shrink-0">
            <Slide6TaskPlanPresentation 
              data={slide6Data} 
              isFullscreen={true} 
              onOpenEditor={() => setIsSlide6EditorOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Quick Summary Reference Card */}
      {showNotes && (
        <>
          {activeSlide === 1 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Bảng Tóm Tắt & Hướng Dẫn Điều Hành Slide 1 (Báo Cáo Tổng Thể)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30 space-y-1.5">
                  <div className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>1. KHSX & THỰC HIỆN</span>
                  </div>
                  <p className="text-slate-600">
                    Kế hoạch lấy từ KHSX Ngày của từng Line (RO, BG). Thực hiện lấy trực tiếp từ Sản Lượng Quy Đổi Line Chính và Tổ RMA.
                  </p>
                </div>

                <div className="border border-teal-200 rounded-lg p-3 bg-teal-50/30 space-y-1.5">
                  <div className="font-bold text-teal-900 text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span>2. NSLĐ & TỈ LỆ ĐI LÀM</span>
                  </div>
                  <p className="text-slate-600">
                    Mục tiêu NSLĐ ≥ 120% (hoặc ≥ 100%). Tỉ lệ đi làm chuyên cần định mức ≥ 95%. Hệ thống tự động Highlight Đạt / Chưa Đạt trực quan.
                  </p>
                </div>

                <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/30 space-y-1.5">
                  <div className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>3. TỈ LỆ LỖI & HƯ HỎNG</span>
                  </div>
                  <p className="text-slate-600">
                    Định mức 4M (PXLR 7.38%, RO 5.20%, BG 7.74%). Chi phí hư hỏng theo ngân sách định mức hoặc đạt Zero Defect (0 lỗi, 0đ).
                  </p>
                </div>
              </div>
            </div>
          ) : activeSlide === 2 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Bảng Tra Cứu Nhanh Dữ Liệu Năng Suất Slide 2
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* PXLR Card */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-[#0284c7] text-sm mb-2 flex items-center justify-between">
                    <span>NSLĐ THÁNG PXLR</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold">
                      Công thức tuyệt đối
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Theo Tuần</div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1">Tuần 35: <Lock className="w-2.5 h-2.5 text-amber-600" /></span>
                      <span className="font-mono font-bold text-slate-700">{slideData.pxlr.weekly.find(w => w.id === 'pxlr-w35')?.value}%</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">Tuần 36: <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono font-bold text-emerald-700">{slideData.pxlr.weekly.find(w => w.id === 'pxlr-w36')?.value}%</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">Tuần 37: <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono font-bold text-emerald-700">{slideData.pxlr.weekly.find(w => w.id === 'pxlr-w37')?.value}%</span>
                    </div>

                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mt-2 mb-0.5">Theo Tháng</div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60 text-slate-500">
                      <span>Tháng 6, 7, 8 (Cũ):</span>
                      <span className="font-mono">131.6% | 135.5% | 133.6%</span>
                    </div>
                    <div className="flex justify-between py-0.5 font-bold text-purple-900 bg-purple-50/80 px-1 rounded">
                      <span className="flex items-center gap-1">Tháng 9 (Tự động): <Zap className="w-2.5 h-2.5 text-purple-600" /></span>
                      <span className="font-mono text-purple-700 font-extrabold">{slideData.pxlr.monthly.find(m => m.id === 'pxlr-m09')?.value}%</span>
                    </div>
                  </div>
                </div>

                {/* RO Card */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-[#0284c7] text-sm mb-2 flex items-center justify-between">
                    <span>NSLĐ THÁNG RO</span>
                    <span className="text-[11px] text-slate-400">Định mức ~86.99%</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Theo Tuần</div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1">Tuần 35: <Lock className="w-2.5 h-2.5 text-amber-600" /></span>
                      <span className="font-mono font-bold text-slate-700">{slideData.ro.weekly.find(w => w.id === 'ro-w35')?.value}%</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">Tuần 36: <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono font-bold text-emerald-700">{slideData.ro.weekly.find(w => w.id === 'ro-w36')?.value}%</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">Tuần 37: <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono font-bold text-emerald-700">{slideData.ro.weekly.find(w => w.id === 'ro-w37')?.value}%</span>
                    </div>

                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mt-2 mb-0.5">Theo Tháng</div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60 text-slate-500">
                      <span>Tháng 7, 8 (Cũ):</span>
                      <span className="font-mono">117.1% | 111.2%</span>
                    </div>
                    <div className="flex justify-between py-0.5 font-bold text-teal-900 bg-teal-50/80 px-1 rounded">
                      <span className="flex items-center gap-1">Tháng 9 (Tự động): <Zap className="w-2.5 h-2.5 text-teal-600" /></span>
                      <span className="font-mono text-teal-700 font-extrabold">{slideData.ro.monthly.find(m => m.id === 'ro-m09')?.value}%</span>
                    </div>
                  </div>
                </div>

                {/* BG Card */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-[#0284c7] text-sm mb-2 flex items-center justify-between">
                    <span>NSLĐ THÁNG BẾP GA</span>
                    <span className="text-[11px] text-slate-400">Định mức ~13.01%</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Theo Tuần</div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1">Tuần 35: <Lock className="w-2.5 h-2.5 text-amber-600" /></span>
                      <span className="font-mono font-bold text-slate-700">{slideData.bg.weekly.find(w => w.id === 'bg-w35')?.value}%</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">Tuần 36: <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono font-bold text-emerald-700">{slideData.bg.weekly.find(w => w.id === 'bg-w36')?.value}%</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">Tuần 37: <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono font-bold text-emerald-700">{slideData.bg.weekly.find(w => w.id === 'bg-w37')?.value}%</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">Tuần 38: <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono font-bold text-emerald-700">{slideData.bg.weekly.find(w => w.id === 'bg-w38')?.value}%</span>
                    </div>

                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mt-2 mb-0.5">Theo Tháng</div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200/60 text-slate-500">
                      <span>Tháng 7, 8 (Cũ):</span>
                      <span className="font-mono">87.1% | 108.2%</span>
                    </div>
                    <div className="flex justify-between py-0.5 font-bold text-emerald-900 bg-emerald-50/80 px-1 rounded">
                      <span className="flex items-center gap-1">Tháng 9 (Tự động): <Zap className="w-2.5 h-2.5 text-emerald-600" /></span>
                      <span className="font-mono text-emerald-700 font-extrabold">{slideData.bg.monthly.find(m => m.id === 'bg-m09')?.value}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSlide === 3 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Bảng Tra Cứu Nhanh Dữ Liệu Chất Lượng Slide 3 (Tỷ Lệ Lỗi 4M & Vật Tư)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* PXLR Quality Card */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-[#0284c7] text-sm mb-2 flex items-center justify-between">
                    <span>CHẤT LƯỢNG PXLR</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                      ĐM 4M: {slide2Data.pxlr?.benchmarkDmLoi ?? 7.38}%
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Diễn biến theo tháng</div>
                    {(slide2Data.pxlr?.items || []).map(m => (
                      <div key={m.id || m.month} className="flex justify-between py-0.5 border-b border-slate-200/60">
                        <span className="font-medium text-slate-700">Tháng {m.month}:</span>
                        <span className="font-mono">
                          VT: <strong className="text-sky-700">{m.vatTu}%</strong> | 4M: <strong className="text-rose-600">{m.totalLoi4M}%</strong>
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 text-[11px] text-slate-500">
                      Định mức vật tư tham chiếu: <span className="font-bold text-slate-700">{slide2Data.pxlr?.items?.[0]?.dmVatTu ?? 3.69}%</span>
                    </div>
                  </div>
                </div>

                {/* Line RO Quality Card */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-[#0284c7] text-sm mb-2 flex items-center justify-between">
                    <span>LINE RO</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                      ĐM 4M: {slide2Data.ro?.benchmarkDmLoi ?? 5.2}%
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Diễn biến theo tháng</div>
                    {(slide2Data.ro?.items || []).map(m => (
                      <div key={m.id || m.month} className="flex justify-between py-0.5 border-b border-slate-200/60">
                        <span className="font-medium text-slate-700">Tháng {m.month}:</span>
                        <span className="font-mono">
                          VT: <strong className="text-sky-700">{m.vatTu}%</strong> | 4M: <strong className="text-rose-600">{m.totalLoi4M}%</strong>
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 text-[11px] text-slate-500">
                      Định mức vật tư tham chiếu: <span className="font-bold text-slate-700">{slide2Data.ro?.items?.[0]?.dmVatTu ?? 2.4}%</span>
                    </div>
                  </div>
                </div>

                {/* Line Bếp Ga Quality Card */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-[#0284c7] text-sm mb-2 flex items-center justify-between">
                    <span>LINE BẾP GA</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                      ĐM 4M: {slide2Data.bg?.benchmarkDmLoi ?? 7.74}%
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Diễn biến theo tháng</div>
                    {(slide2Data.bg?.items || []).map(m => (
                      <div key={m.id || m.month} className="flex justify-between py-0.5 border-b border-slate-200/60">
                        <span className="font-medium text-slate-700">Tháng {m.month}:</span>
                        <span className="font-mono">
                          VT: <strong className="text-sky-700">{m.vatTu}%</strong> | 4M: <strong className="text-rose-600">{m.totalLoi4M}%</strong>
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 text-[11px] text-slate-500">
                      Định mức vật tư tham chiếu: <span className="font-bold text-slate-700">{slide2Data.bg?.items?.[0]?.dmVatTu ?? 4.03}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Defect & Countermeasure list in Quick Card */}
              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    {slide2Data.keyDefects?.title || 'Các lỗi 4M trọng điểm (Tháng 8):'}
                  </span>
                  <ul className="space-y-1 text-slate-600">
                    {(slide2Data.keyDefects?.items || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    {slide2Data.countermeasures?.title || 'Kế hoạch cải tiến & Đối sách (Tháng 9):'}
                  </span>
                  <ul className="space-y-1 text-slate-600">
                    {(slide2Data.countermeasures?.items || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-200" />
                <h3 className="font-bold text-base">Chỉnh Sửa Số Liệu Năng Suất Slide 1</h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 text-teal-100 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Titles Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tiêu Đề Slide (Header)
                  </label>
                  <input
                    type="text"
                    value={editingData.title}
                    onChange={e => setEditingData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên Mục Báo Cáo (SubTitle)
                  </label>
                  <input
                    type="text"
                    value={editingData.subTitle}
                    onChange={e => setEditingData(prev => ({ ...prev, subTitle: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Năng Suất"
                  />
                </div>
              </div>

              {/* Formula Automation Switch */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-950">
                      Tự động tính PXLR theo công thức tuyệt đối: NSLĐ = Σ(SL) / Σ(Định Mức)
                    </div>
                    <div className="text-[11px] text-purple-700">
                      Khi bật: Sửa số liệu RO hoặc BG sẽ tự động tính chính xác 100% cột PXLR (Tháng 9 & các Tuần) theo trọng số chuẩn.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalculatePXLR}
                    onChange={e => setAutoCalculatePXLR(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Navigation Tabs for 3 Sections */}
              <div className="flex border-b border-slate-200 gap-2">
                <button
                  onClick={() => setActiveEditSection('pxlr')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeEditSection === 'pxlr'
                      ? 'bg-purple-100/60 border-b-2 border-purple-600 text-purple-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  1. Phân Xưởng Lắp Ráp (PXLR)
                </button>
                <button
                  onClick={() => setActiveEditSection('ro')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeEditSection === 'ro'
                      ? 'bg-teal-100/60 border-b-2 border-teal-600 text-teal-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  2. Nhóm Lắp Ráp RO (DCRO)
                </button>
                <button
                  onClick={() => setActiveEditSection('bg')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeEditSection === 'bg'
                      ? 'bg-emerald-100/60 border-b-2 border-emerald-600 text-emerald-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  3. Nhóm Lắp Ráp Bếp Gas (DCBG)
                </button>
              </div>

              {/* Real-time Formula Callout for PXLR */}
              {activeEditSection === 'pxlr' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-purple-700" />
                    <span>Công thức tuyệt đối phân xưởng (PXLR = Σ Sản Lượng / Σ Định Mức)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-purple-950">
                    <div className="bg-white/80 p-2 rounded border border-purple-100">
                      <span className="font-bold text-purple-800">Tháng 9:</span> ({editingData.ro.monthly.find(m => m.id === 'ro-m09')?.value}% × 86.99%) + ({editingData.bg.monthly.find(m => m.id === 'bg-m09')?.value}% × 13.01%) = <strong className="text-purple-700 text-xs">{editingData.pxlr.monthly.find(m => m.id === 'pxlr-m09')?.value}%</strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-purple-100">
                      <span className="font-bold text-purple-800">Tuần 37:</span> ({editingData.ro.weekly.find(w => w.id === 'ro-w37')?.value}% × 86.57%) + ({editingData.bg.weekly.find(w => w.id === 'bg-w37')?.value}% × 13.43%) = <strong className="text-purple-700 text-xs">{editingData.pxlr.weekly.find(w => w.id === 'pxlr-w37')?.value}%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    Số Liệu Theo Tuần (Biểu đồ trên)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Tuần 35: Dữ liệu cũ (Tháng 8) • Tuần 36, 37, 38: Dữ liệu mới (Tháng 9)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {editingData[activeEditSection].weekly.map(item => {
                    const isOld = isHistoricalItem(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`border rounded-lg p-2.5 transition-all ${
                          isOld 
                            ? 'bg-slate-50/80 border-slate-200' 
                            : 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-800">
                            {item.label}
                          </label>
                          {isOld ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Dữ liệu cũ
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" /> Tự động
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={item.value}
                            onChange={e =>
                              handleValueChange(
                                activeEditSection,
                                'weekly',
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <span className="text-xs font-bold text-slate-500">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    Số Liệu Theo Tháng (Biểu đồ dưới)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Tháng 6, 7, 8: Dữ liệu cũ • Tháng 9: Dữ liệu mới (Tự động chạy)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {editingData[activeEditSection].monthly.map(item => {
                    const isOld = isHistoricalItem(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`border rounded-lg p-2.5 transition-all ${
                          isOld 
                            ? 'bg-slate-50/80 border-slate-200' 
                            : 'bg-purple-50/50 border-purple-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-800">
                            {item.label}
                          </label>
                          {isOld ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Dữ liệu cũ
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" /> Tự động
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={item.value}
                            onChange={e =>
                              handleValueChange(
                                activeEditSection,
                                'monthly',
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <span className="text-xs font-bold text-slate-500">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const initial = StorageService.resetSlide1NSLD();
                  setEditingData(initial);
                }}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục ban đầu
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={handleSaveData}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Lưu Thay Đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Slide 2 Editor Modal */}
      {isSlide2EditorOpen && (
        <Slide2EditorModal
          isOpen={isSlide2EditorOpen}
          initialData={slide2Data}
          onClose={() => setIsSlide2EditorOpen(false)}
          onSave={handleSaveSlide2}
          onReset={handleResetSlide2}
        />
      )}
      {/* Slide 3 Editor Modal */}
      {isSlide3EditorOpen && (
        <Slide3EditorModal
          isOpen={isSlide3EditorOpen}
          initialData={slide3Data}
          onClose={() => setIsSlide3EditorOpen(false)}
          onSave={handleSaveSlide3}
          onReset={handleResetSlide3}
        />
      )}

      {/* Slide 4 Editor Modal */}
      {isSlide4EditorOpen && (
        <Slide4EditorModal
          isOpen={isSlide4EditorOpen}
          initialData={slide4Data}
          onClose={() => setIsSlide4EditorOpen(false)}
          onSave={handleSaveSlide4}
          onReset={handleResetSlide4}
        />
      )}

      {/* Slide 5 Editor Modal */}
      {isSlide5EditorOpen && (
        <Slide5EditorModal
          isOpen={isSlide5EditorOpen}
          data={slide5Data}
          onClose={() => setIsSlide5EditorOpen(false)}
          onSave={handleSaveSlide5}
          onReset={handleResetSlide5}
        />
      )}

      {/* Slide 6 Editor Modal */}
      {isSlide6EditorOpen && (
        <Slide6EditorModal
          isOpen={isSlide6EditorOpen}
          data={slide6Data}
          onClose={() => setIsSlide6EditorOpen(false)}
          onSave={handleSaveSlide6}
          onReset={handleResetSlide6}
        />
      )}

      {/* Excel Import Modal */}
      {isExcelImportModalOpen && (
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
          currentData={slide3Data}
          onApplyImport={handleApplyExcelImport}
          productivityHistory={monthlyHistory}
        />
      )}
    </div>
  );
};

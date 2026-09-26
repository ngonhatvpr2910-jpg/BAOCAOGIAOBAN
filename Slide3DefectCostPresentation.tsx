import React, { useState, useMemo, useEffect } from 'react';
import { SlideDefectCostData, DamagedItemRecord, SlideBarItem } from './types';
import { exportDefectCostTemplate } from './excelDefectService';
import {
  computeWeeklyAggregations,
  computeMonthlyAggregations,
  isSameWeek,
  isItemInMonth,
  getWeeksInMonth,
  MONTH_WEEKS_MAP
} from './defectCostSyncService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList
} from 'recharts';
import { 
  Edit3, 
  Search, 
  TrendingDown, 
  AlertTriangle, 
  Coins, 
  Download,
  Upload,
  FileSpreadsheet,
  Calendar,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Activity,
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  SlidersHorizontal
} from 'lucide-react';

interface Slide3DefectCostPresentationProps {
  data: SlideDefectCostData;
  isFullscreen?: boolean;
  onOpenEditor?: () => void;
  onOpenExcelImport?: () => void;
}

const formatCurrency = (val: number | undefined): string => {
  if (val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const Slide3DefectCostPresentation: React.FC<Slide3DefectCostPresentationProps> = ({
  data,
  isFullscreen = false,
  onOpenEditor,
  onOpenExcelImport,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'both' | 'week' | 'month'>(
    data.activeChartTab || 'both'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightOnly, setHighlightOnly] = useState(false);
  const [filterByPeriod, setFilterByPeriod] = useState(true);
  const [selectedWeekLabel, setSelectedWeekLabel] = useState<string>('');
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState<'week' | 'month'>('week');
  const [rightTableView, setRightTableView] = useState<'line_split' | 'pareto_analysis'>('line_split');

  // Chế độ dữ liệu của Bảng Phân Tích: Mặc định 'all' (Lấy dữ liệu từ tất cả các data được cập nhật)
  const [analysisScope, setAnalysisScope] = useState<'all' | 'period'>('all');
  const [analysisFilterWeek, setAnalysisFilterWeek] = useState<string>('all');
  const [isGroupedByCode, setIsGroupedByCode] = useState<boolean>(true);

  // Slider state for Week view - Hỗ trợ kéo xem quá khứ & hiện tại, xem tất cả tuần
  const [weeksToShow, setWeeksToShow] = useState<number>(4);
  const [showAllWeeks, setShowAllWeeks] = useState<boolean>(false);

  // 1. Tự động đồng bộ và tính toán dữ liệu Tuần từ tất cả các linh kiện vật tư cập nhật
  const { weeklyData, weeklyTotals } = useMemo(() => {
    return computeWeeklyAggregations(data.itemsRO || [], data.itemsBG || [], data.weeklyData);
  }, [data.itemsRO, data.itemsBG, data.weeklyData]);

  // 2. Chạy theo dữ liệu tuần và logic cả dữ liệu tháng theo data ("chay theo dữ liệu tuần và logic cả dữ liệu tháng theo data")
  // Tháng 9 = Tổng các tuần W36, W37, W38, W39, W40 của Tháng 9
  const { monthlyData, monthlyTotals } = useMemo(() => {
    return computeMonthlyAggregations(weeklyData, weeklyTotals, data.itemsRO || [], data.itemsBG || [], data.monthlyData);
  }, [weeklyData, weeklyTotals, data.itemsRO, data.itemsBG, data.monthlyData]);

  const totalWeeks = weeklyData.length;
  const maxStartIndex = Math.max(0, totalWeeks - weeksToShow);

  // Tìm tuần mới nhất có phát sinh dữ liệu (ưu tiên tuần cao nhất có dữ liệu vật tư hoặc biểu đồ)
  const latestWeekWithData = useMemo(() => {
    const all = [...(data.itemsRO || []), ...(data.itemsBG || [])];
    const itemWeeks = all
      .map(i => i.week)
      .filter((w): w is string => Boolean(w))
      .map(w => {
        const m = w.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      })
      .filter(n => n > 0);

    if (itemWeeks.length > 0) {
      return `W${Math.max(...itemWeeks)}`;
    }

    const chartWeeksWithVal = weeklyData
      .filter(w => (Number(w.value) || 0) > 0)
      .map(w => {
        const m = w.label.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      })
      .filter(n => n > 0);

    if (chartWeeksWithVal.length > 0) {
      return `W${Math.max(...chartWeeksWithVal)}`;
    }

    return weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].label : 'W39';
  }, [data.itemsRO, data.itemsBG, weeklyData]);

  // Vị trí index của tuần mới nhất (ví dụ W39)
  const latestWeekIndex = useMemo(() => {
    if (!latestWeekWithData || weeklyData.length === 0) return Math.max(0, weeklyData.length - 1);
    const idx = weeklyData.findIndex(w => isSameWeek(w.label, latestWeekWithData));
    return idx >= 0 ? idx : Math.max(0, weeklyData.length - 1);
  }, [weeklyData, latestWeekWithData]);

  // Khởi tạo weekStartIndex trỏ ngay đến tuần hiện tại/mới nhất (W39) để biểu đồ luôn xem được W39
  const [weekStartIndex, setWeekStartIndex] = useState<number>(() => {
    const allCount = (data.weeklyData || []).length || 9;
    return Math.max(0, allCount - 4);
  });

  // Set default selected week to the latest week with data (e.g. W39)
  useEffect(() => {
    if (!selectedWeekLabel && latestWeekWithData) {
      setSelectedWeekLabel(latestWeekWithData);
    }
    if (monthlyData.length > 0 && !selectedMonthLabel) {
      setSelectedMonthLabel(monthlyData[monthlyData.length - 1].label);
    }
  }, [latestWeekWithData, monthlyData, selectedWeekLabel, selectedMonthLabel]);

  // Tự động căn chỉnh thanh trượt để tuần mới nhất (W39) luôn được hiển thị trong khung nhìn
  useEffect(() => {
    if (totalWeeks > 0) {
      if (latestWeekIndex >= 0) {
        const targetStart = Math.max(0, Math.min(latestWeekIndex - weeksToShow + 1, maxStartIndex));
        setWeekStartIndex(targetStart);
      } else {
        setWeekStartIndex(maxStartIndex);
      }
    }
  }, [totalWeeks, latestWeekIndex, maxStartIndex, weeksToShow]);

  // Nhảy nhanh về tuần mới nhất / hiện tại (W39)
  const jumpToLatest = () => {
    setShowAllWeeks(false);
    if (latestWeekIndex >= 0) {
      const targetStart = Math.max(0, Math.min(latestWeekIndex - weeksToShow + 1, maxStartIndex));
      setWeekStartIndex(targetStart);
      setSelectedWeekLabel(latestWeekWithData);
      setSelectionMode('week');
    } else {
      setWeekStartIndex(maxStartIndex);
    }
  };

  // Nhảy nhanh về các tuần quá khứ (W32)
  const jumpToPast = () => {
    setShowAllWeeks(false);
    setWeekStartIndex(0);
    if (weeklyData.length > 0) {
      setSelectedWeekLabel(weeklyData[0].label);
      setSelectionMode('week');
    }
  };

  // Cuộn thanh trượt trực tiếp đến tuần bất kỳ
  const scrollToWeek = (weekLabel: string) => {
    const idx = weeklyData.findIndex(w => isSameWeek(w.label, weekLabel));
    if (idx >= 0) {
      setSelectedWeekLabel(weeklyData[idx].label);
      setSelectionMode('week');
      if (!showAllWeeks) {
        if (idx < weekStartIndex || idx >= weekStartIndex + weeksToShow) {
          const newStart = Math.max(0, Math.min(idx - Math.floor(weeksToShow / 2), maxStartIndex));
          setWeekStartIndex(newStart);
        }
      }
    }
  };

  // Sliced weekly data for chart: Hỗ trợ xem 4 tuần, 6 tuần, hoặc Xem tất cả tuần cùng lúc
  const slicedWeeklyData = useMemo(() => {
    if (showAllWeeks) {
      return weeklyData;
    }
    return weeklyData.slice(weekStartIndex, weekStartIndex + weeksToShow);
  }, [weeklyData, showAllWeeks, weekStartIndex, weeksToShow]);

  // Kiểm tra xem tuần W39 (hoặc tuần mới nhất) có đang nằm trong khung nhìn biểu đồ không
  const isW39InView = useMemo(() => {
    if (showAllWeeks) return true;
    return slicedWeeklyData.some(w => isSameWeek(w.label, 'W39') || isSameWeek(w.label, latestWeekWithData));
  }, [showAllWeeks, slicedWeeklyData, latestWeekWithData]);

  // Kích thước cột biểu đồ tự co giãn mượt mà
  const dynamicBarSize = useMemo(() => {
    if (showAllWeeks) {
      if (weeklyData.length > 8) return 18;
      if (weeklyData.length > 6) return 22;
      return 26;
    }
    return weeksToShow === 4 ? 26 : 20;
  }, [showAllWeeks, weeklyData.length, weeksToShow]);

  // Helper so sánh tuần linh hoạt (hỗ trợ "W39", "Tuần 39", "39", "w39", ...)
  const matchWeek = (itemWeek: string | undefined, targetWeek: string): boolean => {
    if (!itemWeek || !targetWeek) return false;
    const cleanItem = itemWeek.trim().toLowerCase();
    const cleanTarget = targetWeek.trim().toLowerCase();
    if (cleanItem === cleanTarget) return true;

    const itemNum = cleanItem.match(/\d+/);
    const targetNum = cleanTarget.match(/\d+/);
    if (itemNum && targetNum && itemNum[0] === targetNum[0]) {
      return true;
    }
    return false;
  };

  const hasAnyWeekTagRO = useMemo(() => (data.itemsRO || []).some(i => Boolean(i.week)), [data.itemsRO]);
  const hasAnyWeekTagBG = useMemo(() => (data.itemsBG || []).some(i => Boolean(i.week)), [data.itemsBG]);
  const targetDisplayWeek = selectedWeekLabel || latestWeekWithData;

  // Danh sách các tuần có dữ liệu để hiển thị nút chọn nhanh
  const availableWeeks = useMemo(() => {
    const set = new Set<string>();
    (data.itemsRO || []).forEach(i => { if (i.week) set.add(i.week); });
    (data.itemsBG || []).forEach(i => { if (i.week) set.add(i.week); });
    (weeklyData || []).forEach(w => {
      const num = (w.label || '').match(/\d+/);
      if (num && parseInt(num[0], 10) >= 36) set.add(w.label);
    });
    const list = Array.from(set);
    const getWeekNum = (l: string) => {
      const m = (l || '').match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };
    list.sort((a, b) => getWeekNum(a) - getWeekNum(b));
    return list.length > 0 ? list : ['W37', 'W38', 'W39'];
  }, [data.itemsRO, data.itemsBG, weeklyData]);

  // Filter RO items: Hỗ trợ lọc theo Tuần hoặc Tháng hoặc Xem tất cả
  const filteredRO = useMemo(() => {
    return (data.itemsRO || []).filter(item => {
      const matchQuery = 
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchHighlight = highlightOnly ? item.isHighlighted : true;
      
      let matchPeriod = true;
      if (filterByPeriod) {
        if (selectionMode === 'week') {
          matchPeriod = hasAnyWeekTagRO ? isSameWeek(item.week, targetDisplayWeek) : true;
        } else {
          matchPeriod = isItemInMonth(item.week, selectedMonthLabel);
        }
      }

      return matchQuery && matchHighlight && matchPeriod;
    });
  }, [data.itemsRO, searchTerm, highlightOnly, filterByPeriod, selectionMode, targetDisplayWeek, selectedMonthLabel, hasAnyWeekTagRO]);

  // Filter BG items: Hỗ trợ lọc theo Tuần hoặc Tháng hoặc Xem tất cả
  const filteredBG = useMemo(() => {
    return (data.itemsBG || []).filter(item => {
      const matchQuery = 
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchHighlight = highlightOnly ? item.isHighlighted : true;

      let matchPeriod = true;
      if (filterByPeriod) {
        if (selectionMode === 'week') {
          matchPeriod = hasAnyWeekTagBG ? isSameWeek(item.week, targetDisplayWeek) : true;
        } else {
          matchPeriod = isItemInMonth(item.week, selectedMonthLabel);
        }
      }

      return matchQuery && matchHighlight && matchPeriod;
    });
  }, [data.itemsBG, searchTerm, highlightOnly, filterByPeriod, selectionMode, targetDisplayWeek, selectedMonthLabel, hasAnyWeekTagBG]);

  // Bảng phân tích Top vật tư linh kiện có giá trị hư hỏng cao - LẤY DỮ LIỆU TỪ TẤT CẢ CÁC DATA ĐƯỢC CẬP NHẬT
  const topHighValueItems = useMemo(() => {
    const allRO = (data.itemsRO || []).map(item => ({ 
      ...item, 
      lineType: 'RO' as const, 
      lineName: 'Line RO' 
    }));
    const allBG = (data.itemsBG || []).map(item => ({ 
      ...item, 
      lineType: 'BG' as const, 
      lineName: 'Bếp Ga' 
    }));
    const combined = [...allRO, ...allBG];

    // Lọc theo tuần nếu người dùng chọn xem riêng một tuần cụ thể, ngược lại mặc định lấy toàn bộ dữ liệu cập nhật
    let sourceList: (DamagedItemRecord & { lineType: 'RO' | 'BG'; lineName: string })[] = [];

    if (analysisFilterWeek !== 'all') {
      sourceList = combined.filter(item => isSameWeek(item.week, analysisFilterWeek));
    } else if (analysisScope === 'period' && filterByPeriod) {
      if (selectionMode === 'week') {
        sourceList = combined.filter(item => isSameWeek(item.week, targetDisplayWeek));
      } else {
        sourceList = combined.filter(item => isItemInMonth(item.week, selectedMonthLabel));
      }
    } else {
      // MẶC ĐỊNH: LẤY DỮ LIỆU TỪ TẤT CẢ CÁC DATA ĐƯỢC CẬP NHẬT
      sourceList = combined;
    }

    // Lọc tiếp theo từ khóa tìm kiếm và lọc trọng điểm nếu người dùng đang bật
    const searchFiltered = sourceList.filter(item => {
      const matchQuery = 
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchHighlight = highlightOnly ? item.isHighlighted : true;
      return matchQuery && matchHighlight;
    });

    type ProcessedItem = DamagedItemRecord & {
      lineType: 'RO' | 'BG';
      lineName: string;
      calcAmount: number;
      weekList: string[];
      occurrences: number;
    };

    let processedList: ProcessedItem[] = [];

    // Nếu đang xem "Tất cả data" và bật "Gộp cùng mã VT": gộp lại theo mã linh kiện
    if (isGroupedByCode && analysisFilterWeek === 'all' && analysisScope === 'all') {
      const groupMap = new Map<string, ProcessedItem>();

      searchFiltered.forEach(item => {
        const key = `${item.lineType}_${(item.itemCode || item.itemName).trim().toLowerCase()}`;
        const amt = item.amount || (item.quantity * item.unitPrice) || 0;
        const existing = groupMap.get(key);

        if (!existing) {
          groupMap.set(key, {
            ...item,
            calcAmount: amt,
            weekList: item.week ? [item.week] : [],
            occurrences: 1,
          });
        } else {
          existing.quantity += item.quantity;
          existing.calcAmount += amt;
          existing.isHighlighted = existing.isHighlighted || Boolean(item.isHighlighted);
          if (item.week && !existing.weekList.includes(item.week)) {
            existing.weekList.push(item.week);
          }
          existing.occurrences += 1;
        }
      });

      processedList = Array.from(groupMap.values());
    } else {
      processedList = searchFiltered.map(item => ({
        ...item,
        calcAmount: item.amount || (item.quantity * item.unitPrice) || 0,
        weekList: item.week ? [item.week] : [],
        occurrences: 1,
      }));
    }

    // Sắp xếp giảm dần theo thành tiền tổn thất
    processedList.sort((a, b) => b.calcAmount - a.calcAmount);

    const totalDefectCost = processedList.reduce((s, i) => s + i.calcAmount, 0) || 1;

    let cumulative = 0;
    return processedList.map((item, index) => {
      const percentage = Number(((item.calcAmount / totalDefectCost) * 100).toFixed(1));
      cumulative += percentage;
      return {
        ...item,
        rank: index + 1,
        percentage,
        cumulativePercent: Number(cumulative.toFixed(1)),
        isPareto: cumulative <= 80 || index === 0, // Nhóm A (Pareto 80/20)
      };
    });
  }, [
    data.itemsRO, 
    data.itemsBG, 
    analysisFilterWeek, 
    analysisScope, 
    filterByPeriod, 
    hasAnyWeekTagRO, 
    hasAnyWeekTagBG, 
    targetDisplayWeek, 
    searchTerm, 
    highlightOnly, 
    isGroupedByCode
  ]);

  const totalAnalysisAmount = useMemo(() => {
    return topHighValueItems.reduce((s, i) => s + i.calcAmount, 0);
  }, [topHighValueItems]);

  const top5Total = useMemo(() => {
    return topHighValueItems.slice(0, 5).reduce((s, i) => s + i.calcAmount, 0);
  }, [topHighValueItems]);

  const top5Percentage = useMemo(() => {
    if (!totalAnalysisAmount) return 0;
    return Number(((top5Total / totalAnalysisAmount) * 100).toFixed(1));
  }, [topHighValueItems, top5Total, totalAnalysisAmount]);

  // Historical breakdown if no raw item rows match for that period
  const historicalMonthBreakdown: Record<string, { ro: number; bg: number; total: number }> = {
    'Tháng 6': { ro: 6480000, bg: 4320000, total: 10800000 },
    'Tháng 7': { ro: 4260000, bg: 2840000, total: 7100000 },
    'Tháng 8': { ro: 3540000, bg: 2360000, total: 5900000 },
  };

  const historicalWeekBreakdown: Record<string, { ro: number; bg: number; total: number }> = {
    'W32': { ro: 1320000, bg: 880000, total: 2200000 },
    'W33': { ro: 360000, bg: 240000, total: 600000 },
    'W34': { ro: 1080000, bg: 720000, total: 1800000 },
    'W35': { ro: 840000, bg: 560000, total: 1400000 },
    'W37': { ro: 840000, bg: 560000, total: 1400000 },
    'W38': { ro: 1080000, bg: 720000, total: 1800000 },
    'W39': { ro: 0, bg: 963848, total: 963848 },
  };

  // Calculate totals for the selected week
  const rawActiveWeekTotalRO = useMemo(() => {
    return (data.itemsRO || [])
      .filter(item => matchWeek(item.week, targetDisplayWeek))
      .reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice)), 0);
  }, [data.itemsRO, targetDisplayWeek]);

  const rawActiveWeekTotalBG = useMemo(() => {
    return (data.itemsBG || [])
      .filter(item => matchWeek(item.week, targetDisplayWeek))
      .reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice)), 0);
  }, [data.itemsBG, targetDisplayWeek]);

  // Tính toán tổn thất cho Tuần đang chọn
  const activeWeekTotalRO = useMemo(() => {
    if (weeklyTotals[targetDisplayWeek]) {
      return weeklyTotals[targetDisplayWeek].ro;
    }
    return rawActiveWeekTotalRO;
  }, [weeklyTotals, targetDisplayWeek, rawActiveWeekTotalRO]);

  const activeWeekTotalBG = useMemo(() => {
    if (weeklyTotals[targetDisplayWeek]) {
      return weeklyTotals[targetDisplayWeek].bg;
    }
    return rawActiveWeekTotalBG;
  }, [weeklyTotals, targetDisplayWeek, rawActiveWeekTotalBG]);

  const activeWeekGrandTotal = useMemo(() => {
    if (weeklyTotals[targetDisplayWeek]) {
      return weeklyTotals[targetDisplayWeek].total;
    }
    return activeWeekTotalRO + activeWeekTotalBG;
  }, [weeklyTotals, targetDisplayWeek, activeWeekTotalRO, activeWeekTotalBG]);

  // Tính toán tổn thất cho Tháng đang chọn (Logic theo các tuần thuộc tháng)
  const activeMonthTotalRO = useMemo(() => {
    if (selectedMonthLabel && monthlyTotals[selectedMonthLabel]) {
      return monthlyTotals[selectedMonthLabel].ro;
    }
    return 0;
  }, [monthlyTotals, selectedMonthLabel]);

  const activeMonthTotalBG = useMemo(() => {
    if (selectedMonthLabel && monthlyTotals[selectedMonthLabel]) {
      return monthlyTotals[selectedMonthLabel].bg;
    }
    return 0;
  }, [monthlyTotals, selectedMonthLabel]);

  const activeMonthGrandTotal = useMemo(() => {
    if (selectedMonthLabel && monthlyTotals[selectedMonthLabel]) {
      return monthlyTotals[selectedMonthLabel].total;
    }
    return activeMonthTotalRO + activeMonthTotalBG;
  }, [monthlyTotals, selectedMonthLabel, activeMonthTotalRO, activeMonthTotalBG]);

  // Calculate totals
  const totalRO = useMemo(() => {
    return (data.itemsRO || []).reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice)), 0);
  }, [data.itemsRO]);

  const totalBG = useMemo(() => {
    return (data.itemsBG || []).reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice)), 0);
  }, [data.itemsBG]);

  const grandTotal = totalRO + totalBG;

  // Recalculate totals for filtered lists if showing all, or use selection totals
  const displayTotalRO = useMemo(() => {
    if (filteredRO.length > 0) {
      return filteredRO.reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice)), 0);
    }
    if (filterByPeriod) {
      return selectionMode === 'week' ? activeWeekTotalRO : activeMonthTotalRO;
    }
    return totalRO;
  }, [filteredRO, filterByPeriod, selectionMode, activeWeekTotalRO, activeMonthTotalRO, totalRO]);

  const displayTotalBG = useMemo(() => {
    if (filteredBG.length > 0) {
      return filteredBG.reduce((acc, curr) => acc + (curr.amount || (curr.quantity * curr.unitPrice)), 0);
    }
    if (filterByPeriod) {
      return selectionMode === 'week' ? activeWeekTotalBG : activeMonthTotalBG;
    }
    return totalBG;
  }, [filteredBG, filterByPeriod, selectionMode, activeWeekTotalBG, activeMonthTotalBG, totalBG]);

  return (
    <div 
      id="slide3-defect-cost-container"
      className={`bg-white shadow-xl transition-all duration-300 flex flex-col justify-between ${
        isFullscreen 
          ? 'w-full h-full max-w-[calc(95vh*16/9)] max-h-[95vh] aspect-[16/9] border-0 rounded-none mx-auto' 
          : 'w-full border border-slate-300 rounded-lg overflow-hidden'
      }`}
      style={{ minHeight: isFullscreen ? 'auto' : '780px', fontFamily: '"Times New Roman", Times, serif' }}
    >
      {/* 1. SLIDE TOP BANNER */}
      <div className="w-full flex items-stretch h-11 sm:h-13 border-b border-teal-900 select-none">
        {/* Left Red Square Block */}
        <div className="w-12 sm:w-16 bg-[#cc0000] flex-shrink-0 flex items-center justify-center">
          <span className="text-white font-black text-sm sm:text-base font-sans">DCLR</span>
        </div>

        {/* Dark Teal Header */}
        <div className="flex-1 bg-[#006064] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-black text-base sm:text-lg md:text-xl tracking-wider uppercase font-['Times_New_Roman',Times,serif]">
              BÁO CÁO TỔN THẤT & TỈ LỆ HÀNG HƯ HỎNG
            </h1>
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-amber-400 text-slate-900 shadow-xs">
              Mục Tiêu Tháng 9 & 10
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/90 text-teal-100 text-xs font-sans font-medium border border-teal-700">
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              Tổng tổn thất: <strong className="text-white font-bold">{formatCurrency(grandTotal)} VNĐ</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. SLIDE BODY */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3 font-['Times_New_Roman',Times,serif]">
        {/* SUBHEADER: Number Badge + Title + Action Controls (Standardized from Slide 1) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          {/* Standard Pill Box */}
          <div className="w-full xl:w-2/3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200/60 border border-slate-300 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-2xs">
            <span className="text-[#0284c7] font-black text-2xl sm:text-3xl leading-none">
              {data.slideNumber || '4'}
            </span>
            <div className="flex flex-col">
              <h2 className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight leading-tight">
                {data.title || 'Tỉ Lệ Hư Hỏng'}
              </h2>
              <span className="text-[11px] text-slate-500 font-sans font-medium">
                {data.weeklySubTitle || 'Chi tiết tổn thất vật tư qua các tuần'}
              </span>
            </div>
          </div>
          {/* Right Controls: Search, Highlight Filter, Edit Button */}
          <div className="flex flex-wrap items-center gap-2 font-sans">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="slide3-search-input"
                type="text"
                placeholder="Tìm mã VT hoặc tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
              />
            </div>

            {/* Highlight Toggle */}
            <button
              id="slide3-highlight-toggle"
              onClick={() => setHighlightOnly(!highlightOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                highlightOnly 
                  ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold' 
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title="Chỉ hiển thị các vật tư trọng điểm được đánh dấu"
            >
              <AlertTriangle className={`w-3 h-3 ${highlightOnly ? 'text-amber-700' : 'text-slate-400'}`} />
              <span>{highlightOnly ? 'Đang lọc trọng điểm' : 'Mục trọng điểm'}</span>
            </button>

            {/* Period Filter Toggle */}
            <button
              onClick={() => setFilterByPeriod(!filterByPeriod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shadow-2xs flex items-center gap-1 cursor-pointer ${
                filterByPeriod 
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title={filterByPeriod ? 'Đang lọc chi tiết theo giai đoạn được chọn trên biểu đồ' : 'Đang xem tất cả vật tư không phân biệt thời gian'}
            >
              <Calendar className={`w-3.5 h-3.5 ${filterByPeriod ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{filterByPeriod ? `Lọc: ${selectionMode === 'week' ? selectedWeekLabel : selectedMonthLabel}` : 'Xem tất cả'}</span>
            </button>

            {/* Export Excel Template Button */}
            <button
              id="slide3-export-template-btn"
              onClick={() => exportDefectCostTemplate(data)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Tải về file Excel mẫu chuẩn (.xlsx) có sẵn dữ liệu và định dạng các sheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất File Mẫu (.xlsx)</span>
            </button>

            {/* Upload / Import Excel Button */}
            {onOpenExcelImport && (
              <button
                id="slide3-open-import-btn"
                onClick={onOpenExcelImport}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Tải lên file Excel (.xlsx / .xls) hoặc CSV để cập nhật dữ liệu tự động"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-200" />
                <span>Upfile Excel</span>
              </button>
            )}

            {/* Edit Modal Button */}
            {onOpenEditor && (
              <button
                id="slide3-open-editor-btn"
                onClick={onOpenEditor}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa Dữ Liệu</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. MAIN SPLIT GRID: Left (Charts + High Defect Analysis) vs Right (Line Details / Full Pareto) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1">
          
          {/* === LEFT COLUMN: CHARTS + COMPACT HIGH DEFECT ANALYSIS TABLE (5 / 12) === */}
          <div className="lg:col-span-5 flex flex-col space-y-2.5 font-sans">
            
            {/* CHARTS CONTAINER: Giảm khoảng cách, đặt 2 biểu đồ sát gần nhau theo yêu cầu */}
            <div className="space-y-2">
              {/* Chart 1: Theo Dõi Hàng Hỏng Theo Tuần */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-col">
                <div className="mb-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <div>
                      <h3 className="text-xs font-black text-slate-900 font-['Times_New_Roman',Times,serif]">
                        {data.weeklyTitle || 'Theo Dõi Hàng Hỏng Theo Tuần'}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-serif italic">
                        {data.weeklySubTitle || 'Tổn thất chi tiết từng tuần sản xuất (VND)'}
                      </p>
                    </div>
                  </div>

                  {/* CONTROLS: Chuyển tuần, xem quá khứ/hiện tại, xem toàn bộ */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Toggle Xem tất cả tuần vs Xem cửa sổ trượt */}
                    <button
                      onClick={() => setShowAllWeeks(!showAllWeeks)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                        showAllWeeks
                          ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={showAllWeeks ? 'Chuyển về chế độ thanh trượt 4 tuần' : 'Xem toàn bộ tất cả các tuần cùng lúc trên biểu đồ'}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{showAllWeeks ? 'Thu gọn (4 tuần)' : 'Xem toàn bộ'}</span>
                    </button>

                    {/* Window Size selector khi ở chế độ trượt */}
                    {!showAllWeeks && (
                      <div className="hidden sm:flex items-center bg-white p-0.5 rounded-md border border-slate-200 text-[10px] font-bold">
                        <button
                          onClick={() => setWeeksToShow(4)}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            weeksToShow === 4 ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          4T
                        </button>
                        <button
                          onClick={() => setWeeksToShow(6)}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            weeksToShow === 6 ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          6T
                        </button>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
                      <button
                        onClick={jumpToPast}
                        disabled={showAllWeeks || weekStartIndex === 0}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Về các tuần quá khứ (W32)"
                      >
                        Quá khứ
                      </button>
                      <div className="w-px h-3 bg-slate-200" />
                      <button
                        onClick={() => setWeekStartIndex(Math.max(0, weekStartIndex - 1))}
                        disabled={showAllWeeks || weekStartIndex === 0}
                        className="p-1 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Tuần trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setWeekStartIndex(Math.min(maxStartIndex, weekStartIndex + 1))}
                        disabled={showAllWeeks || weekStartIndex >= maxStartIndex}
                        className="p-1 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Tuần sau"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3 bg-slate-200" />
                      <button
                        onClick={jumpToLatest}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-colors flex items-center gap-0.5 cursor-pointer ${
                          isW39InView && !showAllWeeks
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-rose-700 text-white hover:bg-rose-800 animate-pulse'
                        }`}
                        title="Xem tuần hiện tại / mới nhất (W39)"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Hiện tại ({latestWeekWithData})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chart Visual with exact red bars and labels */}
                <div className="h-36 sm:h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={slicedWeeklyData}
                      margin={{ top: 16, right: 8, left: -22, bottom: 2 }}
                    >
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: showAllWeeks ? 10 : 11, fontWeight: 'bold', fill: '#1e293b' }}
                        axisLine={{ stroke: '#94a3b8' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        unit="M"
                        domain={[0, 'dataMax + 0.5']}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(val: any) => [`${val} Triệu VNĐ (~${(Number(val) * 1000000).toLocaleString('vi-VN')} đ)`, 'Tổn thất']}
                        labelFormatter={(label) => `Tuần: ${label}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', padding: '6px 10px' }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#e11d48" 
                        radius={[4, 4, 0, 0]}
                        barSize={dynamicBarSize}
                        onClick={(data) => {
                          if (data && data.label) {
                            setSelectedWeekLabel(data.label);
                            setSelectionMode('week');
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList 
                          dataKey="displayLabel" 
                          position="top" 
                          style={{ fontSize: showAllWeeks ? '9px' : '10px', fontWeight: 'bold', fill: '#0f172a' }} 
                        />
                        {slicedWeeklyData.map((entry, index) => {
                          const isSelected = entry.label === selectedWeekLabel && selectionMode === 'week';
                          const isLatest = isSameWeek(entry.label, latestWeekWithData);
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isSelected ? '#9f1239' : isLatest ? '#e11d48' : '#dc2626'} 
                              stroke={isSelected ? '#fecdd3' : isLatest ? '#b91c1c' : 'none'}
                              strokeWidth={isSelected ? 2 : 1}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* THANH TRƯỢT KÉO XEM QUÁ KHỨ & HIỆN TẠI (INTERACTIVE TIMELINE RANGE SLIDER) */}
                <div className="mt-1 pt-1.5 border-t border-slate-200/80 flex flex-col gap-1.5 font-sans">
                  <div className="flex items-center justify-between text-[11px]">
                    {/* Nút nhảy về Quá khứ */}
                    <button
                      onClick={jumpToPast}
                      disabled={showAllWeeks || weekStartIndex === 0}
                      className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors cursor-pointer text-[10px]"
                      title="Nhấp để nhảy về các tuần quá khứ (W32)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>⏮ Quá khứ ({weeklyData[0]?.label || 'W32'})</span>
                    </button>

                    {/* Badge trạng thái khung nhìn */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      <span className="font-extrabold text-[10px] tracking-tight">
                        {showAllWeeks 
                          ? `Đang xem TOÀN BỘ ${totalWeeks} tuần (${weeklyData[0]?.label} ➜ ${weeklyData[totalWeeks - 1]?.label})` 
                          : `Đang xem: ${slicedWeeklyData[0]?.label} ➜ ${slicedWeeklyData[slicedWeeklyData.length - 1]?.label} (${slicedWeeklyData.length} tuần)`}
                      </span>
                    </div>

                    {/* Nút nhảy về Hiện tại */}
                    <button
                      onClick={jumpToLatest}
                      className="flex items-center gap-1 font-black text-rose-700 hover:text-rose-900 transition-colors cursor-pointer text-[10px]"
                      title="Nhấp để nhảy đến tuần mới nhất hiện tại (W39)"
                    >
                      <span>Hiện tại ({latestWeekWithData}) ⏭</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                    </button>
                  </div>

                  {/* Thanh trượt kéo ngang (Range Input) */}
                  {!showAllWeeks && totalWeeks > weeksToShow && (
                    <div className="relative flex flex-col gap-1 px-0.5">
                      <div className="relative h-4 flex items-center">
                        <input
                          type="range"
                          min={0}
                          max={maxStartIndex}
                          step={1}
                          value={weekStartIndex}
                          onChange={(e) => setWeekStartIndex(Number(e.target.value))}
                          className="w-full h-2 bg-gradient-to-r from-slate-200 via-rose-200 to-rose-400 rounded-lg appearance-none cursor-pointer accent-rose-700 hover:accent-rose-800 transition-all z-10"
                          title="Kéo thanh trượt để di chuyển giữa các tuần quá khứ và hiện tại"
                        />
                      </div>

                      {/* Các mốc tuần có thể nhấp chuột trực tiếp để xem */}
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 select-none overflow-x-auto py-0.5">
                        {weeklyData.map((w, i) => {
                          const isVisible = !showAllWeeks && i >= weekStartIndex && i < weekStartIndex + weeksToShow;
                          const isLatest = isSameWeek(w.label, latestWeekWithData);
                          const isSelected = isSameWeek(w.label, selectedWeekLabel);
                          return (
                            <button
                              key={w.id || w.label}
                              onClick={() => scrollToWeek(w.label)}
                              className={`px-1 py-0.5 rounded transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-700 text-white font-black scale-105 shadow-2xs'
                                  : isVisible
                                  ? 'bg-rose-100 text-rose-800 font-black border border-rose-300'
                                  : isLatest
                                  ? 'text-rose-700 font-black underline bg-rose-50'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title={`Tuần ${w.label}: ${w.value}M VND. Nhấp để cuộn và xem tuần này`}
                            >
                              {w.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cảnh báo / Gợi ý nổi bật nếu Tuần 39 đang nằm ngoài khung nhìn */}
                  {!showAllWeeks && !isW39InView && (
                    <div 
                      onClick={jumpToLatest}
                      className="px-2 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors shadow-2xs animate-pulse"
                      title="Nhấp để kéo thanh trượt xem ngay Tuần 39"
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Tuần 39 ({latestWeekWithData}) đã có dữ liệu tổn thất ({weeklyTotals[latestWeekWithData]?.total ? `${Number((weeklyTotals[latestWeekWithData].total / 1000000).toFixed(2))}M` : '0.96M'})</span>
                      </span>
                      <span className="text-amber-800 underline flex items-center gap-0.5 shrink-0">
                        Kéo xem Tuần 39 ➔
                      </span>
                    </div>
                  )}
                </div>

                {/* Pill Button below chart */}
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-sans italic text-[10px]">Nhấp cột biểu đồ hoặc mốc tuần để xem chi tiết</span>
                  <button
                    onClick={() => setActiveChartTab('week')}
                    className={`px-3 py-0.5 rounded text-[11px] font-bold font-serif transition-colors border shadow-2xs ${
                      activeChartTab === 'week' || activeChartTab === 'both'
                        ? 'bg-gradient-to-r from-red-800 to-rose-700 text-white border-red-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    TL Hư Hỏng Tuần
                  </button>
                </div>
              </div>

              {/* Chart 2: TL Hư Hỏng Tháng (Khoảng cách đặt sát ngay dưới Chart 1) */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-col">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-900" />
                    <div>
                      <h3 className="text-xs font-black text-slate-900 font-['Times_New_Roman',Times,serif]">
                        {data.monthlyTitle || 'TL Hư Hỏng Tháng'}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-serif italic">
                        Tổng hợp chi phí hư hỏng vật tư qua các tháng sản xuất
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    T6 - T9
                  </span>
                </div>

                {/* Monthly Bar Chart */}
                <div className="h-36 sm:h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 16, right: 8, left: -22, bottom: 2 }}
                    >
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 11, fontWeight: 'bold', fill: '#1e293b' }}
                        axisLine={{ stroke: '#94a3b8' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        unit="M"
                        domain={[0, 'dataMax + 2']}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(val: any) => [`${val} Triệu VNĐ (~${(Number(val) * 1000000).toLocaleString('vi-VN')} đ)`, 'Tổn thất tháng']}
                        labelFormatter={(label) => `Tháng: ${label}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', padding: '6px 10px' }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#b91c1c" 
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                        onClick={(data) => {
                          if (data && data.label) {
                            setSelectedMonthLabel(data.label);
                            setSelectionMode('month');
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList 
                          dataKey="displayLabel" 
                          position="top" 
                          style={{ fontSize: '10px', fontWeight: 'bold', fill: '#0f172a' }} 
                        />
                        {monthlyData.map((entry, index) => (
                          <Cell 
                            key={`mcell-${index}`} 
                            fill={entry.label === selectedMonthLabel && selectionMode === 'month' ? '#7f1d1d' : '#b91c1c'} 
                            stroke={entry.label === selectedMonthLabel && selectionMode === 'month' ? '#fecdd3' : 'none'}
                            strokeWidth={2}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Pill Button */}
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-sans italic text-[10px]">Nhấp cột để lọc theo tháng</span>
                  <button
                    onClick={() => setActiveChartTab('month')}
                    className={`px-3 py-0.5 rounded text-[11px] font-bold font-serif transition-colors border shadow-2xs ${
                      activeChartTab === 'month' || activeChartTab === 'both'
                        ? 'bg-gradient-to-r from-red-800 to-rose-700 text-white border-red-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    TL Hư Hỏng Tháng
                  </button>
                </div>
              </div>
            </div>

            {/* BẢNG PHÂN TÍCH CÁC VẬT TƯ LINH KIỆN CÓ GIÁ TRỊ HƯ HỎNG CAO (LẤY DỮ LIỆU TỪ TẤT CẢ CÁC DATA ĐƯỢC CẬP NHẬT) */}
            <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-md flex flex-col flex-1">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white px-3.5 py-2 flex items-center justify-between border-b border-rose-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight text-amber-200">
                      Bảng Phân Tích Linh Kiện Hư Hỏng Cao
                    </h4>
                    <p className="text-[10px] text-slate-300 font-sans">
                      {analysisFilterWeek === 'all' && analysisScope === 'all'
                        ? `Lấy dữ liệu từ tất cả ${(data.itemsRO || []).length + (data.itemsBG || []).length} mục data cập nhật (Line RO & Bếp Ga)`
                        : `Dữ liệu tuần ${analysisFilterWeek !== 'all' ? analysisFilterWeek : targetDisplayWeek}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-black/50 px-2 py-0.5 rounded border border-rose-700/60 text-right">
                    <span className="text-[9px] text-amber-300 font-bold block leading-none">Top 5 chiếm</span>
                    <span className="text-xs font-black text-white">{top5Percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Data Scope & Filter Bar */}
              <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-700">
                {/* Left: Quick Scope Buttons */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-slate-500 font-sans font-bold text-[10px] mr-0.5">Dữ liệu:</span>
                  <button
                    onClick={() => {
                      setAnalysisFilterWeek('all');
                      setAnalysisScope('all');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-sans font-black transition-all border cursor-pointer ${
                      analysisFilterWeek === 'all' && analysisScope === 'all'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                    title="Lấy dữ liệu từ tất cả các data được cập nhật (RO & Bếp Ga qua tất cả các tuần)"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1 text-amber-300" />
                    Tất Cả Data Cập Nhật
                  </button>

                  {availableWeeks.map(w => {
                    const isSelected = (analysisFilterWeek === w) || (analysisScope === 'period' && targetDisplayWeek === w && analysisFilterWeek === 'all');
                    return (
                      <button
                        key={`quick-w-${w}`}
                        onClick={() => {
                          setAnalysisFilterWeek(w);
                          setAnalysisScope('period');
                          setSelectedWeekLabel(w);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-amber-300 border-slate-950 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                        title={`Xem riêng dữ liệu phát sinh tuần ${w}`}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Toggle Grouping & Count */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {analysisFilterWeek === 'all' && analysisScope === 'all' && (
                    <button
                      onClick={() => setIsGroupedByCode(!isGroupedByCode)}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border transition-all cursor-pointer ${
                        isGroupedByCode 
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' 
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                      title={isGroupedByCode ? 'Đang gộp các vật tư trùng mã từ các tuần' : 'Hiển thị chi tiết từng dòng cập nhật'}
                    >
                      {isGroupedByCode ? 'Gộp cùng mã VT' : 'Tách từng dòng'}
                    </button>
                  )}
                  <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                    {topHighValueItems.length} linh kiện
                  </span>
                </div>
              </div>

              {/* High-Value Items Scrollable Table */}
              <div className="max-h-56 sm:max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-800 font-black text-[10px] uppercase sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2 px-1 text-center w-7 border-r border-slate-200">#</th>
                      <th className="py-2 px-1 text-center w-12 border-r border-slate-200">Line</th>
                      <th className="py-2 px-1 text-center w-12 border-r border-slate-200">Tuần</th>
                      <th className="py-2 px-2 border-r border-slate-200">Linh kiện vật tư</th>
                      <th className="py-2 px-1 text-center w-8 border-r border-slate-200">SL</th>
                      <th className="py-2 px-2 text-right w-22 border-r border-slate-200">Tổn thất</th>
                      <th className="py-2 px-1.5 text-right w-14">% Tỉ lệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topHighValueItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-500 font-serif italic text-xs">
                          Chưa có linh kiện hư hỏng phát sinh trong dữ liệu đã chọn
                        </td>
                      </tr>
                    ) : (
                      topHighValueItems.slice(0, 10).map((item, idx) => {
                        const isTop3 = idx < 3;
                        const rankBadgeColor = 
                          idx === 0 ? 'bg-amber-400 text-amber-950 font-black shadow-2xs' :
                          idx === 1 ? 'bg-slate-300 text-slate-900 font-black' :
                          idx === 2 ? 'bg-amber-700 text-white font-black' :
                          'bg-slate-100 text-slate-600 font-bold';

                        const isLineRO = item.lineType === 'RO';

                        return (
                          <tr 
                            key={item.id || idx}
                            className={`transition-colors hover:bg-rose-50/50 ${
                              item.isHighlighted ? 'bg-amber-50/60' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                          >
                            <td className="py-2 px-1 text-center border-r border-slate-100">
                              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${rankBadgeColor}`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-center border-r border-slate-100 whitespace-nowrap">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-sans font-black ${
                                isLineRO 
                                  ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' 
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {isLineRO ? 'RO' : 'Bếp Ga'}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-center border-r border-slate-100 whitespace-nowrap">
                              <span className={`inline-block px-1 py-0.5 rounded text-[9px] font-sans font-bold ${
                                item.weekList && item.weekList.length > 1
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : item.week === 'W39'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`} title={item.weekList ? `Các tuần: ${item.weekList.join(', ')}` : undefined}>
                                {item.weekList && item.weekList.length > 1 
                                  ? item.weekList.join(',') 
                                  : item.week || '-'}
                              </span>
                            </td>
                            <td className="py-2 px-2 border-r border-slate-100">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-1" title={item.itemName}>
                                  {item.itemName}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  {item.itemCode}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-1 text-center font-bold text-slate-900 border-r border-slate-100 text-[11px]">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-black text-rose-700 border-r border-slate-100 text-[11.5px] whitespace-nowrap">
                              {formatCurrency(item.calcAmount)}
                            </td>
                            <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-700 text-[10.5px]">
                              <div className="flex flex-col items-end">
                                <span>{item.percentage}%</span>
                                <div className="w-9 bg-slate-200 rounded-full h-1 mt-0.5 overflow-hidden">
                                  <div 
                                    className={`h-full ${isTop3 ? 'bg-rose-600' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, item.percentage * 3)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Analysis Indicator */}
              <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 font-sans">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Xếp hạng theo thành tiền giảm dần (Pareto 80/20)
                </span>
                <div className="flex items-center gap-2">
                  {(analysisFilterWeek === 'W39' || (analysisScope === 'period' && matchWeek(targetDisplayWeek, 'W39'))) && (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded text-[9.5px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Line RO W39: 0 lỗi
                    </span>
                  )}
                  <span className="font-bold font-mono text-slate-800">
                    Tổng tổn thất: {formatCurrency(totalAnalysisAmount)} VNĐ
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* === RIGHT COLUMN: EXCEL-STYLE TABLES & PARETO VIEW (7 / 12) === */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* STATUS BANNER: CHỈ HIỂN THỊ TUẦN MỚI NHẤT & CHỌN NHANH */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-700 font-sans text-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-1.5 text-xs sm:text-[13px]">
                    {filterByPeriod ? `CHỈ HIỂN THỊ LINH KIỆN HƯ HỎNG: ${targetDisplayWeek} (MỚI NHẤT)` : 'ĐANG HIỂN THỊ TỔNG HỢP TẤT CẢ CÁC TUẦN'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {filterByPeriod 
                      ? (matchWeek(targetDisplayWeek, 'W39') 
                          ? 'Tuần 39: Line RO đạt chuẩn 0 lỗi (0 đ) • Toàn bộ tổn thất thuộc Line Bếp Gas' 
                          : `Dữ liệu tuần ${targetDisplayWeek}: Bảng chỉ hiển thị các linh kiện hư hỏng phát sinh trong kỳ`)
                      : 'Đang xem toàn bộ danh mục linh kiện phát sinh qua các tuần'}
                  </span>
                </div>
              </div>

              {/* Quick Week Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {availableWeeks.map(w => {
                  const isLatest = w === latestWeekWithData;
                  const isSelected = filterByPeriod && targetDisplayWeek === w;
                  return (
                    <button
                      key={w}
                      onClick={() => {
                        setSelectedWeekLabel(w);
                        setSelectionMode('week');
                        setFilterByPeriod(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                      }`}
                      title={`Xem linh kiện hư hỏng của ${w}`}
                    >
                      <span>{w}</span>
                      {isLatest && (
                        <span className="text-[9px] px-1 py-0.2 bg-red-600 text-white rounded font-sans font-bold">
                          Mới nhất
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() => setFilterByPeriod(!filterByPeriod)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !filterByPeriod
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                  }`}
                  title={filterByPeriod ? 'Xem toàn bộ vật tư các tuần' : `Chỉ lọc lại ${targetDisplayWeek}`}
                >
                  {filterByPeriod ? 'Tất cả tuần' : `Chỉ ${targetDisplayWeek}`}
                </button>
              </div>
            </div>

            {/* VIEW MODE SWITCHER: CHI TIẾT TỪNG LINE vs BẢNG PHÂN TÍCH PARETO MỞ RỘNG */}
            <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-sans text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">Chế độ hiển thị:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-300">
                  <button
                    onClick={() => setRightTableView('line_split')}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      rightTableView === 'line_split'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Chi Tiết Theo Line (RO & Bếp Ga)</span>
                  </button>
                  <button
                    onClick={() => setRightTableView('pareto_analysis')}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      rightTableView === 'pareto_analysis'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bảng Phân Tích Linh Kiện Hư Hỏng Cao (Toàn diện)</span>
                  </button>
                </div>
              </div>
              <span className="text-slate-500 text-[11px] italic font-serif">
                Đang xem dữ liệu: <strong className="text-slate-800 font-sans">{filterByPeriod ? targetDisplayWeek : 'Tất cả các kỳ'}</strong>
              </span>
            </div>

            {/* CONDITIONAL RENDER: CHI TIẾT 2 LINE HOẶC BẢNG PHÂN TÍCH PARETO MỞ RỘNG */}
            {rightTableView === 'pareto_analysis' ? (
              /* === BẢNG PHÂN TÍCH TOÀN DIỆN CÁC VẬT TƯ LINH KIỆN CÓ GIÁ TRỊ HƯ HỎNG CAO (TẤT CẢ DATA CẬP NHẬT) === */
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-md flex flex-col flex-1">
                <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold font-sans border-b border-rose-800">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    <span className="uppercase font-['Times_New_Roman',Times,serif] text-sm font-black tracking-tight">
                      BẢNG PHÂN TÍCH VẬT TƯ LINH KIỆN HƯ HỎNG GIÁ TRỊ CAO {analysisFilterWeek === 'all' && analysisScope === 'all' ? '(TẤT CẢ DATA ĐƯỢC CẬP NHẬT)' : `(TUẦN ${analysisFilterWeek !== 'all' ? analysisFilterWeek : targetDisplayWeek})`}
                    </span>
                    <span className="text-[10px] text-amber-200 font-sans font-black px-2 py-0.5 bg-rose-900/80 rounded-full border border-rose-700">
                      PARETO 80/20 • {topHighValueItems.length} MỤC
                    </span>
                  </div>
                  <div className="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700 text-amber-300 font-mono text-sm shadow-inner">
                    <span className="text-[10px] text-slate-400 mr-2 font-sans font-black">TỔNG TỔN THẤT:</span>
                    <span className="font-black text-white text-base">{formatCurrency(totalAnalysisAmount)}</span>
                    <span className="text-[10px] ml-1">VNĐ</span>
                  </div>
                </div>

                {/* Scope selector bar for Pareto view */}
                <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-sans font-bold text-[11px]">Nguồn dữ liệu:</span>
                    <button
                      onClick={() => {
                        setAnalysisFilterWeek('all');
                        setAnalysisScope('all');
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-sans font-bold transition-all border cursor-pointer ${
                        analysisFilterWeek === 'all' && analysisScope === 'all'
                          ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 inline mr-1 text-amber-300" />
                      Tất Cả Data Cập Nhật ({topHighValueItems.length} mục)
                    </button>
                    {availableWeeks.map(w => (
                      <button
                        key={`pareto-w-${w}`}
                        onClick={() => {
                          setAnalysisFilterWeek(w);
                          setAnalysisScope('period');
                          setSelectedWeekLabel(w);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-sans font-bold transition-all border cursor-pointer ${
                          (analysisFilterWeek === w) || (analysisScope === 'period' && targetDisplayWeek === w && analysisFilterWeek === 'all')
                            ? 'bg-slate-900 text-amber-300 border-slate-950'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {analysisFilterWeek === 'all' && analysisScope === 'all' && (
                      <button
                        onClick={() => setIsGroupedByCode(!isGroupedByCode)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-sans font-semibold border transition-all cursor-pointer ${
                          isGroupedByCode 
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' 
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isGroupedByCode ? 'Gộp cùng mã VT' : 'Tách từng dòng'}
                      </button>
                    )}
                    <span className="text-slate-600 font-sans text-xs">
                      Top 5 chiếm: <strong className="text-rose-700 font-mono font-bold">{top5Percentage}%</strong>
                    </span>
                  </div>
                </div>

                <div className="max-h-[460px] overflow-y-auto">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase tracking-tighter text-[11px]">
                      <tr>
                        <th className="p-2.5 text-center w-12 border-r border-slate-200">Hạng</th>
                        <th className="p-2.5 w-20 border-r border-slate-200">Line</th>
                        <th className="p-2.5 w-16 text-center border-r border-slate-200">Tuần</th>
                        <th className="p-2.5 border-r border-slate-200">Mã vật tư</th>
                        <th className="p-2.5 border-r border-slate-200">Tên vật tư linh kiện mô tả</th>
                        <th className="p-2.5 text-center w-14 border-r border-slate-200">SL</th>
                        <th className="p-2.5 text-right w-24 border-r border-slate-200">Đơn giá</th>
                        <th className="p-2.5 text-right w-32 border-r border-slate-200">Tổn thất (VNĐ)</th>
                        <th className="p-2.5 text-right w-20 border-r border-slate-200">% Tỉ lệ</th>
                        <th className="p-2.5 text-center w-28">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {topHighValueItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-10 text-slate-500 font-serif italic text-sm">
                            Không tìm thấy dữ liệu vật tư hư hỏng trong phạm vi đã chọn
                          </td>
                        </tr>
                      ) : (
                        topHighValueItems.map((item, idx) => {
                          const isLineRO = item.lineType === 'RO';
                          const rankColor = 
                            idx === 0 ? 'bg-amber-400 text-amber-950 font-black' :
                            idx === 1 ? 'bg-slate-300 text-slate-900 font-black' :
                            idx === 2 ? 'bg-amber-700 text-white font-black' :
                            'bg-slate-100 text-slate-600 font-bold';

                          return (
                            <tr 
                              key={item.id || idx}
                              className={`transition-colors hover:bg-slate-50 group ${
                                item.isHighlighted ? 'bg-amber-50/70 border-y border-amber-200' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                              }`}
                            >
                              <td className="p-2 text-center border-r border-slate-100">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${rankColor}`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-100 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-black ${
                                  isLineRO 
                                    ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' 
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                  {isLineRO ? 'Line RO' : 'Bếp Gas'}
                                </span>
                              </td>
                              <td className="p-2 text-center border-r border-slate-100 whitespace-nowrap">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                                  item.weekList && item.weekList.length > 1
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : item.week === 'W39'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {item.weekList && item.weekList.length > 1 ? item.weekList.join(', ') : item.week || '-'}
                                </span>
                              </td>
                              <td className="p-2 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                {item.itemCode}
                              </td>
                              <td className={`p-2 font-bold border-r border-slate-100 ${item.isHighlighted ? 'text-amber-900 font-black' : 'text-slate-800'}`}>
                                {item.itemName}
                              </td>
                              <td className="p-2 text-center font-black text-slate-900 border-r border-slate-100 text-[13px]">
                                {item.quantity}
                              </td>
                              <td className="p-2 text-right font-mono text-slate-500 border-r border-slate-100 text-xs">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="p-2 text-right font-mono font-black text-rose-700 border-r border-slate-100 text-sm whitespace-nowrap">
                                {formatCurrency(item.calcAmount)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-800 border-r border-slate-100 text-xs">
                                {item.percentage}%
                              </td>
                              <td className="p-2 text-center whitespace-nowrap">
                                {item.isPareto ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-black bg-rose-100 text-rose-800 border border-rose-300">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Pareto 80%
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    Kiểm soát
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-4">
                    <span>Tổng số linh kiện phân tích: <strong className="text-slate-900 font-bold">{topHighValueItems.length}</strong></span>
                    <span>Top 5 chiếm: <strong className="text-rose-700 font-bold">{top5Percentage}% ({formatCurrency(top5Total)} đ)</strong></span>
                  </div>
                  <span className="text-[11px] italic font-serif">
                    * Bảng lấy dữ liệu từ tất cả các data được cập nhật và xếp hạng theo Pareto 80/20
                  </span>
                </div>
              </div>
            ) : (
              /* === CHẾ ĐỘ HIỂN THỊ MẶC ĐỊNH: TÁCH THEO 2 LINE RO & BẾP GAS === */
              <>

            {/* TABLE 1: NHÓM LỌC NƯỚC RO */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-md flex flex-col">
              {/* Header with Sub-total */}
              <div className="bg-[#0f172a] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold font-sans border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${displayTotalRO === 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'}`} />
                  <span className="uppercase font-['Times_New_Roman',Times,serif] text-[15px] font-black tracking-tight">
                    Hàng Hỏng Nhóm RO / Lọc Nước {filterByPeriod ? `(${selectionMode === 'week' ? targetDisplayWeek : selectedMonthLabel})` : '(Tất Cả Kỳ)'}
                  </span>
                  <span className={`text-[10px] font-sans font-black px-2 py-0.5 rounded-full border ${
                    displayTotalRO === 0 
                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700' 
                      : 'bg-slate-700/80 text-cyan-100 border-slate-600'
                  }`}>
                    {displayTotalRO === 0 ? '0 LỖI (ĐẠT CHUẨN)' : `${filteredRO.length} MỤC`} {filterByPeriod ? `(${selectionMode === 'week' ? targetDisplayWeek : selectedMonthLabel})` : ''}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-lg border font-mono text-sm shadow-inner ${
                  displayTotalRO === 0 
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
                    : 'bg-slate-900/90 border-slate-700 text-cyan-300'
                }`}>
                  <span className="text-[10px] text-slate-400 mr-2 font-sans font-black">TOTAL:</span>
                  <span className="font-black text-white text-base">{formatCurrency(displayTotalRO)}</span> 
                  <span className="text-[10px] ml-1">VNĐ</span>
                </div>
              </div>

              {/* Scrollable Excel Grid */}
              <div className="max-h-56 sm:max-h-60 overflow-y-auto">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase tracking-tighter text-[11px]">
                    <tr>
                      <th className="p-3 text-center w-12 border-r border-slate-200">STT</th>
                      <th className="p-3 border-r border-slate-200">Mã VT</th>
                      <th className="p-3 border-r border-slate-200">Tên vật tư mô tả</th>
                      <th className="p-3 text-right w-16 border-r border-slate-200">SL</th>
                      <th className="p-3 text-right w-28 border-r border-slate-200">Đơn giá</th>
                      <th className="p-3 text-right w-36">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRO.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <div className="flex flex-col items-center justify-center gap-2 py-3 px-4 bg-emerald-50/70 rounded-xl border border-emerald-200 mx-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-center text-center">
                              <span className="font-sans font-black text-emerald-800 text-sm uppercase tracking-wide">
                                Line RO {filterByPeriod ? targetDisplayWeek : ''}: Không phát sinh lỗi (0 lỗi - 0 VNĐ)
                              </span>
                              <span className="text-xs text-emerald-700/80 font-sans mt-0.5 max-w-md">
                                Dữ liệu thực tế {filterByPeriod ? `tuần ${targetDisplayWeek}` : 'kỳ này'}: Toàn bộ quá trình sản xuất Line RO không ghi nhận bất kỳ linh kiện hư hỏng nào.
                              </span>
                            </div>
                            {totalRO > 0 && filterByPeriod && (
                              <button
                                onClick={() => setFilterByPeriod(false)}
                                className="mt-1 px-3 py-1 text-[11px] font-sans font-bold bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                              >
                                Xem danh sách vật tư các tuần trước ({formatCurrency(totalRO)} VNĐ)
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRO.map((item, idx) => {
                        const isYellowHighlight = Boolean(item.isHighlighted);

                        return (
                          <tr 
                            key={item.id || idx}
                            className={`transition-colors hover:bg-slate-50 group ${
                              isYellowHighlight 
                                ? 'bg-amber-50 text-amber-900 border-y border-amber-200' 
                                : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                          >
                            <td className="p-2.5 text-center text-slate-400 font-bold border-r border-slate-100">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] font-black text-slate-600 border-r border-slate-100 whitespace-nowrap">
                              {item.itemCode}
                            </td>
                            <td className={`p-2.5 font-bold border-r border-slate-100 ${isYellowHighlight ? 'text-amber-900' : 'text-slate-800'}`}>
                              {item.itemName}
                            </td>
                            <td className="p-2.5 text-right font-black text-slate-900 border-r border-slate-100 text-[13px]">
                              {item.quantity}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-100 italic">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-slate-900 text-[13.5px]">
                              {formatCurrency(item.amount || (item.quantity * item.unitPrice))}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 2: NHÓM BẾP GAS */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-md flex flex-col">
              {/* Header with Sub-total */}
              <div className="bg-[#0f172a] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold font-sans border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span className="uppercase font-['Times_New_Roman',Times,serif] text-[15px] font-black tracking-tight">
                    Hàng Hỏng Nhóm Bếp Gas {filterByPeriod ? `(${selectionMode === 'week' ? targetDisplayWeek : selectedMonthLabel})` : '(Tất Cả Kỳ)'}
                  </span>
                  <span className="text-[10px] text-amber-100 font-sans font-black px-2 py-0.5 bg-slate-700/80 rounded-full border border-slate-600">
                    {filteredBG.length} MỤC {filterByPeriod ? `(${selectionMode === 'week' ? targetDisplayWeek : selectedMonthLabel})` : ''}
                  </span>
                </div>
                <div className="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700 text-amber-300 font-mono text-sm shadow-inner">
                  <span className="text-[10px] text-slate-400 mr-2 font-sans font-black">TOTAL:</span>
                  <span className="font-black text-white text-base">{formatCurrency(displayTotalBG)}</span>
                  <span className="text-[10px] ml-1">VNĐ</span>
                </div>
              </div>

              {/* Scrollable Excel Grid */}
              <div className="max-h-56 sm:max-h-60 overflow-y-auto">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase tracking-tighter text-[11px]">
                    <tr>
                      <th className="p-3 text-center w-12 border-r border-slate-200">STT</th>
                      <th className="p-3 border-r border-slate-200">Mã VT</th>
                      <th className="p-3 border-r border-slate-200">Tên vật tư mô tả</th>
                      <th className="p-3 text-right w-16 border-r border-slate-200">SL</th>
                      <th className="p-3 text-right w-28 border-r border-slate-200">Đơn giá</th>
                      <th className="p-3 text-right w-36">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredBG.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-600 font-serif">
                          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                            <span className="font-bold text-slate-800 text-sm">
                              Dữ liệu Bếp Gas ({selectionMode === 'week' ? selectedWeekLabel : selectedMonthLabel}): {formatCurrency(selectionMode === 'week' ? activeWeekTotalBG : activeMonthTotalBG)} VNĐ (Bảo lưu cố định)
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              Chi tiết vật tư từng mã thuộc danh mục quản lý kỳ hiện hành (W37-W38).
                            </span>
                            <button
                              onClick={() => setFilterByPeriod(false)}
                              className="mt-1 px-3 py-1 text-xs font-sans font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                            >
                              Xem danh sách toàn bộ vật tư ({formatCurrency(totalBG)} VNĐ)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredBG.map((item, idx) => {
                        const isYellowHighlight = Boolean(item.isHighlighted);

                        return (
                          <tr 
                            key={item.id || idx}
                            className={`transition-colors hover:bg-slate-50 group ${
                              isYellowHighlight 
                                ? 'bg-amber-50 text-amber-900 border-y border-amber-200' 
                                : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                          >
                            <td className="p-2.5 text-center text-slate-400 font-bold border-r border-slate-100">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] font-black text-slate-600 border-r border-slate-100 whitespace-nowrap">
                              {item.itemCode}
                            </td>
                            <td className={`p-2.5 font-bold border-r border-slate-100 ${isYellowHighlight ? 'text-amber-900' : 'text-slate-800'}`}>
                              {item.itemName}
                            </td>
                            <td className="p-2.5 text-right font-black text-slate-900 border-r border-slate-100 text-[13px]">
                              {item.quantity}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-100 italic">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-slate-900 text-[13.5px]">
                              {formatCurrency(item.amount || (item.quantity * item.unitPrice))}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

            {/* GRAND TOTAL SUMMARY BAR & LEGEND */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
              
              <div className="flex items-center gap-6 flex-wrap z-10">
                {/* Legend */}
                <div className="flex flex-col border-r border-slate-700 pr-6 mr-2">
                  <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-1">Legend / Chú thích</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 group cursor-help">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      <span className="text-[12px] font-black text-slate-200">
                        Phát sinh trọng điểm
                      </span>
                    </div>
                    <div className="flex items-center gap-2 group cursor-help">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                      <span className="text-[12px] font-black text-slate-200">
                        Vật tư giá trị cao
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weekly/Monthly Breakdown for each Line */}
                {filterByPeriod && (selectionMode === 'week' ? selectedWeekLabel : selectedMonthLabel) && (
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                      <span className="text-cyan-400 font-black text-[9px] uppercase tracking-widest mb-0.5">
                        LINE RO ({selectionMode === 'week' ? selectedWeekLabel : selectedMonthLabel})
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-white font-mono text-xl font-bold">
                          {formatCurrency(selectionMode === 'week' ? activeWeekTotalRO : activeMonthTotalRO)}
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold">VNĐ</span>
                      </div>
                    </div>
                    <div className="flex flex-col bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                      <span className="text-amber-400 font-black text-[9px] uppercase tracking-widest mb-0.5">
                        BẾP GA ({selectionMode === 'week' ? selectedWeekLabel : selectedMonthLabel})
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-white font-mono text-xl font-bold">
                          {formatCurrency(selectionMode === 'week' ? activeWeekTotalBG : activeMonthTotalBG)}
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold">VNĐ</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* If filtering is OFF, show general breakdown for all items */}
                {!filterByPeriod && (
                   <div className="flex items-center gap-5">
                    <div className="flex flex-col bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                      <span className="text-cyan-400 font-black text-[9px] uppercase tracking-widest mb-0.5">TỔNG LINE RO</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-white font-mono text-xl font-bold">{formatCurrency(totalRO)}</span>
                        <span className="text-slate-500 text-[10px] font-bold">VNĐ</span>
                      </div>
                    </div>
                    <div className="flex flex-col bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                      <span className="text-amber-400 font-black text-[9px] uppercase tracking-widest mb-0.5">TỔNG BẾP GA</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-white font-mono text-xl font-bold">{formatCurrency(totalBG)}</span>
                        <span className="text-slate-500 text-[10px] font-bold">VNĐ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end z-10 bg-slate-800/30 px-6 py-2 rounded-2xl border border-slate-700/30">
                <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                  {filterByPeriod 
                    ? (selectionMode === 'week' ? `Tổng Chi Phí Tuần ${selectedWeekLabel}` : `Tổng Chi Phí ${selectedMonthLabel}`)
                    : 'Tổng Chi Phí Tất Cả'
                  }
                </span>
                <div className="flex items-baseline gap-2">
                  <strong className="text-white font-mono text-4xl font-black tracking-tighter drop-shadow-md">
                    {formatCurrency(filterByPeriod 
                      ? (selectionMode === 'week' ? activeWeekGrandTotal : activeMonthGrandTotal)
                      : grandTotal
                    )}
                  </strong>
                  <span className="text-red-500 font-black text-lg tracking-wider">VNĐ</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. FOOTER NOTE */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-sans font-bold">
        <div>
          Báo cáo phân xưởng lắp ráp (PXLR) • Quản đốc & Giám sát Line • Dữ liệu lưu trữ tự động
        </div>
        <div className="flex items-center gap-2">
          <span>Trang trình chiếu PowerPoint</span>
          <span className="px-2 py-0.5 rounded bg-slate-200 font-bold text-slate-700">Slide 4</span>
        </div>
      </div>
    </div>
  );
};

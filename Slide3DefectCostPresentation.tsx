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
  SlidersHorizontal,
  Droplets,
  PieChart,
  BarChart3,
  Columns,
  Rows,
  Split
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

  const [analysisFilterWeek, setAnalysisFilterWeek] = useState<string>('all');
  const [isGroupedByCode, setIsGroupedByCode] = useState<boolean>(true);

  // Phân rõ Bếp Gas và RO: 'both' (Mặc định: Phân rõ cả 2 Dây chuyền), 'bg' (Chuyên sâu Bếp Gas), 'ro' (Chuyên sâu Line RO), 'combined' (Toàn xưởng gộp)
  const [lineViewMode, setLineViewMode] = useState<'both' | 'bg' | 'ro' | 'combined'>('both');
  const [bothLinesLayout, setBothLinesLayout] = useState<'stacked' | 'grid'>('stacked');

  // Slider state for Week view - Hỗ trợ kéo xem quá khứ & hiện tại, xem tất cả tuần
  const [weeksToShow, setWeeksToShow] = useState<number>(4);
  const [showAllWeeks, setShowAllWeeks] = useState<boolean>(false);

  // 1. Tự động đồng bộ và tính toán dữ liệu Tuần từ tất cả các linh kiện vật tư cập nhật
  const { weeklyData, weeklyTotals } = useMemo(() => {
    return computeWeeklyAggregations(data.itemsRO || [], data.itemsBG || [], data.weeklyData);
  }, [data.itemsRO, data.itemsBG, data.weeklyData]);

  // 2. Chạy theo dữ liệu tuần và logic cả dữ liệu tháng theo data
  // Dữ liệu tháng được tổng hợp từ các tuần thuộc tháng đó
  const { monthlyData, monthlyTotals } = useMemo(() => {
    return computeMonthlyAggregations(weeklyData, weeklyTotals, data.itemsRO || [], data.itemsBG || [], data.monthlyData);
  }, [weeklyData, weeklyTotals, data.itemsRO, data.itemsBG, data.monthlyData]);

  // Tinh gọn dữ liệu tháng: Tháng 11 và Tháng 12 chưa đến thì không có số liệu (chỉ hiển thị các tháng có dữ liệu thực tế)
  const activeMonthlyData = useMemo(() => {
    return monthlyData.filter(m => {
      const num = parseInt(m.label.replace(/\D/g, ''), 10);
      if (num === 11 || num === 12) {
        return (Number(m.value) || 0) > 0;
      }
      return true;
    });
  }, [monthlyData]);

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

    return weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].label : '';
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

  // Set default selected week to the latest week with data (e.g. W41)
  useEffect(() => {
    if (!selectedWeekLabel && latestWeekWithData) {
      setSelectedWeekLabel(latestWeekWithData);
    }
    if (!selectedMonthLabel) {
      setSelectedMonthLabel('Tháng 10');
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

  // Kiểm tra xem mục mới nhất có đang nằm trong khung nhìn biểu đồ không
  const isLatestInView = useMemo(() => {
    if (showAllWeeks) return true;
    return slicedWeeklyData.some(w => isSameWeek(w.label, latestWeekWithData));
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
    return list.length > 0 ? list : [];
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

  // Helper dùng chung để xử lý, phân loại và xếp hạng Pareto cho từng Dây chuyền hoặc gộp
  const processDefectList = (
    rawItems: DamagedItemRecord[], 
    lineType: 'RO' | 'BG' | 'COMBINED',
    lineName: string,
    factoryGrandTotal: number
  ) => {
    let sourceList: (DamagedItemRecord & { lineType: 'RO' | 'BG'; lineName: string })[] = [];

    if (lineType === 'COMBINED') {
      const allRO = (data.itemsRO || []).map(item => ({ ...item, lineType: 'RO' as const, lineName: 'Line RO' }));
      const allBG = (data.itemsBG || []).map(item => ({ ...item, lineType: 'BG' as const, lineName: 'Bếp Ga' }));
      sourceList = [...allRO, ...allBG];
    } else {
      sourceList = rawItems.map(item => ({
        ...item,
        lineType: lineType as 'RO' | 'BG',
        lineName,
      }));
    }

    if (analysisFilterWeek !== 'all') {
      sourceList = sourceList.filter(item => isSameWeek(item.week, analysisFilterWeek));
    } else if (!filterByPeriod) {
      // Giữ nguyên toàn bộ
    } else if (selectionMode === 'week') {
      sourceList = sourceList.filter(item => isSameWeek(item.week, targetDisplayWeek));
    } else {
      sourceList = sourceList.filter(item => isItemInMonth(item.week, selectedMonthLabel));
    }

    // Lọc theo từ khóa tìm kiếm và lọc mục trọng điểm
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
      rank: number;
      percentage: number;
      percentageOfLine: number;
      percentageOfTotal: number;
      cumulativePercent: number;
      isPareto: boolean;
    };

    let processedList: (DamagedItemRecord & {
      lineType: 'RO' | 'BG';
      lineName: string;
      calcAmount: number;
      weekList: string[];
      occurrences: number;
    })[] = [];

    if (isGroupedByCode && (!filterByPeriod || selectionMode === 'month' || analysisFilterWeek === 'all')) {
      const groupMap = new Map<string, any>();
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

    const lineTotal = processedList.reduce((s, i) => s + i.calcAmount, 0);
    const safeLineTotal = lineTotal || 1;
    const safeFactoryTotal = factoryGrandTotal || safeLineTotal;

    let cumulative = 0;
    const ranked: ProcessedItem[] = processedList.map((item, index) => {
      const percentageOfLine = Number(((item.calcAmount / safeLineTotal) * 100).toFixed(1));
      const percentageOfTotal = Number(((item.calcAmount / safeFactoryTotal) * 100).toFixed(1));
      cumulative += percentageOfLine;
      return {
        ...item,
        rank: index + 1,
        percentage: percentageOfLine,
        percentageOfLine,
        percentageOfTotal,
        cumulativePercent: Number(cumulative.toFixed(1)),
        isPareto: cumulative <= 80 || index === 0,
      };
    });

    const top5Total = ranked.slice(0, 5).reduce((s, i) => s + i.calcAmount, 0);
    const top5Percentage = lineTotal > 0 ? Number(((top5Total / lineTotal) * 100).toFixed(1)) : 0;

    return {
      items: ranked,
      totalAmount: lineTotal,
      top5Total,
      top5Percentage,
      topItem: ranked.length > 0 ? ranked[0] : null,
      count: ranked.length,
    };
  };

  // Tính tổng nhà máy sơ bộ để tính % đóng góp
  const roughFactoryTotal = useMemo(() => {
    const all = [...(data.itemsRO || []), ...(data.itemsBG || [])];
    return all.reduce((s, i) => s + (i.amount || (i.quantity * i.unitPrice) || 0), 0) || 1;
  }, [data.itemsRO, data.itemsBG]);

  // 1. Phân tích trọng điểm hư hỏng riêng cho DÂY CHUYỀN BẾP GAS (DCBG)
  const bgAnalysis = useMemo(() => {
    return processDefectList(data.itemsBG || [], 'BG', 'Bếp Ga', roughFactoryTotal);
  }, [data.itemsBG, analysisFilterWeek, filterByPeriod, selectionMode, targetDisplayWeek, selectedMonthLabel, searchTerm, highlightOnly, isGroupedByCode, roughFactoryTotal]);

  // 2. Phân tích trọng điểm hư hỏng riêng cho DÂY CHUYỀN MÁY LỌC NƯỚC (DCRO)
  const roAnalysis = useMemo(() => {
    return processDefectList(data.itemsRO || [], 'RO', 'Line RO', roughFactoryTotal);
  }, [data.itemsRO, analysisFilterWeek, filterByPeriod, selectionMode, targetDisplayWeek, selectedMonthLabel, searchTerm, highlightOnly, isGroupedByCode, roughFactoryTotal]);

  // 3. Phân tích gộp toàn xưởng (PARETO CHUNG)
  const combinedAnalysis = useMemo(() => {
    return processDefectList([], 'COMBINED', 'Toàn xưởng', roughFactoryTotal);
  }, [data.itemsRO, data.itemsBG, analysisFilterWeek, filterByPeriod, selectionMode, targetDisplayWeek, selectedMonthLabel, searchTerm, highlightOnly, isGroupedByCode, roughFactoryTotal]);

  // Giữ lại topHighValueItems để tương thích các chỗ gọi cũ
  const topHighValueItems = combinedAnalysis.items;
  const totalAnalysisAmount = combinedAnalysis.totalAmount;
  const top5Total = combinedAnalysis.top5Total;
  const top5Percentage = combinedAnalysis.top5Percentage;

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

  // Tổng tổn thất hiệu lực từng line theo chế độ lọc hiện tại (dùng hiển thị phân rõ Bếp Gas vs RO)
  const effectiveBGTotal = useMemo(() => {
    if (bgAnalysis.totalAmount > 0) return bgAnalysis.totalAmount;
    if (filterByPeriod) {
      return selectionMode === 'week' ? activeWeekTotalBG : activeMonthTotalBG;
    }
    return totalBG;
  }, [bgAnalysis.totalAmount, filterByPeriod, selectionMode, activeWeekTotalBG, activeMonthTotalBG, totalBG]);

  const effectiveROTotal = useMemo(() => {
    if (roAnalysis.totalAmount > 0) return roAnalysis.totalAmount;
    if (filterByPeriod) {
      return selectionMode === 'week' ? activeWeekTotalRO : activeMonthTotalRO;
    }
    return totalRO;
  }, [roAnalysis.totalAmount, filterByPeriod, selectionMode, activeWeekTotalRO, activeMonthTotalRO, totalRO]);

  const effectiveGrandTotal = useMemo(() => {
    const sum = effectiveBGTotal + effectiveROTotal;
    if (sum > 0) return sum;
    if (filterByPeriod) {
      return selectionMode === 'week' ? activeWeekGrandTotal : activeMonthGrandTotal;
    }
    return grandTotal;
  }, [effectiveBGTotal, effectiveROTotal, filterByPeriod, selectionMode, activeWeekGrandTotal, activeMonthGrandTotal, grandTotal]);

  const effectiveBGShare = useMemo(() => {
    if (!effectiveGrandTotal) return 0;
    return Number(((effectiveBGTotal / effectiveGrandTotal) * 100).toFixed(1));
  }, [effectiveBGTotal, effectiveGrandTotal]);

  const effectiveROShare = useMemo(() => {
    if (!effectiveGrandTotal) return 0;
    return Number(((effectiveROTotal / effectiveGrandTotal) * 100).toFixed(1));
  }, [effectiveROTotal, effectiveGrandTotal]);

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
              BÁO CÁO TỔN THẤT & TỈ LỆ HÀNG HƯ HỎNG ({selectionMode === 'week' ? (showAllWeeks ? 'Tất cả tuần' : targetDisplayWeek) : selectedMonthLabel})
            </h1>
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-amber-400 text-slate-900 shadow-xs">
              Mục Tiêu Năm 2026
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
                          isLatestInView && !showAllWeeks
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-rose-700 text-white hover:bg-rose-800 animate-pulse'
                        }`}
                        title="Xem tuần hiện tại / mới nhất"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Hiện tại ({latestWeekWithData})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chart Visual with exact red bars and labels */}
                <div className="h-48 sm:h-56 w-full">
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
                      title={`Nhấp để nhảy đến tuần mới nhất hiện tại (${latestWeekWithData})`}
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

                  {/* Cảnh báo / Gợi ý nổi bật nếu mục mới nhất đang nằm ngoài khung nhìn */}
                  {!showAllWeeks && !isLatestInView && (
                    <div 
                      onClick={jumpToLatest}
                      className="px-2 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors shadow-2xs animate-pulse"
                      title={`Nhấp để kéo thanh trượt xem ngay ${latestWeekWithData}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{latestWeekWithData} đã có dữ liệu tổn thất ({weeklyTotals[latestWeekWithData]?.total ? `${Number((weeklyTotals[latestWeekWithData].total / 1000000).toFixed(2))}M` : '0M'})</span>
                      </span>
                      <span className="text-amber-800 underline flex items-center gap-0.5 shrink-0">
                        Kéo xem ngay ➔
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
                    Lịch sử Năm
                  </span>
                </div>

                {/* Monthly Bar Chart (Chỉ hiển thị các tháng có dữ liệu, Tháng 11 và 12 chưa đến thì không có số liệu) */}
                <div className="h-48 sm:h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeMonthlyData}
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
                        formatter={(val: any) => {
                          const num = Number(val) || 0;
                          if (num <= 0) return ['Chưa có số liệu (Chưa đến kỳ)', 'Tổn thất'];
                          return [`${val} Triệu VNĐ (~${(num * 1000000).toLocaleString('vi-VN')} đ)`, 'Tổn thất tháng'];
                        }}
                        labelFormatter={(label) => `Tháng: ${label}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', padding: '6px 10px' }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#b91c1c" 
                        radius={[4, 4, 0, 0]}
                        barSize={32}
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
                        {activeMonthlyData.map((entry, index) => (
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

          </div>

          {/* === RIGHT COLUMN: EXCEL-STYLE TABLES & PARETO VIEW (7 / 12) === */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* STATUS BANNER: HỖ TRỢ LỌC TỰ ĐỘNG THEO TUẦN HOẶC THEO THÁNG DỰA VÀO DỮ LIỆU TUẦN */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm border border-slate-700 font-sans text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-amber-300 uppercase tracking-wide text-xs truncate">
                      {filterByPeriod 
                        ? (selectionMode === 'week' 
                            ? `Linh Kiện Hư Hỏng: ${targetDisplayWeek}` 
                            : `Linh Kiện Hư Hỏng: ${selectedMonthLabel} (Gồm ${getWeeksInMonth(selectedMonthLabel).join(', ')})`)
                        : 'Tổng Hợp Tất Cả Các Tuần'
                      }
                    </span>
                    {filterByPeriod && selectionMode === 'week' && matchWeek(targetDisplayWeek, latestWeekWithData) && (
                      <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-bold rounded">
                        Mới nhất
                      </span>
                    )}
                    {filterByPeriod && selectionMode === 'month' && (
                      <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-bold rounded">
                        Lọc Tháng
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10.5px] truncate">
                    {filterByPeriod 
                      ? (selectionMode === 'week'
                          ? (matchWeek(targetDisplayWeek, 'W41')
                              ? `Tuần 41 (01 - 11/Oct - Bắt đầu Tháng 10): Tổ RMA tuần vừa qua không có SX/báo cáo • Line RO: ${formatCurrency(displayTotalRO)} đ (${filteredRO.length} mã) • Bếp Gas: ${formatCurrency(displayTotalBG)} đ (${filteredBG.length} mã)`
                              : matchWeek(targetDisplayWeek, 'W39')
                                ? `Tuần 39 (18 - 24/Sep): Line RO đạt chuẩn 0 lỗi (0 đ) • Toàn bộ tổn thất thuộc Line Bếp Gas: ${formatCurrency(displayTotalBG)} đ`
                                : displayTotalRO === 0 && displayTotalBG > 0
                                  ? `${targetDisplayWeek}: Line RO đạt chuẩn 0 lỗi (0 đ) • Toàn bộ tổn thất thuộc Line Bếp Gas (${formatCurrency(displayTotalBG)} đ)`
                                  : displayTotalBG === 0 && displayTotalRO > 0
                                    ? `${targetDisplayWeek}: Line Bếp Gas đạt chuẩn 0 lỗi (0 đ) • Toàn bộ tổn thất thuộc Line RO (${formatCurrency(displayTotalRO)} đ)`
                                    : `${targetDisplayWeek}: Phân rõ 2 dây chuyền - Line RO: ${formatCurrency(displayTotalRO)} đ (${filteredRO.length} mã) • Bếp Gas: ${formatCurrency(displayTotalBG)} đ (${filteredBG.length} mã)`)
                          : (selectedMonthLabel === 'Tháng 10'
                              ? `Dữ liệu Tháng 10 (Bắt đầu từ Tuần 41: W41, W42, W43, W44): Line RO (${formatCurrency(displayTotalRO)} đ), Bếp Gas (${formatCurrency(displayTotalBG)} đ) • RMA tuần 41 không có SX`
                              : `Dữ liệu ${selectedMonthLabel}: Lọc tự động ${filteredRO.length + filteredBG.length} linh kiện từ các tuần ${getWeeksInMonth(selectedMonthLabel).join(', ')}`))
                      : 'Đang xem toàn bộ danh mục linh kiện phát sinh qua các tuần'}
                  </span>
                </div>
              </div>

              {/* Quick Filter Buttons: TUẦN & THÁNG */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {/* Chế độ lọc Tuần / Tháng */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-600 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode('week');
                      setFilterByPeriod(true);
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      filterByPeriod && selectionMode === 'week' 
                        ? 'bg-amber-400 text-slate-950 shadow-xs' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Tuần
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode('month');
                      setFilterByPeriod(true);
                      if (!selectedMonthLabel) setSelectedMonthLabel('Tháng 10');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      filterByPeriod && selectionMode === 'month' 
                        ? 'bg-amber-400 text-slate-950 shadow-xs' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Tháng
                  </button>
                </div>

                {/* Danh sách nút theo chế độ */}
                {selectionMode === 'week' ? (
                  ['W36', 'W37', 'W38', 'W39', 'W40', 'W41', 'W42', 'W43', 'W44'].filter(w => availableWeeks.includes(w) || isSameWeek(w, latestWeekWithData) || ['W41', 'W42', 'W43', 'W44'].includes(w)).map(w => {
                    const isLatest = isSameWeek(w, latestWeekWithData);
                    const isSelected = filterByPeriod && isSameWeek(targetDisplayWeek, w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          setSelectedWeekLabel(w);
                          setSelectionMode('week');
                          setFilterByPeriod(true);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-300'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-600'
                        }`}
                        title={`Xem linh kiện hư hỏng của ${w}${['W41', 'W42', 'W43', 'W44'].includes(w) ? ' (Tháng 10)' : ' (Tháng 9)'}`}
                      >
                        <span>{w}</span>
                        {isLatest && (
                          <span className="text-[8.5px] px-1 py-0 bg-red-600 text-white rounded font-sans font-black">
                            ★
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  ['Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10'].map(m => {
                    const isSelected = filterByPeriod && selectedMonthLabel === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSelectedMonthLabel(m);
                          setSelectionMode('month');
                          setFilterByPeriod(true);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-300'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-600'
                        }`}
                        title={`Lọc tất cả linh kiện thuộc ${m} (${getWeeksInMonth(m).join(', ')})`}
                      >
                        <span>{m}</span>
                        {m === 'Tháng 10' && (
                          <span className="text-[8.5px] px-1 py-0 bg-blue-600 text-white rounded font-sans font-black">
                            W41-44
                          </span>
                        )}
                      </button>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={() => setFilterByPeriod(!filterByPeriod)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    !filterByPeriod
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                  }`}
                  title={filterByPeriod ? 'Xem toàn bộ vật tư các kỳ' : 'Bật lọc kỳ'}
                >
                  {filterByPeriod ? 'Tất cả' : 'Bật Lọc'}
                </button>
              </div>
            </div>

            {/* Phụ đề hướng dẫn tuần thuộc Tháng khi ở chế độ Tháng */}
            {filterByPeriod && selectionMode === 'month' && (
              <div className="bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-300">
                    {selectedMonthLabel === 'Tháng 10' ? 'Tháng 10 (bắt đầu từ Tuần 41):' : `${selectedMonthLabel}:`}
                  </span>
                  <span className="text-slate-400">Xem nhanh chi tiết từng tuần trong tháng:</span>
                </div>
                <div className="flex items-center gap-1">
                  {getWeeksInMonth(selectedMonthLabel).map(w => (
                    <button
                      key={`sub-${w}`}
                      type="button"
                      onClick={() => {
                        setSelectedWeekLabel(w);
                        setSelectionMode('week');
                        setFilterByPeriod(true);
                      }}
                      className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
                      title={`Chuyển sang xem chi tiết ${w}`}
                    >
                      {w} {isSameWeek(w, 'W41') ? '★' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* === BẢNG PHÂN TÍCH TRỌNG ĐIỂM HƯ HỎNG - PHÂN RÕ BẾP GAS VÀ RO CẢ 2 DÂY CHUYỀN === */}
            <div className="flex flex-col space-y-2.5 flex-1">
              {/* 1. THẺ SO SÁNH TRỌNG ĐIỂM HƯ HỎNG 2 DÂY CHUYỀN (KPI COMPARISON CARDS) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 rounded-xl p-3 shadow-sm text-white font-sans">
                {/* Thông báo RMA khi xem Tháng 10 hoặc Tuần 41 */}
                {((selectionMode === 'week' && matchWeek(targetDisplayWeek, 'W41')) || (selectionMode === 'month' && selectedMonthLabel === 'Tháng 10')) && (
                  <div className="mb-2 bg-blue-950/80 border border-blue-500/50 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-blue-200 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-black text-[9.5px]">
                        RMA TUẦN 41
                      </span>
                      <span className="font-medium text-slate-200">
                        Tổ RMA tuần vừa qua không có sản xuất cũng như không có dữ liệu báo cáo hư hỏng.
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-amber-400/30">
                      Tháng 10 bắt đầu từ Tuần 41 (01 - 11/Oct)
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-750">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white font-['Times_New_Roman',Times,serif]">
                      SO SÁNH TỔN THẤT & TRỌNG ĐIỂM HƯ HỎNG 2 DÂY CHUYỀN {filterByPeriod ? `(${selectionMode === 'week' ? targetDisplayWeek : selectedMonthLabel})` : '(TẤT CẢ KỲ)'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                    <span>Tổng tổn thất 2 DC:</span>
                    <strong className="text-rose-400 font-mono text-sm">{formatCurrency(effectiveGrandTotal)} đ</strong>
                  </div>
                </div>

                {/* 2 Cột so sánh Bếp Gas vs RO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Card Bếp Gas (DCBG) */}
                  <div className="bg-gradient-to-br from-amber-950/60 to-rose-950/40 border border-amber-600/40 rounded-lg p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-amber-300 text-xs tracking-wide">DÂY CHUYỀN BẾP GAS (DCBG)</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-2xs">
                        Chiếm {effectiveBGShare}% tổn thất
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between py-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Tổn thất Bếp Gas:</span>
                        <strong className="text-amber-200 font-mono text-lg font-black">{formatCurrency(effectiveBGTotal)} VNĐ</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Số mã VT lỗi:</span>
                        <span className="font-bold text-slate-200 text-xs font-mono">{bgAnalysis.count} mã ({bgAnalysis.top5Percentage}% top 5)</span>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-amber-800/40 text-[10.5px] text-amber-100 flex items-center justify-between">
                      <span className="text-slate-400 truncate mr-1">Thiệt hại lớn nhất:</span>
                      <strong className="text-amber-300 truncate max-w-[200px]" title={bgAnalysis.topItem ? `${bgAnalysis.topItem.itemName} (${formatCurrency(bgAnalysis.topItem.calcAmount)} đ)` : 'Không phát sinh'}>
                        {bgAnalysis.topItem ? `${bgAnalysis.topItem.itemName} (${formatCurrency(bgAnalysis.topItem.calcAmount)} đ)` : 'Không phát sinh'}
                      </strong>
                    </div>
                  </div>

                  {/* Card Line RO (DCRO) */}
                  <div className="bg-gradient-to-br from-cyan-950/60 to-teal-950/40 border border-cyan-600/40 rounded-lg p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        <span className="font-black text-cyan-300 text-xs tracking-wide">DÂY CHUYỀN RO (DCRO)</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                        effectiveROTotal === 0 ? 'bg-emerald-400 text-slate-950' : 'bg-cyan-400 text-slate-950'
                      }`}>
                        {effectiveROTotal === 0 ? '0% (Đạt chuẩn 0 lỗi)' : `Chiếm ${effectiveROShare}% tổn thất`}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between py-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Tổn thất Line RO:</span>
                        <strong className="text-cyan-200 font-mono text-lg font-black">{formatCurrency(effectiveROTotal)} VNĐ</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Số mã VT lỗi:</span>
                        <span className="font-bold text-slate-200 text-xs font-mono">{roAnalysis.count} mã {roAnalysis.count > 0 ? `(${roAnalysis.top5Percentage}% top 5)` : ''}</span>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-cyan-800/40 text-[10.5px] text-cyan-100 flex items-center justify-between">
                      <span className="text-slate-400 truncate mr-1">Thiệt hại lớn nhất:</span>
                      <strong className={`truncate max-w-[200px] ${effectiveROTotal === 0 ? 'text-emerald-300 font-black' : 'text-cyan-300'}`} title={roAnalysis.topItem ? `${roAnalysis.topItem.itemName} (${formatCurrency(roAnalysis.topItem.calcAmount)} đ)` : 'Đạt chuẩn 0 lỗi chất lượng'}>
                        {roAnalysis.topItem ? `${roAnalysis.topItem.itemName} (${formatCurrency(roAnalysis.topItem.calcAmount)} đ)` : 'Đạt chuẩn 0 lỗi chất lượng (0 đ)'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Thanh so sánh tương quan tỷ trọng tổn thất */}
                <div className="mt-2.5 pt-2 border-t border-slate-750 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Bếp Gas: {effectiveBGShare}% ({formatCurrency(effectiveBGTotal)} đ)
                    </span>
                    <span className="text-slate-400 text-[9.5px]">Tương quan tỷ trọng tổn thất giữa 2 Line</span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      Line RO: {effectiveROShare}% ({formatCurrency(effectiveROTotal)} đ)
                      <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-rose-600 h-full transition-all duration-500" 
                      style={{ width: `${Math.max(2, Math.min(98, effectiveBGShare))}%` }} 
                      title={`Bếp Gas: ${effectiveBGShare}%`}
                    />
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full transition-all duration-500" 
                      style={{ width: `${Math.max(2, Math.min(98, effectiveROShare))}%` }} 
                      title={`Line RO: ${effectiveROShare}%`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. THANH CHỌN CHẾ ĐỘ PHÂN TÍCH & BỘ LỌC DÂY CHUYỀN */}
              <div className="bg-slate-100 p-2 rounded-xl border border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs font-sans shadow-2xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-600 font-bold text-[11px] mr-1">Chế độ xem:</span>
                  <button
                    type="button"
                    onClick={() => setLineViewMode('both')}
                    className={`px-3 py-1 rounded-lg font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      lineViewMode === 'both'
                        ? 'bg-gradient-to-r from-slate-900 via-rose-900 to-slate-900 text-amber-300 border border-slate-950 ring-1 ring-amber-400/50'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                    }`}
                    title="Phân rõ ràng và song song cả 2 dây chuyền Bếp Gas và RO"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Phân Rõ Cả 2 Dây Chuyền</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineViewMode('bg')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      lineViewMode === 'bg'
                        ? 'bg-amber-600 text-white shadow-xs border border-amber-700'
                        : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-300'
                    }`}
                    title="Chỉ phân tích chi tiết linh kiện hư hỏng của Dây chuyền Bếp Gas"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dây Chuyền Bếp Gas ({bgAnalysis.count})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineViewMode('ro')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      lineViewMode === 'ro'
                        ? 'bg-cyan-700 text-white shadow-xs border border-cyan-800'
                        : 'bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 border border-slate-300'
                    }`}
                    title="Chỉ phân tích chi tiết linh kiện hư hỏng của Dây chuyền Máy Lọc Nước RO"
                  >
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Dây Chuyền RO ({roAnalysis.count})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineViewMode('combined')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      lineViewMode === 'combined'
                        ? 'bg-slate-800 text-white shadow-xs border border-slate-900'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
                    }`}
                    title="Bảng gộp toàn xưởng xếp hạng theo Pareto 80/20"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Toàn Xưởng Gộp ({combinedAnalysis.count})</span>
                  </button>
                </div>

                {/* Tùy chọn Bố cục khi xem Cả 2 Dây Chuyền */}
                {lineViewMode === 'both' && (
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-300 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBothLinesLayout('stacked')}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                        bothLinesLayout === 'stacked' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Xếp chồng 2 bảng riêng biệt - xem đầy đủ thông tin"
                    >
                      <Rows className="w-3 h-3" />
                      <span>Xếp Chồng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBothLinesLayout('grid')}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                        bothLinesLayout === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Hiển thị 2 cột song song để đối chiếu nhanh"
                    >
                      <Columns className="w-3 h-3" />
                      <span>Song Song</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. BẢNG DỮ LIỆU PHÂN TÍCH TRỌNG HƯ HỎNG */}
              {/* CHẾ ĐỘ 1: PHÂN RÕ CẢ 2 DÂY CHUYỀN (MẶC ĐỊNH) */}
              {lineViewMode === 'both' && (
                <div className={`flex flex-col gap-3 ${bothLinesLayout === 'grid' ? 'xl:grid xl:grid-cols-2 xl:gap-3' : 'space-y-3'}`}>
                  {/* BẢNG 1: DÂY CHUYỀN BẾP GAS (DCBG) */}
                  <div className="border border-amber-300/80 rounded-xl overflow-hidden bg-white shadow-md flex flex-col">
                    <div className="bg-gradient-to-r from-amber-950 via-rose-950 to-amber-900 text-white px-3.5 py-2 flex items-center justify-between text-xs font-bold font-sans border-b border-amber-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="uppercase font-['Times_New_Roman',Times,serif] text-xs sm:text-sm font-black tracking-tight text-amber-200 truncate">
                          PHÂN TÍCH TRỌNG HƯ HỎNG - DÂY CHUYỀN BẾP GAS
                        </span>
                        <span className="text-[9.5px] text-slate-900 bg-amber-400 font-sans font-black px-1.5 py-0.2 rounded-full shrink-0">
                          {bgAnalysis.count} MỤC
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-amber-300 font-mono font-bold">
                          {formatCurrency(effectiveBGTotal)} VNĐ
                        </span>
                      </div>
                    </div>
                    <div className="bg-amber-50/70 px-3 py-1 border-b border-amber-200 flex items-center justify-between text-[11px] text-amber-900 font-sans">
                      <span>Top 5 chiếm: <strong className="text-rose-700 font-mono font-bold">{bgAnalysis.top5Percentage}%</strong> tổn thất Bếp Gas</span>
                      <span className="text-slate-600 font-bold">Tỷ trọng: <strong className="text-amber-800">{effectiveBGShare}%</strong> toàn xưởng</span>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase text-[10px]">
                          <tr>
                            <th className="p-2 text-center w-10 border-r border-slate-200">Hạng</th>
                            {(!filterByPeriod || selectionMode === 'month') && (
                              <th className="p-2 text-center w-14 border-r border-slate-200">Tuần</th>
                            )}
                            <th className="p-2 border-r border-slate-200">Mã VT</th>
                            <th className="p-2 border-r border-slate-200">Tên linh kiện vật tư Bếp Gas</th>
                            <th className="p-2 text-center w-12 border-r border-slate-200">SL</th>
                            <th className="p-2 text-right w-20 border-r border-slate-200">Đơn giá</th>
                            <th className="p-2 text-right w-24 border-r border-slate-200">Tổn thất (đ)</th>
                            <th className="p-2 text-right w-16 border-r border-slate-200">% Line BG</th>
                            <th className="p-2 text-center w-20">Đánh giá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-sans">
                          {bgAnalysis.items.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-6 text-slate-500 italic font-serif text-xs">
                                Không ghi nhận linh kiện hư hỏng phát sinh cho Bếp Gas trong kỳ này
                              </td>
                            </tr>
                          ) : (
                            bgAnalysis.items.map((item, idx) => (
                              <tr key={`bg-${item.id || idx}`} className={`hover:bg-amber-50/40 transition-colors ${item.isHighlighted ? 'bg-amber-50/80 font-semibold' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                                <td className="p-1.5 text-center border-r border-slate-100">
                                  <span className={`inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] font-black ${
                                    idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </td>
                                {(!filterByPeriod || selectionMode === 'month') && (
                                  <td className="p-1.5 text-center border-r border-slate-100 text-[10px] text-slate-600 whitespace-nowrap">
                                    {item.weekList && item.weekList.length > 1 ? item.weekList.join(',') : item.week || '-'}
                                  </td>
                                )}
                                <td className="p-1.5 font-mono text-[10.5px] text-slate-600 border-r border-slate-100 whitespace-nowrap">{item.itemCode}</td>
                                <td className="p-1.5 font-bold text-slate-800 border-r border-slate-100">{item.itemName}</td>
                                <td className="p-1.5 text-center font-black text-slate-900 border-r border-slate-100">{item.quantity}</td>
                                <td className="p-1.5 text-right font-mono text-slate-500 border-r border-slate-100 text-[11px]">{formatCurrency(item.unitPrice)}</td>
                                <td className="p-1.5 text-right font-mono font-black text-rose-700 border-r border-slate-100 text-xs whitespace-nowrap">{formatCurrency(item.calcAmount)}</td>
                                <td className="p-1.5 text-right font-mono font-bold text-amber-900 border-r border-slate-100 text-[11px]">{item.percentageOfLine}%</td>
                                <td className="p-1.5 text-center whitespace-nowrap">
                                  {item.isPareto ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                      Pareto 80%
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      Kiểm soát
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BẢNG 2: DÂY CHUYỀN MÁY LỌC NƯỚC (DCRO) */}
                  <div className="border border-cyan-300/80 rounded-xl overflow-hidden bg-white shadow-md flex flex-col">
                    <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white px-3.5 py-2 flex items-center justify-between text-xs font-bold font-sans border-b border-cyan-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="uppercase font-['Times_New_Roman',Times,serif] text-xs sm:text-sm font-black tracking-tight text-cyan-200 truncate">
                          PHÂN TÍCH TRỌNG HƯ HỎNG - DÂY CHUYỀN RO
                        </span>
                        <span className="text-[9.5px] text-slate-900 bg-cyan-400 font-sans font-black px-1.5 py-0.2 rounded-full shrink-0">
                          {roAnalysis.count} MỤC
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-cyan-300 font-mono font-bold">
                          {formatCurrency(effectiveROTotal)} VNĐ
                        </span>
                      </div>
                    </div>
                    <div className="bg-cyan-50/70 px-3 py-1 border-b border-cyan-200 flex items-center justify-between text-[11px] text-cyan-900 font-sans">
                      <span>Top 5 chiếm: <strong className="text-rose-700 font-mono font-bold">{roAnalysis.top5Percentage}%</strong> tổn thất Line RO</span>
                      <span className="text-slate-600 font-bold">Tỷ trọng: <strong className="text-cyan-800">{effectiveROShare}%</strong> toàn xưởng</span>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase text-[10px]">
                          <tr>
                            <th className="p-2 text-center w-10 border-r border-slate-200">Hạng</th>
                            {(!filterByPeriod || selectionMode === 'month') && (
                              <th className="p-2 text-center w-14 border-r border-slate-200">Tuần</th>
                            )}
                            <th className="p-2 border-r border-slate-200">Mã VT</th>
                            <th className="p-2 border-r border-slate-200">Tên linh kiện vật tư Line RO</th>
                            <th className="p-2 text-center w-12 border-r border-slate-200">SL</th>
                            <th className="p-2 text-right w-20 border-r border-slate-200">Đơn giá</th>
                            <th className="p-2 text-right w-24 border-r border-slate-200">Tổn thất (đ)</th>
                            <th className="p-2 text-right w-16 border-r border-slate-200">% Line RO</th>
                            <th className="p-2 text-center w-20">Đánh giá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-sans">
                          {roAnalysis.items.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-6 text-slate-500 font-serif italic text-xs">
                                <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  <span className="font-bold text-slate-800">
                                    Line RO Đạt Chuẩn 0 Lỗi {filterByPeriod && selectionMode === 'week' ? `trong tuần ${targetDisplayWeek}` : 'trong kỳ này'} (0 đ tổn thất)
                                  </span>
                                  <span className="text-[11px] text-emerald-700 font-sans font-semibold">
                                    ✓ Không phát sinh linh kiện hư hỏng • Chất lượng kiểm soát đạt 100%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            roAnalysis.items.map((item, idx) => (
                              <tr key={`ro-${item.id || idx}`} className={`hover:bg-cyan-50/40 transition-colors ${item.isHighlighted ? 'bg-amber-50/80 font-semibold' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                                <td className="p-1.5 text-center border-r border-slate-100">
                                  <span className={`inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] font-black ${
                                    idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </td>
                                {(!filterByPeriod || selectionMode === 'month') && (
                                  <td className="p-1.5 text-center border-r border-slate-100 text-[10px] text-slate-600 whitespace-nowrap">
                                    {item.weekList && item.weekList.length > 1 ? item.weekList.join(',') : item.week || '-'}
                                  </td>
                                )}
                                <td className="p-1.5 font-mono text-[10.5px] text-slate-600 border-r border-slate-100 whitespace-nowrap">{item.itemCode}</td>
                                <td className="p-1.5 font-bold text-slate-800 border-r border-slate-100">{item.itemName}</td>
                                <td className="p-1.5 text-center font-black text-slate-900 border-r border-slate-100">{item.quantity}</td>
                                <td className="p-1.5 text-right font-mono text-slate-500 border-r border-slate-100 text-[11px]">{formatCurrency(item.unitPrice)}</td>
                                <td className="p-1.5 text-right font-mono font-black text-rose-700 border-r border-slate-100 text-xs whitespace-nowrap">{formatCurrency(item.calcAmount)}</td>
                                <td className="p-1.5 text-right font-mono font-bold text-cyan-900 border-r border-slate-100 text-[11px]">{item.percentageOfLine}%</td>
                                <td className="p-1.5 text-center whitespace-nowrap">
                                  {item.isPareto ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                      Pareto 80%
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      Kiểm soát
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* CHẾ ĐỘ 2: CHUYÊN SÂU DÂY CHUYỀN BẾP GAS (DCBG) */}
              {lineViewMode === 'bg' && (
                <div className="border border-amber-400 rounded-xl overflow-hidden bg-white shadow-md flex flex-col flex-1">
                  <div className="bg-gradient-to-r from-amber-950 via-rose-950 to-amber-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold font-sans border-b border-amber-700">
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-5 h-5 text-amber-400" />
                      <span className="uppercase font-['Times_New_Roman',Times,serif] text-sm font-black tracking-tight text-amber-200">
                        PHÂN TÍCH TRỌNG ĐIỂM HƯ HỎNG - DÂY CHUYỀN BẾP GAS (DCBG)
                      </span>
                      <span className="text-[10px] text-slate-950 bg-amber-400 font-sans font-black px-2 py-0.5 rounded-full">
                        {bgAnalysis.count} MỤC • CHIẾM {effectiveBGShare}% TOÀN XƯỞNG
                      </span>
                    </div>
                    <div className="bg-slate-950/80 px-3 py-1 rounded-lg border border-amber-600/50 text-amber-300 font-mono text-sm shadow-inner">
                      <span className="text-[10px] text-slate-400 mr-2 font-sans font-black">TỔNG BẾP GAS:</span>
                      <span className="font-black text-white text-base">{formatCurrency(effectiveBGTotal)}</span>
                      <span className="text-[10px] ml-1">VNĐ</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 px-4 py-1.5 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-amber-950">
                    <span>Top 5 vật tư chiếm: <strong className="text-rose-700 font-mono font-bold text-sm">{bgAnalysis.top5Percentage}%</strong> ({formatCurrency(bgAnalysis.top5Total)} đ)</span>
                    <span>Đánh giá Pareto 80/20 chuyên sâu cho các vật tư rủi ro cao của DC Bếp Gas</span>
                  </div>

                  <div className="max-h-[440px] overflow-y-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase text-[11px]">
                        <tr>
                          <th className="p-2.5 text-center w-12 border-r border-slate-200">Hạng</th>
                          <th className="p-2.5 w-16 text-center border-r border-slate-200">Tuần</th>
                          <th className="p-2.5 border-r border-slate-200">Mã vật tư</th>
                          <th className="p-2.5 border-r border-slate-200">Tên vật tư linh kiện mô tả</th>
                          <th className="p-2.5 text-center w-14 border-r border-slate-200">SL</th>
                          <th className="p-2.5 text-right w-24 border-r border-slate-200">Đơn giá</th>
                          <th className="p-2.5 text-right w-32 border-r border-slate-200">Tổn thất (VNĐ)</th>
                          <th className="p-2.5 text-right w-20 border-r border-slate-200">% Line BG</th>
                          <th className="p-2.5 text-right w-20 border-r border-slate-200">% Toàn xưởng</th>
                          <th className="p-2.5 text-center w-28">Đánh giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-sans">
                        {bgAnalysis.items.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-10 text-slate-500 font-serif italic text-sm">
                              Không có dữ liệu vật tư hư hỏng phát sinh cho Bếp Gas trong kỳ này
                            </td>
                          </tr>
                        ) : (
                          bgAnalysis.items.map((item, idx) => (
                            <tr key={`bg-full-${item.id || idx}`} className={`hover:bg-amber-50/50 transition-colors ${item.isHighlighted ? 'bg-amber-50 font-bold' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                              <td className="p-2 text-center border-r border-slate-100">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black ${
                                  idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="p-2 text-center border-r border-slate-100 whitespace-nowrap text-xs text-slate-600">
                                {item.weekList && item.weekList.length > 1 ? item.weekList.join(', ') : item.week || '-'}
                              </td>
                              <td className="p-2 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-100 whitespace-nowrap">{item.itemCode}</td>
                              <td className="p-2 font-bold text-slate-800 border-r border-slate-100">{item.itemName}</td>
                              <td className="p-2 text-center font-black text-slate-900 border-r border-slate-100 text-[13px]">{item.quantity}</td>
                              <td className="p-2 text-right font-mono text-slate-500 border-r border-slate-100 text-xs">{formatCurrency(item.unitPrice)}</td>
                              <td className="p-2 text-right font-mono font-black text-rose-700 border-r border-slate-100 text-sm whitespace-nowrap">{formatCurrency(item.calcAmount)}</td>
                              <td className="p-2 text-right font-mono font-bold text-amber-900 border-r border-slate-100 text-xs">{item.percentageOfLine}%</td>
                              <td className="p-2 text-right font-mono text-slate-600 border-r border-slate-100 text-xs">{item.percentageOfTotal}%</td>
                              <td className="p-2 text-center whitespace-nowrap">
                                {item.isPareto ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                    Pareto 80%
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    Kiểm soát
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CHẾ ĐỘ 3: CHUYÊN SÂU DÂY CHUYỀN MÁY LỌC NƯỚC (DCRO) */}
              {lineViewMode === 'ro' && (
                <div className="border border-cyan-400 rounded-xl overflow-hidden bg-white shadow-md flex flex-col flex-1">
                  <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold font-sans border-b border-cyan-700">
                    <div className="flex items-center gap-2.5">
                      <Droplets className="w-5 h-5 text-cyan-400" />
                      <span className="uppercase font-['Times_New_Roman',Times,serif] text-sm font-black tracking-tight text-cyan-200">
                        PHÂN TÍCH TRỌNG ĐIỂM HƯ HỎNG - DÂY CHUYỀN RO (DCRO)
                      </span>
                      <span className="text-[10px] text-slate-950 bg-cyan-400 font-sans font-black px-2 py-0.5 rounded-full">
                        {roAnalysis.count} MỤC • CHIẾM {effectiveROShare}% TOÀN XƯỞNG
                      </span>
                    </div>
                    <div className="bg-slate-950/80 px-3 py-1 rounded-lg border border-cyan-600/50 text-cyan-300 font-mono text-sm shadow-inner">
                      <span className="text-[10px] text-slate-400 mr-2 font-sans font-black">TỔNG LINE RO:</span>
                      <span className="font-black text-white text-base">{formatCurrency(effectiveROTotal)}</span>
                      <span className="text-[10px] ml-1">VNĐ</span>
                    </div>
                  </div>

                  <div className="bg-cyan-50 px-4 py-1.5 border-b border-cyan-200 flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-cyan-950">
                    <span>Top 5 vật tư chiếm: <strong className="text-rose-700 font-mono font-bold text-sm">{roAnalysis.top5Percentage}%</strong> ({formatCurrency(roAnalysis.top5Total)} đ)</span>
                    <span>Đánh giá Pareto 80/20 chuyên sâu cho các vật tư rủi ro cao của DC Máy Lọc Nước RO</span>
                  </div>

                  <div className="max-h-[440px] overflow-y-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase text-[11px]">
                        <tr>
                          <th className="p-2.5 text-center w-12 border-r border-slate-200">Hạng</th>
                          <th className="p-2.5 w-16 text-center border-r border-slate-200">Tuần</th>
                          <th className="p-2.5 border-r border-slate-200">Mã vật tư</th>
                          <th className="p-2.5 border-r border-slate-200">Tên vật tư linh kiện mô tả</th>
                          <th className="p-2.5 text-center w-14 border-r border-slate-200">SL</th>
                          <th className="p-2.5 text-right w-24 border-r border-slate-200">Đơn giá</th>
                          <th className="p-2.5 text-right w-32 border-r border-slate-200">Tổn thất (VNĐ)</th>
                          <th className="p-2.5 text-right w-20 border-r border-slate-200">% Line RO</th>
                          <th className="p-2.5 text-right w-20 border-r border-slate-200">% Toàn xưởng</th>
                          <th className="p-2.5 text-center w-28">Đánh giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-sans">
                        {roAnalysis.items.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-12 text-slate-500 font-serif italic text-sm">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                <span className="font-bold text-slate-800 text-base">
                                  Line RO Đạt Chuẩn 0 Lỗi {filterByPeriod && selectionMode === 'week' ? `trong tuần ${targetDisplayWeek}` : 'trong kỳ này'} (0 VNĐ tổn thất)
                                </span>
                                <span className="text-xs text-slate-500 max-w-md">
                                  Không ghi nhận bất kỳ linh kiện hỏng nào phát sinh trên Line RO. Toàn bộ dây chuyền hoạt động chuẩn chỉ và an toàn tuyệt đối.
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          roAnalysis.items.map((item, idx) => (
                            <tr key={`ro-full-${item.id || idx}`} className={`hover:bg-cyan-50/50 transition-colors ${item.isHighlighted ? 'bg-amber-50 font-bold' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                              <td className="p-2 text-center border-r border-slate-100">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black ${
                                  idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="p-2 text-center border-r border-slate-100 whitespace-nowrap text-xs text-slate-600">
                                {item.weekList && item.weekList.length > 1 ? item.weekList.join(', ') : item.week || '-'}
                              </td>
                              <td className="p-2 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-100 whitespace-nowrap">{item.itemCode}</td>
                              <td className="p-2 font-bold text-slate-800 border-r border-slate-100">{item.itemName}</td>
                              <td className="p-2 text-center font-black text-slate-900 border-r border-slate-100 text-[13px]">{item.quantity}</td>
                              <td className="p-2 text-right font-mono text-slate-500 border-r border-slate-100 text-xs">{formatCurrency(item.unitPrice)}</td>
                              <td className="p-2 text-right font-mono font-black text-rose-700 border-r border-slate-100 text-sm whitespace-nowrap">{formatCurrency(item.calcAmount)}</td>
                              <td className="p-2 text-right font-mono font-bold text-cyan-900 border-r border-slate-100 text-xs">{item.percentageOfLine}%</td>
                              <td className="p-2 text-right font-mono text-slate-600 border-r border-slate-100 text-xs">{item.percentageOfTotal}%</td>
                              <td className="p-2 text-center whitespace-nowrap">
                                {item.isPareto ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                    Pareto 80%
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    Kiểm soát
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CHẾ ĐỘ 4: BẢNG GỘP TOÀN XƯỞNG (PARETO 80/20) */}
              {lineViewMode === 'combined' && (
                <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-md flex flex-col flex-1">
                  <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold font-sans border-b border-rose-800">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      <span className="uppercase font-['Times_New_Roman',Times,serif] text-sm font-black tracking-tight">
                        BẢNG PHÂN TÍCH GỘP TOÀN XƯỞNG {filterByPeriod ? `(${selectionMode === 'week' ? targetDisplayWeek : selectedMonthLabel})` : '(TẤT CẢ KỲ)'}
                      </span>
                      <span className="text-[10px] text-amber-200 font-sans font-black px-2 py-0.5 bg-rose-900/80 rounded-full border border-rose-700">
                        PARETO 80/20 • {topHighValueItems.length} MỤC
                      </span>
                    </div>
                    <div className="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700 text-amber-300 font-mono text-sm shadow-inner">
                      <span className="text-[10px] text-slate-400 mr-2 font-sans font-black">TỔNG TỔN THẤT:</span>
                      <span className="font-black text-white text-base">
                        {formatCurrency(totalAnalysisAmount || effectiveGrandTotal)}
                      </span>
                      <span className="text-[10px] ml-1">VNĐ</span>
                    </div>
                  </div>

                  <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1 text-xs font-sans">
                    <span className="text-slate-600">
                      Gộp chung 2 Line: Bếp Gas ({formatCurrency(effectiveBGTotal)} đ) + Line RO ({formatCurrency(effectiveROTotal)} đ)
                    </span>
                    <span className="text-slate-600 font-sans text-xs">
                      Top 5 chiếm: <strong className="text-rose-700 font-mono font-bold">{top5Percentage}%</strong>
                    </span>
                  </div>

                  <div className="max-h-[440px] overflow-y-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-black sticky top-0 border-b border-slate-300 z-10 uppercase text-[11px]">
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
                      <tbody className="divide-y divide-slate-200 font-sans">
                        {topHighValueItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-10 text-slate-500 font-serif italic text-sm">
                              Không tìm thấy dữ liệu vật tư hư hỏng
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
                                key={`comb-${item.id || idx}`}
                                className={`transition-colors hover:bg-slate-50 ${
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
                                <td className="p-2 text-center border-r border-slate-100 whitespace-nowrap text-xs text-slate-600">
                                  {item.weekList && item.weekList.length > 1 ? item.weekList.join(', ') : item.week || '-'}
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
                </div>
              )}
            </div>

            {/* GRAND TOTAL SUMMARY BAR & LEGEND */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
              
              <div className="flex items-center gap-6 flex-wrap z-10">
                {/* Weekly/Monthly Breakdown for each Line */}
                {filterByPeriod && (selectionMode === 'week' ? selectedWeekLabel : selectedMonthLabel) && (
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                      <span className="text-cyan-400 font-black text-[9px] uppercase tracking-widest mb-0.5">
                        LINE RO ({selectionMode === 'week' ? selectedWeekLabel : selectedMonthLabel})
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-white font-mono text-xl font-bold">
                          {formatCurrency(effectiveROTotal)}
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
                          {formatCurrency(effectiveBGTotal)}
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
                    {formatCurrency(effectiveGrandTotal)}
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

import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { ExcelMatrixBGColumn, ExcelMatrixROColumn } from './types';
import { StorageService } from './storage';
import { recalculateBGMatrix, recalculateROMatrix, MONTH_NAMES_SHORT } from './matrixGenerator';

function findExcelColIndex(col: { label: string; dateStr?: string }, header: string[], monthIndex0: number): number {
  const targetLabel = col.label.toLowerCase().trim();
  // 1. Direct match
  const directIdx = header.findIndex(h => h.toLowerCase().trim() === targetLabel);
  if (directIdx !== -1) return directIdx;

  // 2. Day number match
  const dayMatch = col.label.match(/^(\d{1,2})/);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    const dayStr = String(dayNum).padStart(2, '0');
    const mShort = (MONTH_NAMES_SHORT[monthIndex0] || '').toLowerCase();
    
    const dayIdx = header.findIndex(h => {
      const cleanH = h.toLowerCase().trim();
      if (cleanH === String(dayNum) || cleanH === dayStr) return true;
      if (cleanH.startsWith(`${dayStr}-`) || cleanH.startsWith(`${dayNum}-`)) return true;
      if (cleanH.includes(`${dayStr}/${monthIndex0 + 1}`) || cleanH.includes(`${dayNum}/${monthIndex0 + 1}`)) return true;
      if (cleanH.includes(mShort) && (cleanH.includes(dayStr) || cleanH.includes(String(dayNum)))) return true;
      return false;
    });
    if (dayIdx !== -1) return dayIdx;
  }
  return -1;
}

function parseBGSheet(rows: any[][], year: number, monthIndex0: number): ExcelMatrixBGColumn[] {
  // Lấy ma trận hiện tại để giữ cấu trúc (W1, W2, mốc chốt...)
  const matrix = StorageService.getMatrixBGForMonth(year, monthIndex0);
  const header = (rows[0] || []).map(h => {
    if (h instanceof Date) {
      const d = h.getDate();
      const m = MONTH_NAMES_SHORT[h.getMonth()] || h.toLocaleString('en-us', { month: 'short' });
      return `${String(d).padStart(2, '0')}-${m}`;
    }
    return String(h || '').trim();
  });
  
  // Mapping labels to data
  const dataMap: Record<string, any> = {};
  rows.slice(1).forEach(row => {
    const metricLabel = String(row[0] || '').trim();
    const key = bgMetricToKey(metricLabel);
    if (key) {
      dataMap[key] = row;
    }
  });
  
  const updatedMatrix = matrix.map(col => {
    // Chỉ cập nhật các cột ngày (không phải cột tổng)
    if (col.isWeeklyTotal || col.isMonthlyTotal) return col;
    
    // Tìm index của cột trong header Excel
    const excelColIdx = findExcelColIndex(col, header, monthIndex0);
    if (excelColIdx === -1) return col;
    
    const updated = { ...col };
    Object.keys(dataMap).forEach(key => {
      const rawCell = dataMap[key][excelColIdx];
      let val = extractNumericCell(rawCell);
      if (val !== null) {
        // Convert ratios to percentages for specific fields
        if (key === 'nsldTheoNgay' || key === 'tiLeHoanThanhKhsx') {
          if (val > 0 && val < 5) val = val * 100;
        } else if (key === 'tiLeDiLam') {
          if (val > 0 && val < 2) val = val * 100;
        }
        (updated as any)[key] = Number(val.toFixed(1));
      }
    });
    
    return updated;
  });

  return recalculateBGMatrix(updatedMatrix);
}

function parseROSheet(rows: any[][], year: number, monthIndex0: number): ExcelMatrixROColumn[] {
  const matrix = StorageService.getMatrixROForMonth(year, monthIndex0);
  const header = (rows[0] || []).map(h => {
    if (h instanceof Date) {
      const d = h.getDate();
      const m = MONTH_NAMES_SHORT[h.getMonth()] || h.toLocaleString('en-us', { month: 'short' });
      return `${String(d).padStart(2, '0')}-${m}`;
    }
    return String(h || '').trim();
  });
  
  const dataMap: Record<string, any> = {};
  rows.slice(1).forEach(row => {
    const metricLabel = String(row[0] || '').trim();
    const key = roMetricToKey(metricLabel);
    if (key) {
      dataMap[key] = row;
    }
  });
  
  const updatedMatrix = matrix.map(col => {
    if (col.isWeeklyTotal || col.isMonthlyTotal) return col;
    
    const excelColIdx = findExcelColIndex(col, header, monthIndex0);
    if (excelColIdx === -1) return col;
    
    const updated = { ...col };
    Object.keys(dataMap).forEach(key => {
      const rawCell = dataMap[key][excelColIdx];
      let val = extractNumericCell(rawCell);
      if (val !== null) {
        // Convert ratios to percentages for specific fields
        if (key === 'nsldTheoNgay' || key === 'tiLeHoanThanhKhsx') {
          if (val > 0 && val < 5) val = val * 100;
        } else if (key === 'tiLeDiLam') {
          if (val > 0 && val < 2) val = val * 100;
        }
        (updated as any)[key] = Number(val.toFixed(1));
      }
    });
    
    return updated;
  });

  return recalculateROMatrix(updatedMatrix);
}

export interface ProductionExcelImportResult {
  success: boolean;
  message: string;
  bgMatrix?: ExcelMatrixBGColumn[];
  roMatrix?: ExcelMatrixROColumn[];
  year: number;
  monthIndex0: number;
}

export function getColLetter(colIdx: number): string {
  let temp = colIdx;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter || 'A';
}

/**
 * Xuất file Excel mẫu (.xlsx) để cập nhật dữ liệu năng suất cho cả 2 nhóm BG và RO
 * Được tối ưu định dạng đặc biệt để người dùng có thể COPY-PASTE hàng loạt không bị lỗi
 */
export async function exportProductionTemplate(year: number, monthIndex0: number): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hệ Thống Quản Lý Sản Xuất PXLR NMBD';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Lấy dữ liệu hiện tại từ Storage
  const currentBG = StorageService.getMatrixBGForMonth(year, monthIndex0);
  const currentRO = StorageService.getMatrixROForMonth(year, monthIndex0);

  // Tách riêng các cột ngày và các cột tổng (tuần/tháng)
  const dayColsBG = currentBG.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal);
  const totalColsBG = currentBG.filter(c => c.isWeeklyTotal || c.isMonthlyTotal);

  const dayColsRO = currentRO.filter(c => !c.isWeeklyTotal && !c.isMonthlyTotal);
  const totalColsRO = currentRO.filter(c => c.isWeeklyTotal || c.isMonthlyTotal);

  // Định nghĩa các chỉ số dòng cho BG
  const bgRows = [
    { label: 'CÔNG Bếp GA', key: 'congBepGa', isInput: true, numFmt: '#,##0.0' },
    { label: 'CÔNG THỜI VỤ', key: 'congThoiVu', isInput: true, numFmt: '#,##0.0' },
    { label: 'CÔNG RMA', key: 'congRma', isInput: true, numFmt: '#,##0.0' },
    { label: 'SẢN LƯỢNG QUY ĐỔI Bếp Ga', key: 'sanLuongBepGa', isInput: true, numFmt: '#,##0' },
    { label: 'SẢN LƯỢNG QUY ĐỔI RMA', key: 'sanLuongRma', isInput: true, numFmt: '#,##0' },
    { label: 'ĐỊNH MỨC SL THEO NS', key: 'dinhMucSlTheoNs', isInput: false, numFmt: '#,##0.0', formula: (c: string) => `(${c}2+${c}3+${c}4)*9.03` },
    { label: 'NSLĐ THEO NGÀY', key: 'nsldTheoNgay', isInput: false, numFmt: '0.0%', formula: (c: string) => `IFERROR((${c}5+${c}6)/${c}7, 0)` },
    { label: 'KHSX NGÀY', key: 'khsxNgay', isInput: true, numFmt: '#,##0' },
    { label: 'TỈ LỆ HOÀN THÀNH KHSX', key: 'tiLeHoanThanhKhsx', isInput: false, numFmt: '0.0%', formula: (c: string) => `IFERROR((${c}5+${c}6)/${c}9, 0)` },
    { label: 'Tổng nhân sự Line', key: 'tongNhanSuLine', isInput: true, numFmt: '#,##0' },
    { label: 'Nhân sự nghỉ', key: 'nhanSuNghi', isInput: true, numFmt: '#,##0' },
    { label: 'TỈ LỆ ĐI LÀM', key: 'tiLeDiLam', isInput: false, numFmt: '0.0%', formula: (c: string) => `IFERROR((${c}11-${c}12)/${c}11, 0)` },
  ];

  // Định nghĩa các chỉ số dòng cho RO
  const roRows = [
    { label: 'CÔNG CHÍNH THỨC', key: 'congChinhThuc', isInput: true, numFmt: '#,##0.0' },
    { label: 'CÔNG THỜI VỤ', key: 'congThoiVu', isInput: true, numFmt: '#,##0.0' },
    { label: 'SẢN LƯỢNG QUY ĐỔI LINE CHÍNH', key: 'sanLuongLineChinh', isInput: true, numFmt: '#,##0' },
    { label: 'ĐỊNH MỨC SL THEO NS', key: 'dinhMucSlTheoNs', isInput: false, numFmt: '#,##0.0', formula: (c: string) => `(${c}2+${c}3)*9.03` },
    { label: 'NSLĐ THEO NGÀY', key: 'nsldTheoNgay', isInput: false, numFmt: '0.0%', formula: (c: string) => `IFERROR(${c}4/${c}5, 0)` },
    { label: 'KHSX NGÀY', key: 'khsxNgay', isInput: true, numFmt: '#,##0' },
    { label: 'TỈ LỆ HOÀN THÀNH KHSX', key: 'tiLeHoanThanhKhsx', isInput: false, numFmt: '0.0%', formula: (c: string) => `IFERROR(${c}4/${c}7, 0)` },
    { label: 'TỔNG NHÂN SỰ LINE ĐI LÀM', key: 'tongNhanSuLine', isInput: true, numFmt: '#,##0' },
    { label: 'TỔNG NHÂN SỰ NGHỈ', key: 'nhanSuNghi', isInput: true, numFmt: '#,##0' },
    { label: 'TỈ LỆ ĐI LÀM', key: 'tiLeDiLam', isInput: false, numFmt: '0.0%', formula: (c: string) => `IFERROR((${c}9-${c}10)/${c}9, 0)` },
  ];

  // Helper áp dụng style chuẩn
  const applySheetStyles = (ws: ExcelJS.Worksheet) => {
    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
    ws.getRow(1).height = 28;
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004D40' } }; // Dark Teal
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    ws.getColumn(1).width = 32;
    ws.getColumn(1).font = { bold: true, size: 9 };
    ws.getColumn(1).alignment = { vertical: 'middle', horizontal: 'left' };

    for (let i = 2; i <= ws.columnCount; i++) {
      ws.getColumn(i).width = 13;
      ws.getColumn(i).alignment = { vertical: 'middle', horizontal: 'center' };
    }

    ws.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });
  };

  // =========================================================================
  // 1. SHEET 1: NHÓM BG (Nhập Ngày Liên Tục) - THIẾT KẾ ĐẶC BIỆT ĐỂ COPY-PASTE 31 NGÀY
  // =========================================================================
  const wsBGCont = workbook.addWorksheet('Nhóm BG (Nhập Ngày Liên Tục)');
  const bgContHeader = ['CHỈ SỐ / NGÀY', ...dayColsBG.map(c => c.label), ...totalColsBG.map(c => c.label)];
  wsBGCont.addRow(bgContHeader);

  bgRows.forEach((rowDef, rowIdx) => {
    const excelRow = rowIdx + 2;
    const row = wsBGCont.getRow(excelRow);
    row.getCell(1).value = rowDef.label;

    // Các cột ngày liên tục (Cột B trở đi)
    dayColsBG.forEach((col, dayIdx) => {
      const excelCol = dayIdx + 2;
      const cell = row.getCell(excelCol);
      const colLetter = getColLetter(excelCol);

      if (rowDef.numFmt) cell.numFmt = rowDef.numFmt;

      if (rowDef.isInput) {
        cell.value = (col as any)[rowDef.key] || 0;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFDE7' } }; // Light Yellow
        cell.protection = { locked: false };
      } else {
        if (rowDef.formula) cell.value = { formula: rowDef.formula(colLetter) };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }; // Light Sky Blue
      }
    });

    // Các cột tổng hợp đặt ở cuối (W41, W42, Tổng Tháng)
    totalColsBG.forEach((col, tIdx) => {
      const excelCol = dayColsBG.length + 2 + tIdx;
      const cell = row.getCell(excelCol);
      const colLetter = getColLetter(excelCol);

      if (rowDef.numFmt) cell.numFmt = rowDef.numFmt;

      if (col.isMonthlyTotal) {
        // Tổng tháng = SUM toàn bộ ngày
        const startLetter = getColLetter(2);
        const endLetter = getColLetter(dayColsBG.length + 1);
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          cell.value = { formula: `SUM(${startLetter}${excelRow}:${endLetter}${excelRow})` };
        } else if (rowDef.formula) {
          cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } }; // Orange
      } else {
        // Cột tuần
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          // Tính sum theo tuần tương ứng
          cell.value = (col as any)[rowDef.key] || 0;
        } else if (rowDef.formula) {
          cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // Gray
      }
    });
  });
  applySheetStyles(wsBGCont);

  // =========================================================================
  // 2. SHEET 2: NHÓM BG (Bảng Chi Tiết) - Ma trận đầy đủ với cột tuần xen kẽ
  // =========================================================================
  const wsBGDetail = workbook.addWorksheet('Nhóm BG');
  const bgDetailHeader = ['CHỈ SỐ / NGÀY', ...currentBG.map(c => c.label)];
  wsBGDetail.addRow(bgDetailHeader);

  bgRows.forEach((rowDef, rowIdx) => {
    const excelRow = rowIdx + 2;
    const row = wsBGDetail.getRow(excelRow);
    row.getCell(1).value = rowDef.label;

    currentBG.forEach((col, colIdx) => {
      const excelCol = colIdx + 2;
      const cell = row.getCell(excelCol);
      const colLetter = getColLetter(excelCol);

      if (rowDef.numFmt) cell.numFmt = rowDef.numFmt;

      if (col.isWeeklyTotal || col.isMonthlyTotal) {
        let startCol = 2;
        for (let i = colIdx - 1; i >= 0; i--) {
          if (currentBG[i].isWeeklyTotal || currentBG[i].isMonthlyTotal) {
            startCol = i + 3;
            break;
          }
        }
        const range = `${getColLetter(startCol)}${excelRow}:${getColLetter(colIdx + 1)}${excelRow}`;
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          cell.value = { formula: `SUM(${range})` };
        } else if (rowDef.formula) {
          cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.isMonthlyTotal ? 'FFFFE0B2' : 'FFF3F4F6' } };
      } else {
        if (rowDef.isInput) {
          cell.value = (col as any)[rowDef.key] || 0;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFDE7' } };
          cell.protection = { locked: false };
        } else {
          if (rowDef.formula) cell.value = { formula: rowDef.formula(colLetter) };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
        }
      }
    });
  });
  applySheetStyles(wsBGDetail);

  // =========================================================================
  // 3. SHEET 3: NHÓM RO (Nhập Ngày Liên Tục) - COPY-PASTE 31 NGÀY LIÊN TỤC
  // =========================================================================
  const wsROCont = workbook.addWorksheet('Nhóm RO (Nhập Ngày Liên Tục)');
  const roContHeader = ['CHỈ SỐ / NGÀY', ...dayColsRO.map(c => c.label), ...totalColsRO.map(c => c.label)];
  wsROCont.addRow(roContHeader);

  roRows.forEach((rowDef, rowIdx) => {
    const excelRow = rowIdx + 2;
    const row = wsROCont.getRow(excelRow);
    row.getCell(1).value = rowDef.label;

    dayColsRO.forEach((col, dayIdx) => {
      const excelCol = dayIdx + 2;
      const cell = row.getCell(excelCol);
      const colLetter = getColLetter(excelCol);

      if (rowDef.numFmt) cell.numFmt = rowDef.numFmt;

      if (rowDef.isInput) {
        cell.value = (col as any)[rowDef.key] || 0;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFDE7' } };
        cell.protection = { locked: false };
      } else {
        if (rowDef.formula) cell.value = { formula: rowDef.formula(colLetter) };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      }
    });

    totalColsRO.forEach((col, tIdx) => {
      const excelCol = dayColsRO.length + 2 + tIdx;
      const cell = row.getCell(excelCol);
      const colLetter = getColLetter(excelCol);

      if (rowDef.numFmt) cell.numFmt = rowDef.numFmt;

      if (col.isMonthlyTotal) {
        const startLetter = getColLetter(2);
        const endLetter = getColLetter(dayColsRO.length + 1);
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          cell.value = { formula: `SUM(${startLetter}${excelRow}:${endLetter}${excelRow})` };
        } else if (rowDef.formula) {
          cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
      } else {
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          cell.value = (col as any)[rowDef.key] || 0;
        } else if (rowDef.formula) {
          cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      }
    });
  });
  applySheetStyles(wsROCont);

  // =========================================================================
  // 4. SHEET 4: NHÓM RO (Bảng Chi Tiết) - Ma trận đầy đủ với cột tuần xen kẽ
  // =========================================================================
  const wsRODetail = workbook.addWorksheet('Nhóm RO');
  const roDetailHeader = ['CHỈ SỐ / NGÀY', ...currentRO.map(c => c.label)];
  wsRODetail.addRow(roDetailHeader);

  roRows.forEach((rowDef, rowIdx) => {
    const excelRow = rowIdx + 2;
    const row = wsRODetail.getRow(excelRow);
    row.getCell(1).value = rowDef.label;

    currentRO.forEach((col, colIdx) => {
      const excelCol = colIdx + 2;
      const cell = row.getCell(excelCol);
      const colLetter = getColLetter(excelCol);

      if (rowDef.numFmt) cell.numFmt = rowDef.numFmt;

      if (col.isWeeklyTotal || col.isMonthlyTotal) {
        let startCol = 2;
        for (let i = colIdx - 1; i >= 0; i--) {
          if (currentRO[i].isWeeklyTotal || currentRO[i].isMonthlyTotal) {
            startCol = i + 3;
            break;
          }
        }
        const range = `${getColLetter(startCol)}${excelRow}:${getColLetter(colIdx + 1)}${excelRow}`;
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          cell.value = { formula: `SUM(${range})` };
        } else if (rowDef.formula) {
          cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.isMonthlyTotal ? 'FFFFE0B2' : 'FFF3F4F6' } };
      } else {
        if (rowDef.isInput) {
          cell.value = (col as any)[rowDef.key] || 0;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFDE7' } };
          cell.protection = { locked: false };
        } else {
          if (rowDef.formula) cell.value = { formula: rowDef.formula(colLetter) };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
        }
      }
    });
  });
  applySheetStyles(wsRODetail);

  // =========================================================================
  // 5. SHEET 5: HƯỚNG DẪN COPY-PASTE VÀ ĐỊNH DẠNG CHUẨN
  // =========================================================================
  const wsInst = workbook.addWorksheet('Hướng Dẫn Copy-Paste');
  wsInst.addRow(['QUY TẮC MÀU SẮC', 'Ý NGHĨA', 'HƯỚNG DẪN CẬP NHẬT']);
  wsInst.addRow(['MÀU VÀNG NHẠT', 'Ô NHẬP LIỆU HÀNG NGÀY', 'Có thể copy-paste trực tiếp toàn bộ hàng số liệu hoặc điền tay.']);
  wsInst.addRow(['MÀU XANH NHẠT', 'Ô CÔNG THỨC TỰ ĐỘNG', 'Không cần điền số. Excel tự động tính theo công thức nhà máy.']);
  wsInst.addRow(['MÀU XÁM / CAM', 'CỘT TỔNG TUẦN / TỔNG THÁNG', 'Tự động tính tổng và tỉ lệ hoàn thành. Không ghi đè.']);
  wsInst.addRow(['', '', '']);
  wsInst.addRow(['⭐ MẸO COPY-PASTE NHANH NHẤT:', '', '']);
  wsInst.addRow(['Cách 1', 'Sheet "Nhập Ngày Liên Tục"', 'Các ngày 01 đến 31 được xếp liên tiếp nhau. Bạn có thể copy cả dãy 31 ngày từ file nguồn và dán (Ctrl+V) vào ô Ngày 01.']);
  wsInst.addRow(['Cách 2', 'Dán trực tiếp trên Web', 'Trong giao diện Dashboard web, bấm "Dán Excel" hoặc chọn ô đầu tiên và bấm Ctrl+V để dán dữ liệu.']);
  
  wsInst.getColumn(1).width = 25;
  wsInst.getColumn(2).width = 35;
  wsInst.getColumn(3).width = 65;
  wsInst.getRow(1).height = 25;
  wsInst.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsInst.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004D40' } };
  wsInst.getRow(6).font = { bold: true, color: { argb: 'FF004D40' } };

  // Ghi file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mau_Cap_Nhat_DCLR_T${monthIndex0 + 1}_${year}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Helper trích xuất giá trị số an toàn từ ô Excel
 */
export function extractNumericCell(rawCell: any): number | null {
  if (rawCell === undefined || rawCell === null) return null;
  if (typeof rawCell === 'object' && rawCell !== null && 'result' in rawCell) {
    rawCell = rawCell.result;
  }
  const str = String(rawCell).trim();
  if (str === '' || str === '-' || str === 'N/A' || str === 'null') return null;
  const isPercent = str.endsWith('%');
  const clean = str.replace(/%/g, '').replace(/,/g, '').trim();
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  if (isPercent) return num;
  return num;
}

/**
 * Nhập dữ liệu từ file Excel - Tự động phát hiện sheet và cấu trúc
 */
export async function importProductionExcel(file: File, year: number, monthIndex0: number): Promise<ProductionExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        let bgMatrix: ExcelMatrixBGColumn[] | undefined;
        let roMatrix: ExcelMatrixROColumn[] | undefined;
        
        // 1. Tìm sheet BG theo thứ tự ưu tiên
        const bgSheetNames = [
          'Nhóm BG (Nhập Ngày Liên Tục)',
          'Nhóm BG',
          'Nhóm BG (Bảng Chi Tiết)',
          'BG',
          'Bếp Ga',
          'BEP GA'
        ];
        let foundBgSheetName = bgSheetNames.find(name => !!workbook.Sheets[name]);
        
        // Nếu không tìm thấy theo tên, quét sheet đầu tiên nếu có chứa từ khóa Bếp Ga
        if (!foundBgSheetName) {
          for (const sName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sName];
            const sample = JSON.stringify(sheet).toUpperCase();
            if (sample.includes('BẾP GA') || sample.includes('BEP GA') || sample.includes('CONGBEPGA')) {
              foundBgSheetName = sName;
              break;
            }
          }
        }

        if (foundBgSheetName) {
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[foundBgSheetName], { header: 1 }) as any[][];
          bgMatrix = parseBGSheet(rawData, year, monthIndex0);
        }
        
        // 2. Tìm sheet RO theo thứ tự ưu tiên
        const roSheetNames = [
          'Nhóm RO (Nhập Ngày Liên Tục)',
          'Nhóm RO',
          'Nhóm RO (Bảng Chi Tiết)',
          'RO',
          'Máy Lọc Nước RO',
          'MAY LOC NUOC'
        ];
        let foundRoSheetName = roSheetNames.find(name => !!workbook.Sheets[name]);

        if (!foundRoSheetName) {
          for (const sName of workbook.SheetNames) {
            if (sName === foundBgSheetName) continue;
            const sheet = workbook.Sheets[sName];
            const sample = JSON.stringify(sheet).toUpperCase();
            if (sample.includes('RO') || sample.includes('CÔNG CHÍNH THỨC') || sample.includes('LINE CHÍNH')) {
              foundRoSheetName = sName;
              break;
            }
          }
        }

        if (foundRoSheetName) {
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[foundRoSheetName], { header: 1 }) as any[][];
          roMatrix = parseROSheet(rawData, year, monthIndex0);
        }
        
        if (!bgMatrix && !roMatrix) {
          throw new Error('Không tìm thấy sheet dữ liệu của "Nhóm BG" hoặc "Nhóm RO". Vui lòng kiểm tra lại tên sheet.');
        }
        
        resolve({
          success: true,
          message: `Nhập dữ liệu thành công! Đã đồng bộ ${bgMatrix ? 'Nhóm BG' : ''} ${bgMatrix && roMatrix ? '& ' : ''}${roMatrix ? 'Nhóm RO' : ''}.`,
          bgMatrix,
          roMatrix,
          year,
          monthIndex0
        });
        
      } catch (error: any) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Lỗi khi đọc file Excel.'));
    reader.readAsBinaryString(file);
  });
}


function bgMetricToKey(label: string): string | null {
  const l = label.toUpperCase();
  if (l.includes('CÔNG BẾP GA')) return 'congBepGa';
  if (l.includes('CÔNG THỜI VỤ')) return 'congThoiVu';
  if (l.includes('CÔNG RMA')) return 'congRma';
  if (l.includes('SẢN LƯỢNG QUY ĐỔI BẾP GA')) return 'sanLuongBepGa';
  if (l.includes('SẢN LƯỢNG QUY ĐỔI RMA')) return 'sanLuongRma';
  if (l.includes('ĐỊNH MỨC SL THEO NS')) return 'dinhMucSlTheoNs';
  if (l.includes('NSLĐ THEO NGÀY')) return 'nsldTheoNgay';
  if (l.includes('KHSX NGÀY')) return 'khsxNgay';
  if (l.includes('TỈ LỆ HOÀN THÀNH KHSX')) return 'tiLeHoanThanhKhsx';
  if (l.includes('TỔNG NHÂN SỰ LINE')) return 'tongNhanSuLine';
  if (l.includes('NHÂN SỰ NGHỈ')) return 'nhanSuNghi';
  if (l.includes('TỈ LỆ ĐI LÀM')) return 'tiLeDiLam';
  return null;
}

function roMetricToKey(label: string): string | null {
  const l = label.toUpperCase();
  if (l.includes('CÔNG CHÍNH THỨC')) return 'congChinhThuc';
  if (l.includes('CÔNG THỜI VỤ')) return 'congThoiVu';
  if (l.includes('SẢN LƯỢNG QUY ĐỔI LINE CHÍNH')) return 'sanLuongLineChinh';
  if (l.includes('ĐỊNH MỨC SL THEO NS')) return 'dinhMucSlTheoNs';
  if (l.includes('NSLĐ THEO NGÀY')) return 'nsldTheoNgay';
  if (l.includes('KHSX NGÀY')) return 'khsxNgay';
  if (l.includes('TỈ LỆ HOÀN THÀNH KHSX')) return 'tiLeHoanThanhKhsx';
  if (l.includes('TỔNG NHÂN SỰ LINE ĐI LÀM')) return 'tongNhanSuLine';
  if (l.includes('TỔNG NHÂN SỰ NGHỈ')) return 'nhanSuNghi';
  if (l.includes('TỈ LỆ ĐI LÀM')) return 'tiLeDiLam';
  return null;
}

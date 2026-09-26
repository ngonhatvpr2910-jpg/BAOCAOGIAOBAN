import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { ExcelMatrixBGColumn, ExcelMatrixROColumn } from './types';
import { StorageService } from './storage';
import { recalculateBGMatrix, recalculateROMatrix } from './matrixGenerator';

export interface ProductionExcelImportResult {
  success: boolean;
  message: string;
  bgMatrix?: ExcelMatrixBGColumn[];
  roMatrix?: ExcelMatrixROColumn[];
  year: number;
  monthIndex0: number;
}

/**
 * Xuất file Excel mẫu (.xlsx) để cập nhật dữ liệu năng suất cho cả 2 nhóm BG và RO
 */
export async function exportProductionTemplate(year: number, monthIndex0: number): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Lấy dữ liệu hiện tại từ Storage
  const currentBG = StorageService.getMatrixBGForMonth(year, monthIndex0);
  const currentRO = StorageService.getMatrixROForMonth(year, monthIndex0);
  
  // Helper to get Excel column letter (1 -> A, 2 -> B, ...)
  const getColLetter = (idx: number) => String.fromCharCode(64 + idx);
  
  // 1. Sheet Nhóm BG
  const wsBG = workbook.addWorksheet('Nhóm BG');
  
  // Header
  const bgHeader = ['CHỈ SỐ / NGÀY', ...currentBG.map(col => col.label)];
  const headerRow = wsBG.addRow(bgHeader);
  
  // Rows definitions for BG
  const bgRows = [
    { label: 'CÔNG Bếp GA', key: 'congBepGa', isInput: true },
    { label: 'CÔNG THỜI VỤ', key: 'congThoiVu', isInput: true },
    { label: 'CÔNG RMA', key: 'congRma', isInput: true },
    { label: 'SẢN LƯỢNG QUY ĐỔI Bếp Ga', key: 'sanLuongBepGa', isInput: true },
    { label: 'SẢN LƯỢNG QUY ĐỔI RMA', key: 'sanLuongRma', isInput: true },
    { label: 'ĐỊNH MỨC SL THEO NS', key: 'dinhMucSlTheoNs', isInput: false, formula: (c: string) => `(${c}2+${c}3+${c}4)*9.03` }, // Rows 2,3,4 are actual Excel rows 3,4,5
    { label: 'NSLĐ THEO NGÀY', key: 'nslđTheoNgay', isInput: false, formula: (c: string) => `IFERROR(${c}5/${c}7, 0)` }, // Row 5 is SL, Row 7 is DinhMuc
    { label: 'KHSX NGÀY', key: 'khsxNgay', isInput: true },
    { label: 'TỈ LỆ HOÀN THÀNH KHSX', key: 'tiLeHoanThanhKhsx', isInput: false, formula: (c: string) => `IFERROR(${c}5/${c}9, 0)` }, // Row 5 is SL, Row 9 is KHSX
    { label: 'Tổng nhân sự Line', key: 'tongNhanSuLine', isInput: true },
    { label: 'Nhân sự nghỉ', key: 'nhanSuNghi', isInput: true },
    { label: 'TỈ LỆ ĐI LÀM', key: 'tiLeDiLam', isInput: false, formula: (c: string) => `IFERROR((${c}11-${c}12)/${c}11, 0)` },
  ];

  // Map to store which columns are days vs totals
  const dayCols: number[] = [];
  const weekStartIdxs: number[] = [2];

  currentBG.forEach((col, idx) => {
    const excelCol = idx + 2;
    if (!col.isWeeklyTotal && !col.isMonthlyTotal) {
      dayCols.push(excelCol);
    } else if (col.isWeeklyTotal) {
      // It's a total column
      weekStartIdxs.push(excelCol + 1);
    }
  });

  bgRows.forEach((rowDef, rowIdx) => {
    const excelRowIdx = rowIdx + 2;
    const row = wsBG.getRow(excelRowIdx);
    row.getCell(1).value = rowDef.label;

    currentBG.forEach((col, colIdx) => {
      const excelColIdx = colIdx + 2;
      const cell = row.getCell(excelColIdx);
      const colLetter = getColLetter(excelColIdx);

      if (col.isWeeklyTotal || col.isMonthlyTotal) {
        // Find previous day columns to sum
        let startCol = 2;
        for (let i = colIdx - 1; i >= 0; i--) {
          if (currentBG[i].isWeeklyTotal || currentBG[i].isMonthlyTotal) {
            startCol = i + 3;
            break;
          }
        }
        const range = `${getColLetter(startCol)}${excelRowIdx}:${getColLetter(colIdx + 1)}${excelRowIdx}`;
        
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          cell.value = { formula: `SUM(${range})` };
        } else {
          // For ratio rows in total columns, apply the same formula but using the total values in that column
          if (rowDef.formula) cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      } else {
        // Regular day column
        if (rowDef.isInput) {
          cell.value = (col as any)[rowDef.key] || 0;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }; // Light yellow for input
        } else {
          if (rowDef.formula) cell.value = { formula: rowDef.formula(colLetter) };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }; // Light blue for formula
        }
      }
    });
  });

  // 2. Sheet Nhóm RO
  const wsRO = workbook.addWorksheet('Nhóm RO');
  const roHeader = ['CHỈ SỐ / NGÀY', ...currentRO.map(col => col.label)];
  wsRO.addRow(roHeader);
  
  const roRows = [
    { label: 'CÔNG CHÍNH THỨC', key: 'congChinhThuc', isInput: true },
    { label: 'CÔNG THỜI VỤ', key: 'congThoiVu', isInput: true },
    { label: 'SẢN LƯỢNG QUY ĐỔI LINE CHÍNH', key: 'sanLuongLineChinh', isInput: true },
    { label: 'ĐỊNH MỨC SL THEO NS', key: 'dinhMucSlTheoNs', isInput: false, formula: (c: string) => `(${c}2+${c}3)*9.03` },
    { label: 'NSLĐ THEO NGÀY', key: 'nsldTheoNgay', isInput: false, formula: (c: string) => `IFERROR(${c}4/${c}5, 0)` }, 
    { label: 'KHSX NGÀY', key: 'khsxNgay', isInput: true },
    { label: 'TỈ LỆ HOÀN THÀNH KHSX', key: 'tiLeHoanThanhKhsx', isInput: false, formula: (c: string) => `IFERROR(${c}4/${c}7, 0)` },
    { label: 'TỔNG NHÂN SỰ LINE ĐI LÀM', key: 'tongNhanSuLine', isInput: true },
    { label: 'TỔNG NHÂN SỰ NGHỈ', key: 'nhanSuNghi', isInput: true },
    { label: 'TỈ LỆ ĐI LÀM', key: 'tiLeDiLam', isInput: false, formula: (c: string) => `IFERROR((${c}9-${c}10)/${c}9, 0)` },
  ];

  roRows.forEach((rowDef, rowIdx) => {
    const excelRowIdx = rowIdx + 2;
    const row = wsRO.getRow(excelRowIdx);
    row.getCell(1).value = rowDef.label;

    currentRO.forEach((col, colIdx) => {
      const excelColIdx = colIdx + 2;
      const cell = row.getCell(excelColIdx);
      const colLetter = getColLetter(excelColIdx);

      if (col.isWeeklyTotal || col.isMonthlyTotal) {
        let startCol = 2;
        for (let i = colIdx - 1; i >= 0; i--) {
          if (currentRO[i].isWeeklyTotal || currentRO[i].isMonthlyTotal) {
            startCol = i + 3;
            break;
          }
        }
        const range = `${getColLetter(startCol)}${excelRowIdx}:${getColLetter(colIdx + 1)}${excelRowIdx}`;
        if (rowDef.isInput || rowDef.key === 'dinhMucSlTheoNs') {
          cell.value = { formula: `SUM(${range})` };
        } else if (rowDef.formula) {
          cell.value = { formula: rowDef.formula(colLetter) };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      } else {
        if (rowDef.isInput) {
          cell.value = (col as any)[rowDef.key] || 0;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
        } else {
          if (rowDef.formula) cell.value = { formula: rowDef.formula(colLetter) };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
        }
      }
    });
  });

  // Global Styling
  [wsBG, wsRO].forEach(ws => {
    ws.getRow(1).height = 25;
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006064' } }; // Dark teal header
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    ws.getColumn(1).font = { bold: true };
    ws.getColumn(1).width = 35;
    
    // Borders
    ws.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    for (let i = 2; i <= ws.columnCount; i++) {
      ws.getColumn(i).width = 12;
      ws.getColumn(i).alignment = { horizontal: 'center' };
    }
  });

  // Instructions
  const wsInst = workbook.addWorksheet('Hướng dẫn');
  wsInst.addRow(['MÀU SẮC', 'Ý NGHĨA', 'HÀNH ĐỘNG']);
  wsInst.addRow(['VÀNG NHẠT', 'Ô NHẬP LIỆU', 'ĐIỀN SỐ VÀO ĐÂY']);
  wsInst.addRow(['XANH NHẠT', 'Ô CÔNG THỨC', 'KHÔNG CẦN ĐIỀN, TỰ TÍNH']);
  wsInst.addRow(['XÁM', 'Ô TỔNG CỘNG', 'TỰ ĐỘNG TỔNG HỢP']);
  wsInst.getColumn(1).width = 20;
  wsInst.getColumn(2).width = 30;
  wsInst.getColumn(3).width = 40;
  wsInst.getRow(1).font = { bold: true };

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
 * Nhập dữ liệu từ file Excel
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
        
        // 1. Xử lý sheet BG
        const bgSheet = workbook.Sheets['Nhóm BG'];
        if (bgSheet) {
          const rawData = XLSX.utils.sheet_to_json(bgSheet, { header: 1 }) as any[][];
          bgMatrix = parseBGSheet(rawData, year, monthIndex0);
        }
        
        // 2. Xử lý sheet RO
        const roSheet = workbook.Sheets['Nhóm RO'];
        if (roSheet) {
          const rawData = XLSX.utils.sheet_to_json(roSheet, { header: 1 }) as any[][];
          roMatrix = parseROSheet(rawData, year, monthIndex0);
        }
        
        if (!bgMatrix && !roMatrix) {
          throw new Error('Không tìm thấy sheet "Nhóm BG" hoặc "Nhóm RO" trong file.');
        }
        
        resolve({
          success: true,
          message: 'Nhập dữ liệu thành công.',
          bgMatrix,
          roMatrix,
          year,
          monthIndex0
        });
        
      } catch (error: any) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Lỗi đọc file.'));
    reader.readAsBinaryString(file);
  });
}

function parseBGSheet(rows: any[][], year: number, monthIndex0: number): ExcelMatrixBGColumn[] {
  // Lấy ma trận hiện tại để giữ cấu trúc (W1, W2, mốc chốt...)
  const matrix = StorageService.getMatrixBGForMonth(year, monthIndex0);
  const header = rows[0].map(h => {
    if (h instanceof Date) {
      const d = h.getDate();
      const m = h.toLocaleString('en-us', { month: 'short' });
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
    const excelColIdx = header.indexOf(col.label);
    if (excelColIdx === -1) return col;
    
    const updated = { ...col };
    Object.keys(dataMap).forEach(key => {
      let val = parseFloat(dataMap[key][excelColIdx]) || 0;
      
      // Convert ratios to percentages for specific fields
      if (key === 'nsldTheoNgay' || key === 'tiLeHoanThanhKhsx') {
        if (val > 0 && val < 5) val = val * 100;
      } else if (key === 'tiLeDiLam') {
        if (val > 0 && val < 2) val = val * 100;
      }
      
      (updated as any)[key] = Number(val.toFixed(1));
    });
    
    return updated;
  });

  return recalculateBGMatrix(updatedMatrix);
}

function parseROSheet(rows: any[][], year: number, monthIndex0: number): ExcelMatrixROColumn[] {
  const matrix = StorageService.getMatrixROForMonth(year, monthIndex0);
  const header = rows[0].map(h => {
    if (h instanceof Date) {
      const d = h.getDate();
      const m = h.toLocaleString('en-us', { month: 'short' });
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
    
    const excelColIdx = header.indexOf(col.label);
    if (excelColIdx === -1) return col;
    
    const updated = { ...col };
    Object.keys(dataMap).forEach(key => {
      let val = parseFloat(dataMap[key][excelColIdx]) || 0;
      
      // Convert ratios to percentages for specific fields
      if (key === 'nsldTheoNgay' || key === 'tiLeHoanThanhKhsx') {
        if (val > 0 && val < 5) val = val * 100;
      } else if (key === 'tiLeDiLam') {
        if (val > 0 && val < 2) val = val * 100;
      }
      
      (updated as any)[key] = Number(val.toFixed(1));
    });
    
    return updated;
  });

  return recalculateROMatrix(updatedMatrix);
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

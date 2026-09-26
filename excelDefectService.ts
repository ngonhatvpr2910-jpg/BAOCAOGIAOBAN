import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { SlideDefectCostData, DamagedItemRecord, SlideBarItem, MonthlyHistoryRecord } from './types';
import { computeWeeklyAggregations, computeMonthlyAggregations } from './defectCostSyncService';

export interface ExcelImportResult {
  success: boolean;
  message: string;
  itemsRO: DamagedItemRecord[];
  itemsBG: DamagedItemRecord[];
  weeklyData?: SlideBarItem[];
  monthlyData?: SlideBarItem[];
  productivityData?: MonthlyHistoryRecord[]; // New: Năng suất & Công
  totalRO: number;
  totalBG: number;
  grandTotal: number;
}

/**
 * Xuất file Excel mẫu (.xlsx) chuẩn cho Báo cáo Tỉ lệ Hư Hỏng & Tổn thất vật tư (Slide 3/4)
 * Sử dụng ExcelJS để hỗ trợ Conditional Formatting (Tự động tô màu dòng)
 */
export async function exportDefectCostTemplate(currentData?: SlideDefectCostData, productivityHistory?: MonthlyHistoryRecord[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // 1. Sheet Nhóm RO
  const wsRO = workbook.addWorksheet('Hang_Hong_RO');
  const roData = (currentData?.itemsRO && currentData.itemsRO.length > 0)
    ? currentData.itemsRO
    : [
        { itemCode: '04-28-03-BRA590N-0007', itemName: 'Van xả áp', quantity: 2, unitPrice: 9999.58, isHighlighted: false },
        { itemCode: '04-29-06-SHA76622KL-0000', itemName: 'Vỏ carton MLN R.O Slim dùng chung', quantity: 3, unitPrice: 23916.90, isHighlighted: false },
        { itemCode: '04-29-07-SHA76636KL-0003', itemName: 'Bộ dây nguồn tổng SHA76636KL', quantity: 2, unitPrice: 18411.65, isHighlighted: false },
        { itemCode: '04-29-03-SHA76218CK-0016', itemName: 'Cút nối tự hãm nước vào 3/8"(DT0303-TSUNG)', quantity: 3, unitPrice: 3458.35, isHighlighted: false },
        { itemCode: '04-29-07-SHA76222KL-0005', itemName: 'Bộ dây điện rời SHA76222KL', quantity: 2, unitPrice: 9245.90, isHighlighted: false },
        { itemCode: '04-29-03-SHA76213CK-0015', itemName: 'Nhựa đế tủ Slim SX', quantity: 5, unitPrice: 20360.55, isHighlighted: false },
        { itemCode: '04-29-06-SHA76601S-0007', itemName: 'Vỏ carton máy lọc nước R.O Slim UltraX', quantity: 3, unitPrice: 21135.54, isHighlighted: false },
        { itemCode: '04-28-01-SHA8820KL-0000', itemName: 'Mặt kính trước SHA8820KL', quantity: 3, unitPrice: 95000.00, isHighlighted: true },
        { itemCode: '04-28-00-SHA88115K-0004', itemName: 'Màng R.O TFC 100GPD', quantity: 4, unitPrice: 168925.24, isHighlighted: true },
        { itemCode: '04-29-08-SHA76688SH-0036', itemName: 'Gói cánh tủ dưới SHA76688SH(BD)', quantity: 1, unitPrice: 415058.32, isHighlighted: true },
      ];

  wsRO.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Mã Vật Tư', key: 'itemCode', width: 28 },
    { header: 'Tên Vật Tư Mô Tả', key: 'itemName', width: 42 },
    { header: 'Số Lượng', key: 'quantity', width: 12 },
    { header: 'Đơn Giá (VNĐ)', key: 'unitPrice', width: 16 },
    { header: 'Thành Tiền (VNĐ)', key: 'amount', width: 18 },
    { header: 'Mục Trọng Điểm (Có/Không)', key: 'isHighlighted', width: 25 },
    { header: 'Tuần (Ví dụ: W38)', key: 'week', width: 20 },
  ];

  roData.forEach((item, idx) => {
    const rowNum = idx + 2;
    wsRO.addRow({
      stt: idx + 1,
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: { formula: `D${rowNum}*E${rowNum}` },
      isHighlighted: { formula: `IF(F${rowNum}>=LARGE($F$2:$F$100,MIN(3,COUNT($F$2:$F$100))),"Có","Không")` },
      week: (item as any).week || 'W38'
    });
  });

  // Áp dụng Conditional Formatting cho RO: Nếu cột G là "Có" thì tô vàng cả dòng
  wsRO.addConditionalFormatting({
    ref: `A2:H100`,
    rules: [
      {
        priority: 1,
        type: 'expression',
        formulae: ['$G2="Có"'],
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } } },
      }
    ]
  });

  // 2. Sheet Nhóm Bếp Gas
  const wsBG = workbook.addWorksheet('Hang_Hong_Bep_Gas');
  const bgData = (currentData?.itemsBG && currentData.itemsBG.length > 0)
    ? currentData.itemsBG
    : [
        { itemCode: '01-55-06-00-0001', itemName: 'Tem bảo hành cụm đánh lửa (5 năm)', quantity: 8, unitPrice: 650.00, isHighlighted: false },
        { itemCode: '02-33-07-MMB0787-0002', itemName: 'Cụm đánh lửa MMB0787-V2', quantity: 1, unitPrice: 29835.98, isHighlighted: false },
        { itemCode: '02-33-08-SH0000-0001', itemName: 'Đĩa chống tràn Inox cuốn mép (SH SX)', quantity: 1, unitPrice: 7724.85, isHighlighted: false },
        { itemCode: '02-33-06-MMBB0787B-0001', itemName: 'Vỏ hộp bếp ga MMBB0787B', quantity: 16, unitPrice: 15361.43, isHighlighted: true },
        { itemCode: '02-33-05-B160000-0001', itemName: 'Nút nhựa B16 đen xám', quantity: 70, unitPrice: 1480.52, isHighlighted: false },
        { itemCode: '02-33-06-SHB32012VMC-0001', itemName: 'Vỏ hộp bếp gas SHB32012-VMC', quantity: 7, unitPrice: 14842.00, isHighlighted: true },
        { itemCode: '02-33-07-MMB3569MT-0000', itemName: 'Cụm đánh lửa 3569MT(0.8)(30 độ )', quantity: 9, unitPrice: 21906.10, isHighlighted: true },
      ];

  wsBG.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Mã Vật Tư', key: 'itemCode', width: 28 },
    { header: 'Tên Vật Tư Mô Tả', key: 'itemName', width: 42 },
    { header: 'Số Lượng', key: 'quantity', width: 12 },
    { header: 'Đơn Giá (VNĐ)', key: 'unitPrice', width: 16 },
    { header: 'Thành Tiền (VNĐ)', key: 'amount', width: 18 },
    { header: 'Mục Trọng Điểm (Có/Không)', key: 'isHighlighted', width: 25 },
    { header: 'Tuần (Ví dụ: W38)', key: 'week', width: 20 },
  ];

  bgData.forEach((item, idx) => {
    const rowNum = idx + 2;
    wsBG.addRow({
      stt: idx + 1,
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: { formula: `D${rowNum}*E${rowNum}` },
      isHighlighted: { formula: `IF(F${rowNum}>=LARGE($F$2:$F$100,MIN(3,COUNT($F$2:$F$100))),"Có","Không")` },
      week: (item as any).week || 'W38'
    });
  });

  // Áp dụng Conditional Formatting cho Bếp Gas
  wsBG.addConditionalFormatting({
    ref: `A2:H100`,
    rules: [
      {
        priority: 1,
        type: 'expression',
        formulae: ['$G2="Có"'],
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } } },
      }
    ]
  });

  // 3. Sheet Tuần
  const wsWeek = workbook.addWorksheet('Ty_Le_Tuan');
  wsWeek.columns = [
    { header: 'Tuần', key: 'label', width: 12 },
    { header: 'Giá Trị (Triệu VNĐ)', key: 'value', width: 22 },
    { header: 'Nhãn Hiển Thị', key: 'displayLabel', width: 18 },
  ];
  const defaultHistoricalWeeks: Record<string, number> = {
    'W32': 2.2,
    'W33': 0.6,
    'W34': 1.8,
    'W35': 1.4,
  };
  const weeklyData = currentData?.weeklyData || [
    { label: 'W32', value: 2.2 }, { label: 'W33', value: 0.6 }, { label: 'W34', value: 1.8 },
    { label: 'W35', value: 1.4 }, { label: 'W36', value: 0 }, { label: 'W37', value: 1.4 },
    { label: 'W38', value: 3 }, { label: 'W39', value: 0 }, { label: 'W40', value: 0 },
  ];
  weeklyData.forEach((w, idx) => {
    const rowNum = idx + 2;
    const isHistorical = defaultHistoricalWeeks[w.label] !== undefined;

    if (isHistorical) {
      const fixedVal = defaultHistoricalWeeks[w.label];
      wsWeek.addRow({
        label: w.label,
        value: fixedVal,
        displayLabel: `${fixedVal}M`,
      });
    } else {
      wsWeek.addRow({
        label: w.label,
        value: { 
          formula: `ROUND((SUMIF(Hang_Hong_RO!$H$2:$H$1000, A${rowNum}, Hang_Hong_RO!$F$2:$F$1000) + SUMIF(Hang_Hong_Bep_Gas!$H$2:$H$1000, A${rowNum}, Hang_Hong_Bep_Gas!$F$2:$F$1000))/1000000, 2)` 
        },
        displayLabel: { formula: `IF(B${rowNum}=0, "0", ROUND(B${rowNum}, 2) & "M")` }
      });
    }
  });

  // 4. Sheet Tháng
  const wsMonth = workbook.addWorksheet('Ty_Le_Thang');
  wsMonth.columns = [
    { header: 'Tháng', key: 'label', width: 15 },
    { header: 'Giá Trị (Triệu VNĐ)', key: 'value', width: 22 },
    { header: 'Nhãn Hiển Thị', key: 'displayLabel', width: 18 },
  ];
  const defaultHistoricalMonths: Record<string, number> = {
    'Tháng 6': 10.8,
    'Tháng 7': 7.1,
    'Tháng 8': 5.9,
  };
  const monthlyData = currentData?.monthlyData || [
    { label: 'Tháng 6', value: 10.8 }, { label: 'Tháng 7', value: 7.1 },
    { label: 'Tháng 8', value: 5.9 }, { label: 'Tháng 9', value: 4.4 },
  ];
  monthlyData.forEach((m, idx) => {
    const rowNum = idx + 2;
    const isHistorical = defaultHistoricalMonths[m.label] !== undefined;
    
    if (isHistorical) {
      const fixedVal = defaultHistoricalMonths[m.label];
      wsMonth.addRow({
        label: m.label,
        value: fixedVal,
        displayLabel: `${fixedVal}M`,
      });
    } else {
      wsMonth.addRow({
        label: m.label,
        value: { formula: `ROUND(SUM(Ty_Le_Tuan!B7:B11), 2)` }, // W36-W40
        displayLabel: { formula: `IF(B${rowNum}=0, "0", ROUND(B${rowNum}, 2) & "M")` }
      });
    }
  });

  // 5. Sheet Hướng Dẫn
  const wsGuide = workbook.addWorksheet('Huong_Dan');
  wsGuide.columns = [
    { header: 'Mục', key: 'key', width: 25 },
    { header: 'Quy Cách', key: 'desc', width: 80 },
  ];
  [
    { key: 'Hang_Hong_RO', desc: 'Danh sách vật tư hư hỏng line R.O. Nhập "Tuần" ở cột H để tự động chạy biểu đồ.' },
    { key: 'Hang_Hong_Bep_Gas', desc: 'Danh sách vật tư hư hỏng line Bếp Gas. Nhập "Tuần" ở cột H để tự động chạy biểu đồ.' },
    { key: 'Ty_Le_Tuan', desc: 'Tự động tính tổng từ các sheet Hang_Hong theo tuần tương ứng (Triệu VNĐ).' },
    { key: 'Ty_Le_Thang', desc: 'Tự động cộng dồn từ sheet Ty_Le_Tuan theo các tuần trong tháng (Triệu VNĐ).' },
  ].forEach(row => wsGuide.addRow(row));

  // Ghi file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mau_Bao_Cao_Ty_Le_Hu_Hong_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Đọc và phân tích file Excel / CSV tải lên từ người dùng
 */
export async function parseDefectCostExcelFile(file: File): Promise<ExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Không thể đọc nội dung file.');
        }

        const wb = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const sheetNames = wb.SheetNames;

        if (!sheetNames || sheetNames.length === 0) {
          throw new Error('File Excel không có dữ liệu trang tính (Sheet).');
        }

        let itemsRO: DamagedItemRecord[] = [];
        let itemsBG: DamagedItemRecord[] = [];
        let weeklyData: SlideBarItem[] | undefined = undefined;
        let monthlyData: SlideBarItem[] | undefined = undefined;
        let productivityData: MonthlyHistoryRecord[] | undefined = undefined;

        // Tìm sheet RO
        const roSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('ro') || 
          s.toLowerCase().includes('lọc nước') || 
          s.toLowerCase().includes('loc nuoc')
        );

        // Tìm sheet Bếp Gas
        const bgSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('gas') || 
          s.toLowerCase().includes('ga') || 
          s.toLowerCase().includes('bep') || 
          s.toLowerCase().includes('bg')
        );

        // Parse Sheet RO
        if (roSheetName) {
          const ws = wb.Sheets[roSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(ws);
          itemsRO = extractItemsFromRows(rawRows, 'RO');
        }

        // Parse Sheet BG
        if (bgSheetName) {
          const ws = wb.Sheets[bgSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(ws);
          itemsBG = extractItemsFromRows(rawRows, 'BG');
        }

        // Nếu file chỉ có 1 sheet hoặc không tìm thấy theo tên, đọc theo cột Phân loại hoặc sheet đầu tiên
        if (itemsRO.length === 0 && itemsBG.length === 0) {
          const firstSheet = wb.Sheets[sheetNames[0]];
          const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet);
          
          rawRows.forEach((row, idx) => {
            const item = parseSingleRow(row, idx, 'RO');
            if (item) {
              const cat = String(row['Nhóm'] || row['Phân Loại'] || row['Chuyền'] || row['Category'] || '').toUpperCase();
              if (cat.includes('GAS') || cat.includes('GA') || cat.includes('BG') || cat.includes('BẾP')) {
                item.category = 'BG';
                itemsBG.push(item);
              } else {
                itemsRO.push(item);
              }
            }
          });
        }

        // Parse Tuần nếu có
        const weekSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('tuan') || 
          s.toLowerCase().includes('tuần') || 
          s.toLowerCase().includes('week')
        );
        if (weekSheetName) {
          const ws = wb.Sheets[weekSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(ws);
          const defaultHistoricalWeeks: Record<string, number> = {
            'w32': 2.2,
            'w33': 0.6,
            'w34': 1.8,
            'w35': 1.4,
          };
          weeklyData = rawRows.map((r, i) => {
            const label = String(r['Tuần'] || r['Tuan'] || r['Week'] || r['label'] || `W${32 + i}`).trim();
            let val = parseFloat(String(r['Giá Trị (Triệu VNĐ)'] || r['Giá Trị'] || r['value'] || r['Tổn Thất'] || 0)) || 0;
            const hist = defaultHistoricalWeeks[label.toLowerCase()];
            if (hist !== undefined && val <= 0) {
              val = hist;
            }
            const cleanDisplay = val > 0 ? `${Number(val.toFixed(2))}M` : '';
            return {
              id: `w-${label.toLowerCase()}`,
              label,
              value: Number(val.toFixed(2)),
              displayLabel: cleanDisplay,
            };
          }).filter(w => w.label);
        }

        // Parse Tháng nếu có
        const monthSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('thang') || 
          s.toLowerCase().includes('tháng') || 
          s.toLowerCase().includes('month')
        );
        if (monthSheetName) {
          const ws = wb.Sheets[monthSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(ws);
          const defaultHistoricalMonths: Record<string, number> = {
            'tháng 6': 10.8,
            'tháng 7': 7.1,
            'tháng 8': 5.9,
          };
          monthlyData = rawRows.map((r, i) => {
            const label = String(r['Tháng'] || r['Thang'] || r['Month'] || r['label'] || `Tháng ${6 + i}`).trim();
            let val = parseFloat(String(r['Giá Trị (Triệu VNĐ)'] || r['Giá Trị'] || r['value'] || 0)) || 0;
            const hist = defaultHistoricalMonths[label.toLowerCase()];
            if (hist !== undefined && val <= 0) {
              val = hist;
            }
            const cleanDisplay = val > 0 ? `${Number(val.toFixed(2))}M` : '0M';
            return {
              id: `m-${i + 1}`,
              label,
              value: Number(val.toFixed(2)),
              displayLabel: cleanDisplay,
            };
          }).filter(m => m.label);
        }

        // Parse Năng Suất & Công nếu có
        const prodSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('nang suat') || 
          s.toLowerCase().includes('năng suất') || 
          s.toLowerCase().includes('prod') ||
          s.toLowerCase().includes('cong') ||
          s.toLowerCase().includes('công')
        );

        if (prodSheetName) {
          const ws = wb.Sheets[prodSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(ws);
          productivityData = rawRows.map((r, i) => {
            const monthLabel = String(r['Tháng'] || r['Thang'] || r['Month'] || r['month'] || `Tháng ${i + 1}`).trim();
            const nsld25 = parseFloat(String(r['NSLĐ 2025 (%)'] || r['NSLĐ 2025'] || r['nsld2025'] || 0)) || 0;
            const nsld26 = parseFloat(String(r['NSLĐ 2026 (%)'] || r['NSLĐ 2026'] || r['nsld2026'] || 0)) || 0;
            const cong25 = parseInt(String(r['Công 2025'] || r['cong2025'] || 0)) || 0;
            const cong26 = parseInt(String(r['Công 2026'] || r['cong2026'] || 0)) || 0;
            const attendance = parseFloat(String(r['Đi Làm Lũy Kế (%)'] || r['Đi Làm Lũy Kế'] || r['tiLeDiLam'] || 0)) || 0;
            
            return {
              month: monthLabel,
              monthNum: i + 1,
              nsld2025: nsld25,
              nsld2026: nsld26,
              cong2025: cong25,
              cong2026: cong26,
              tiLeDiLam: attendance
            };
          }).filter(p => p.month);
        }

        // Đảm bảo dữ liệu biểu đồ Tuần & Tháng được tính toán đồng bộ theo danh sách vật tư nạp vào
        if (!weeklyData || weeklyData.length === 0) {
          const resW = computeWeeklyAggregations(itemsRO, itemsBG);
          weeklyData = resW.weeklyData;
        }
        if (!monthlyData || monthlyData.length === 0) {
          const resW = computeWeeklyAggregations(itemsRO, itemsBG, weeklyData);
          const resM = computeMonthlyAggregations(resW.weeklyData, resW.weeklyTotals, itemsRO, itemsBG);
          monthlyData = resM.monthlyData;
        }

        const totalRO = itemsRO.reduce((acc, curr) => acc + curr.amount, 0);
        const totalBG = itemsBG.reduce((acc, curr) => acc + curr.amount, 0);
        const grandTotal = totalRO + totalBG;

        resolve({
          success: true,
          message: `Đọc thành công dữ liệu${productivityData ? ' Năng suất & Công,' : ''} ${itemsRO.length + itemsBG.length} mục vật tư (${itemsRO.length} mục RO, ${itemsBG.length} mục Bếp Gas).`,
          itemsRO,
          itemsBG,
          weeklyData,
          monthlyData,
          productivityData,
          totalRO,
          totalBG,
          grandTotal,
        });

      } catch (err: any) {
        console.error('Error parsing defect cost Excel:', err);
        reject(new Error(err?.message || 'Có lỗi khi phân tích file Excel. Vui lòng kiểm tra lại định dạng file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Không thể đọc file từ thiết bị của bạn.'));
    };

    reader.readAsBinaryString(file);
  });
}

function extractItemsFromRows(rows: any[], defaultCat: 'RO' | 'BG'): DamagedItemRecord[] {
  const result: DamagedItemRecord[] = [];
  rows.forEach((row, idx) => {
    const item = parseSingleRow(row, idx, defaultCat);
    if (item) {
      result.push(item);
    }
  });
  return result;
}

function parseSingleRow(row: any, idx: number, defaultCat: 'RO' | 'BG'): DamagedItemRecord | null {
  // Tìm mã vật tư
  const itemCode = String(
    row['Mã Vật Tư'] || 
    row['Mã VT'] || 
    row['Mã VT (item)'] || 
    row['Ma VT'] || 
    row['Item Code'] || 
    row['itemCode'] || 
    row['Mã'] || 
    ''
  ).trim();

  // Tìm tên vật tư
  const itemName = String(
    row['Tên Vật Tư Mô Tả'] || 
    row['Tên vật tư mô tả'] || 
    row['Tên Vật Tư'] || 
    row['Tên VT'] || 
    row['Ten Vat Tu'] || 
    row['Item Name'] || 
    row['itemName'] || 
    row['Tên'] || 
    ''
  ).trim();

  if (!itemCode && !itemName) {
    return null;
  }

  // Số lượng
  const quantity = parseFloat(String(
    row['Số Lượng'] || 
    row['Số lượng'] || 
    row['So Luong'] || 
    row['SL'] || 
    row['quantity'] || 
    row['Qty'] || 
    1
  ).replace(/,/g, '')) || 1;

  // Đơn giá
  const unitPrice = parseFloat(String(
    row['Đơn Giá (VNĐ)'] || 
    row['Đơn giá'] || 
    row['Don Gia'] || 
    row['Đơn Giá'] || 
    row['unitPrice'] || 
    row['Price'] || 
    0
  ).replace(/,/g, '')) || 0;

  // Thành tiền
  let amount = parseFloat(String(
    row['Thành Tiền (VNĐ)'] || 
    row['Thành tiền (đ)'] || 
    row['Thành tiền'] || 
    row['Thanh Tien'] || 
    row['amount'] || 
    row['Total'] || 
    0
  ).replace(/,/g, '')) || (quantity * unitPrice);

  if (amount === 0 && unitPrice > 0) {
    amount = quantity * unitPrice;
  }

  // Highlight
  const highlightVal = String(
    row['Mục Trọng Điểm (Có/Không)'] || 
    row['Mục Trọng Điểm'] || 
    row['Trọng Điểm'] || 
    row['isHighlighted'] || 
    row['Highlight'] || 
    ''
  ).toLowerCase().trim();

  const isHighlighted = 
    highlightVal === 'có' || 
    highlightVal === 'co' || 
    highlightVal === 'true' || 
    highlightVal === '1' || 
    highlightVal === 'yes' ||
    itemName.toLowerCase().includes('mặt kính') ||
    itemName.toLowerCase().includes('vỏ hộp');

  // Tìm cột tuần linh hoạt từ mọi biến thể tên cột
  const weekKey = Object.keys(row).find(k => {
    const clean = k.toLowerCase().replace(/[\s_\-()]/g, '');
    return clean.includes('tuan') || clean.includes('tuần') || clean.includes('week');
  });
  const rawWeek = weekKey ? String(row[weekKey] || '').trim() : '';
  const weekMatch = rawWeek.match(/\d+/);
  let week = weekMatch ? `W${parseInt(weekMatch[0], 10)}` : (rawWeek ? rawWeek.toUpperCase() : '');

  // Nếu không có cột tuần, thử suy luận từ cột ngày nếu có
  if (!week) {
    const dateKey = Object.keys(row).find(k => {
      const clean = k.toLowerCase().replace(/[\s_\-()]/g, '');
      return clean.includes('ngay') || clean.includes('ngày') || clean.includes('date');
    });
    if (dateKey && row[dateKey]) {
      const dateVal = String(row[dateKey]).trim();
      const dayMatch = dateVal.match(/(\d{1,2})[\/\-](\d{1,2})/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1], 10);
        const month = parseInt(dayMatch[2], 10);
        if (month === 9) {
          if (day <= 3) week = 'W36';
          else if (day <= 10) week = 'W37';
          else if (day <= 17) week = 'W38';
          else if (day <= 24) week = 'W39';
          else week = 'W40';
        }
      }
    }
  }

  return {
    id: `${defaultCat.toLowerCase()}-imported-${idx + 1}-${Date.now()}`,
    itemCode: itemCode || `VT-${idx + 1}`,
    itemName: itemName || 'Vật tư',
    quantity,
    unitPrice,
    amount,
    category: defaultCat,
    isHighlighted,
    week: week || undefined,
  } as any;
}

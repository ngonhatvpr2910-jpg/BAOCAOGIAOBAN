import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { StorageService } from './storage';

/**
 * Xuất toàn bộ dữ liệu hệ thống ra một file Excel đa sheet
 */
export async function exportSystemExcel(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // 1. Sheet: Thống kê & Cấu hình (Thresholds)
  const wsConfig = workbook.addWorksheet('Cau_Hinh');
  const thresholds = StorageService.getThresholds();
  wsConfig.addRow(['THAM SỐ', 'GIÁ TRỊ', 'MÔ TẢ']);
  wsConfig.addRow(['minAttendanceRate', thresholds.minAttendanceRate, 'Tỉ lệ đi làm tối thiểu (%)']);
  wsConfig.addRow(['minProductivityRate', thresholds.minProductivityRate, 'NSLĐ tối thiểu (%)']);
  wsConfig.addRow(['maxDefectCostPerDay', thresholds.maxDefectCostPerDay, 'Hàng hỏng tối đa (VNĐ)']);
  wsConfig.addRow(['maxErrorRate', thresholds.maxErrorRate, 'Lỗi thao tác tối đa (%)']);
  wsConfig.addRow(['autoExportTime', thresholds.autoExportTime, 'Giờ xuất báo cáo tự động']);
  wsConfig.getColumn(1).width = 25;
  wsConfig.getColumn(2).width = 15;
  wsConfig.getColumn(3).width = 40;

  // 2. Sheet: Báo cáo Năng suất BG (DCBG Records)
  const wsDCBG = workbook.addWorksheet('Nhat_Ky_DCBG');
  const dcbgRecords = StorageService.getDCBGRecords();
  if (dcbgRecords.length > 0) {
    const headers = Object.keys(dcbgRecords[0]);
    wsDCBG.addRow(headers);
    dcbgRecords.forEach(r => wsDCBG.addRow(Object.values(r)));
  }

  // 3. Sheet: Báo cáo Năng suất RO (DCRO Records)
  const wsDCRO = workbook.addWorksheet('Nhat_Ky_DCRO');
  const dcroRecords = StorageService.getDCRORecords();
  if (dcroRecords.length > 0) {
    const headers = Object.keys(dcroRecords[0]);
    wsDCRO.addRow(headers);
    dcroRecords.forEach(r => wsDCRO.addRow(Object.values(r)));
  }

  // 4. Sheet: Dữ liệu Chất lượng (Slide 2 Quality Records)
  const wsQuality = workbook.addWorksheet('Chat_Luong_Hang_Ngay');
  const qualityData = StorageService.getSlide2Quality();
  if (qualityData.dailyRecords && qualityData.dailyRecords.length > 0) {
    // Flatten quality records for Excel
    wsQuality.addRow([
      'Ngày', 'Tuần', 
      'RO_VT', 'RO_Loi4M', 'RO_DMVT',
      'BG_VT', 'BG_Loi4M', 'BG_DMVT',
      'PXLR_VT', 'PXLR_Loi4M', 'PXLR_DMVT'
    ]);
    qualityData.dailyRecords.forEach(r => {
      wsQuality.addRow([
        r.date, r.week,
        r.ro.vatTu, r.ro.totalLoi4M, r.ro.dmVatTu,
        r.bg.vatTu, r.bg.totalLoi4M, r.bg.dmVatTu,
        r.pxlr.vatTu, r.pxlr.totalLoi4M, r.pxlr.dmVatTu
      ]);
    });
  }

  // 5. Sheet: Danh sách vật tư hỏng (RO)
  const wsDefectsRO = workbook.addWorksheet('Vat_Tu_Hong_RO');
  const defectData = StorageService.getSlide3DefectCost();
  if (defectData.itemsRO.length > 0) {
    const headers = Object.keys(defectData.itemsRO[0]);
    wsDefectsRO.addRow(headers);
    defectData.itemsRO.forEach(r => wsDefectsRO.addRow(Object.values(r)));
  }

  // 6. Sheet: Danh sách vật tư hỏng (BG)
  const wsDefectsBG = workbook.addWorksheet('Vat_Tu_Hong_BG');
  if (defectData.itemsBG.length > 0) {
    const headers = Object.keys(defectData.itemsBG[0]);
    wsDefectsBG.addRow(headers);
    defectData.itemsBG.forEach(r => wsDefectsBG.addRow(Object.values(r)));
  }

  // 7. Sheet: Lịch sử Năng suất Tháng
  const wsHistory = workbook.addWorksheet('Lich_Su_Thang');
  const history = StorageService.getMonthlyHistory();
  if (history.length > 0) {
    const headers = Object.keys(history[0]);
    wsHistory.addRow(headers);
    history.forEach(r => wsHistory.addRow(Object.values(r)));
  }

  // 8. Sheet: Ma trận Năng suất (BG & RO) - Gom tất cả các tháng đã lưu
  const wsMatrices = workbook.addWorksheet('Ma_Tran_Thang');
  wsMatrices.addRow(['Loại', 'Năm', 'Tháng', 'Dữ liệu JSON']);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('pxlr_matrix_bg_v1_') || key.startsWith('pxlr_matrix_ro_v1_'))) {
      const parts = key.split('_');
      const type = parts[2].toUpperCase(); // BG or RO
      const year = parts[4];
      const month = parts[5];
      const data = localStorage.getItem(key);
      if (data) {
        wsMatrices.addRow([type, year, month, data]);
      }
    }
  }
  wsMatrices.getColumn(4).width = 100;

  // Ghi file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `he_thong_pxlr_backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Nhập dữ liệu hệ thống từ file Excel
 */
export async function importSystemExcel(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 1. Phục hồi Thresholds
        const wsConfig = workbook.Sheets['Cau_Hinh'];
        if (wsConfig) {
          const rows: any[] = XLSX.utils.sheet_to_json(wsConfig);
          const thresholds = StorageService.getThresholds();
          rows.forEach(r => {
            const key = r['THAM SỐ'];
            const val = r['GIÁ TRỊ'];
            if (key === 'minAttendanceRate') thresholds.minAttendanceRate = parseFloat(val);
            if (key === 'minProductivityRate') thresholds.minProductivityRate = parseFloat(val);
            if (key === 'maxDefectCostPerDay') thresholds.maxDefectCostPerDay = parseFloat(val);
            if (key === 'maxErrorRate') thresholds.maxErrorRate = parseFloat(val);
            if (key === 'autoExportTime') thresholds.autoExportTime = String(val);
          });
          StorageService.saveThresholds(thresholds);
        }

        // 2. Phục hồi DCBG
        const wsDCBG = workbook.Sheets['Nhat_Ky_DCBG'];
        if (wsDCBG) {
          const records = XLSX.utils.sheet_to_json(wsDCBG);
          StorageService.saveDCBGRecords(records as any);
        }

        // 3. Phục hồi DCRO
        const wsDCRO = workbook.Sheets['Nhat_Ky_DCRO'];
        if (wsDCRO) {
          const records = XLSX.utils.sheet_to_json(wsDCRO);
          StorageService.saveDCRORecords(records as any);
        }

        // 4. Phục hồi Quality
        const wsQuality = workbook.Sheets['Chat_Luong_Hang_Ngay'];
        if (wsQuality) {
          const rows: any[] = XLSX.utils.sheet_to_json(wsQuality);
          const qualityData = StorageService.getSlide2Quality();
          qualityData.dailyRecords = rows.map(r => ({
            id: `imported-${r['Ngày']}`,
            date: r['Ngày'],
            dayLabel: r['Ngày'].split('-').slice(1).reverse().join('/'),
            week: r['Tuần'],
            month: 'T' + parseInt(r['Ngày'].split('-')[1], 10),
            ro: { vatTu: r['RO_VT'], totalLoi4M: r['RO_Loi4M'], dmVatTu: r['RO_DMVT'] },
            bg: { vatTu: r['BG_VT'], totalLoi4M: r['BG_Loi4M'], dmVatTu: r['BG_DMVT'] },
            pxlr: { vatTu: r['PXLR_VT'], totalLoi4M: r['PXLR_Loi4M'], dmVatTu: r['PXLR_DMVT'] }
          })) as any;
          StorageService.saveSlide2Quality(qualityData);
        }

        // 5 & 6. Phục hồi Defects
        const wsDefectsRO = workbook.Sheets['Vat_Tu_Hong_RO'];
        const wsDefectsBG = workbook.Sheets['Vat_Tu_Hong_BG'];
        if (wsDefectsRO || wsDefectsBG) {
          const defectData = StorageService.getSlide3DefectCost();
          if (wsDefectsRO) defectData.itemsRO = XLSX.utils.sheet_to_json(wsDefectsRO) as any;
          if (wsDefectsBG) defectData.itemsBG = XLSX.utils.sheet_to_json(wsDefectsBG) as any;
          StorageService.saveSlide3DefectCost(defectData);
        }

        // 7. Phục hồi History
        const wsHistory = workbook.Sheets['Lich_Su_Thang'];
        if (wsHistory) {
          const history = XLSX.utils.sheet_to_json(wsHistory);
          StorageService.saveMonthlyHistory(history as any);
        }

        // 8. Phục hồi Ma trận
        const wsMatrices = workbook.Sheets['Ma_Tran_Thang'];
        if (wsMatrices) {
          const rows: any[] = XLSX.utils.sheet_to_json(wsMatrices);
          rows.forEach(r => {
            const type = String(r['Loại']).toLowerCase();
            const year = r['Năm'];
            const month = r['Tháng'];
            const jsonData = r['Dữ liệu JSON'];
            if (jsonData) {
              const key = `pxlr_matrix_${type}_v1_${year}_${month}`;
              localStorage.setItem(key, jsonData);
            }
          });
        }

        resolve({ success: true, message: 'Đã phục hồi toàn bộ dữ liệu hệ thống thành công!' });
      } catch (err: any) {
        resolve({ success: false, message: 'Lỗi khi nhập file Excel hệ thống: ' + err.message });
      }
    };
    reader.readAsBinaryString(file);
  });
}

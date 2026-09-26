export interface NSLDDataPoint {
  id: string;
  date: string;       // e.g. '02-Jul', '17-Sep'
  fullDate: string;   // e.g. '2026-07-02'
  month: 'Jul' | 'Aug' | 'Sep';
  monthNum: number;   // 7, 8, 9
  week: string;       // 'W27', ..., 'W38'
  nsld: number;       // e.g. 77, 122.9
  nsldBG?: number;    // Line Bếp Ga
  nsldRO?: number;    // Line RO
}

// Exact sequence transcribed from User's uploaded screenshot (02-Jul to 17-Sep)
export const RAW_DAILY_NSLD_DATA: NSLDDataPoint[] = [
  { id: 'd-01', date: '02-Jul', fullDate: '2026-07-02', month: 'Jul', monthNum: 7, week: 'W27', nsld: 77.0, nsldBG: 72.5, nsldRO: 79.4 },
  { id: 'd-02', date: '04-Jul', fullDate: '2026-07-04', month: 'Jul', monthNum: 7, week: 'W27', nsld: 122.9, nsldBG: 118.0, nsldRO: 125.6 },
  { id: 'd-03', date: '05-Jul', fullDate: '2026-07-05', month: 'Jul', monthNum: 7, week: 'W27', nsld: 129.5, nsldBG: 124.2, nsldRO: 132.4 },
  { id: 'd-04', date: '07-Jul', fullDate: '2026-07-07', month: 'Jul', monthNum: 7, week: 'W28', nsld: 105.2, nsldBG: 101.0, nsldRO: 107.5 },
  { id: 'd-05', date: '09-Jul', fullDate: '2026-07-09', month: 'Jul', monthNum: 7, week: 'W28', nsld: 115.4, nsldBG: 110.8, nsldRO: 118.0 },
  { id: 'd-06', date: '10-Jul', fullDate: '2026-07-10', month: 'Jul', monthNum: 7, week: 'W28', nsld: 118.2, nsldBG: 115.0, nsldRO: 120.0 },
  { id: 'd-07', date: '11-Jul', fullDate: '2026-07-11', month: 'Jul', monthNum: 7, week: 'W28', nsld: 139.0, nsldBG: 132.5, nsldRO: 142.5 },
  { id: 'd-08', date: '13-Jul', fullDate: '2026-07-13', month: 'Jul', monthNum: 7, week: 'W29', nsld: 112.5, nsldBG: 108.2, nsldRO: 114.8 },
  { id: 'd-09', date: '14-Jul', fullDate: '2026-07-14', month: 'Jul', monthNum: 7, week: 'W29', nsld: 117.4, nsldBG: 112.0, nsldRO: 120.3 },
  { id: 'd-10', date: '15-Jul', fullDate: '2026-07-15', month: 'Jul', monthNum: 7, week: 'W29', nsld: 113.0, nsldBG: 109.5, nsldRO: 115.0 },
  { id: 'd-11', date: '16-Jul', fullDate: '2026-07-16', month: 'Jul', monthNum: 7, week: 'W29', nsld: 102.9, nsldBG: 98.4, nsldRO: 105.4 },
  { id: 'd-12', date: '17-Jul', fullDate: '2026-07-17', month: 'Jul', monthNum: 7, week: 'W29', nsld: 127.1, nsldBG: 121.6, nsldRO: 130.0 },
  { id: 'd-13', date: '18-Jul', fullDate: '2026-07-18', month: 'Jul', monthNum: 7, week: 'W29', nsld: 123.2, nsldBG: 119.0, nsldRO: 125.5 },
  { id: 'd-14', date: '20-Jul', fullDate: '2026-07-20', month: 'Jul', monthNum: 7, week: 'W30', nsld: 121.0, nsldBG: 115.4, nsldRO: 124.0 },
  { id: 'd-15', date: '21-Jul', fullDate: '2026-07-21', month: 'Jul', monthNum: 7, week: 'W30', nsld: 117.4, nsldBG: 112.8, nsldRO: 120.0 },
  { id: 'd-16', date: '22-Jul', fullDate: '2026-07-22', month: 'Jul', monthNum: 7, week: 'W30', nsld: 89.9, nsldBG: 85.0, nsldRO: 92.5 },
  { id: 'd-17', date: '23-Jul', fullDate: '2026-07-23', month: 'Jul', monthNum: 7, week: 'W30', nsld: 97.4, nsldBG: 94.0, nsldRO: 99.2 },
  { id: 'd-18', date: '24-Jul', fullDate: '2026-07-24', month: 'Jul', monthNum: 7, week: 'W30', nsld: 123.0, nsldBG: 118.5, nsldRO: 125.4 },
  { id: 'd-19', date: '25-Jul', fullDate: '2026-07-25', month: 'Jul', monthNum: 7, week: 'W30', nsld: 99.3, nsldBG: 95.0, nsldRO: 101.6 },
  { id: 'd-20', date: '27-Jul', fullDate: '2026-07-27', month: 'Jul', monthNum: 7, week: 'W31', nsld: 118.5, nsldBG: 114.2, nsldRO: 121.0 },
  { id: 'd-21', date: '28-Jul', fullDate: '2026-07-28', month: 'Jul', monthNum: 7, week: 'W31', nsld: 124.8, nsldBG: 120.0, nsldRO: 127.4 },
  { id: 'd-22', date: '29-Jul', fullDate: '2026-07-29', month: 'Jul', monthNum: 7, week: 'W31', nsld: 104.0, nsldBG: 99.5, nsldRO: 106.5 },
  { id: 'd-23', date: '30-Jul', fullDate: '2026-07-30', month: 'Jul', monthNum: 7, week: 'W31', nsld: 109.6, nsldBG: 106.0, nsldRO: 111.5 },
  { id: 'd-24', date: '31-Jul', fullDate: '2026-07-31', month: 'Jul', monthNum: 7, week: 'W31', nsld: 111.7, nsldBG: 108.2, nsldRO: 113.6 },
  { id: 'd-25', date: '01-Aug', fullDate: '2026-08-01', month: 'Aug', monthNum: 8, week: 'W31', nsld: 119.8, nsldBG: 115.0, nsldRO: 122.4 },
  { id: 'd-26', date: '03-Aug', fullDate: '2026-08-03', month: 'Aug', monthNum: 8, week: 'W32', nsld: 109.9, nsldBG: 105.4, nsldRO: 112.3 },
  { id: 'd-27', date: '04-Aug', fullDate: '2026-08-04', month: 'Aug', monthNum: 8, week: 'W32', nsld: 108.4, nsldBG: 104.0, nsldRO: 110.8 },
  { id: 'd-28', date: '05-Aug', fullDate: '2026-08-05', month: 'Aug', monthNum: 8, week: 'W32', nsld: 109.2, nsldBG: 105.0, nsldRO: 111.5 },
  { id: 'd-29', date: '06-Aug', fullDate: '2026-08-06', month: 'Aug', monthNum: 8, week: 'W32', nsld: 117.4, nsldBG: 112.5, nsldRO: 120.0 },
  { id: 'd-30', date: '07-Aug', fullDate: '2026-08-07', month: 'Aug', monthNum: 8, week: 'W32', nsld: 116.1, nsldBG: 111.2, nsldRO: 118.8 },
  { id: 'd-31', date: '08-Aug', fullDate: '2026-08-08', month: 'Aug', monthNum: 8, week: 'W32', nsld: 101.8, nsldBG: 98.0, nsldRO: 103.8 },
  { id: 'd-32', date: '10-Aug', fullDate: '2026-08-10', month: 'Aug', monthNum: 8, week: 'W33', nsld: 88.3, nsldBG: 84.0, nsldRO: 90.6 },
  { id: 'd-33', date: '11-Aug', fullDate: '2026-08-11', month: 'Aug', monthNum: 8, week: 'W33', nsld: 121.7, nsldBG: 116.8, nsldRO: 124.3 },
  { id: 'd-34', date: '12-Aug', fullDate: '2026-08-12', month: 'Aug', monthNum: 8, week: 'W33', nsld: 121.5, nsldBG: 117.0, nsldRO: 123.9 },
  { id: 'd-35', date: '13-Aug', fullDate: '2026-08-13', month: 'Aug', monthNum: 8, week: 'W33', nsld: 122.9, nsldBG: 118.4, nsldRO: 125.3 },
  { id: 'd-36', date: '14-Aug', fullDate: '2026-08-14', month: 'Aug', monthNum: 8, week: 'W33', nsld: 128.0, nsldBG: 123.5, nsldRO: 130.4 },
  { id: 'd-37', date: '15-Aug', fullDate: '2026-08-15', month: 'Aug', monthNum: 8, week: 'W33', nsld: 118.9, nsldBG: 114.0, nsldRO: 121.5 },
  { id: 'd-38', date: '17-Aug', fullDate: '2026-08-17', month: 'Aug', monthNum: 8, week: 'W34', nsld: 106.2, nsldBG: 102.0, nsldRO: 108.4 },
  { id: 'd-39', date: '18-Aug', fullDate: '2026-08-18', month: 'Aug', monthNum: 8, week: 'W34', nsld: 118.0, nsldBG: 113.6, nsldRO: 120.4 },
  { id: 'd-40', date: '19-Aug', fullDate: '2026-08-19', month: 'Aug', monthNum: 8, week: 'W34', nsld: 113.3, nsldBG: 109.0, nsldRO: 115.6 },
  { id: 'd-41', date: '20-Aug', fullDate: '2026-08-20', month: 'Aug', monthNum: 8, week: 'W34', nsld: 85.6, nsldBG: 80.0, nsldRO: 88.6 },
  { id: 'd-42', date: '21-Aug', fullDate: '2026-08-21', month: 'Aug', monthNum: 8, week: 'W34', nsld: 51.3, nsldBG: 48.0, nsldRO: 53.0 },
  { id: 'd-43', date: '22-Aug', fullDate: '2026-08-22', month: 'Aug', monthNum: 8, week: 'W34', nsld: 55.4, nsldBG: 51.0, nsldRO: 57.8 },
  { id: 'd-44', date: '23-Aug', fullDate: '2026-08-23', month: 'Aug', monthNum: 8, week: 'W35', nsld: 111.8, nsldBG: 107.5, nsldRO: 114.1 },
  { id: 'd-45', date: '25-Aug', fullDate: '2026-08-25', month: 'Aug', monthNum: 8, week: 'W35', nsld: 125.7, nsldBG: 120.4, nsldRO: 128.5 },
  { id: 'd-46', date: '26-Aug', fullDate: '2026-08-26', month: 'Aug', monthNum: 8, week: 'W35', nsld: 105.5, nsldBG: 101.2, nsldRO: 107.8 },
  { id: 'd-47', date: '27-Aug', fullDate: '2026-08-27', month: 'Aug', monthNum: 8, week: 'W35', nsld: 113.8, nsldBG: 109.6, nsldRO: 116.0 },
  { id: 'd-48', date: '28-Aug', fullDate: '2026-08-28', month: 'Aug', monthNum: 8, week: 'W35', nsld: 106.8, nsldBG: 102.5, nsldRO: 109.0 },
  { id: 'd-49', date: '29-Aug', fullDate: '2026-08-29', month: 'Aug', monthNum: 8, week: 'W35', nsld: 92.7, nsldBG: 88.0, nsldRO: 95.2 },
  { id: 'd-50', date: '31-Aug', fullDate: '2026-08-31', month: 'Aug', monthNum: 8, week: 'W36', nsld: 122.5, nsldBG: 117.8, nsldRO: 125.0 },
  { id: 'd-51', date: '01-Sep', fullDate: '2026-09-01', month: 'Sep', monthNum: 9, week: 'W36', nsld: 124.4, nsldBG: 120.0, nsldRO: 126.8 },
  { id: 'd-52', date: '03-Sep', fullDate: '2026-09-03', month: 'Sep', monthNum: 9, week: 'W36', nsld: 109.8, nsldBG: 105.2, nsldRO: 112.3 },
  { id: 'd-53', date: '04-Sep', fullDate: '2026-09-04', month: 'Sep', monthNum: 9, week: 'W36', nsld: 119.4, nsldBG: 115.0, nsldRO: 121.8 },
  { id: 'd-54', date: '05-Sep', fullDate: '2026-09-05', month: 'Sep', monthNum: 9, week: 'W36', nsld: 144.9, nsldBG: 139.5, nsldRO: 147.8 },
  { id: 'd-55', date: '07-Sep', fullDate: '2026-09-07', month: 'Sep', monthNum: 9, week: 'W37', nsld: 113.7, nsldBG: 109.0, nsldRO: 116.2 },
  { id: 'd-56', date: '08-Sep', fullDate: '2026-09-08', month: 'Sep', monthNum: 9, week: 'W37', nsld: 119.1, nsldBG: 114.5, nsldRO: 121.6 },
  { id: 'd-57', date: '09-Sep', fullDate: '2026-09-09', month: 'Sep', monthNum: 9, week: 'W37', nsld: 103.8, nsldBG: 99.4, nsldRO: 106.1 },
  { id: 'd-58', date: '10-Sep', fullDate: '2026-09-10', month: 'Sep', monthNum: 9, week: 'W37', nsld: 131.5, nsldBG: 126.2, nsldRO: 134.3 },
  { id: 'd-59', date: '17-Sep', fullDate: '2026-09-17', month: 'Sep', monthNum: 9, week: 'W38', nsld: 103.7, nsldBG: 99.5, nsldRO: 106.0 },
];

export interface NSLDWeeklyDataPoint {
  week: string;       // 'W27', 'W28', ..., 'W38'
  label: string;      // 'W27 (01-05/07)'
  nsld: number;
  nsldBG: number;
  nsldRO: number;
  daysCount: number;
}

export const RAW_WEEKLY_NSLD_DATA: NSLDWeeklyDataPoint[] = [
  { week: 'W27', label: 'W27 (Tháng 7)', nsld: 109.8, nsldBG: 104.9, nsldRO: 112.5, daysCount: 3 },
  { week: 'W28', label: 'W28 (Tháng 7)', nsld: 119.5, nsldBG: 114.8, nsldRO: 122.0, daysCount: 4 },
  { week: 'W29', label: 'W29 (Tháng 7)', nsld: 116.0, nsldBG: 111.4, nsldRO: 118.5, daysCount: 6 },
  { week: 'W30', label: 'W30 (Tháng 7)', nsld: 108.4, nsldBG: 104.1, nsldRO: 110.7, daysCount: 6 },
  { week: 'W31', label: 'W31 (T7-T8)', nsld: 114.7, nsldBG: 110.4, nsldRO: 117.0, daysCount: 6 },
  { week: 'W32', label: 'W32 (Tháng 8)', nsld: 110.5, nsldBG: 106.1, nsldRO: 112.9, daysCount: 6 },
  { week: 'W33', label: 'W33 (Tháng 8)', nsld: 116.9, nsldBG: 112.3, nsldRO: 119.4, daysCount: 6 },
  { week: 'W34', label: 'W34 (Tháng 8)', nsld: 86.6, nsldBG: 82.3, nsldRO: 89.0, daysCount: 6 },
  { week: 'W35', label: 'W35 (Tháng 8)', nsld: 111.1, nsldBG: 106.5, nsldRO: 113.6, daysCount: 6 },
  { week: 'W36', label: 'W36 (T8-T9)', nsld: 124.2, nsldBG: 119.5, nsldRO: 126.7, daysCount: 5 },
  { week: 'W37', label: 'W37 (Tháng 9)', nsld: 117.0, nsldBG: 112.3, nsldRO: 119.6, daysCount: 4 },
  { week: 'W38', label: 'W38 (Tháng 9)', nsld: 103.7, nsldBG: 99.5, nsldRO: 106.0, daysCount: 1 },
];

export interface NSLDMonthlyDataPoint {
  month: string;      // 'T1', 'T2', ..., 'T12'
  monthLabel: string; // 'Tháng 1', ...
  nsld: number;
  nsld2025: number;
  nsldBG: number;
  nsldRO: number;
}

export const RAW_MONTHLY_NSLD_DATA: NSLDMonthlyDataPoint[] = [
  { month: 'T1', monthLabel: 'Tháng 1', nsld: 103.54, nsld2025: 103.54, nsldBG: 98.4, nsldRO: 105.8 },
  { month: 'T2', monthLabel: 'Tháng 2', nsld: 106.42, nsld2025: 106.42, nsldBG: 101.2, nsldRO: 108.9 },
  { month: 'T3', monthLabel: 'Tháng 3', nsld: 107.82, nsld2025: 107.82, nsldBG: 102.5, nsldRO: 110.4 },
  { month: 'T4', monthLabel: 'Tháng 4', nsld: 116.59, nsld2025: 116.59, nsldBG: 111.0, nsldRO: 119.2 },
  { month: 'T5', monthLabel: 'Tháng 5', nsld: 105.34, nsld2025: 105.34, nsldBG: 100.8, nsldRO: 107.5 },
  { month: 'T6', monthLabel: 'Tháng 6', nsld: 112.92, nsld2025: 112.92, nsldBG: 108.5, nsldRO: 115.0 },
  { month: 'T7', monthLabel: 'Tháng 7', nsld: 114.15, nsld2025: 114.15, nsldBG: 109.8, nsldRO: 116.5 },
  { month: 'T8', monthLabel: 'Tháng 8', nsld: 108.62, nsld2025: 108.62, nsldBG: 103.9, nsldRO: 111.0 },
  { month: 'T9', monthLabel: 'Tháng 9', nsld: 118.35, nsld2025: 118.35, nsldBG: 113.6, nsldRO: 120.8 },
  { month: 'T10', monthLabel: 'Tháng 10', nsld: 109.43, nsld2025: 109.43, nsldBG: 105.0, nsldRO: 111.6 },
  { month: 'T11', monthLabel: 'Tháng 11', nsld: 105.28, nsld2025: 105.28, nsldBG: 101.4, nsldRO: 107.2 },
  { month: 'T12', monthLabel: 'Tháng 12', nsld: 110.00, nsld2025: 110.00, nsldBG: 106.0, nsldRO: 112.0 },
];

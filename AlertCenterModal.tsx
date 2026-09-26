import React, { useState } from 'react';
import { useProduction } from './ProductionContext';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Check, 
  Trash2, 
  Radio, 
  Send,
  Flame,
  Droplets,
  Layers
} from 'lucide-react';

interface AlertCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertCenterModal: React.FC<AlertCenterModalProps> = ({ isOpen, onClose }) => {
  const { 
    alerts, 
    markAlertAsRead, 
    clearAllAlerts, 
    requestNotificationPermission, 
    sendManualPushNotification,
    thresholds 
  } = useProduction();

  const [testTitle, setTestTitle] = useState('Biến động đột xuất: Vắng 7 nhân sự ca chiều');
  const [testDC, setTestDC] = useState<'DCBG' | 'DCRO' | 'PXLR'>('DCBG');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendManualPushNotification(
        'Đã kích hoạt Thông Báo Đẩy Thành Công',
        'Hệ thống sẽ gửi cảnh báo tức thì khi Tỉ lệ đi làm < 92% hoặc NSLĐ < 100%.',
        'info'
      );
    }
  };

  const handleSendTestPush = () => {
    sendManualPushNotification(
      `[Biến động ${testDC}] Cảnh báo điều phối khẩn`,
      `${testTitle}. Tỉ lệ đi làm giảm xuống dưới mức an toàn, đề xuất điều chuyển công hỗ trợ.`,
      'critical'
    );
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">
              Trung Tâm Thông Báo Đẩy & Cảnh Báo Biến Động
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web Push Permission Banner */}
        <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <Radio className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
            <span>
              Kích hoạt Web Push Notifications để nhận cảnh báo trên điện thoại / máy tính ngay cả khi không mở ứng dụng.
            </span>
          </div>
          <button
            onClick={handleRequestPush}
            id="btn-enable-push"
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer"
          >
            Bật Thông Báo Đẩy
          </button>
        </div>

        {/* Controls & Test Box */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Kiểm tra bắn thông báo đẩy tức thì
            </span>
            <div className="flex items-center gap-1">
              {(['all', 'critical', 'warning'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    filterSeverity === sev ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sev === 'all' ? 'Tất cả' : sev === 'critical' ? 'Khẩn cấp' : 'Cảnh báo'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={testDC}
              onChange={(e) => setTestDC(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="DCBG">DCBG (Bếp)</option>
              <option value="DCRO">DCRO (RO)</option>
              <option value="PXLR">PXLR (Tổng)</option>
            </select>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Nội dung biến động cần cảnh báo..."
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden"
            />
            <button
              onClick={handleSendTestPush}
              id="btn-send-test-push"
              className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Ngay</span>
            </button>
          </div>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 divide-y divide-slate-100">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              Chưa có biến động chỉ số nghiêm trọng nào. Mọi chỉ tiêu đang trong ngưỡng an toàn!
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => markAlertAsRead(alert.id)}
                className={`pt-3 first:pt-0 flex items-start gap-3 p-3 rounded-xl transition cursor-pointer ${
                  alert.isRead ? 'bg-white opacity-75' : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {alert.severity === 'critical' ? (
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  ) : alert.severity === 'warning' ? (
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Info className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {alert.title}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                        alert.dcSource === 'DCBG' ? 'bg-emerald-100 text-emerald-800' :
                        alert.dcSource === 'DCRO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.dcSource}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">
              Tổng cộng {alerts.length} thông báo
            </span>
            <button
              onClick={clearAllAlerts}
              className="text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả thông báo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

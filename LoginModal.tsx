import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { User, UserRole } from './types';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  KeyRound, 
  UserCheck, 
  Check, 
  AlertCircle,
  Briefcase
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, availableUsers, switchUser, loginWithPin, isAuthenticated } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pin, setPin] = useState<string>('1234');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginWithPin(selectedUserId, pin);
    if (success) {
      setSuccessMsg('Xác thực bảo mật thành công!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } else {
      setErrorMsg('Mã PIN không đúng. Gợi ý: Dùng mã mặc định 1234 hoặc 2026.');
    }
  };

  const handleQuickSwitch = (u: User) => {
    switchUser(u);
    setSelectedUserId(u.id);
    setSuccessMsg(`Đã chuyển phiên sang: ${u.name}`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">
              Xác Thực Bảo Mật & Phân Quyền Vận Hành
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Current Active User Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500 font-medium">Phiên làm việc hiện hành</div>
              <div className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-xs text-blue-700 font-semibold">{currentUser.roleTitle}</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
              Đang đăng nhập
            </span>
          </div>

          {/* Quick Select Role Profile */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Chọn Tài Khoản Cán Bộ Chuyền / Quản Đốc
            </label>
            <div className="space-y-2">
              {availableUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleQuickSwitch(u)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    u.id === currentUser.id
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${u.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {u.roleTitle} • <span className="text-slate-400">{u.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {u.id === currentUser.id ? (
                      <span className="text-blue-600 flex items-center text-xs font-bold gap-1">
                        <Check className="w-4 h-4" /> Đang dùng
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium hover:text-blue-600">
                        Chuyển đổi
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PIN Verification Form */}
          <form onSubmit={handleLogin} className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-500" />
                Xác Thực Mã PIN Chuyền (Tablet / Mobile)
              </label>
              <span className="text-[11px] text-slate-400">PIN chuẩn: 1234</span>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Nhập mã PIN..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold tracking-widest text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden"
              />
              <button
                type="submit"
                id="btn-confirm-pin"
                className="bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Xác Nhận
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-emerald-600 flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </form>

          {/* Role permissions matrix note */}
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-700">Ma trận phân quyền:</div>
            <div>• <b>Quản Đốc PXLR:</b> Nhập/sửa DCBG, DCRO, Phê duyệt giao ban, Cấu hình ngưỡng.</div>
            <div>• <b>Trưởng Ca DCBG:</b> Nhập & cập nhật số liệu line Bếp Gas, xem tổng hợp.</div>
            <div>• <b>Trưởng Ca DCRO:</b> Nhập & cập nhật số liệu line Máy lọc RO, xem tổng hợp.</div>
            <div>• <b>Kế Hoạch & Điều Độ:</b> Xem báo cáo, chạy mô phỏng dự báo & điều phối nguồn lực.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

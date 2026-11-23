import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-[#2A332E] px-4 py-3 text-xs font-medium text-[#FAF6F0] shadow-lg"
    >
      <WifiOff className="w-4 h-4 text-[#E5B968] shrink-0" />
      <span>لا يوجد اتصال بالإنترنت — يتم عرض البيانات المحفوظة مؤقتاً</span>
    </div>
  );
};

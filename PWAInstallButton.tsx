import React, { useState } from 'react';
import { Check, Copy, Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'subtle';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'subtle',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } =
    usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleCopyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'primary'
            ? 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5248] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163F37] transition-colors whitespace-nowrap shrink-0'
            : 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8CFC0] bg-[#FFFDF9] px-4 py-2 text-xs font-semibold text-[#1E5248] hover:bg-[#EFE8DC] transition-colors whitespace-nowrap shrink-0'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>تثبيت التطبيق على الهاتف</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'primary'
              ? 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5248] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163F37] transition-colors whitespace-nowrap shrink-0'
              : 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8CFC0] bg-[#FFFDF9] px-4 py-2 text-xs font-semibold text-[#1E5248] hover:bg-[#EFE8DC] transition-colors whitespace-nowrap shrink-0'
          }
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-3xl bg-[#FFFDF9] border border-[#E4DDD0] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#1C2521]">
                  تثبيت بلدنا على آيفون
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="إغلاق"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#5A655F] hover:bg-[#F4EFE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-2.5 text-sm text-[#3F4A44] leading-relaxed list-decimal list-inside">
                <li>اضغط على زر المشاركة (Share) في شريط متصفح Safari.</li>
                <li>اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).</li>
                <li>اضغط على "إضافة" ليظهر التطبيق كبرنامج مستقل.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-semibold hover:bg-[#163F37] transition-colors"
              >
                حسناً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowAndroidGuide(true)}
        className={
          variant === 'primary'
            ? 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5248] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163F37] transition-colors whitespace-nowrap shrink-0'
            : 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8CFC0] bg-[#FFFDF9] px-4 py-2 text-xs font-semibold text-[#1E5248] hover:bg-[#EFE8DC] transition-colors whitespace-nowrap shrink-0'
        }
      >
        <Smartphone className="w-4 h-4 shrink-0" />
        <span>
          {isAndroid ? 'تثبيت كتطبيق أندرويد' : 'تثبيت التطبيق على الهاتف'}
        </span>
      </button>

      {showAndroidGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#FFFDF9] border border-[#E4DDD0] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C2521]">
                تشغيل «بلدنا» كتطبيق أندرويد على هاتفك
              </h3>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                aria-label="إغلاق"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#5A655F] hover:bg-[#F4EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-2.5 text-sm text-[#3F4A44] leading-relaxed list-decimal list-inside">
              <li>
                افتح رابط التطبيق مباشرة في متصفح <strong>Google Chrome</strong>{' '}
                على هاتفك الأندرويد.
              </li>
              <li>
                اضغط على قائمة المتصفح (<strong>⋮</strong>) بالأعلى ثم اختر{' '}
                <strong>تثبيت التطبيق (Install App)</strong> أو{' '}
                <strong>الإضافة إلى الشاشة الرئيسية</strong>.
              </li>
              <li>
                سيُثبَّت «بلدنا» على هاتفك كتطبيق مستقل بملء الشاشة وأيقونة رسمية
                مع دعم التصفح السريع.
              </li>
            </ol>

            <div className="rounded-2xl bg-[#FAF6F0] border border-[#E4DDD0] p-3 flex items-center justify-between gap-2">
              <span
                dir="ltr"
                className="text-xs text-[#5A655F] truncate select-all"
              >
                {typeof window !== 'undefined' ? window.location.origin : ''}
              </span>
              <button
                type="button"
                onClick={handleCopyCurrentUrl}
                className="min-h-[38px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] text-xs font-bold text-[#1E5248] inline-flex items-center gap-1.5 shrink-0"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-semibold hover:bg-[#163F37] transition-colors"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};

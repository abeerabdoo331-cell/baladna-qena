import React from 'react';
import { ArrowRight, Download, Home, Smartphone, Sparkles } from 'lucide-react';
import { AppUpdate, CURRENT_APP_VERSION } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface AppUpdatesViewProps {
  updates: AppUpdate[];
  onBack: () => void;
}

function formatDate(ts: AppUpdate['createdAt']): string {
  if (!ts) return '';
  const date = 'toDate' in ts ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!date) return '';
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const AppUpdatesView: React.FC<AppUpdatesViewProps> = ({
  updates,
  onBack,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              aria-label="العودة للصفحة الرئيسية"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#1C2521] hover:bg-[#EFE8DC] transition-colors shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#E8F1EE] text-[#1E5248] flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C2521]">
                تحديثات التطبيق (APK)
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-[#5A655F] tabular-nums">
                الإصدار الحالي المثبت: {CURRENT_APP_VERSION}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <PWAInstallButton variant="primary" />
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-bold text-[#1C2521] hover:bg-[#EFE8DC] inline-flex items-center gap-1.5"
            >
              <Home className="w-4 h-4 text-[#1E5248]" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Direct Android Install Card */}
      <section className="bg-[#EDF6F1] border border-[#CBE0D6] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-[#1E5248]">
            التشغيل الفوري كتطبيق أندرويد على الهاتف
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#3F4A44] leading-relaxed">
            يمكنك تثبيت «بلدنا» مباشرة على شاشة هاتفك الأندرويد كبرنامج مستقل بأيقونة رسمية وتشغيل بملء الشاشة، أو تنزيل ملف APK عند نشره من الإدارة أدناه.
          </p>
        </div>
        <PWAInstallButton variant="primary" />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-[#49534E] px-1">
          سجل الإصدارات وحزم APK المنشورة ·{' '}
          <span className="tabular-nums">{updates.length}</span>
        </h3>

        {updates.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] text-[#1E5248] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-[#1C2521]">
              أنت تستخدم أحدث نسخة من بلدنا — قنا
            </h4>
            <p className="mt-1.5 text-sm text-[#5A655F] max-w-md mx-auto leading-relaxed">
              لا توجد حزم APK خارجية منشورة حالياً. يمكنك التثبيت المباشر على هاتفك عبر الزر أعلاه، وعند نشر الإدارة لملف APK جديد سيظهر رابط التنزيل هنا مباشرة.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((upd, idx) => (
              <article
                key={upd.id}
                className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-extrabold text-[#1C2521] tabular-nums">
                      الإصدار {upd.versionName}
                      {idx === 0 ? ' · الأحدث' : ''}
                    </h4>
                    <p className="mt-0.5 text-xs text-[#5A655F] tabular-nums">
                      رقم البناء: {upd.versionCode}
                      {formatDate(upd.createdAt)
                        ? ` · ${formatDate(upd.createdAt)}`
                        : ''}
                    </p>
                  </div>

                  {upd.apkUrl && (
                    <a
                      href={upd.apkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E5248] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-[#163F37] transition-colors whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل التحديث (APK)</span>
                    </a>
                  )}
                </div>

                <p className="text-sm text-[#3F4A44] leading-relaxed whitespace-pre-line">
                  {upd.releaseNotes}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

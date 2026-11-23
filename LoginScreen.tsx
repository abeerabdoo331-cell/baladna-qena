import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, ShieldCheck, User } from 'lucide-react';
import { BLUEPRINT_CONSTRAINTS, GOVERNORATE_NAME } from '../types';
import { AppLogo } from './AppLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginScreenProps {
  initialName?: string;
  initialPhone?: string;
  onLogin: (name: string, phone: string) => void;
  onOpenAdmin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialName = '',
  initialPhone = '',
  onLogin,
  onOpenAdmin,
}) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = name.trim();
    const cleanedPhone = phone.trim();

    if (cleanedName.length < BLUEPRINT_CONSTRAINTS.listing.submittedByNameMinLength) {
      setError('يرجى كتابة الاسم الكامل (حرفان على الأقل)');
      return;
    }
    if (cleanedName.length > BLUEPRINT_CONSTRAINTS.listing.submittedByNameMaxLength) {
      setError('الاسم طويل جداً، يرجى الاختصار');
      return;
    }
    if (!BLUEPRINT_CONSTRAINTS.listing.phonePattern.test(cleanedPhone)) {
      setError('يرجى إدخال رقم هاتف صحيح (مثال: 010XXXXXXXX)');
      return;
    }

    setError('');
    onLogin(cleanedName, cleanedPhone);
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#1C2521] flex flex-col justify-between px-4 py-8 sm:py-12">
      {/* Top: Brand Logo, Name, and Slogan */}
      <header className="max-w-md w-full mx-auto text-center pt-4 sm:pt-6">
        <div className="flex justify-center mb-4">
          <AppLogo size="lg" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E5248] tracking-tight text-balance">
          بلدنا
        </h1>
        <p className="mt-2 text-base font-bold text-[#2A332E] text-balance">
          خدمات قنا كلها أقرب ليك
        </p>
        <p className="mt-1.5 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[#5A655F]">
          <MapPin className="w-3.5 h-3.5 text-[#1E5248]" />
          <span>{GOVERNORATE_NAME} · مراكزها وقراها</span>
        </p>
      </header>

      {/* Center: Name & Phone Login Card */}
      <main className="max-w-md w-full mx-auto my-6">
        <form
          onSubmit={handleSubmit}
          className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 sm:p-8 shadow-sm"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#1C2521]">
              تسجيل الدخول بالاسم ورقم الهاتف
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#5A655F]">
              سجّل دخولك السريع للوصول إلى خدمات وإعلانات محافظة قنا
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="user-name"
                className="block text-sm font-semibold text-[#2A332E] mb-1.5"
              >
                الاسم الكريم *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-[#7A847E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="مثال: محمد أحمد علي"
                  maxLength={BLUEPRINT_CONSTRAINTS.listing.submittedByNameMaxLength}
                  autoComplete="name"
                  className="w-full min-h-[48px] rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] pr-11 pl-4 py-3 text-base text-[#1C2521] placeholder:text-[#8E9691] focus:outline-none focus:border-[#1E5248] focus:ring-2 focus:ring-[#1E5248]/15 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="user-phone"
                className="block text-sm font-semibold text-[#2A332E] mb-1.5"
              >
                رقم الهاتف *
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-[#7A847E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="user-phone"
                  type="tel"
                  dir="ltr"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="01XXXXXXXXX"
                  maxLength={BLUEPRINT_CONSTRAINTS.listing.phoneMaxLength}
                  autoComplete="tel"
                  className="w-full min-h-[48px] rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] pr-11 pl-4 py-3 text-base text-right tabular-nums text-[#1C2521] placeholder:text-[#8E9691] focus:outline-none focus:border-[#1E5248] focus:ring-2 focus:ring-[#1E5248]/15 transition"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-[#B34338]">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-2xl bg-[#1E5248] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#163F37] active:scale-[0.99] transition-all shadow-sm"
            >
              <span>دخول إلى بلدنا</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </form>
      </main>

      {/* Footer: Admin Access & PWA Install */}
      <footer className="max-w-md w-full mx-auto flex flex-col items-center gap-3 pb-2">
        <PWAInstallButton variant="subtle" />
        <button
          type="button"
          onClick={onOpenAdmin}
          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#5A655F] hover:text-[#1E5248] hover:bg-[#EAE2D4]/60 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>لوحة تحكم الإدارة</span>
        </button>
      </footer>
    </div>
  );
};

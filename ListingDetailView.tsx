import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import {
  ArrowRight,
  Check,
  Copy,
  Heart,
  Home,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  User,
  X,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import { GOVERNORATE_NAME, Listing } from '../types';
import { buildWhatsAppUrl } from './ListingCard';

interface ListingDetailViewProps {
  listing: Listing;
  categoryName?: string;
  subcategoryName?: string;
  isFavorite: boolean;
  currentUser: FirebaseUser | null;
  isAdmin: boolean;
  onToggleFavorite: (listingId: string) => void;
  onBack: () => void;
  onGoHome: () => void;
}

export const ListingDetailView: React.FC<ListingDetailViewProps> = ({
  listing,
  categoryName,
  subcategoryName,
  isFavorite,
  currentUser,
  isAdmin,
  onToggleFavorite,
  onBack,
  onGoHome,
}) => {
  const images = Array.isArray(listing.images) ? listing.images : [];
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [privatePhone, setPrivatePhone] = useState<string | null>(null);

  // Fetch private aid contact ONLY if viewer is authorized (admin or creator)
  useEffect(() => {
    setSelectedImageIdx(0);
    setPrivatePhone(null);

    const canViewPrivate =
      listing.hideContactInfo &&
      (isAdmin || (currentUser && currentUser.uid === listing.authorUid));

    if (!canViewPrivate) return;

    let cancelled = false;
    getDoc(doc(db, 'aid_contacts', listing.id))
      .then((snap) => {
        if (!cancelled && snap.exists()) {
          const data = snap.data() as { contactPhone?: string };
          if (data.contactPhone) {
            setPrivatePhone(data.contactPhone);
          }
        }
      })
      .catch(() => {
        // Ignore if not found
      });

    return () => {
      cancelled = true;
    };
  }, [listing.id, listing.hideContactInfo, listing.authorUid, isAdmin, currentUser]);

  const effectivePhone = listing.hideContactInfo
    ? privatePhone || ''
    : listing.contactPhone;

  const regionParts = [
    GOVERNORATE_NAME,
    listing.centerName ? `مركز ${listing.centerName}` : '',
    listing.villageName || '',
    listing.area || '',
  ].filter(Boolean);

  const handleCopy = async () => {
    if (!effectivePhone) return;
    try {
      await navigator.clipboard.writeText(effectivePhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5">
      {/* Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] text-sm font-bold text-[#1C2521] hover:bg-[#EFE8DC] inline-flex items-center gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] text-sm font-bold text-[#1E5248] hover:bg-[#EFE8DC] inline-flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(listing.id)}
          className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-bold inline-flex items-center gap-2 transition-colors ${
            isFavorite
              ? 'border-[#C96B5E]/40 bg-[#FBF1EE] text-[#B34338]'
              : 'border-[#DDD4C5] bg-[#FFFDF9] text-[#3F4A44] hover:bg-[#EFE8DC]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          <span>{isFavorite ? 'محفوظ في المفضلة' : 'حفظ في المفضلة'}</span>
        </button>
      </div>

      {/* Main Detail Card */}
      <article className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl overflow-hidden shadow-xs">
        {/* Photos Gallery */}
        {images.length > 0 && (
          <div className="bg-[#FAF6F0] border-b border-[#EFE8DC] p-4 sm:p-5 space-y-3">
            <button
              type="button"
              onClick={() => setLightboxImage(images[selectedImageIdx] || images[0])}
              className="w-full aspect-16/10 sm:aspect-16/9 rounded-2xl overflow-hidden border border-[#E4DDD0] bg-white block"
            >
              <img
                src={images[selectedImageIdx] || images[0]}
                alt={listing.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-[#FAF6F0]"
              />
            </button>

            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      selectedImageIdx === idx
                        ? 'border-[#1E5248]'
                        : 'border-[#E4DDD0] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${listing.title} - صورة ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-5 sm:p-7 space-y-6">
          {/* Title & Metadata */}
          <div className="space-y-2">
            {(listing.isFeatured || listing.status !== 'approved') && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                {listing.isFeatured && (
                  <span className="text-[#9A5B25]">إعلان مميز في قنا</span>
                )}
                {listing.status === 'pending' && (
                  <span className="text-[#9A6324]">قيد مراجعة الإدارة</span>
                )}
                {listing.status === 'rejected' && (
                  <span className="text-[#B34338]">مرفوض</span>
                )}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C2521] leading-snug text-balance">
              {listing.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[#5A655F]">
              <span className="font-bold text-[#1E5248]">
                {listing.serviceType}
              </span>
              {categoryName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{categoryName}</span>
                </>
              )}
              {subcategoryName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{subcategoryName}</span>
                </>
              )}
            </div>
          </div>

          {/* Price Highlight (if any) */}
          {listing.price && (
            <div className="rounded-2xl bg-[#FAF6F0] border border-[#E4DDD0] px-4 py-3.5">
              <span className="text-xs font-semibold text-[#5A655F] block">
                السعر / التكلفة
              </span>
              <span className="text-lg font-extrabold text-[#9A5B25] tabular-nums">
                {listing.price}
              </span>
            </div>
          )}

          {/* Region & Owner Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#FAF6F0] border border-[#E4DDD0] p-4 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#1E5248] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#5A655F] block">
                  المنطقة
                </span>
                <p className="text-sm font-bold text-[#1C2521] mt-0.5 leading-relaxed">
                  {regionParts.join(' · ')}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF6F0] border border-[#E4DDD0] p-4 flex items-start gap-3">
              <User className="w-5 h-5 text-[#1E5248] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#5A655F] block">
                  المعلن / صاحب الخدمة
                </span>
                <p className="text-sm font-bold text-[#1C2521] mt-0.5">
                  {listing.hideContactInfo && !isAdmin && currentUser?.uid !== listing.authorUid
                    ? 'بيانات محمية بناءً على طلب صاحب الحالة'
                    : listing.submittedByName}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-base font-bold text-[#1C2521]">التفاصيل والوصف</h2>
            <p className="text-sm sm:text-base text-[#3F4A44] leading-relaxed whitespace-pre-line">
              {listing.notes || 'لا توجد تفاصيل إضافية مكتوبة.'}
            </p>
          </div>

          {/* Contact Actions Section */}
          <div className="pt-5 border-t border-[#EFE8DC] space-y-4">
            {listing.hideContactInfo && !effectivePhone ? (
              <div className="rounded-2xl bg-[#EDF6F1] border border-[#CBE0D6] p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#1E5248] shrink-0 mt-0.5" />
                <div className="text-sm text-[#1E5248] leading-relaxed">
                  <p className="font-bold">خصوصية بيانات أصحاب الطلبات</p>
                  <p className="mt-0.5 text-xs sm:text-sm text-[#3F4A44]">
                    اختار صاحب الطلب عدم نشر بيانات التواصل الشخصية للعامة. تتم مراجعة الحالة والتنسيق عبر إدارة «بلدنا» لضمان الخصوصية.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {listing.hideContactInfo && (
                  <p className="text-xs font-semibold text-[#9A6324]">
                    بيانات سرية مرئية فقط لصاحب الطلب والإدارة للتنسيق:
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-[#5A655F] block">رقم التواصل</span>
                    <span
                      dir="ltr"
                      className="text-xl font-extrabold text-[#1C2521] tabular-nums tracking-wide"
                    >
                      {effectivePhone}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-bold text-[#3F4A44] hover:bg-[#EFE8DC] inline-flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-[#1E5248]" />
                        <span className="text-[#1E5248]">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ الرقم</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`tel:${effectivePhone.replace(/\s+/g, '')}`}
                    className="min-h-[48px] px-5 py-3 rounded-2xl bg-[#1E5248] text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#163F37] transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span>اتصال مباشر</span>
                  </a>

                  <a
                    href={buildWhatsAppUrl(effectivePhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] px-5 py-3 rounded-2xl border border-[#CBE0D6] bg-[#EDF6F1] text-[#1E5248] text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#DCEEE4] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>تواصل عبر واتساب</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </article>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="إغلاق الصورة"
            className="absolute top-4 left-4 min-h-[44px] min-w-[44px] rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt={listing.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

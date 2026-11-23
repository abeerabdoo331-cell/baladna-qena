import React, { useState } from 'react';
import {
  Check,
  ChevronLeft,
  Copy,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  categoryName?: string;
  subcategoryName?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: string) => void;
  onOpenDetail?: (listing: Listing) => void;
}

export function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('01') && digits.length === 11) {
    return `https://wa.me/2${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export function formatLocationLabel(listing: Listing): string {
  const parts: string[] = [];
  if (listing.centerName) parts.push(`مركز ${listing.centerName}`);
  if (listing.villageName) parts.push(listing.villageName);
  if (listing.area) parts.push(listing.area);
  return parts.join(' · ');
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  categoryName,
  subcategoryName,
  isFavorite = false,
  onToggleFavorite,
  onOpenDetail,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!listing.contactPhone) return;
    try {
      await navigator.clipboard.writeText(listing.contactPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const images = Array.isArray(listing.images) ? listing.images : [];
  const locationText = formatLocationLabel(listing);
  const isPrivateAid = listing.hideContactInfo === true;

  return (
    <article
      onClick={() => onOpenDetail?.(listing)}
      className={`bg-[#FFFDF9] border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors ${
        listing.isFeatured
          ? 'border-[#C79A4B]/60'
          : 'border-[#E4DDD0]'
      } ${onOpenDetail ? 'cursor-pointer hover:border-[#1E5248]/45' : ''}`}
    >
      <div className="space-y-3">
        {/* Top Row: Thumbnail (if any) + Title & Unboxed Metadata + Favorite */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {images.length > 0 && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E4DDD0] bg-[#FAF6F0] shrink-0">
                <img
                  src={images[0]}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              {(listing.isFeatured ||
                listing.status === 'pending' ||
                listing.status === 'rejected') && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold mb-1">
                  {listing.isFeatured && (
                    <span className="text-[#9A5B25]">إعلان مميز</span>
                  )}
                  {listing.status === 'pending' && (
                    <span className="text-[#9A6324]">قيد المراجعة</span>
                  )}
                  {listing.status === 'rejected' && (
                    <span className="text-[#B34338]">مرفوض</span>
                  )}
                </div>
              )}

              <h3 className="text-base sm:text-lg font-bold text-[#1C2521] leading-snug line-clamp-2">
                {listing.title}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-[#5A655F]">
                <span className="font-semibold text-[#1E5248]">
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

              {locationText && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#5A655F]">
                  <MapPin className="w-3.5 h-3.5 text-[#8A7D6B] shrink-0" />
                  <span className="line-clamp-1">{locationText}</span>
                </p>
              )}
            </div>
          </div>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(listing.id);
              }}
              aria-label={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
              className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isFavorite
                  ? 'border-[#C96B5E]/40 bg-[#FBF1EE] text-[#B34338]'
                  : 'border-[#E4DDD0] bg-[#FAF6F0] text-[#7A847E] hover:text-[#1C2521]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {listing.price && (
          <p className="text-sm font-bold text-[#9A5B25] tabular-nums">
            السعر: {listing.price}
          </p>
        )}

        {listing.notes && (
          <p className="text-sm text-[#49534E] leading-relaxed line-clamp-2">
            {listing.notes}
          </p>
        )}
      </div>

      {/* Contact / Detail Footer */}
      <div className="pt-3 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-2">
        {isPrivateAid || !listing.contactPhone ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E5248]">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>البيانات محمية (التنسيق عبر الإدارة)</span>
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${listing.contactPhone.replace(/\s+/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1E5248] text-white hover:bg-[#163F37] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال</span>
            </a>

            <a
              href={buildWhatsAppUrl(listing.contactPhone)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#CBE0D6] bg-[#EDF6F1] text-[#1E5248] hover:bg-[#DCEEE4] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#3F4A44] hover:bg-[#EFE8DC] text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#1E5248]" />
                  <span className="text-[#1E5248]">تم</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>
        )}

        {onOpenDetail && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(listing);
            }}
            className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold text-[#1E5248] hover:bg-[#EDF6F1] inline-flex items-center gap-1 transition-colors whitespace-nowrap mr-auto"
          >
            <span>التفاصيل</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
};

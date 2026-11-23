import React from 'react';
import { ArrowRight, Heart, Home } from 'lucide-react';
import { Listing } from '../types';
import { ListingCard } from './ListingCard';

interface FavoritesViewProps {
  favoriteListings: Listing[];
  categoryNameMap: Record<string, string>;
  onToggleFavorite: (listingId: string) => void;
  onOpenDetail: (listing: Listing) => void;
  onBack: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteListings,
  categoryNameMap,
  onToggleFavorite,
  onOpenDetail,
  onBack,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="العودة للصفحة الرئيسية"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#1C2521] hover:bg-[#EFE8DC] transition-colors shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#FBF1EE] text-[#B34338] flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C2521]">
              الإعلانات والخدمات المحفوظة
            </h2>
            <p className="text-xs sm:text-sm text-[#5A655F] tabular-nums">
              لديك {favoriteListings.length} عناصر في المفضلة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-bold text-[#1E5248] hover:bg-[#EFE8DC] inline-flex items-center gap-1.5"
        >
          <Home className="w-4 h-4" />
          <span>الصفحة الرئيسية</span>
        </button>
      </div>

      {favoriteListings.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] text-[#7A847E] flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#1C2521]">
            قائمة المفضلة فارغة حالياً
          </h3>
          <p className="mt-1.5 text-sm text-[#5A655F] max-w-md mx-auto">
            اضغط على علامة القلب داخل أي إعلان أو خدمة لحفظها والرجوع إليها بسهولة لاحقاً.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#1E5248] text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-[#163F37]"
          >
            <Home className="w-4 h-4" />
            <span>تصفح خدمات قنا</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoriteListings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              categoryName={categoryNameMap[item.categoryId]}
              subcategoryName={
                item.subcategoryId ? categoryNameMap[item.subcategoryId] : undefined
              }
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};

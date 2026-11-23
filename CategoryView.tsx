import React, { useMemo, useState } from 'react';
import { ArrowRight, Home, MapPin, Plus, Search, X } from 'lucide-react';
import { Category, Center, Listing, Village } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { ListingCard } from './ListingCard';

interface CategoryViewProps {
  category: Category;
  subcategories: Category[];
  centers: Center[];
  villages: Village[];
  initialCenterId?: string;
  initialVillageId?: string;
  approvedListings: Listing[];
  myPendingListings: Listing[];
  favoriteIds: Set<string>;
  onToggleFavorite: (listingId: string) => void;
  onOpenDetail: (listing: Listing) => void;
  onBack: () => void;
  onOpenAdd: (categoryId: string, subcategoryId?: string) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  subcategories,
  centers,
  villages,
  initialCenterId = 'all',
  initialVillageId = 'all',
  approvedListings,
  myPendingListings,
  favoriteIds,
  onToggleFavorite,
  onOpenDetail,
  onBack,
  onOpenAdd,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>('all');
  const [selectedCenterId, setSelectedCenterId] = useState<string>(initialCenterId);
  const [selectedVillageId, setSelectedVillageId] = useState<string>(initialVillageId);

  const availableVillages = useMemo(() => {
    if (selectedCenterId === 'all') return [];
    return villages
      .filter((v) => v.centerId === selectedCenterId)
      .sort((a, b) => a.order - b.order);
  }, [villages, selectedCenterId]);

  const subcategoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    subcategories.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [subcategories]);

  const countsBySubcategory = useMemo(() => {
    const counts: Record<string, number> = {};
    approvedListings.forEach((item) => {
      if (item.categoryId === category.id && item.subcategoryId) {
        counts[item.subcategoryId] = (counts[item.subcategoryId] || 0) + 1;
      }
    });
    return counts;
  }, [approvedListings, category.id]);

  const filteredApproved = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return approvedListings.filter((item) => {
      if (item.categoryId !== category.id) return false;
      if (
        activeSubcategoryId !== 'all' &&
        item.subcategoryId !== activeSubcategoryId
      ) {
        return false;
      }
      if (selectedCenterId !== 'all' && item.centerId !== selectedCenterId) {
        return false;
      }
      if (selectedVillageId !== 'all' && item.villageId !== selectedVillageId) {
        return false;
      }
      if (!q) return true;
      return (
        item.serviceType.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.centerName.toLowerCase().includes(q) ||
        item.villageName.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        (item.price || '').toLowerCase().includes(q)
      );
    });
  }, [
    approvedListings,
    category.id,
    activeSubcategoryId,
    selectedCenterId,
    selectedVillageId,
    searchTerm,
  ]);

  const myCategoryPending = useMemo(
    () => myPendingListings.filter((item) => item.categoryId === category.id),
    [myPendingListings, category.id]
  );

  const selectedSubcatForAdd =
    activeSubcategoryId !== 'all' ? activeSubcategoryId : undefined;

  const hasFilters =
    searchTerm.trim() !== '' ||
    selectedCenterId !== 'all' ||
    selectedVillageId !== 'all' ||
    activeSubcategoryId !== 'all';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Category Header */}
      <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="العودة للصفحة الرئيسية"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#1C2521] hover:bg-[#EFE8DC] transition-colors shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <CategoryIcon
              iconKey={category.iconKey}
              className="w-14 h-14 shrink-0"
            />

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C2521] truncate">
                {category.name}
              </h2>
              {category.description && (
                <p className="mt-0.5 text-xs sm:text-sm text-[#5A655F] line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[46px] px-4 py-2.5 rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#1C2521] text-sm font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#EFE8DC] transition-colors whitespace-nowrap"
            >
              <Home className="w-4 h-4 text-[#1E5248]" />
              <span>الرئيسية</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAdd(category.id, selectedSubcatForAdd)}
              className="flex-1 sm:flex-initial min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#1E5248] text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#163F37] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>أضف في {category.name}</span>
            </button>
          </div>
        </div>

        {/* Search & Qena Center/Village Filter inside Category */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#7A847E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`ابحث في ${category.name}...`}
              className="w-full min-h-[46px] rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] pr-10 pl-10 py-2.5 text-sm text-[#1C2521] placeholder:text-[#8E9691] focus:outline-none focus:border-[#1E5248]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="مسح البحث"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-[#5A655F] hover:text-[#1C2521]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-3 relative">
            <MapPin className="w-4 h-4 text-[#1E5248] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="اختر المركز"
              value={selectedCenterId}
              onChange={(e) => {
                setSelectedCenterId(e.target.value);
                setSelectedVillageId('all');
              }}
              className="w-full min-h-[46px] rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] pr-9 pl-3 py-2 text-sm font-semibold text-[#1C2521] focus:outline-none focus:border-[#1E5248]"
            >
              <option value="all">كل مراكز قنا</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  مركز {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="اختر القرية أو المدينة"
              value={selectedVillageId}
              disabled={selectedCenterId === 'all' || availableVillages.length === 0}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="w-full min-h-[46px] rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 py-2 text-sm font-semibold text-[#1C2521] disabled:opacity-55 focus:outline-none focus:border-[#1E5248]"
            >
              <option value="all">
                {selectedCenterId === 'all' ? 'اختر المركز أولاً' : 'كل قرى المركز'}
              </option>
              {availableVillages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Admin-managed Internal Subcategories inside this Main Category */}
      {subcategories.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#49534E] px-1">
            التخصصات والأقسام الفرعية في {category.name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setActiveSubcategoryId('all')}
              className={`min-h-[56px] rounded-2xl border p-3 text-right transition-colors flex flex-col justify-center ${
                activeSubcategoryId === 'all'
                  ? 'border-[#1E5248] bg-[#E8F1EE] text-[#1E5248]'
                  : 'border-[#E4DDD0] bg-[#FFFDF9] text-[#1C2521] hover:bg-[#FAF6F0]'
              }`}
            >
              <span className="text-sm font-bold">عرض الكل</span>
              <span className="text-xs opacity-75 tabular-nums">
                {
                  approvedListings.filter((l) => l.categoryId === category.id)
                    .length
                }{' '}
                إعلان
              </span>
            </button>

            {subcategories.map((sub) => {
              const isSelected = activeSubcategoryId === sub.id;
              const subCount = countsBySubcategory[sub.id] || 0;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSubcategoryId(sub.id)}
                  className={`min-h-[56px] rounded-2xl border p-3 text-right transition-colors flex items-center gap-2.5 ${
                    isSelected
                      ? 'border-[#1E5248] bg-[#E8F1EE] text-[#1E5248]'
                      : 'border-[#E4DDD0] bg-[#FFFDF9] text-[#1C2521] hover:bg-[#FAF6F0]'
                  }`}
                >
                  <CategoryIcon iconKey={sub.iconKey} className="w-9 h-9 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-sm font-bold truncate">
                      {sub.name}
                    </span>
                    <span className="block text-xs opacity-75 tabular-nums">
                      {subCount} {subCount === 1 ? 'إعلان' : 'إعلانات'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* My Pending Submissions in this Category */}
      {myCategoryPending.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-[#9A6324]">
              إعلاناتك قيد مراجعة الإدارة ({myCategoryPending.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCategoryPending.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                subcategoryName={subcategoryNameMap[item.subcategoryId]}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        </section>
      )}

      {/* Approved Listings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[#49534E]">
            {activeSubcategoryId !== 'all'
              ? `إعلانات "${subcategoryNameMap[activeSubcategoryId] || ''}"`
              : `نتائج ${category.name}`}{' '}
            · <span className="tabular-nums">{filteredApproved.length}</span>
          </h3>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActiveSubcategoryId('all');
                setSelectedCenterId('all');
                setSelectedVillageId('all');
              }}
              className="text-xs font-bold text-[#1E5248] hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        {filteredApproved.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-8 sm:p-12 text-center">
            <div className="flex justify-center mb-3 opacity-85">
              <CategoryIcon iconKey={category.iconKey} className="w-16 h-16" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-[#1C2521]">
              {hasFilters
                ? 'لا توجد نتائج مطابقة لخيارات البحث أو المنطقة المحددة'
                : `لا توجد إضافات في "${category.name}" بعد`}
            </h4>
            <p className="mt-1.5 text-sm text-[#5A655F] max-w-md mx-auto leading-relaxed">
              {hasFilters
                ? 'جرب اختيار كل مراكز قنا أو تغيير كلمات البحث لعرض المزيد من النتائج.'
                : 'يمكن لأي مقدم خدمة أو معلن إضافة التفاصيل والصور الآن، وستظهر بعد موافقة الإدارة.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSubcategoryId('all');
                    setSelectedCenterId('all');
                    setSelectedVillageId('all');
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] text-sm font-bold text-[#1C2521] hover:bg-[#EFE8DC]"
                >
                  عرض كل نتائج القسم في قنا
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenAdd(category.id, selectedSubcatForAdd)}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#1E5248] text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-[#163F37] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>أضف أول إعلان هنا</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApproved.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                subcategoryName={subcategoryNameMap[item.subcategoryId]}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { signInWithPopup, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { CheckCircle2, ImagePlus, Loader2, Lock, Trash2, X } from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  BLUEPRINT_CONSTRAINTS,
  Category,
  Center,
  GOVERNORATE_NAME,
  ListingKind,
  UserProfile,
  Village,
} from '../types';
import { compressImageFile } from '../utils/imageCompress';

interface AddListingModalProps {
  mainCategories: Category[];
  subcategoriesByParent: Record<string, Category[]>;
  centers: Center[];
  villages: Village[];
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
  defaultCenterId?: string;
  defaultVillageId?: string;
  userName: string;
  userPhone: string;
  currentUser: User | null;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: (status: 'pending' | 'approved') => void;
}

function inferListingKind(categoryId: string): ListingKind {
  if (categoryId === 'qena-jobs' || categoryId === 'jobs') return 'job';
  if (categoryId === 'qena-aid') return 'aid';
  if (categoryId === 'qena-market' || categoryId === 'ads' || categoryId === 'hegaza-market') {
    return 'ad';
  }
  return 'service';
}

export const AddListingModal: React.FC<AddListingModalProps> = ({
  mainCategories,
  subcategoriesByParent,
  centers,
  villages,
  defaultCategoryId,
  defaultSubcategoryId,
  defaultCenterId,
  defaultVillageId,
  userName,
  userPhone,
  currentUser,
  isAdmin,
  onClose,
  onSuccess,
}) => {
  const initialCatId = defaultCategoryId || mainCategories[0]?.id || 'qena-market';
  const [categoryId, setCategoryId] = useState(initialCatId);
  const [subcategoryId, setSubcategoryId] = useState(defaultSubcategoryId || '');
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [centerId, setCenterId] = useState(
    defaultCenterId && defaultCenterId !== 'all'
      ? defaultCenterId
      : centers[0]?.id || 'qena'
  );
  const [villageId, setVillageId] = useState(
    defaultVillageId && defaultVillageId !== 'all' ? defaultVillageId : ''
  );
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState(userPhone || '');
  const [ownerName, setOwnerName] = useState(userName || '');
  const [hideContactInfo, setHideContactInfo] = useState(
    initialCatId === 'qena-aid'
  );
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [processingImages, setProcessingImages] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(isAdmin);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const availableSubcategories = useMemo(
    () => subcategoriesByParent[categoryId] || [],
    [subcategoriesByParent, categoryId]
  );

  const availableVillages = useMemo(
    () =>
      villages
        .filter((v) => v.centerId === centerId)
        .sort((a, b) => a.order - b.order),
    [villages, centerId]
  );

  const isAid = categoryId === 'qena-aid';
  const isMarket = categoryId === 'qena-market';
  const isJobs = categoryId === 'qena-jobs';

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setSubcategoryId('');
    setHideContactInfo(newCatId === 'qena-aid');
  };

  const handleCenterChange = (newCenterId: string) => {
    setCenterId(newCenterId);
    setVillageId('');
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = BLUEPRINT_CONSTRAINTS.listing.maxImages - images.length;
    if (remainingSlots <= 0) {
      setError('الحد الأقصى للصور المرفقة هو ٣ صور');
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    setProcessingImages(true);
    setError('');
    try {
      const compressed = await Promise.all(
        toProcess.map((file) => compressImageFile(file))
      );
      setImages((prev) =>
        [...prev, ...compressed].slice(0, BLUEPRINT_CONSTRAINTS.listing.maxImages)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تجهيز الصورة، يرجى اختيار صورة أخرى.'
      );
    } finally {
      setProcessingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validate = (): string | null => {
    const t = title.trim();
    const s = serviceType.trim();
    const p = contactPhone.trim();
    const o = ownerName.trim();
    const pr = price.trim();
    const a = area.trim();
    const n = notes.trim();

    if (
      t.length < BLUEPRINT_CONSTRAINTS.listing.titleMinLength ||
      t.length > BLUEPRINT_CONSTRAINTS.listing.titleMaxLength
    ) {
      return 'يرجى كتابة عنوان الإعلان بشكل صحيح (من حرفين إلى ٨٠ حرفاً)';
    }
    if (
      s.length < BLUEPRINT_CONSTRAINTS.listing.serviceTypeMinLength ||
      s.length > BLUEPRINT_CONSTRAINTS.listing.serviceTypeMaxLength
    ) {
      return 'يرجى تحديد نوع الخدمة أو التصنيف (من حرفين إلى ٨٠ حرفاً)';
    }
    if (!centerId) {
      return 'يرجى اختيار المركز داخل محافظة قنا';
    }
    if (
      o.length < BLUEPRINT_CONSTRAINTS.listing.submittedByNameMinLength ||
      o.length > BLUEPRINT_CONSTRAINTS.listing.submittedByNameMaxLength
    ) {
      return 'يرجى كتابة اسم صاحب الإعلان (من حرفين إلى ٦٠ حرفاً)';
    }
    if (!BLUEPRINT_CONSTRAINTS.listing.phonePattern.test(p)) {
      return 'يرجى إدخال رقم هاتف أو واتساب صحيح للتواصل';
    }
    if (pr.length > BLUEPRINT_CONSTRAINTS.listing.priceMaxLength) {
      return 'نص السعر يجب ألا يتجاوز ٦٠ حرفاً';
    }
    if (a.length > BLUEPRINT_CONSTRAINTS.listing.areaMaxLength) {
      return 'وصف العنوان التفصيلي يجب ألا يتجاوز ٨٠ حرفاً';
    }
    if (n.length > BLUEPRINT_CONSTRAINTS.listing.notesMaxLength) {
      return 'الوصف يجب ألا يتجاوز ٦٠٠ حرف';
    }
    if (!categoryId) {
      return 'يرجى اختيار القسم المناسب';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      let activeUser = currentUser || auth.currentUser;
      if (!activeUser) {
        const result = await signInWithPopup(auth, googleProvider);
        activeUser = result.user;
      }

      const selectedCenter = centers.find((c) => c.id === centerId);
      const selectedVillage = availableVillages.find((v) => v.id === villageId);
      const cleanedOwner = ownerName
        .trim()
        .slice(0, BLUEPRINT_CONSTRAINTS.listing.submittedByNameMaxLength);
      const cleanedPhone = contactPhone
        .trim()
        .slice(0, BLUEPRINT_CONSTRAINTS.listing.phoneMaxLength);

      // Sync or check user profile for block status
      if (!isAdmin) {
        const userRef = doc(db, 'users', activeUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = userSnap.data() as Partial<UserProfile>;
          if (profile.isBlocked) {
            setError('هذا الحساب موقوف حالياً من الإدارة ولا يمكنه نشر إعلانات جديدة.');
            setSubmitting(false);
            return;
          }
          await updateDoc(userRef, {
            displayName: cleanedOwner,
            phone: cleanedPhone,
            email: (activeUser.email || '').slice(0, 120),
            centerId: selectedCenter?.id || '',
            villageId: selectedVillage?.id || '',
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(userRef, {
            uid: activeUser.uid,
            displayName: cleanedOwner,
            phone: cleanedPhone,
            email: (activeUser.email || '').slice(0, 120),
            centerId: selectedCenter?.id || '',
            villageId: selectedVillage?.id || '',
            favorites: [],
            isBlocked: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      const targetStatus: 'pending' | 'approved' =
        isAdmin && publishImmediately ? 'approved' : 'pending';

      const newRef = doc(collection(db, 'listings'));
      const validSubcat = availableSubcategories.some(
        (sub) => sub.id === subcategoryId
      )
        ? subcategoryId
        : '';

      const shouldHidePhone = isAid && hideContactInfo;

      const payload = {
        title: title.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.titleMaxLength),
        serviceType: serviceType
          .trim()
          .slice(0, BLUEPRINT_CONSTRAINTS.listing.serviceTypeMaxLength),
        listingKind: inferListingKind(categoryId),
        contactPhone: shouldHidePhone ? '' : cleanedPhone,
        hideContactInfo: shouldHidePhone,
        centerId: selectedCenter?.id || '',
        centerName: (selectedCenter?.name || '').slice(0, 60),
        villageId: selectedVillage?.id || '',
        villageName: (selectedVillage?.name || '').slice(0, 60),
        area: area.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.areaMaxLength),
        notes: notes.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.notesMaxLength),
        price: price.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.priceMaxLength),
        images,
        categoryId,
        subcategoryId: validSubcat,
        submittedByName: cleanedOwner,
        authorUid: activeUser.uid,
        status: targetStatus,
        isFeatured: isAdmin ? isFeatured : false,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(newRef, payload);
        if (shouldHidePhone) {
          await setDoc(doc(db, 'aid_contacts', newRef.id), {
            listingId: newRef.id,
            authorUid: activeUser.uid,
            contactPhone: cleanedPhone,
            requesterName: cleanedOwner,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `listings/${newRef.id}`);
      }

      onSuccess(targetStatus);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request')
      ) {
        setError(
          'تم إلغاء تأكيد الحساب. يرجى إتمام الدخول بحساب جوجل لإرسال الإعلان.'
        );
      } else {
        setError('تعذر إرسال البيانات حالياً، يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-listing-title"
    >
      <div className="w-full sm:max-w-xl bg-[#FFFDF9] border border-[#E4DDD0] rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-xl">
        <div className="sm:hidden pt-3 pb-1">
          <div className="w-10 h-1.5 bg-[#D8CFC0] rounded-full mx-auto" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFE8DC]">
          <div>
            <h2 id="add-listing-title" className="text-lg font-bold text-[#1C2521]">
              {isAdmin ? 'إضافة إعلان أو خدمة جديدة' : 'إرسال إعلان أو خدمة'}
            </h2>
            <p className="text-xs text-[#5A655F]">{GOVERNORATE_NAME} (مراجعة الإدارة قبل النشر)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#5A655F] hover:bg-[#F4EFE6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          {/* Category & Subcategory */}
          <div className={availableSubcategories.length > 0 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}>
            <div>
              <label
                htmlFor="listing-category"
                className="block text-sm font-semibold text-[#2A332E] mb-1.5"
              >
                القسم *
              </label>
              <select
                id="listing-category"
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full min-h-[46px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521] focus:outline-none focus:border-[#1E5248]"
              >
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {availableSubcategories.length > 0 && (
              <div>
                <label
                  htmlFor="listing-subcategory"
                  className="block text-sm font-semibold text-[#2A332E] mb-1.5"
                >
                  القسم الفرعي (اختياري)
                </label>
                <select
                  id="listing-subcategory"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full min-h-[46px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521] focus:outline-none focus:border-[#1E5248]"
                >
                  <option value="">عام داخل القسم</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Ad Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="listing-title"
                className="block text-sm font-semibold text-[#2A332E] mb-1.5"
              >
                عنوان الإعلان *
              </label>
              <input
                id="listing-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isMarket
                    ? 'مثال: غسالة بحالة ممتازة للبيع'
                    : isJobs
                    ? 'مثال: مطلوب محاسب لشركة بقنا'
                    : isAid
                    ? 'مثال: مبادرة توفير بطاطين / طلب مساعدة'
                    : 'مثال: د. ... / ورشة ... / سيارة توصيل'
                }
                maxLength={BLUEPRINT_CONSTRAINTS.listing.titleMaxLength}
                className="w-full min-h-[46px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521] placeholder:text-[#8E9691] focus:outline-none focus:border-[#1E5248]"
              />
            </div>

            <div>
              <label
                htmlFor="listing-service-type"
                className="block text-sm font-semibold text-[#2A332E] mb-1.5"
              >
                التخصص / النوع *
              </label>
              <input
                id="listing-service-type"
                type="text"
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder={
                  isMarket
                    ? 'مثال: أجهزة منزلية / مستعمل / جديد'
                    : isJobs
                    ? 'مثال: فرصة عمل / باحث عن عمل'
                    : isAid
                    ? 'مثال: مبادرة خيرية / تطوع / مساعدة'
                    : 'مثال: باطنة، سباكة، توصيل قوص - قنا'
                }
                maxLength={BLUEPRINT_CONSTRAINTS.listing.serviceTypeMaxLength}
                className="w-full min-h-[46px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521] placeholder:text-[#8E9691] focus:outline-none focus:border-[#1E5248]"
              />
            </div>
          </div>

          {/* Geographic Selection: Governorate (Fixed Qena) -> Center -> Village */}
          <div className="rounded-2xl bg-[#FAF6F0] border border-[#E4DDD0] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E5248]">
                الموقع الجغرافي
              </span>
              <span className="text-xs font-bold text-[#5A655F]">
                المحافظة: {GOVERNORATE_NAME} (ثابتة)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="listing-center"
                  className="block text-xs font-semibold text-[#2A332E] mb-1"
                >
                  المركز *
                </label>
                <select
                  id="listing-center"
                  value={centerId}
                  onChange={(e) => handleCenterChange(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] px-3 text-sm text-[#1C2521]"
                >
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      مركز {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="listing-village"
                  className="block text-xs font-semibold text-[#2A332E] mb-1"
                >
                  القرية أو المدينة
                </label>
                <select
                  id="listing-village"
                  value={villageId}
                  onChange={(e) => setVillageId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] px-3 text-sm text-[#1C2521]"
                >
                  <option value="">عام داخل المركز</option>
                  {availableVillages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="listing-area"
                className="block text-xs font-semibold text-[#2A332E] mb-1"
              >
                تفاصيل العنوان أو أقرب معلم (اختياري)
              </label>
              <input
                id="listing-area"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="مثال: شارع المحطة / بجوار الوحدة الصحية"
                maxLength={BLUEPRINT_CONSTRAINTS.listing.areaMaxLength}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] px-3 text-sm text-[#1C2521] placeholder:text-[#8E9691]"
              />
            </div>
          </div>

          {/* Owner Name, Phone/WhatsApp, Optional Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="listing-owner"
                className="block text-sm font-semibold text-[#2A332E] mb-1.5"
              >
                اسم صاحب الإعلان *
              </label>
              <input
                id="listing-owner"
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="الاسم الكامل"
                maxLength={BLUEPRINT_CONSTRAINTS.listing.submittedByNameMaxLength}
                className="w-full min-h-[46px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521]"
              />
            </div>

            <div>
              <label
                htmlFor="listing-phone"
                className="block text-sm font-semibold text-[#2A332E] mb-1.5"
              >
                رقم الهاتف أو واتساب *
              </label>
              <input
                id="listing-phone"
                type="tel"
                dir="ltr"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={BLUEPRINT_CONSTRAINTS.listing.phoneMaxLength}
                className="w-full min-h-[46px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521] text-right tabular-nums"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="listing-price"
              className="block text-sm font-semibold text-[#2A332E] mb-1.5"
            >
              السعر عند الحاجة (اختياري)
            </label>
            <input
              id="listing-price"
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="اتركه فارغاً إذا لم يوجد سعر محدد"
              maxLength={BLUEPRINT_CONSTRAINTS.listing.priceMaxLength}
              className="w-full min-h-[46px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521] placeholder:text-[#8E9691]"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="listing-notes"
              className="block text-sm font-semibold text-[#2A332E] mb-1.5"
            >
              وصف الإعلان والتفاصيل *
            </label>
            <textarea
              id="listing-notes"
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب كافة التفاصيل والمواصفات ومواعيد التواصل المناسبة..."
              maxLength={BLUEPRINT_CONSTRAINTS.listing.notesMaxLength}
              className="w-full rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1C2521] placeholder:text-[#8E9691] focus:outline-none focus:border-[#1E5248]"
            />
          </div>

          {/* Aid Privacy Control */}
          {isAid && (
            <div className="rounded-2xl bg-[#EDF6F1] border border-[#CBE0D6] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E5248]">
                <Lock className="w-4 h-4 shrink-0" />
                <span>حماية خصوصية أصحاب طلبات المساعدة</span>
              </div>
              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1C2521] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideContactInfo}
                  onChange={(e) => setHideContactInfo(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#1E5248] rounded"
                />
                <span>
                  إخفاء رقم هاتفي واسمي عن العامة (يظهر فقط لإدارة التطبيق للتنسيق بسرية)
                </span>
              </label>
            </div>
          )}

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-[#2A332E]">
                الصور (اختياري · حتى ٣ صور)
              </span>
              <span className="text-xs text-[#7A847E] tabular-nums">
                {images.length}/{BLUEPRINT_CONSTRAINTS.listing.maxImages}
              </span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                {images.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-4/3 rounded-xl overflow-hidden border border-[#DDD4C5] bg-[#FAF6F0]"
                  >
                    <img
                      src={src}
                      alt={`صورة مرفقة ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      aria-label="حذف الصورة"
                      className="absolute top-1 left-1 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-[#B34338]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < BLUEPRINT_CONSTRAINTS.listing.maxImages && (
              <label className="min-h-[46px] w-full rounded-xl border border-dashed border-[#C7BDAE] bg-[#FAF6F0] hover:bg-[#F1EAE0] px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-[#1E5248] cursor-pointer transition-colors">
                {processingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تجهيز الصور...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4" />
                    <span>اختر صور من الهاتف (يتم ضغطها تلقائياً)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={processingImages}
                  onChange={handleFilesChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {isAdmin ? (
            <div className="rounded-xl bg-[#FAF6F0] border border-[#E4DDD0] p-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs sm:text-sm text-[#1E5248] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="w-4 h-4 accent-[#1E5248]"
                />
                <span>نشر مباشر دون انتظار</span>
              </label>
              <label className="flex items-center gap-2 text-xs sm:text-sm text-[#9A5B25] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#9A5B25]"
                />
                <span>تمييز الإعلان في الرئيسية</span>
              </label>
            </div>
          ) : (
            <div className="rounded-xl bg-[#F4EFE6] px-3.5 py-2.5 text-xs text-[#5A655F] leading-relaxed">
              لن يظهر الإعلان للعامة إلا بعد مراجعة الإدارة والموافقة عليه.
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs font-semibold text-[#B34338]">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-sm font-semibold text-[#3F4A44] hover:bg-[#EFE8DC] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || processingImages}
              className="flex-1 min-h-[48px] rounded-xl bg-[#1E5248] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#163F37] disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {currentUser ? 'إرسال الإعلان' : 'تأكيد بحساب جوجل وإرسال'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

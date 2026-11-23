import React, { useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  ArrowRight,
  Ban,
  Check,
  Edit3,
  FolderPlus,
  Loader2,
  LogOut,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { DEFAULT_QENA_CENTERS, DEFAULT_QENA_VILLAGES } from '../data/qenaLocations';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  ADMIN_EMAIL,
  Announcement,
  AppUpdate,
  BLUEPRINT_CONSTRAINTS,
  Category,
  Center,
  IconKey,
  Listing,
  UserProfile,
  Village,
} from '../types';
import { AdminLocationsTab } from './AdminLocationsTab';
import { AdminNewsTab, AdminUsersTab } from './AdminUsersNewsTab';
import { CategoryIcon } from './CategoryIcon';
import { PWAInstallButton } from './PWAInstallButton';

interface AdminDashboardProps {
  currentUser: User | null;
  isAdmin: boolean;
  categories: Category[];
  centers: Center[];
  villages: Village[];
  onBack: () => void;
  onOpenAddListing: () => void;
}

type AdminTab =
  | 'pending'
  | 'listings'
  | 'categories'
  | 'locations'
  | 'users'
  | 'news'
  | 'apk';

const ICON_OPTIONS: { key: IconKey; label: string }[] = [
  { key: 'market', label: 'السوق والبيع والشراء' },
  { key: 'health', label: 'الصحة والأطباء' },
  { key: 'services', label: 'الخدمات والحرف' },
  { key: 'jobs', label: 'الوظائف وفرص العمل' },
  { key: 'transport', label: 'المواصلات والسائقين' },
  { key: 'aid', label: 'المساعدات والمبادرات' },
  { key: 'medical', label: 'طبي وصيدليات' },
  { key: 'education', label: 'تعليم ومدرسين' },
  { key: 'crafts', label: 'حرف وصنايعية' },
  { key: 'shop', label: 'محلات تجارية' },
  { key: 'home', label: 'مشروعات منزلية' },
  { key: 'ads', label: 'إعلانات' },
  { key: 'delivery', label: 'ديلفري ومشتريات' },
  { key: 'general', label: 'قسم عام' },
];

function normalizeListingDoc(id: string, raw: Partial<Listing>): Listing {
  return {
    ...(raw as Omit<Listing, 'id'>),
    id,
    listingKind: raw.listingKind ?? 'service',
    hideContactInfo: raw.hideContactInfo ?? false,
    centerId: raw.centerId ?? '',
    centerName: raw.centerName ?? '',
    villageId: raw.villageId ?? '',
    villageName: raw.villageName ?? '',
    price: raw.price ?? '',
    images: Array.isArray(raw.images) ? raw.images : [],
    subcategoryId: raw.subcategoryId ?? '',
    isFeatured: raw.isFeatured ?? false,
    isActive: raw.isActive ?? true,
  };
}

function buildCompatibilityFields(item: Listing) {
  return {
    listingKind: item.listingKind ?? 'service',
    hideContactInfo: item.hideContactInfo ?? false,
    centerId: item.centerId ?? '',
    centerName: item.centerName ?? '',
    villageId: item.villageId ?? '',
    villageName: item.villageName ?? '',
    price: item.price ?? '',
    images: Array.isArray(item.images) ? item.images : [],
    subcategoryId: item.subcategoryId ?? '',
    isFeatured: item.isFeatured ?? false,
    isActive: item.isActive ?? true,
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  isAdmin,
  categories,
  centers,
  villages,
  onBack,
  onOpenAddListing,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>(categories);
  const [allCenters, setAllCenters] = useState<Center[]>(centers);
  const [allVillages, setAllVillages] = useState<Village[]>(villages);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [allUpdates, setAllUpdates] = useState<AppUpdate[]>([]);
  const [privatePhonesMap, setPrivatePhonesMap] = useState<Record<string, string>>({});

  const [loadingData, setLoadingData] = useState(false);
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'paused' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [centerFilter, setCenterFilter] = useState<string>('all');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);
  const [confirmDeleteUpdateId, setConfirmDeleteUpdateId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Listing edit state
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  // Category / Subcategory modal state
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catParentId, setCatParentId] = useState('');
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIconKey, setCatIconKey] = useState<IconKey>('general');
  const [catColor, setCatColor] = useState('#1E5248');
  const [catOrder, setCatOrder] = useState(7);
  const [catActive, setCatActive] = useState(true);
  const [catError, setCatError] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // APK Update publish state
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<AppUpdate | null>(null);
  const [updVersionName, setUpdVersionName] = useState('');
  const [updVersionCode, setUpdVersionCode] = useState(3);
  const [updNotes, setUpdNotes] = useState('');
  const [updApkUrl, setUpdApkUrl] = useState('');
  const [updActive, setUpdActive] = useState(true);
  const [updError, setUpdError] = useState('');
  const [savingUpd, setSavingUpd] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingData(true);

    const unsubListings = onSnapshot(
      query(collection(db, 'listings'), orderBy('createdAt', 'desc')),
      (snap) => {
        const docs = snap.docs.map((d) =>
          normalizeListingDoc(d.id, d.data() as Partial<Listing>)
        );
        setAllListings(docs);
        setLoadingData(false);
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'listings');
      }
    );

    const unsubCats = onSnapshot(
      query(collection(db, 'categories'), orderBy('order', 'asc')),
      async (snap) => {
        if (snap.empty) {
          try {
            await Promise.all(
              DEFAULT_CATEGORIES.map((cat) =>
                setDoc(doc(db, 'categories', cat.id), {
                  ...cat,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              )
            );
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'categories');
          }
          return;
        }
        setAllCategories(
          snap.docs.map((d) => {
            const raw = d.data() as Partial<Category>;
            return {
              ...(raw as Omit<Category, 'id'>),
              id: d.id,
              parentId: raw.parentId ?? '',
            };
          })
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'categories')
    );

    const unsubCenters = onSnapshot(
      query(collection(db, 'centers'), orderBy('order', 'asc')),
      async (snap) => {
        if (snap.empty) {
          try {
            await Promise.all(
              DEFAULT_QENA_CENTERS.map((c) =>
                setDoc(doc(db, 'centers', c.id), {
                  ...c,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              )
            );
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'centers');
          }
          return;
        }
        setAllCenters(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<Center, 'id'>),
            id: d.id,
          }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'centers')
    );

    const unsubVillages = onSnapshot(
      query(collection(db, 'villages'), orderBy('order', 'asc')),
      async (snap) => {
        if (snap.empty) {
          try {
            await Promise.all(
              DEFAULT_QENA_VILLAGES.map((v) =>
                setDoc(doc(db, 'villages', v.id), {
                  ...v,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              )
            );
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'villages');
          }
          return;
        }
        setAllVillages(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<Village, 'id'>),
            id: d.id,
          }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'villages')
    );

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAllUsers(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<UserProfile, 'uid'>),
            uid: d.id,
          }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAllAnnouncements(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<Announcement, 'id'>),
            id: d.id,
          }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'announcements')
    );

    const unsubUpdates = onSnapshot(
      query(collection(db, 'app_updates'), orderBy('versionCode', 'desc')),
      (snap) => {
        setAllUpdates(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AppUpdate, 'id'>),
          }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'app_updates')
    );

    return () => {
      unsubListings();
      unsubCats();
      unsubCenters();
      unsubVillages();
      unsubUsers();
      unsubAnnouncements();
      unsubUpdates();
    };
  }, [isAdmin]);

  // Load private aid contact numbers on demand for pending/approved private aid entries
  const loadPrivatePhone = async (listingId: string) => {
    if (privatePhonesMap[listingId]) return;
    try {
      const snap = await getDoc(doc(db, 'aid_contacts', listingId));
      if (snap.exists()) {
        const data = snap.data() as { contactPhone?: string };
        setPrivatePhonesMap((prev) => ({
          ...prev,
          [listingId]: data.contactPhone || 'غير مسجل',
        }));
      }
    } catch {
      // Ignore if missing
    }
  };

  const mainCategories = useMemo(
    () =>
      allCategories
        .filter((c) => !c.parentId)
        .sort((a, b) => a.order - b.order),
    [allCategories]
  );

  const subcategoriesByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};
    allCategories
      .filter((c) => !!c.parentId)
      .sort((a, b) => a.order - b.order)
      .forEach((sub) => {
        if (!map[sub.parentId]) map[sub.parentId] = [];
        map[sub.parentId].push(sub);
      });
    return map;
  }, [allCategories]);

  const missingDefaultsCount = useMemo(() => {
    const existingIds = new Set(allCategories.map((c) => c.id));
    return DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id)).length;
  }, [allCategories]);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    allCategories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [allCategories]);

  const pendingListings = useMemo(
    () => allListings.filter((l) => l.status === 'pending'),
    [allListings]
  );

  const managedListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allListings.filter((l) => {
      if (statusFilter === 'approved' && (l.status !== 'approved' || !l.isActive)) return false;
      if (statusFilter === 'paused' && l.isActive) return false;
      if (statusFilter === 'rejected' && l.status !== 'rejected') return false;
      if (categoryFilter !== 'all' && l.categoryId !== categoryFilter) return false;
      if (centerFilter !== 'all' && l.centerId !== centerFilter) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.serviceType.toLowerCase().includes(q) ||
        l.contactPhone.toLowerCase().includes(q) ||
        l.centerName.toLowerCase().includes(q) ||
        l.villageName.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q)
      );
    });
  }, [allListings, statusFilter, categoryFilter, centerFilter, searchQuery]);

  const handleAdminSignIn = async () => {
    setAuthError('');
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setAuthError('تعذر تسجيل الدخول بحساب جوجل، يرجى المحاولة مرة أخرى.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleApprove = async (listing: Listing) => {
    setBusyId(listing.id);
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        ...buildCompatibilityFields(listing),
        status: 'approved',
        isActive: true,
        updatedAt: serverTimestamp(),
      });
      setStatusMessage(`تمت الموافقة على "${listing.title}" ونشره`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${listing.id}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (listing: Listing) => {
    setBusyId(listing.id);
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        ...buildCompatibilityFields(listing),
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
      setStatusMessage(`تم رفض "${listing.title}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${listing.id}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (listing: Listing) => {
    setBusyId(listing.id);
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        ...buildCompatibilityFields(listing),
        isFeatured: !listing.isFeatured,
        updatedAt: serverTimestamp(),
      });
      setStatusMessage(
        !listing.isFeatured
          ? `تم تمييز إعلان "${listing.title}" ليظهر في الرئيسية`
          : `تم إلغاء تمييز "${listing.title}"`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${listing.id}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (listing: Listing) => {
    setBusyId(listing.id);
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        ...buildCompatibilityFields(listing),
        isActive: !listing.isActive,
        updatedAt: serverTimestamp(),
      });
      setStatusMessage(
        !listing.isActive
          ? `تم تفعيل إعلان "${listing.title}"`
          : `تم إيقاف إعلان "${listing.title}" مؤقتاً`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${listing.id}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setBusyId(listingId);
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      setConfirmDeleteId(null);
      setStatusMessage('تم حذف الإعلان بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `listings/${listingId}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEditedListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setBusyId(editingListing.id);
    const chosenCenter = allCenters.find((c) => c.id === editingListing.centerId);
    const chosenVillage = allVillages.find((v) => v.id === editingListing.villageId);
    try {
      await updateDoc(doc(db, 'listings', editingListing.id), {
        title: editingListing.title.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.titleMaxLength),
        serviceType: editingListing.serviceType.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.serviceTypeMaxLength),
        listingKind: editingListing.listingKind || 'service',
        contactPhone: editingListing.hideContactInfo
          ? ''
          : editingListing.contactPhone.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.phoneMaxLength),
        hideContactInfo: editingListing.hideContactInfo ?? false,
        centerId: editingListing.centerId || '',
        centerName: chosenCenter?.name || editingListing.centerName || '',
        villageId: editingListing.villageId || '',
        villageName: chosenVillage?.name || editingListing.villageName || '',
        area: editingListing.area.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.areaMaxLength),
        notes: editingListing.notes.trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.notesMaxLength),
        price: (editingListing.price || '').trim().slice(0, BLUEPRINT_CONSTRAINTS.listing.priceMaxLength),
        images: Array.isArray(editingListing.images)
          ? editingListing.images.slice(0, BLUEPRINT_CONSTRAINTS.listing.maxImages)
          : [],
        categoryId: editingListing.categoryId,
        subcategoryId: editingListing.subcategoryId || '',
        submittedByName: editingListing.submittedByName.trim().slice(0, 60),
        status: editingListing.status,
        isFeatured: editingListing.isFeatured ?? false,
        isActive: editingListing.isActive ?? true,
        updatedAt: serverTimestamp(),
      });
      setEditingListing(null);
      setStatusMessage('تم تحديث بيانات الإعلان بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${editingListing.id}`);
    } finally {
      setBusyId(null);
    }
  };

  // Category CRUD handlers
  const openNewCategoryForm = (parentId = '') => {
    const parentCat = mainCategories.find((c) => c.id === parentId);
    const siblingCount = parentId
      ? (subcategoriesByParent[parentId] || []).length
      : mainCategories.length;
    setEditingCategory(null);
    setCatParentId(parentId);
    setCatName('');
    setCatDescription('');
    setCatIconKey(parentCat ? parentCat.iconKey : 'general');
    setCatColor(parentCat ? parentCat.accentColor : '#1E5248');
    setCatOrder(siblingCount + 1);
    setCatActive(true);
    setCatError('');
    setCategoryFormOpen(true);
  };

  const openEditCategoryForm = (cat: Category) => {
    setEditingCategory(cat);
    setCatParentId(cat.parentId || '');
    setCatName(cat.name);
    setCatDescription(cat.description);
    setCatIconKey(cat.iconKey);
    setCatColor(cat.accentColor);
    setCatOrder(cat.order);
    setCatActive(cat.isActive);
    setCatError('');
    setCategoryFormOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = catName.trim();
    const cleanedDesc = catDescription.trim();
    if (
      cleanedName.length < BLUEPRINT_CONSTRAINTS.category.nameMinLength ||
      cleanedName.length > BLUEPRINT_CONSTRAINTS.category.nameMaxLength
    ) {
      setCatError('اسم القسم يجب أن يكون بين حرفين و٦٠ حرفاً');
      return;
    }
    if (cleanedDesc.length > BLUEPRINT_CONSTRAINTS.category.descriptionMaxLength) {
      setCatError('وصف القسم يجب ألا يتجاوز ١٦٠ حرفاً');
      return;
    }
    const safeColor = BLUEPRINT_CONSTRAINTS.category.colorPattern.test(catColor)
      ? catColor
      : '#1E5248';
    const safeOrder = Math.max(0, Math.min(100, Math.floor(Number(catOrder) || 1)));

    setSavingCat(true);
    setCatError('');
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          parentId: catParentId,
          name: cleanedName,
          description: cleanedDesc,
          iconKey: catIconKey,
          accentColor: safeColor,
          order: safeOrder,
          isActive: catActive,
          updatedAt: serverTimestamp(),
        });
        setStatusMessage(`تم تعديل "${cleanedName}"`);
      } else {
        const newId = catParentId ? `sub_${Date.now()}` : `cat_${Date.now()}`;
        await setDoc(doc(db, 'categories', newId), {
          id: newId,
          parentId: catParentId,
          name: cleanedName,
          description: cleanedDesc,
          iconKey: catIconKey,
          accentColor: safeColor,
          order: safeOrder,
          isActive: catActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatusMessage(`تمت إضافة "${cleanedName}" بنجاح`);
      }
      setCategoryFormOpen(false);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        editingCategory ? `categories/${editingCategory.id}` : 'categories'
      );
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setBusyId(categoryId);
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      setConfirmDeleteCatId(null);
      setStatusMessage('تم حذف القسم');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRestoreDefaults = async () => {
    setBusyId('restore');
    try {
      const existingIds = new Set(allCategories.map((c) => c.id));
      const missing = DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id));
      await Promise.all(
        missing.map((cat) =>
          setDoc(doc(db, 'categories', cat.id), {
            ...cat,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        )
      );
      setStatusMessage('تمت مزامنة أقسام محافظة قنا بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
    } finally {
      setBusyId(null);
    }
  };

  // APK Updates handlers
  const openNewUpdateForm = () => {
    setEditingUpdate(null);
    setUpdVersionName('');
    setUpdVersionCode((allUpdates[0]?.versionCode || 1) + 1);
    setUpdNotes('');
    setUpdApkUrl('');
    setUpdActive(true);
    setUpdError('');
    setUpdateFormOpen(true);
  };

  const openEditUpdateForm = (upd: AppUpdate) => {
    setEditingUpdate(upd);
    setUpdVersionName(upd.versionName);
    setUpdVersionCode(upd.versionCode);
    setUpdNotes(upd.releaseNotes);
    setUpdApkUrl(upd.apkUrl);
    setUpdActive(upd.isActive);
    setUpdError('');
    setUpdateFormOpen(true);
  };

  const handleSaveAppUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ver = updVersionName.trim();
    const notes = updNotes.trim();
    const url = updApkUrl.trim();
    const code = Math.max(1, Math.min(100000, Math.floor(Number(updVersionCode) || 1)));

    if (!ver || ver.length > BLUEPRINT_CONSTRAINTS.appUpdate.versionNameMaxLength) {
      setUpdError('يرجى كتابة رقم الإصدار (مثال: 2.1.0)');
      return;
    }
    if (
      notes.length < BLUEPRINT_CONSTRAINTS.appUpdate.releaseNotesMinLength ||
      notes.length > BLUEPRINT_CONSTRAINTS.appUpdate.releaseNotesMaxLength
    ) {
      setUpdError('يرجى كتابة تفاصيل التحديث');
      return;
    }
    if (url && !/^https?:\/\/.*$/.test(url)) {
      setUpdError('رابط التحميل يجب أن يبدأ بـ https:// أو http://');
      return;
    }

    setSavingUpd(true);
    setUpdError('');
    try {
      if (editingUpdate) {
        await updateDoc(doc(db, 'app_updates', editingUpdate.id), {
          versionName: ver,
          versionCode: code,
          releaseNotes: notes,
          apkUrl: url,
          isActive: updActive,
          updatedAt: serverTimestamp(),
        });
        setStatusMessage(`تم تحديث بيانات الإصدار ${ver}`);
      } else {
        const newId = `upd_${Date.now()}`;
        await setDoc(doc(db, 'app_updates', newId), {
          versionName: ver,
          versionCode: code,
          releaseNotes: notes,
          apkUrl: url,
          isActive: updActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatusMessage(`تم نشر تحديث APK جديد (${ver})`);
      }
      setUpdateFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'app_updates');
    } finally {
      setSavingUpd(false);
    }
  };

  const handleDeleteUpdate = async (updId: string) => {
    setBusyId(updId);
    try {
      await deleteDoc(doc(db, 'app_updates', updId));
      setConfirmDeleteUpdateId(null);
      setStatusMessage('تم حذف التحديث');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `app_updates/${updId}`);
    } finally {
      setBusyId(null);
    }
  };

  // Strict Admin Gate
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 sm:p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F1EE] text-[#1E5248] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1C2521]">
            لوحة تحكم إدارة بلدنا — قنا
          </h2>
          <p className="mt-2 text-sm text-[#5A655F] leading-relaxed">
            هذه اللوحة محمية ومخصصة لصاحب التطبيق والإدارة المعتمدة فقط ولا يُسمح لأي مستخدم عادي بالدخول إليها.
          </p>

          {currentUser && (
            <div className="mt-4 rounded-2xl bg-[#FBF1EE] border border-[#EBCAC3] p-3.5 text-xs text-[#8D382E] flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                الحساب الحالي ({currentUser.email}) غير مصرح له بصلاحيات الإدارة ({ADMIN_EMAIL}).
              </span>
            </div>
          )}

          {authError && (
            <p className="mt-3 text-xs font-semibold text-[#B34338]">{authError}</p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAdminSignIn}
              disabled={signingIn}
              className="w-full min-h-[48px] rounded-2xl bg-[#1E5248] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#163F37] disabled:opacity-60 transition-colors"
            >
              {signingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <span>تسجيل الدخول بحساب الإدارة المعتمد</span>
              )}
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold text-[#3F4A44] hover:bg-[#EFE8DC]"
              >
                تسجيل الخروج من الحساب الحالي
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full min-h-[44px] rounded-xl text-sm font-semibold text-[#5A655F] hover:text-[#1C2521]"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="العودة للصفحة الرئيسية"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#1C2521] hover:bg-[#EFE8DC]"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1C2521]">
              لوحة تحكم الإدارة — بلدنا قنا
            </h2>
            <p className="text-xs text-[#5A655F]">
              {currentUser?.email} · إجمالي الإعلانات:{' '}
              <span className="tabular-nums">{allListings.length}</span> · المستخدمون:{' '}
              <span className="tabular-nums">{allUsers.length}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddListing}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E5248] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#163F37]"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إعلان أو خدمة</span>
          </button>

          <button
            type="button"
            onClick={() => signOut(auth)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold text-[#3F4A44] hover:bg-[#EFE8DC] inline-flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج الإدارة</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="bg-[#E8F3EE] border border-[#C3DFD2] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-sm font-medium text-[#1E5248]"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            aria-label="إخفاء التنبيه"
            className="p-1 rounded-lg hover:bg-[#D5EAE0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Segmented Admin Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#EAE2D4] rounded-2xl">
        {(
          [
            { id: 'pending', label: `الطلبات المعلقة (${pendingListings.length})` },
            { id: 'listings', label: `الإعلانات والخدمات (${allListings.length})` },
            { id: 'categories', label: `الأقسام (${allCategories.length})` },
            { id: 'locations', label: `المراكز والقرى (${allCenters.length})` },
            { id: 'users', label: `المستخدمون (${allUsers.length})` },
            { id: 'news', label: `الأخبار والتنبيهات (${allAnnouncements.length})` },
            { id: 'apk', label: 'تحديثات APK' },
          ] as { id: AdminTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#FFFDF9] text-[#1E5248] shadow-xs'
                : 'text-[#5A655F] hover:text-[#1C2521]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Pending Moderation */}
      {activeTab === 'pending' && (
        <section className="space-y-4">
          {loadingData ? (
            <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-10 text-center text-sm text-[#5A655F]">
              جاري تحميل الطلبات...
            </div>
          ) : pendingListings.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-10 text-center">
              <p className="text-base font-bold text-[#1C2521]">
                لا توجد إعلانات بانتظار المراجعة حالياً
              </p>
              <p className="mt-1 text-sm text-[#5A655F]">
                أي إعلان أو خدمة يرسلها المستخدمون ستظهر هنا للموافقة أو الرفض قبل نشرها للعامة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-[#1C2521]">{item.title}</h3>
                        <p className="mt-0.5 text-xs text-[#5A655F]">
                          {item.serviceType} · {categoryNameMap[item.categoryId] || item.categoryId}
                          {item.centerName ? ` · مركز ${item.centerName}` : ''}
                          {item.villageName ? ` · ${item.villageName}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#9A6324]">معلق</span>
                    </div>

                    {item.price && (
                      <p className="text-xs font-bold text-[#9A5B25]">السعر: {item.price}</p>
                    )}

                    {item.hideContactInfo ? (
                      <div className="rounded-xl bg-[#EDF6F1] p-2.5 text-xs text-[#1E5248] flex items-center justify-between gap-2">
                        <span>طلب مساعدة محمي الخصوصية</span>
                        {privatePhonesMap[item.id] ? (
                          <span dir="ltr" className="font-bold tabular-nums">
                            {privatePhonesMap[item.id]}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => loadPrivatePhone(item.id)}
                            className="font-bold underline"
                          >
                            عرض الرقم للإدارة
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#1C2521] tabular-nums" dir="ltr">
                        {item.contactPhone}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-xs text-[#49534E] leading-relaxed">{item.notes}</p>
                    )}

                    {item.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {item.images.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt={`مرفق ${idx + 1}`}
                            className="aspect-4/3 rounded-lg object-cover border border-[#E4DDD0]"
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-[#7A847E]">أضافه: {item.submittedByName}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EFE8DC] flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleApprove(item)}
                      className="flex-1 min-h-[42px] px-3 rounded-xl bg-[#1E5248] text-white text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-[#163F37]"
                    >
                      <Check className="w-4 h-4" />
                      <span>قبول ونشر</span>
                    </button>

                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleReject(item)}
                      className="min-h-[42px] px-3 rounded-xl border border-[#EBCAC3] bg-[#FBF1EE] text-xs font-bold text-[#B34338] inline-flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>رفض</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingListing(item)}
                      className="min-h-[42px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold text-[#3F4A44]"
                    >
                      تعديل
                    </button>

                    {confirmDeleteId === item.id ? (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleDeleteListing(item.id)}
                        className="min-h-[42px] px-3 rounded-xl bg-[#B34338] text-white text-xs font-bold"
                      >
                        تأكيد
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label="حذف"
                        className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-[#EBCAC3] bg-[#FBF1EE] text-[#B34338]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: All Listings & Services Directory Management */}
      {activeTab === 'listings' && (
        <section className="space-y-4">
          <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#7A847E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالعنوان أو نوع الخدمة أو الرقم أو المنطقة..."
                className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] pr-9 pl-3 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-2.5 text-xs sm:text-sm font-semibold"
              >
                <option value="all">كل الحالات</option>
                <option value="approved">منشور ومفعل</option>
                <option value="paused">متوقف</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-2.5 text-xs sm:text-sm font-semibold"
              >
                <option value="all">كل الأقسام</option>
                {mainCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-2.5 text-xs sm:text-sm font-semibold"
              >
                <option value="all">كل المراكز</option>
                {allCenters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {managedListings.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-10 text-center text-sm text-[#5A655F]">
              لا توجد إعلانات مطابقة للتصفية الحالية.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {managedListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span
                        className={
                          item.status === 'approved' && item.isActive
                            ? 'text-[#1E5248]'
                            : !item.isActive
                            ? 'text-[#9A6324]'
                            : item.status === 'pending'
                            ? 'text-[#9A6324]'
                            : 'text-[#B34338]'
                        }
                      >
                        {!item.isActive
                          ? 'متوقف'
                          : item.status === 'approved'
                          ? 'منشور'
                          : item.status === 'pending'
                          ? 'معلق'
                          : 'مرفوض'}
                      </span>
                      {item.isFeatured && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#9A5B25]">إعلان مميز</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="text-[#5A655F]">
                        {categoryNameMap[item.categoryId] || item.categoryId}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#1C2521]">{item.title}</h3>
                    <p className="text-xs text-[#5A655F]">
                      {item.serviceType}
                      {item.centerName ? ` · مركز ${item.centerName}` : ''}
                      {item.villageName ? ` · ${item.villageName}` : ''}
                    </p>
                    {item.price && (
                      <p className="text-xs font-bold text-[#9A5B25]">السعر: {item.price}</p>
                    )}
                    {!item.hideContactInfo && item.contactPhone && (
                      <p dir="ltr" className="text-sm font-bold text-[#1C2521] tabular-nums text-right">
                        {item.contactPhone}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#EFE8DC] flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleToggleFeatured(item)}
                      className={`min-h-[40px] px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1 ${
                        item.isFeatured
                          ? 'bg-[#F8EBD4] text-[#9A5B25] border border-[#E2C28B]'
                          : 'border border-[#DDD4C5] bg-[#FAF6F0] text-[#3F4A44]'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-current' : ''}`} />
                      <span>{item.isFeatured ? 'إلغاء التمييز' : 'تمييز'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleToggleActive(item)}
                      className="min-h-[40px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold text-[#3F4A44] inline-flex items-center gap-1"
                    >
                      {item.isActive ? (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-[#9A6324]" />
                          <span>إيقاف</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-[#1E5248]" />
                          <span>تفعيل</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingListing(item)}
                      className="min-h-[40px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold text-[#3F4A44] inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {confirmDeleteId === item.id ? (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleDeleteListing(item.id)}
                        className="min-h-[40px] px-3 rounded-xl bg-[#B34338] text-white text-xs font-bold"
                      >
                        تأكيد الحذف
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="min-h-[40px] px-3 rounded-xl border border-[#EBCAC3] bg-[#FBF1EE] text-xs font-semibold text-[#B34338]"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Categories Management */}
      {activeTab === 'categories' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => openNewCategoryForm('')}
              className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#1E5248] text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-[#163F37]"
            >
              <FolderPlus className="w-4 h-4" />
              <span>إضافة قسم رئيسي جديد</span>
            </button>

            {missingDefaultsCount > 0 && (
              <button
                type="button"
                disabled={busyId === 'restore'}
                onClick={handleRestoreDefaults}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#1E5248]/30 bg-[#E8F3EE] text-xs font-bold text-[#1E5248] hover:bg-[#D5EAE0]"
              >
                إضافة أقسام قنا الافتراضية الناقصة ({missingDefaultsCount})
              </button>
            )}
          </div>

          <div className="space-y-4">
            {mainCategories.map((cat) => {
              const subs = subcategoriesByParent[cat.id] || [];
              return (
                <div
                  key={cat.id}
                  className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon iconKey={cat.iconKey} className="w-12 h-12 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#1C2521] truncate">
                            {cat.name}
                          </h3>
                          {!cat.isActive && (
                            <span className="text-xs font-semibold text-[#9A6324]">مخفي</span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A655F] truncate">
                          ترتيب: <span className="tabular-nums">{cat.order}</span> · {cat.description || 'بدون وصف'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openNewCategoryForm(cat.id)}
                        className="min-h-[40px] px-3 rounded-xl border border-[#CBE0D6] bg-[#EDF6F1] text-xs font-bold text-[#1E5248] inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>قسم فرعي</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditCategoryForm(cat)}
                        aria-label={`تعديل ${cat.name}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#3F4A44]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {confirmDeleteCatId === cat.id ? (
                        <button
                          type="button"
                          disabled={busyId === cat.id}
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="min-h-[40px] px-3 rounded-xl bg-[#B34338] text-white text-xs font-bold"
                        >
                          تأكيد
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatId(cat.id)}
                          aria-label={`حذف ${cat.name}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#EBCAC3] bg-[#FBF1EE] text-[#B34338]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {subs.length > 0 && (
                    <div className="pt-3 border-t border-[#EFE8DC] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {subs.map((sub) => (
                        <div
                          key={sub.id}
                          className="rounded-xl border border-[#E4DDD0] bg-[#FAF6F0] px-3 py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CategoryIcon iconKey={sub.iconKey} className="w-8 h-8 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1C2521] truncate">
                                {sub.name}
                                {!sub.isActive ? ' (مخفي)' : ''}
                              </p>
                              <p className="text-xs text-[#5A655F] truncate">
                                قسم فرعي · ترتيب {sub.order}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditCategoryForm(sub)}
                              aria-label={`تعديل ${sub.name}`}
                              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#DDD4C5] bg-[#FFFDF9] text-[#3F4A44]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteCatId === sub.id ? (
                              <button
                                type="button"
                                disabled={busyId === sub.id}
                                onClick={() => handleDeleteCategory(sub.id)}
                                className="min-h-[36px] px-2.5 rounded-lg bg-[#B34338] text-white text-xs font-bold"
                              >
                                تأكيد
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCatId(sub.id)}
                                aria-label={`حذف ${sub.name}`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#EBCAC3] bg-[#FBF1EE] text-[#B34338]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 4: Centers & Villages Management */}
      {activeTab === 'locations' && (
        <AdminLocationsTab
          centers={allCenters}
          villages={allVillages}
          onStatusMessage={setStatusMessage}
        />
      )}

      {/* Tab 5: Users Management */}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={allUsers}
          centers={allCenters}
          onStatusMessage={setStatusMessage}
        />
      )}

      {/* Tab 6: News & Announcements */}
      {activeTab === 'news' && (
        <AdminNewsTab
          announcements={allAnnouncements}
          centers={allCenters}
          onStatusMessage={setStatusMessage}
        />
      )}

      {/* Tab 7: APK Updates Publisher & Android Packaging */}
      {activeTab === 'apk' && (
        <section className="space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#1C2521]">
                  إدارة تحديثات التطبيق (APK)
                </h3>
                <p className="text-xs text-[#5A655F]">
                  انشر هنا رقم الإصدار الجديد وملاحظات التحديث ورابط تحميل ملف الـ APK.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewUpdateForm}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E5248] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#163F37]"
              >
                <Plus className="w-4 h-4" />
                <span>نشر تحديث APK جديد</span>
              </button>
            </div>

            {allUpdates.length === 0 ? (
              <p className="text-sm text-[#5A655F] bg-[#FAF6F0] rounded-2xl p-4 text-center">
                لم يتم نشر أي تحديثات APK بعد.
              </p>
            ) : (
              <div className="space-y-3">
                {allUpdates.map((upd) => (
                  <div
                    key={upd.id}
                    className="rounded-2xl border border-[#E4DDD0] bg-[#FAF6F0] p-4 flex flex-wrap items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-[#1C2521] tabular-nums">
                        الإصدار {upd.versionName} (Build {upd.versionCode})
                        {!upd.isActive ? ' · مخفي' : ''}
                      </h4>
                      <p className="mt-1 text-xs text-[#49534E] whitespace-pre-line">
                        {upd.releaseNotes}
                      </p>
                      {upd.apkUrl && (
                        <p className="mt-1 text-xs text-[#1E5248] truncate" dir="ltr">
                          {upd.apkUrl}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditUpdateForm(upd)}
                        className="min-h-[40px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] text-xs font-semibold"
                      >
                        تعديل
                      </button>
                      {confirmDeleteUpdateId === upd.id ? (
                        <button
                          type="button"
                          disabled={busyId === upd.id}
                          onClick={() => handleDeleteUpdate(upd.id)}
                          className="min-h-[40px] px-3 rounded-xl bg-[#B34338] text-white text-xs font-bold"
                        >
                          تأكيد
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteUpdateId(upd.id)}
                          className="min-h-[40px] px-3 rounded-xl border border-[#EBCAC3] bg-[#FBF1EE] text-xs font-semibold text-[#B34338]"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F1EE] text-[#1E5248] flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C2521]">
                  تجهيز التطبيق للهاتف والأندرويد (APK)
                </h3>
                <p className="text-xs sm:text-sm text-[#5A655F]">
                  التطبيق يعمل كتطبيق ويب تقدمي PWA قابل للتثبيت الفوري ومجهز بإعدادات Capacitor لبناء APK.
                </p>
              </div>
            </div>
            <PWAInstallButton variant="primary" />
          </div>
        </section>
      )}

      {/* Modal: Edit Listing */}
      {editingListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveEditedListing}
            className="w-full max-w-md bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-3.5 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C2521]">تعديل الإعلان</h3>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="p-2 text-[#5A655F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">القسم</label>
              <select
                value={editingListing.categoryId}
                onChange={(e) =>
                  setEditingListing({
                    ...editingListing,
                    categoryId: e.target.value,
                    subcategoryId: '',
                  })
                }
                className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              >
                {mainCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold mb-1">المركز</label>
                <select
                  value={editingListing.centerId}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      centerId: e.target.value,
                      villageId: '',
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                >
                  <option value="">غير محدد</option>
                  {allCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      مركز {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">القرية / المدينة</label>
                <select
                  value={editingListing.villageId}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      villageId: e.target.value,
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                >
                  <option value="">عام بالمركز</option>
                  {allVillages
                    .filter((v) => v.centerId === editingListing.centerId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">العنوان</label>
              <input
                type="text"
                required
                value={editingListing.title}
                onChange={(e) =>
                  setEditingListing({ ...editingListing, title: e.target.value })
                }
                className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">التخصص / النوع</label>
              <input
                type="text"
                required
                value={editingListing.serviceType}
                onChange={(e) =>
                  setEditingListing({ ...editingListing, serviceType: e.target.value })
                }
                className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  dir="ltr"
                  disabled={editingListing.hideContactInfo}
                  value={editingListing.contactPhone}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      contactPhone: e.target.value,
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm text-right disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">السعر</label>
                <input
                  type="text"
                  value={editingListing.price || ''}
                  onChange={(e) =>
                    setEditingListing({ ...editingListing, price: e.target.value })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">الوصف</label>
              <textarea
                rows={2}
                value={editingListing.notes}
                onChange={(e) =>
                  setEditingListing({ ...editingListing, notes: e.target.value })
                }
                className="w-full rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] p-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold mb-1">الحالة</label>
                <select
                  value={editingListing.status}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      status: e.target.value as Listing['status'],
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                >
                  <option value="pending">قيد المراجعة</option>
                  <option value="approved">معتمد ومنشور</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
              <div className="flex flex-col justify-center gap-1.5 pt-3">
                <label className="flex items-center gap-2 text-xs font-bold text-[#9A5B25]">
                  <input
                    type="checkbox"
                    checked={editingListing.isFeatured}
                    onChange={(e) =>
                      setEditingListing({ ...editingListing, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#9A5B25]"
                  />
                  <span>إعلان مميز</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-[#1E5248]">
                  <input
                    type="checkbox"
                    checked={editingListing.isActive}
                    onChange={(e) =>
                      setEditingListing({ ...editingListing, isActive: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#1E5248]"
                  />
                  <span>مفعّل</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="min-h-[44px] px-4 rounded-xl border border-[#DDD4C5] text-sm font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={busyId === editingListing.id}
                className="flex-1 min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-bold"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create / Edit Category */}
      {categoryFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveCategory}
            className="w-full max-w-md bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C2521]">
                {editingCategory ? 'تعديل القسم' : catParentId ? 'إضافة قسم فرعي' : 'إضافة قسم رئيسي'}
              </h3>
              <button type="button" onClick={() => setCategoryFormOpen(false)} className="p-2 text-[#5A655F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">التبعية</label>
              <select
                value={catParentId}
                onChange={(e) => setCatParentId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              >
                <option value="">قسم رئيسي (في الصفحة الرئيسية)</option>
                {mainCategories
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      قسم فرعي داخل: {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">اسم القسم *</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                maxLength={BLUEPRINT_CONSTRAINTS.category.nameMaxLength}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">وصف القسم</label>
              <input
                type="text"
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                maxLength={BLUEPRINT_CONSTRAINTS.category.descriptionMaxLength}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">الأيقونة</label>
                <select
                  value={catIconKey}
                  onChange={(e) => setCatIconKey(e.target.value as IconKey)}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">الترتيب</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                  className="w-4 h-4 accent-[#1E5248]"
                />
                <span>إظهار القسم</span>
              </label>
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-[#DDD4C5]"
              />
            </div>

            {catError && <p className="text-xs font-semibold text-[#B34338]">{catError}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setCategoryFormOpen(false)} className="min-h-[44px] px-4 rounded-xl border border-[#DDD4C5] text-sm font-semibold">
                إلغاء
              </button>
              <button type="submit" disabled={savingCat} className="flex-1 min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-bold">
                حفظ القسم
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Publish / Edit APK Update */}
      {updateFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveAppUpdate}
            className="w-full max-w-md bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C2521]">
                {editingUpdate ? 'تعديل تحديث APK' : 'نشر تحديث APK جديد'}
              </h3>
              <button type="button" onClick={() => setUpdateFormOpen(false)} className="p-2 text-[#5A655F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">رقم الإصدار *</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={updVersionName}
                  onChange={(e) => setUpdVersionName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">رقم البناء *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100000}
                  value={updVersionCode}
                  onChange={(e) => setUpdVersionCode(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">ملاحظات التحديث *</label>
              <textarea
                rows={3}
                required
                value={updNotes}
                onChange={(e) => setUpdNotes(e.target.value)}
                className="w-full rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] p-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">رابط APK (اختياري)</label>
              <input
                type="url"
                dir="ltr"
                value={updApkUrl}
                onChange={(e) => setUpdApkUrl(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm text-right"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={updActive}
                onChange={(e) => setUpdActive(e.target.checked)}
                className="w-4 h-4 accent-[#1E5248]"
              />
              <span>إظهار للمستخدمين</span>
            </label>

            {updError && <p className="text-xs font-semibold text-[#B34338]">{updError}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setUpdateFormOpen(false)} className="min-h-[44px] px-4 rounded-xl border border-[#DDD4C5] text-sm font-semibold">
                إلغاء
              </button>
              <button type="submit" disabled={savingUpd} className="flex-1 min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-bold">
                حفظ التحديث
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

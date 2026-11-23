import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Bell,
  Briefcase,
  CheckCircle2,
  Download,
  Heart,
  Home,
  LogOut,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { AddListingModal } from './components/AddListingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AppLogo } from './components/AppLogo';
import { AppUpdatesView } from './components/AppUpdatesView';
import { CategoryIcon } from './components/CategoryIcon';
import { CategoryView } from './components/CategoryView';
import { FavoritesView } from './components/FavoritesView';
import { ListingCard } from './components/ListingCard';
import { ListingDetailView } from './components/ListingDetailView';
import { LoginScreen } from './components/LoginScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  DEFAULT_CATEGORIES,
  QENA_CORE_MAIN_CATEGORY_IDS,
} from './data/defaultCategories';
import {
  DEFAULT_QENA_CENTERS,
  DEFAULT_QENA_VILLAGES,
} from './data/qenaLocations';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  testConnection,
} from './firebase';
import {
  ADMIN_EMAIL,
  Announcement,
  AppUpdate,
  BLUEPRINT_CONSTRAINTS,
  Category,
  Center,
  GOVERNORATE_NAME,
  Listing,
  UserProfile,
  Village,
} from './types';

type ScreenView =
  | 'login'
  | 'home'
  | 'category'
  | 'detail'
  | 'favorites'
  | 'updates'
  | 'admin';

const STORAGE_NAME_KEY = 'baladna_user_name';
const LEGACY_NAME_KEY = 'baladna_hegaza_villager_name';
const STORAGE_PHONE_KEY = 'baladna_user_phone';
const STORAGE_CENTER_KEY = 'baladna_qena_center_id';
const STORAGE_VILLAGE_KEY = 'baladna_qena_village_id';
const STORAGE_FAVORITES_KEY = 'baladna_favorites';

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

function getCreatedAtMillis(ts: Listing['createdAt'] | Announcement['createdAt']): number {
  if (!ts) return 0;
  if ('toMillis' in ts && typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

export default function App() {
  const [userName, setUserName] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_NAME_KEY) ||
        localStorage.getItem(LEGACY_NAME_KEY) ||
        ''
      );
    } catch {
      return '';
    }
  });

  const [userPhone, setUserPhone] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_PHONE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [selectedCenterId, setSelectedCenterId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_CENTER_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  const [selectedVillageId, setSelectedVillageId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_VILLAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  const [favoriteIdsList, setFavoriteIdsList] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string')
        : [];
    } catch {
      return [];
    }
  });

  const [view, setView] = useState<ScreenView>(() =>
    userName ? 'home' : 'login'
  );
  const [previousView, setPreviousView] = useState<ScreenView>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [firestoreCategories, setFirestoreCategories] = useState<Category[] | null>(
    null
  );
  const [firestoreCenters, setFirestoreCenters] = useState<Center[] | null>(null);
  const [firestoreVillages, setFirestoreVillages] = useState<Village[] | null>(
    null
  );
  const [approvedListings, setApprovedListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [appUpdates, setAppUpdates] = useState<AppUpdate[]>([]);

  const [globalSearch, setGlobalSearch] = useState('');
  const [addModalCategoryId, setAddModalCategoryId] = useState<string | null>(
    null
  );
  const [addModalSubcategoryId, setAddModalSubcategoryId] = useState<
    string | undefined
  >(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Verify Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state & resolve admin role + sync saved favorites
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user || !user.emailVerified) {
        setIsAdmin(false);
        return;
      }

      // Sync cloud favorites if user profile exists
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data() as Partial<UserProfile>;
          if (Array.isArray(data.favorites) && data.favorites.length > 0) {
            setFavoriteIdsList((prev) => {
              const merged = Array.from(new Set([...prev, ...data.favorites!])).slice(
                0,
                BLUEPRINT_CONSTRAINTS.userProfile.maxFavorites
              );
              try {
                localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(merged));
              } catch {
                // ignore
              }
              return merged;
            });
          }
        }
      } catch {
        // ignore non-critical profile read error
      }

      if (user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        return;
      }
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to active categories
  useEffect(() => {
    const q = query(
      collection(db, 'categories'),
      where('isActive', '==', true)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setFirestoreCategories(null);
          return;
        }
        const docs: Category[] = snap.docs
          .map((d) => {
            const raw = d.data() as Partial<Category>;
            return {
              ...(raw as Omit<Category, 'id'>),
              id: d.id,
              parentId: raw.parentId ?? '',
            };
          })
          .sort((a, b) => a.order - b.order);
        setFirestoreCategories(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to active Qena centers
  useEffect(() => {
    const q = query(
      collection(db, 'centers'),
      where('isActive', '==', true)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setFirestoreCenters(null);
          return;
        }
        const docs: Center[] = snap.docs
          .map((d) => ({
            ...(d.data() as Omit<Center, 'id'>),
            id: d.id,
          }))
          .sort((a, b) => a.order - b.order);
        setFirestoreCenters(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'centers');
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to active Qena villages
  useEffect(() => {
    const q = query(
      collection(db, 'villages'),
      where('isActive', '==', true)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setFirestoreVillages(null);
          return;
        }
        const docs: Village[] = snap.docs
          .map((d) => ({
            ...(d.data() as Omit<Village, 'id'>),
            id: d.id,
          }))
          .sort((a, b) => a.order - b.order);
        setFirestoreVillages(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'villages');
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to approved & active listings
  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'approved')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Listing[] = snap.docs
          .map((d) => normalizeListingDoc(d.id, d.data() as Partial<Listing>))
          .filter((item) => item.isActive !== false)
          .sort(
            (a, b) => getCreatedAtMillis(b.createdAt) - getCreatedAtMillis(a.createdAt)
          );
        setApprovedListings(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to active announcements
  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      where('isActive', '==', true)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Announcement[] = snap.docs
          .map((d) => ({
            ...(d.data() as Omit<Announcement, 'id'>),
            id: d.id,
          }))
          .sort((a, b) => {
            if (a.priority === 'important' && b.priority !== 'important') return -1;
            if (b.priority === 'important' && a.priority !== 'important') return 1;
            return getCreatedAtMillis(b.createdAt) - getCreatedAtMillis(a.createdAt);
          });
        setAnnouncements(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'announcements');
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to published APK updates
  useEffect(() => {
    const q = query(
      collection(db, 'app_updates'),
      where('isActive', '==', true)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: AppUpdate[] = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AppUpdate, 'id'>),
          }))
          .sort((a, b) => b.versionCode - a.versionCode);
        setAppUpdates(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'app_updates');
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to current user's own pending submissions when signed in
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) {
      setMyListings([]);
      return;
    }
    const q = query(
      collection(db, 'listings'),
      where('authorUid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Listing[] = snap.docs
          .map((d) => normalizeListingDoc(d.id, d.data() as Partial<Listing>))
          .filter((l) => l.status === 'pending');
        setMyListings(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      }
    );
    return () => unsub();
  }, [currentUser]);

  // Merge Qena default categories seamlessly if Firestore still holds only pre-Qena docs
  const categories = useMemo(() => {
    if (!firestoreCategories) return DEFAULT_CATEGORIES;
    const hasQenaCore = firestoreCategories.some((c) =>
      QENA_CORE_MAIN_CATEGORY_IDS.has(c.id)
    );
    if (hasQenaCore) return firestoreCategories;
    const map = new Map<string, Category>();
    DEFAULT_CATEGORIES.forEach((c) => map.set(c.id, c));
    firestoreCategories.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return Array.from(map.values()).sort((a, b) => a.order - b.order);
  }, [firestoreCategories]);

  const centers = useMemo(
    () => firestoreCenters || DEFAULT_QENA_CENTERS,
    [firestoreCenters]
  );

  const villages = useMemo(
    () => firestoreVillages || DEFAULT_QENA_VILLAGES,
    [firestoreVillages]
  );

  const availableVillages = useMemo(() => {
    if (selectedCenterId === 'all') return [];
    return villages
      .filter((v) => v.centerId === selectedCenterId)
      .sort((a, b) => a.order - b.order);
  }, [villages, selectedCenterId]);

  const mainCategories = useMemo(() => {
    const mains = categories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.order - b.order);
    const coreOnly = mains.filter((c) => QENA_CORE_MAIN_CATEGORY_IDS.has(c.id));
    const extras = mains.filter((c) => !QENA_CORE_MAIN_CATEGORY_IDS.has(c.id));
    return [...coreOnly, ...extras];
  }, [categories]);

  const subcategoriesByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};
    categories
      .filter((c) => !!c.parentId)
      .sort((a, b) => a.order - b.order)
      .forEach((sub) => {
        if (!map[sub.parentId]) map[sub.parentId] = [];
        map[sub.parentId].push(sub);
      });
    return map;
  }, [categories]);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const favoriteIdsSet = useMemo(() => new Set(favoriteIdsList), [favoriteIdsList]);

  // Filter listings by currently selected Qena Center & Village
  const regionFilteredListings = useMemo(() => {
    return approvedListings.filter((item) => {
      if (selectedCenterId !== 'all' && item.centerId !== selectedCenterId) {
        return false;
      }
      if (selectedVillageId !== 'all' && item.villageId !== selectedVillageId) {
        return false;
      }
      return true;
    });
  }, [approvedListings, selectedCenterId, selectedVillageId]);

  const listingCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    regionFilteredListings.forEach((item) => {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    });
    return counts;
  }, [regionFilteredListings]);

  const featuredListings = useMemo(
    () => regionFilteredListings.filter((l) => l.isFeatured).slice(0, 6),
    [regionFilteredListings]
  );

  const latestJobs = useMemo(
    () =>
      regionFilteredListings
        .filter((l) => l.categoryId === 'qena-jobs' || l.listingKind === 'job')
        .slice(0, 4),
    [regionFilteredListings]
  );

  const latestAds = useMemo(
    () =>
      regionFilteredListings
        .filter((l) => l.categoryId !== 'qena-jobs' && l.listingKind !== 'job')
        .slice(0, 6),
    [regionFilteredListings]
  );

  const favoriteListings = useMemo(
    () => approvedListings.filter((l) => favoriteIdsSet.has(l.id)),
    [approvedListings, favoriteIdsSet]
  );

  const selectedCategory = useMemo(
    () => mainCategories.find((c) => c.id === selectedCategoryId) || null,
    [mainCategories, selectedCategoryId]
  );

  const globalSearchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    return regionFilteredListings.filter((item) => {
      const catName = (categoryNameMap[item.categoryId] || '').toLowerCase();
      const subName = (categoryNameMap[item.subcategoryId] || '').toLowerCase();
      return (
        item.serviceType.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.centerName.toLowerCase().includes(q) ||
        item.villageName.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        (item.price || '').toLowerCase().includes(q) ||
        catName.includes(q) ||
        subName.includes(q)
      );
    });
  }, [regionFilteredListings, globalSearch, categoryNameMap]);

  const selectedCenterName = useMemo(
    () => centers.find((c) => c.id === selectedCenterId)?.name || '',
    [centers, selectedCenterId]
  );

  const selectedVillageName = useMemo(
    () => availableVillages.find((v) => v.id === selectedVillageId)?.name || '',
    [availableVillages, selectedVillageId]
  );

  const handleLogin = (name: string, phone: string) => {
    setUserName(name);
    setUserPhone(phone);
    try {
      localStorage.setItem(STORAGE_NAME_KEY, name);
      localStorage.setItem(STORAGE_PHONE_KEY, phone);
    } catch {
      // ignore storage errors
    }
    setView('home');
  };

  const handleCenterSelect = (centerId: string) => {
    setSelectedCenterId(centerId);
    setSelectedVillageId('all');
    try {
      localStorage.setItem(STORAGE_CENTER_KEY, centerId);
      localStorage.setItem(STORAGE_VILLAGE_KEY, 'all');
    } catch {
      // ignore
    }
  };

  const handleVillageSelect = (villageId: string) => {
    setSelectedVillageId(villageId);
    try {
      localStorage.setItem(STORAGE_VILLAGE_KEY, villageId);
    } catch {
      // ignore
    }
  };

  const handleToggleFavorite = async (listingId: string) => {
    let nextFavorites: string[] = [];
    setFavoriteIdsList((prev) => {
      const exists = prev.includes(listingId);
      nextFavorites = exists
        ? prev.filter((id) => id !== listingId)
        : [listingId, ...prev].slice(0, BLUEPRINT_CONSTRAINTS.userProfile.maxFavorites);
      try {
        localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(nextFavorites));
      } catch {
        // ignore
      }
      return nextFavorites;
    });

    if (currentUser && currentUser.emailVerified) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          await updateDoc(userRef, {
            favorites: nextFavorites,
            updatedAt: serverTimestamp(),
          });
        }
      } catch {
        // Ignore silent sync error
      }
    }
  };

  const openDetail = (listing: Listing) => {
    setPreviousView(view === 'detail' ? previousView : view);
    setSelectedListing(listing);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAddModal = (categoryId?: string, subcategoryId?: string) => {
    setAddModalCategoryId(categoryId || mainCategories[0]?.id || null);
    setAddModalSubcategoryId(subcategoryId);
    setShowAddModal(true);
  };

  const handleAddSuccess = (status: 'pending' | 'approved') => {
    setShowAddModal(false);
    setToastMessage(
      status === 'approved'
        ? 'تمت إضافة الإعلان ونشره في دليل قنا بنجاح.'
        : 'تم إرسال إعلانك بنجاح، وسيظهر للجميع فور موافقة الإدارة.'
    );
    setTimeout(() => setToastMessage(''), 5500);
  };

  const goHome = () => {
    setSelectedCategoryId(null);
    setSelectedListing(null);
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'login') {
    return (
      <>
        <LoginScreen
          initialName={userName}
          initialPhone={userPhone}
          onLogin={handleLogin}
          onOpenAdmin={() => setView('admin')}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#1C2521] flex flex-col pb-20 md:pb-0">
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E4DDD0]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-2.5 text-right shrink-0"
          >
            <AppLogo size="sm" />
            <div className="leading-tight">
              <span className="block text-base sm:text-lg font-extrabold text-[#1E5248] whitespace-nowrap">
                بلدنا
              </span>
              <span className="hidden sm:block text-[11px] font-semibold text-[#5A655F]">
                خدمات قنا كلها أقرب ليك
              </span>
            </div>
          </button>

          <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={goHome}
              className={`hidden md:inline-flex min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold items-center gap-1.5 transition-colors whitespace-nowrap ${
                view === 'home'
                  ? 'border-[#1E5248] bg-[#E8F1EE] text-[#1E5248]'
                  : 'border-[#DDD4C5] bg-[#FFFDF9] text-[#1C2521] hover:bg-[#EFE8DC]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            <button
              type="button"
              onClick={() => setView('favorites')}
              className={`hidden md:inline-flex min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold items-center gap-1.5 transition-colors whitespace-nowrap ${
                view === 'favorites'
                  ? 'border-[#C96B5E]/50 bg-[#FBF1EE] text-[#B34338]'
                  : 'border-[#DDD4C5] bg-[#FFFDF9] text-[#1C2521] hover:bg-[#EFE8DC]'
              }`}
            >
              <Heart className="w-4 h-4 text-[#B34338]" />
              <span>المفضلة</span>
              {favoriteListings.length > 0 && (
                <span className="tabular-nums text-[11px] text-[#B34338]">
                  ({favoriteListings.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setView('updates')}
              className={`hidden md:inline-flex min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold items-center gap-1.5 transition-colors whitespace-nowrap ${
                view === 'updates'
                  ? 'border-[#1E5248] bg-[#E8F1EE] text-[#1E5248]'
                  : 'border-[#DDD4C5] bg-[#FFFDF9] text-[#1C2521] hover:bg-[#EFE8DC]'
              }`}
            >
              <Download className="w-4 h-4 text-[#1E5248]" />
              <span>تحديثات APK</span>
            </button>

            <button
              type="button"
              onClick={() => setView('admin')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                view === 'admin'
                  ? 'border-[#1E5248] bg-[#E8F1EE] text-[#1E5248]'
                  : 'border-[#DDD4C5] bg-[#FFFDF9] text-[#1E5248] hover:bg-[#EFE8DC]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>الإدارة</span>
            </button>

            <button
              type="button"
              onClick={() => setView('login')}
              aria-label="تغيير الاسم أو رقم الهاتف"
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#5A655F] hover:text-[#1C2521] hover:bg-[#EAE2D4]/70 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">الحساب</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div
            role="status"
            className="bg-[#E8F3EE] border border-[#C3DFD2] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-sm font-semibold text-[#1E5248]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              aria-label="إغلاق"
              className="p-1 rounded-lg hover:bg-[#D5EAE0]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {view === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            isAdmin={isAdmin}
            categories={categories}
            centers={centers}
            villages={villages}
            onBack={goHome}
            onOpenAddListing={() => openAddModal()}
          />
        ) : view === 'updates' ? (
          <AppUpdatesView updates={appUpdates} onBack={goHome} />
        ) : view === 'favorites' ? (
          <FavoritesView
            favoriteListings={favoriteListings}
            categoryNameMap={categoryNameMap}
            onToggleFavorite={handleToggleFavorite}
            onOpenDetail={openDetail}
            onBack={goHome}
          />
        ) : view === 'detail' && selectedListing ? (
          <ListingDetailView
            listing={selectedListing}
            categoryName={categoryNameMap[selectedListing.categoryId]}
            subcategoryName={
              selectedListing.subcategoryId
                ? categoryNameMap[selectedListing.subcategoryId]
                : undefined
            }
            isFavorite={favoriteIdsSet.has(selectedListing.id)}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onToggleFavorite={handleToggleFavorite}
            onBack={() =>
              setView(previousView === 'detail' ? 'home' : previousView)
            }
            onGoHome={goHome}
          />
        ) : view === 'category' && selectedCategory ? (
          <CategoryView
            category={selectedCategory}
            subcategories={subcategoriesByParent[selectedCategory.id] || []}
            centers={centers}
            villages={villages}
            initialCenterId={selectedCenterId}
            initialVillageId={selectedVillageId}
            approvedListings={approvedListings}
            myPendingListings={myListings}
            favoriteIds={favoriteIdsSet}
            onToggleFavorite={handleToggleFavorite}
            onOpenDetail={openDetail}
            onBack={goHome}
            onOpenAdd={(catId, subId) => openAddModal(catId, subId)}
          />
        ) : (
          /* Home Screen */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
            {/* 1. Hero Header, Search & Qena Geographic Filter */}
            <section className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-5 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C2521] text-balance">
                    أهلاً بك{userName ? ` يا ${userName}` : ''} في بلدنا
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-[#1E5248]">
                    خدمات قنا كلها أقرب ليك
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openAddModal()}
                  className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#1E5248] text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#163F37] transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة إعلان أو خدمة</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 text-[#7A847E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="ابحث في خدمات وإعلانات محافظة قنا (مثال: سباكة، أطباء، شقة، وظيفة...)"
                  className="w-full min-h-[48px] rounded-2xl border border-[#DDD4C5] bg-[#FAF6F0] pr-11 pl-11 py-3 text-sm sm:text-base text-[#1C2521] placeholder:text-[#8E9691] focus:outline-none focus:border-[#1E5248] focus:ring-2 focus:ring-[#1E5248]/15 transition"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('')}
                    aria-label="مسح البحث"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-[#5A655F] hover:text-[#1C2521]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Qena Geographic Selector: Governorate (fixed) -> Center -> Village */}
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#E4DDD0] p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E5248]">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>النطاق الجغرافي: {GOVERNORATE_NAME} (ثابتة)</span>
                  </div>

                  {(selectedCenterId !== 'all' || selectedVillageId !== 'all') && (
                    <button
                      type="button"
                      onClick={() => handleCenterSelect('all')}
                      className="text-xs font-bold text-[#1E5248] hover:underline"
                    >
                      عرض إعلانات قنا بالكامل
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="home-center-select"
                      className="block text-xs font-semibold text-[#5A655F] mb-1"
                    >
                      المركز
                    </label>
                    <select
                      id="home-center-select"
                      value={selectedCenterId}
                      onChange={(e) => handleCenterSelect(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] px-3 text-sm font-semibold text-[#1C2521] focus:outline-none focus:border-[#1E5248]"
                    >
                      <option value="all">كل مراكز محافظة قنا</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          مركز {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="home-village-select"
                      className="block text-xs font-semibold text-[#5A655F] mb-1"
                    >
                      القرية أو المدينة
                    </label>
                    <select
                      id="home-village-select"
                      value={selectedVillageId}
                      disabled={
                        selectedCenterId === 'all' || availableVillages.length === 0
                      }
                      onChange={(e) => handleVillageSelect(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] px-3 text-sm font-semibold text-[#1C2521] disabled:opacity-55 focus:outline-none focus:border-[#1E5248]"
                    >
                      <option value="all">
                        {selectedCenterId === 'all'
                          ? 'اختر المركز أولاً'
                          : 'كل قرى ومدن المركز'}
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
            </section>

            {/* 2. Admin News & Alerts (if any) */}
            {announcements.length > 0 && (
              <section className="space-y-2.5">
                {announcements.slice(0, 2).map((ann) => (
                  <div
                    key={ann.id}
                    className={`rounded-2xl border p-4 flex items-start gap-3 ${
                      ann.priority === 'important'
                        ? 'bg-[#FDF6EC] border-[#DFC08E]'
                        : 'bg-[#FFFDF9] border-[#E4DDD0]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ann.priority === 'important'
                          ? 'bg-[#9A5B25] text-white'
                          : 'bg-[#E8F1EE] text-[#1E5248]'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-extrabold text-[#1C2521]">
                          {ann.title}
                        </h2>
                        {ann.centerName && (
                          <span className="text-xs font-semibold text-[#1E5248]">
                            · {ann.centerName}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-[#49534E] leading-relaxed">
                        {ann.body}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* 3. Search Results OR Home Feed */}
            {globalSearch.trim() ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-base font-bold text-[#1C2521]">
                    نتائج البحث عن "{globalSearch.trim()}" ·{' '}
                    <span className="tabular-nums text-[#1E5248]">
                      {globalSearchResults.length}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('')}
                    className="text-xs font-bold text-[#1E5248] hover:underline"
                  >
                    العودة للرئيسية
                  </button>
                </div>

                {globalSearchResults.length === 0 ? (
                  <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-8 sm:p-10 text-center">
                    <p className="text-base font-bold text-[#1C2521]">
                      لا توجد نتائج مطابقة لـ "{globalSearch.trim()}"
                      {selectedCenterName ? ` في مركز ${selectedCenterName}` : ''}
                    </p>
                    <p className="mt-1.5 text-sm text-[#5A655F]">
                      يمكنك عرض إعلانات قنا بالكامل أو إضافة خدمة جديدة الآن.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                      {selectedCenterId !== 'all' && (
                        <button
                          type="button"
                          onClick={() => handleCenterSelect('all')}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-sm font-bold text-[#1C2521]"
                        >
                          بحث في كل قنا
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openAddModal()}
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1E5248] text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-[#163F37]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة إعلان أو خدمة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {globalSearchResults.map((item) => (
                      <ListingCard
                        key={item.id}
                        listing={item}
                        categoryName={categoryNameMap[item.categoryId]}
                        subcategoryName={
                          item.subcategoryId
                            ? categoryNameMap[item.subcategoryId]
                            : undefined
                        }
                        isFavorite={favoriteIdsSet.has(item.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenDetail={openDetail}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Main 6 Categories Grid */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#1C2521]">
                      الأقسام الرئيسية
                    </h2>
                    <span className="text-xs text-[#5A655F]">
                      {selectedCenterName
                        ? `منطقة: مركز ${selectedCenterName}${
                            selectedVillageName ? ` · ${selectedVillageName}` : ''
                          }`
                        : 'جميع مراكز قنا'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
                    {mainCategories.map((cat) => {
                      const count = listingCountByCategory[cat.id] || 0;
                      const subCount = (subcategoriesByParent[cat.id] || []).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setView('category');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="group bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-3 hover:border-[#1E5248]/45 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 shadow-xs"
                        >
                          <div className="transition-transform duration-150 group-hover:scale-105">
                            <CategoryIcon
                              iconKey={cat.iconKey}
                              className="w-16 h-16 sm:w-20 sm:h-20"
                            />
                          </div>

                          <div className="space-y-1 w-full">
                            <h3 className="text-base sm:text-lg font-extrabold text-[#1C2521] leading-snug">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-[#5A655F] line-clamp-2 leading-relaxed">
                              {cat.description}
                            </p>
                            <p className="text-xs font-semibold text-[#1E5248] tabular-nums pt-0.5">
                              {count > 0
                                ? `${count} ${count === 1 ? 'إعلان' : 'إعلانات'}`
                                : subCount > 0
                                ? `${subCount} تخصصات`
                                : 'تصفح القسم'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Featured Ads Section (الإعلانات المميزة) */}
                {featuredListings.length > 0 && (
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-base sm:text-lg font-extrabold text-[#1C2521] inline-flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#9A5B25]" />
                        <span>الإعلانات المميزة</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {featuredListings.map((item) => (
                        <ListingCard
                          key={item.id}
                          listing={item}
                          categoryName={categoryNameMap[item.categoryId]}
                          subcategoryName={
                            item.subcategoryId
                              ? categoryNameMap[item.subcategoryId]
                              : undefined
                          }
                          isFavorite={favoriteIdsSet.has(item.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onOpenDetail={openDetail}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Latest Ads & Services (أحدث الإعلانات) */}
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#1C2521]">
                      أحدث الإعلانات
                    </h2>
                    <button
                      type="button"
                      onClick={() => openAddModal('qena-market')}
                      className="text-xs font-bold text-[#1E5248] hover:underline"
                    >
                      + أضف إعلانك
                    </button>
                  </div>

                  {latestAds.length === 0 ? (
                    <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-7 text-center">
                      <p className="text-sm font-bold text-[#1C2521]">
                        {selectedCenterName
                          ? `لا توجد إعلانات مضافة في مركز ${selectedCenterName} حتى الآن`
                          : 'لا توجد إعلانات منشورة حالياً'}
                      </p>
                      <p className="mt-1 text-xs sm:text-sm text-[#5A655F]">
                        كن أول من يضيف منتجاً أو خدمة في منطقته ليصل لأهالي قنا.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {latestAds.map((item) => (
                        <ListingCard
                          key={item.id}
                          listing={item}
                          categoryName={categoryNameMap[item.categoryId]}
                          subcategoryName={
                            item.subcategoryId
                              ? categoryNameMap[item.subcategoryId]
                              : undefined
                          }
                          isFavorite={favoriteIdsSet.has(item.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onOpenDetail={openDetail}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Latest Jobs (أحدث فرص العمل) */}
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#1C2521] inline-flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#1E5248]" />
                      <span>أحدث فرص العمل</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId('qena-jobs');
                        setView('category');
                      }}
                      className="text-xs font-bold text-[#1E5248] hover:underline"
                    >
                      قسم الوظائف
                    </button>
                  </div>

                  {latestJobs.length === 0 ? (
                    <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#1C2521]">
                          لا توجد فرص عمل منشورة في هذا النطاق حالياً
                        </p>
                        <p className="text-xs text-[#5A655F] mt-0.5">
                          يمكن لأصحاب الأعمال والباحثين عن عمل إضافة إعلاناتهم من هنا.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAddModal('qena-jobs')}
                        className="min-h-[42px] px-4 py-2 rounded-xl border border-[#1E5248]/30 bg-[#EDF6F1] text-xs font-bold text-[#1E5248] hover:bg-[#DCEEE4] whitespace-nowrap shrink-0"
                      >
                        أضف فرصة عمل
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {latestJobs.map((item) => (
                        <ListingCard
                          key={item.id}
                          listing={item}
                          categoryName={categoryNameMap[item.categoryId]}
                          subcategoryName={
                            item.subcategoryId
                              ? categoryNameMap[item.subcategoryId]
                              : undefined
                          }
                          isFavorite={favoriteIdsSet.has(item.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onOpenDetail={openDetail}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Dedicated App APK Updates Entry Section */}
                <section className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8F1EE] text-[#1E5248] flex items-center justify-center shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#1C2521]">
                        تحديثات التطبيق للأندرويد (APK)
                      </h2>
                      <p className="text-xs sm:text-sm text-[#5A655F]">
                        {appUpdates.length > 0
                          ? `أحدث إصدار متاح: ${appUpdates[0].versionName} — اضغط للاطلاع والتحميل`
                          : 'تابع آخر إصدارات وتحديثات تطبيق بلدنا — قنا'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView('updates')}
                    className="min-h-[44px] px-5 py-2 rounded-xl border border-[#1E5248]/30 bg-[#EDF6F1] text-sm font-bold text-[#1E5248] hover:bg-[#DCEEE4] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>عرض التحديثات</span>
                  </button>
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {/* Clean Desktop Footer */}
      <footer className="border-t border-[#E4DDD0] bg-[#FAF6F0] py-5 px-4 sm:px-6 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div>
            <p className="text-sm font-bold text-[#1E5248]">
              بلدنا — {GOVERNORATE_NAME}
            </p>
            <p className="text-xs text-[#5A655F]">خدمات قنا كلها أقرب ليك</p>
          </div>
          <PWAInstallButton variant="subtle" />
        </div>
      </footer>

      {/* Mobile Thumb Bottom Navigation Bar (<= 56px height) */}
      <nav
        aria-label="التنقل السفلي"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#E4DDD0] grid grid-cols-5 items-center"
      >
        <button
          type="button"
          onClick={goHome}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
            view === 'home' ? 'text-[#1E5248]' : 'text-[#5A655F]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>

        <button
          type="button"
          onClick={() => setView('favorites')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
            view === 'favorites' ? 'text-[#B34338]' : 'text-[#5A655F]'
          }`}
        >
          <Heart
            className={`w-4 h-4 ${view === 'favorites' ? 'fill-current' : ''}`}
          />
          <span>المفضلة</span>
        </button>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold text-[#1E5248]"
        >
          <div className="w-7 h-7 rounded-full bg-[#1E5248] text-white flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span>أضف</span>
        </button>

        <button
          type="button"
          onClick={() => setView('updates')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
            view === 'updates' ? 'text-[#1E5248]' : 'text-[#5A655F]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>التحديثات</span>
        </button>

        <button
          type="button"
          onClick={() => setView('admin')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
            view === 'admin' ? 'text-[#1E5248]' : 'text-[#5A655F]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>الإدارة</span>
        </button>
      </nav>

      {/* Add Listing / Service Modal */}
      {showAddModal && (
        <AddListingModal
          mainCategories={mainCategories}
          subcategoriesByParent={subcategoriesByParent}
          centers={centers}
          villages={villages}
          defaultCategoryId={addModalCategoryId || undefined}
          defaultSubcategoryId={addModalSubcategoryId}
          defaultCenterId={selectedCenterId}
          defaultVillageId={selectedVillageId}
          userName={userName}
          userPhone={userPhone}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}

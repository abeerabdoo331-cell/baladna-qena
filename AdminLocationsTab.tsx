import React, { useMemo, useState } from 'react';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Edit3, MapPin, Plus, Trash2, X } from 'lucide-react';
import { DEFAULT_QENA_CENTERS, DEFAULT_QENA_VILLAGES } from '../data/qenaLocations';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BLUEPRINT_CONSTRAINTS, Center, Village } from '../types';

interface AdminLocationsTabProps {
  centers: Center[];
  villages: Village[];
  onStatusMessage: (msg: string) => void;
}

export const AdminLocationsTab: React.FC<AdminLocationsTabProps> = ({
  centers,
  villages,
  onStatusMessage,
}) => {
  const [selectedCenterFilter, setSelectedCenterFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteCenterId, setConfirmDeleteCenterId] = useState<string | null>(null);
  const [confirmDeleteVillageId, setConfirmDeleteVillageId] = useState<string | null>(null);

  // Center modal state
  const [centerModalOpen, setCenterModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [centerName, setCenterName] = useState('');
  const [centerOrder, setCenterOrder] = useState(1);
  const [centerActive, setCenterActive] = useState(true);
  const [centerErr, setCenterErr] = useState('');

  // Village modal state
  const [villageModalOpen, setVillageModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [villageCenterId, setVillageCenterId] = useState('');
  const [villageName, setVillageName] = useState('');
  const [villageOrder, setVillageOrder] = useState(1);
  const [villageActive, setVillageActive] = useState(true);
  const [villageErr, setVillageErr] = useState('');

  const missingCentersCount = useMemo(() => {
    const existing = new Set(centers.map((c) => c.id));
    return DEFAULT_QENA_CENTERS.filter((c) => !existing.has(c.id)).length;
  }, [centers]);

  const missingVillagesCount = useMemo(() => {
    const existing = new Set(villages.map((v) => v.id));
    return DEFAULT_QENA_VILLAGES.filter((v) => !existing.has(v.id)).length;
  }, [villages]);

  const displayedCenters = useMemo(() => {
    const sorted = [...centers].sort((a, b) => a.order - b.order);
    if (selectedCenterFilter === 'all') return sorted;
    return sorted.filter((c) => c.id === selectedCenterFilter);
  }, [centers, selectedCenterFilter]);

  const villagesByCenter = useMemo(() => {
    const map: Record<string, Village[]> = {};
    [...villages]
      .sort((a, b) => a.order - b.order)
      .forEach((v) => {
        if (!map[v.centerId]) map[v.centerId] = [];
        map[v.centerId].push(v);
      });
    return map;
  }, [villages]);

  const handleRestoreDefaultLocations = async () => {
    setBusyId('restore-loc');
    try {
      const existingCenterIds = new Set(centers.map((c) => c.id));
      const existingVillageIds = new Set(villages.map((v) => v.id));

      const missingCenters = DEFAULT_QENA_CENTERS.filter(
        (c) => !existingCenterIds.has(c.id)
      );
      const missingVillages = DEFAULT_QENA_VILLAGES.filter(
        (v) => !existingVillageIds.has(v.id)
      );

      await Promise.all(
        missingCenters.map((c) =>
          setDoc(doc(db, 'centers', c.id), {
            ...c,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        )
      );

      await Promise.all(
        missingVillages.map((v) =>
          setDoc(doc(db, 'villages', v.id), {
            ...v,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        )
      );

      onStatusMessage('تمت مزامنة مراكز وقرى محافظة قنا الافتراضية بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'centers');
    } finally {
      setBusyId(null);
    }
  };

  const openNewCenter = () => {
    setEditingCenter(null);
    setCenterName('');
    setCenterOrder(centers.length + 1);
    setCenterActive(true);
    setCenterErr('');
    setCenterModalOpen(true);
  };

  const openEditCenter = (c: Center) => {
    setEditingCenter(c);
    setCenterName(c.name);
    setCenterOrder(c.order);
    setCenterActive(c.isActive);
    setCenterErr('');
    setCenterModalOpen(true);
  };

  const handleSaveCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = centerName.trim();
    if (
      cleaned.length < BLUEPRINT_CONSTRAINTS.location.nameMinLength ||
      cleaned.length > BLUEPRINT_CONSTRAINTS.location.nameMaxLength
    ) {
      setCenterErr('اسم المركز يجب أن يكون بين حرفين و٦٠ حرفاً');
      return;
    }
    const safeOrder = Math.max(0, Math.min(100, Math.floor(Number(centerOrder) || 1)));
    setBusyId('save-center');
    try {
      if (editingCenter) {
        await updateDoc(doc(db, 'centers', editingCenter.id), {
          name: cleaned,
          order: safeOrder,
          isActive: centerActive,
          updatedAt: serverTimestamp(),
        });
        onStatusMessage(`تم تعديل مركز "${cleaned}"`);
      } else {
        const newId = `center_${Date.now()}`;
        await setDoc(doc(db, 'centers', newId), {
          id: newId,
          name: cleaned,
          order: safeOrder,
          isActive: centerActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        onStatusMessage(`تمت إضافة مركز "${cleaned}"`);
      }
      setCenterModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'centers');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    setBusyId(centerId);
    try {
      await deleteDoc(doc(db, 'centers', centerId));
      setConfirmDeleteCenterId(null);
      onStatusMessage('تم حذف المركز');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `centers/${centerId}`);
    } finally {
      setBusyId(null);
    }
  };

  const openNewVillage = (parentCenterId: string) => {
    const siblings = villagesByCenter[parentCenterId] || [];
    setEditingVillage(null);
    setVillageCenterId(parentCenterId || centers[0]?.id || 'qena');
    setVillageName('');
    setVillageOrder(siblings.length + 1);
    setVillageActive(true);
    setVillageErr('');
    setVillageModalOpen(true);
  };

  const openEditVillage = (v: Village) => {
    setEditingVillage(v);
    setVillageCenterId(v.centerId);
    setVillageName(v.name);
    setVillageOrder(v.order);
    setVillageActive(v.isActive);
    setVillageErr('');
    setVillageModalOpen(true);
  };

  const handleSaveVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = villageName.trim();
    if (
      cleaned.length < BLUEPRINT_CONSTRAINTS.location.nameMinLength ||
      cleaned.length > BLUEPRINT_CONSTRAINTS.location.nameMaxLength
    ) {
      setVillageErr('اسم القرية أو المدينة يجب أن يكون بين حرفين و٦٠ حرفاً');
      return;
    }
    if (!villageCenterId) {
      setVillageErr('يرجى اختيار المركز التابع له');
      return;
    }
    const safeOrder = Math.max(0, Math.min(500, Math.floor(Number(villageOrder) || 1)));
    setBusyId('save-village');
    try {
      if (editingVillage) {
        await updateDoc(doc(db, 'villages', editingVillage.id), {
          centerId: villageCenterId,
          name: cleaned,
          order: safeOrder,
          isActive: villageActive,
          updatedAt: serverTimestamp(),
        });
        onStatusMessage(`تم تعديل "${cleaned}"`);
      } else {
        const newId = `vil_${Date.now()}`;
        await setDoc(doc(db, 'villages', newId), {
          id: newId,
          centerId: villageCenterId,
          name: cleaned,
          order: safeOrder,
          isActive: villageActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        onStatusMessage(`تمت إضافة "${cleaned}" بنجاح`);
      }
      setVillageModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'villages');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteVillage = async (villageId: string) => {
    setBusyId(villageId);
    try {
      await deleteDoc(doc(db, 'villages', villageId));
      setConfirmDeleteVillageId(null);
      onStatusMessage('تم حذف القرية');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `villages/${villageId}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openNewCenter}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E5248] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#163F37]"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مركز</span>
          </button>

          <button
            type="button"
            onClick={() => openNewVillage(centers[0]?.id || 'qena')}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#1E5248]/35 bg-[#EDF6F1] text-[#1E5248] text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#DCEEE4]"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قرية أو مدينة</span>
          </button>
        </div>

        {(missingCentersCount > 0 || missingVillagesCount > 0) && (
          <button
            type="button"
            disabled={busyId === 'restore-loc'}
            onClick={handleRestoreDefaultLocations}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DDD4C5] bg-[#FFFDF9] text-xs font-bold text-[#1E5248] hover:bg-[#EFE8DC]"
          >
            مزامنة مراكز وقرى قنا الافتراضية
          </button>
        )}
      </div>

      {/* Filter by Center */}
      <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#5A655F]">
          محافظة قنا · <span className="tabular-nums">{centers.length}</span> مركز ·{' '}
          <span className="tabular-nums">{villages.length}</span> قرية/مدينة
        </span>
        <select
          aria-label="تصفية حسب المركز"
          value={selectedCenterFilter}
          onChange={(e) => setSelectedCenterFilter(e.target.value)}
          className="min-h-[40px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-xs sm:text-sm font-semibold"
        >
          <option value="all">عرض كل المراكز</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              مركز {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {displayedCenters.map((center) => {
          const centerVillages = villagesByCenter[center.id] || [];
          return (
            <div
              key={center.id}
              className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F1EE] text-[#1E5248] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1C2521]">
                      مركز {center.name}
                      {!center.isActive ? ' (مخفي)' : ''}
                    </h3>
                    <p className="text-xs text-[#5A655F] tabular-nums">
                      القرى والمدن التابعة: {centerVillages.length} · ترتيب {center.order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openNewVillage(center.id)}
                    className="min-h-[40px] px-3 rounded-xl border border-[#CBE0D6] bg-[#EDF6F1] text-xs font-bold text-[#1E5248] hover:bg-[#DCEEE4] inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>قرية جديدة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditCenter(center)}
                    aria-label={`تعديل مركز ${center.name}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-[#3F4A44]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {confirmDeleteCenterId === center.id ? (
                    <button
                      type="button"
                      disabled={busyId === center.id}
                      onClick={() => handleDeleteCenter(center.id)}
                      className="min-h-[40px] px-3 rounded-xl bg-[#B34338] text-white text-xs font-bold"
                    >
                      تأكيد
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCenterId(center.id)}
                      aria-label={`حذف مركز ${center.name}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#EBCAC3] bg-[#FBF1EE] text-[#B34338]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {centerVillages.length > 0 && (
                <div className="pt-3 border-t border-[#EFE8DC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {centerVillages.map((vil) => (
                    <div
                      key={vil.id}
                      className="rounded-xl border border-[#E4DDD0] bg-[#FAF6F0] px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1C2521] truncate">
                          {vil.name}
                          {!vil.isActive ? ' (مخفي)' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditVillage(vil)}
                          aria-label={`تعديل ${vil.name}`}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#DDD4C5] bg-[#FFFDF9] text-[#3F4A44]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteVillageId === vil.id ? (
                          <button
                            type="button"
                            disabled={busyId === vil.id}
                            onClick={() => handleDeleteVillage(vil.id)}
                            className="min-h-[36px] px-2 rounded-lg bg-[#B34338] text-white text-xs font-bold"
                          >
                            تأكيد
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteVillageId(vil.id)}
                            aria-label={`حذف ${vil.name}`}
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

      {/* Modal: Center */}
      {centerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSaveCenter}
            className="w-full max-w-md bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C2521]">
                {editingCenter ? 'تعديل المركز' : 'إضافة مركز جديد'}
              </h3>
              <button type="button" onClick={() => setCenterModalOpen(false)} className="p-2 text-[#5A655F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2A332E] mb-1">اسم المركز *</label>
              <input
                type="text"
                required
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                maxLength={BLUEPRINT_CONSTRAINTS.location.nameMaxLength}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2A332E] mb-1">ترتيب العرض</label>
              <input
                type="number"
                min={0}
                max={100}
                value={centerOrder}
                onChange={(e) => setCenterOrder(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm tabular-nums"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-[#2A332E]">
              <input
                type="checkbox"
                checked={centerActive}
                onChange={(e) => setCenterActive(e.target.checked)}
                className="w-4 h-4 accent-[#1E5248]"
              />
              <span>مفعّل للظهور للمستخدمين</span>
            </label>

            {centerErr && <p className="text-xs font-semibold text-[#B34338]">{centerErr}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setCenterModalOpen(false)} className="min-h-[44px] px-4 rounded-xl border border-[#DDD4C5] text-sm font-semibold">
                إلغاء
              </button>
              <button type="submit" disabled={busyId === 'save-center'} className="flex-1 min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-bold">
                حفظ المركز
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Village */}
      {villageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSaveVillage}
            className="w-full max-w-md bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C2521]">
                {editingVillage ? 'تعديل قرية / مدينة' : 'إضافة قرية أو مدينة جديدة'}
              </h3>
              <button type="button" onClick={() => setVillageModalOpen(false)} className="p-2 text-[#5A655F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2A332E] mb-1">المركز التابع له *</label>
              <select
                value={villageCenterId}
                onChange={(e) => setVillageCenterId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    مركز {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2A332E] mb-1">اسم القرية أو المدينة *</label>
              <input
                type="text"
                required
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                maxLength={BLUEPRINT_CONSTRAINTS.location.nameMaxLength}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2A332E] mb-1">ترتيب العرض</label>
              <input
                type="number"
                min={0}
                max={500}
                value={villageOrder}
                onChange={(e) => setVillageOrder(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm tabular-nums"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-[#2A332E]">
              <input
                type="checkbox"
                checked={villageActive}
                onChange={(e) => setVillageActive(e.target.checked)}
                className="w-4 h-4 accent-[#1E5248]"
              />
              <span>مفعّلة للظهور للمستخدمين</span>
            </label>

            {villageErr && <p className="text-xs font-semibold text-[#B34338]">{villageErr}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setVillageModalOpen(false)} className="min-h-[44px] px-4 rounded-xl border border-[#DDD4C5] text-sm font-semibold">
                إلغاء
              </button>
              <button type="submit" disabled={busyId === 'save-village'} className="flex-1 min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-bold">
                حفظ القرية
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

import React, { useMemo, useState } from 'react';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Ban,
  CheckCircle2,
  Edit3,
  Megaphone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Announcement,
  AnnouncementPriority,
  BLUEPRINT_CONSTRAINTS,
  Center,
  UserProfile,
} from '../types';

interface AdminUsersTabProps {
  users: UserProfile[];
  centers: Center[];
  onStatusMessage: (msg: string) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  centers,
  onStatusMessage,
}) => {
  const [search, setSearch] = useState('');
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userEditErr, setUserEditErr] = useState('');

  const centerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    centers.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [centers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleToggleBlock = async (u: UserProfile) => {
    setBusyUid(u.uid);
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        isBlocked: !u.isBlocked,
        updatedAt: serverTimestamp(),
      });
      onStatusMessage(
        !u.isBlocked
          ? `تم إيقاف حساب "${u.displayName}"`
          : `تم تفعيل حساب "${u.displayName}"`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${u.uid}`);
    } finally {
      setBusyUid(null);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const cleanedName = editingUser.displayName.trim();
    const cleanedPhone = editingUser.phone.trim();
    if (cleanedName.length < 2 || cleanedName.length > 60) {
      setUserEditErr('الاسم يجب أن يكون بين حرفين و٦٠ حرفاً');
      return;
    }
    if (
      cleanedPhone !== '' &&
      !BLUEPRINT_CONSTRAINTS.listing.phonePattern.test(cleanedPhone)
    ) {
      setUserEditErr('يرجى إدخال رقم هاتف صحيح أو تركه فارغاً');
      return;
    }
    setUserEditErr('');
    setBusyUid(editingUser.uid);
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        displayName: cleanedName,
        phone: cleanedPhone,
        centerId: editingUser.centerId || '',
        isBlocked: editingUser.isBlocked,
        updatedAt: serverTimestamp(),
      });
      setEditingUser(null);
      onStatusMessage('تم تحديث بيانات المستخدم');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${editingUser.uid}`);
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-[#7A847E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في المستخدمين بالاسم أو الهاتف أو البريد..."
          className="w-full min-h-[46px] rounded-2xl border border-[#DDD4C5] bg-[#FFFDF9] pr-10 pl-4 py-2.5 text-sm"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-10 text-center text-sm text-[#5A655F]">
          لا يوجد مستخدمون مسجلون مطابقون للبحث حالياً. يظهر المستخدمون هنا تلقائياً عند تسجيلهم أو إضافتهم إعلانات.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((u) => (
            <div
              key={u.uid}
              className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1C2521]">
                      {u.displayName}
                    </h3>
                    <p className="text-xs text-[#5A655F] mt-0.5">
                      {u.centerId && centerNameMap[u.centerId]
                        ? `مركز ${centerNameMap[u.centerId]}`
                        : 'قنا'}
                      {u.email ? ` · ${u.email}` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      u.isBlocked ? 'text-[#B34338]' : 'text-[#1E5248]'
                    }`}
                  >
                    {u.isBlocked ? 'محظور' : 'نشط'}
                  </span>
                </div>

                {u.phone && (
                  <p dir="ltr" className="mt-2 text-sm font-bold tabular-nums text-[#1C2521]">
                    {u.phone}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserEditErr('');
                    setEditingUser(u);
                  }}
                  className="min-h-[40px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  disabled={busyUid === u.uid}
                  onClick={() => handleToggleBlock(u)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1 ${
                    u.isBlocked
                      ? 'border border-[#CBE0D6] bg-[#EDF6F1] text-[#1E5248]'
                      : 'border border-[#EBCAC3] bg-[#FBF1EE] text-[#B34338]'
                  }`}
                >
                  {u.isBlocked ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>إلغاء الحظر</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>إيقاف الحساب</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSaveUserEdit}
            className="w-full max-w-md bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">تعديل بيانات المستخدم</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="p-2 text-[#5A655F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">الاسم</label>
              <input
                type="text"
                required
                value={editingUser.displayName}
                onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">رقم الهاتف</label>
              <input
                type="tel"
                dir="ltr"
                value={editingUser.phone}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">المركز</label>
              <select
                value={editingUser.centerId}
                onChange={(e) => setEditingUser({ ...editingUser, centerId: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              >
                <option value="">غير محدد</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    مركز {c.name}
                  </option>
                ))}
              </select>
            </div>

            {userEditErr && (
              <p className="text-xs font-semibold text-[#B34338]">{userEditErr}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className="min-h-[44px] px-4 rounded-xl border border-[#DDD4C5] text-sm font-semibold">
                إلغاء
              </button>
              <button type="submit" disabled={busyUid === editingUser.uid} className="flex-1 min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-bold">
                حفظ
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

interface AdminNewsTabProps {
  announcements: Announcement[];
  centers: Center[];
  onStatusMessage: (msg: string) => void;
}

export const AdminNewsTab: React.FC<AdminNewsTabProps> = ({
  announcements,
  centers,
  onStatusMessage,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [centerName, setCenterName] = useState('عموم محافظة قنا');
  const [isActive, setIsActive] = useState(true);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setBody('');
    setPriority('normal');
    setCenterName('عموم محافظة قنا');
    setIsActive(true);
    setErr('');
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setTitle(a.title);
    setBody(a.body);
    setPriority(a.priority);
    setCenterName(a.centerName || 'عموم محافظة قنا');
    setIsActive(a.isActive);
    setErr('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (
      t.length < BLUEPRINT_CONSTRAINTS.announcement.titleMinLength ||
      t.length > BLUEPRINT_CONSTRAINTS.announcement.titleMaxLength
    ) {
      setErr('العنوان يجب أن يكون بين حرفين و١٠٠ حرف');
      return;
    }
    if (
      b.length < BLUEPRINT_CONSTRAINTS.announcement.bodyMinLength ||
      b.length > BLUEPRINT_CONSTRAINTS.announcement.bodyMaxLength
    ) {
      setErr('نص الخبر أو التنبيه يجب أن يكون بين حرفين و٦٠٠ حرف');
      return;
    }
    setBusyId('save-news');
    try {
      if (editing) {
        await updateDoc(doc(db, 'announcements', editing.id), {
          title: t,
          body: b,
          priority,
          centerName: centerName.slice(0, 60),
          isActive,
          updatedAt: serverTimestamp(),
        });
        onStatusMessage('تم تحديث الخبر بنجاح');
      } else {
        const newId = `news_${Date.now()}`;
        await setDoc(doc(db, 'announcements', newId), {
          title: t,
          body: b,
          priority,
          centerName: centerName.slice(0, 60),
          isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        onStatusMessage('تم نشر الخبر والتنبيه لأهالي قنا');
      }
      setModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'announcements');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (a: Announcement) => {
    setBusyId(a.id);
    try {
      await updateDoc(doc(db, 'announcements', a.id), {
        isActive: !a.isActive,
        updatedAt: serverTimestamp(),
      });
      onStatusMessage(!a.isActive ? 'تم تفعيل التنبيه' : 'تم إيقاف التنبيه');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `announcements/${a.id}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setConfirmDeleteId(null);
      onStatusMessage('تم حذف التنبيه');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#1C2521]">
            الأخبار والتنبيهات المحلية
          </h3>
          <p className="text-xs text-[#5A655F]">
            تظهر التنبيهات المفعلة في الصفحة الرئيسية لجميع أهالي محافظة قنا.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E5248] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#163F37]"
        >
          <Plus className="w-4 h-4" />
          <span>نشر خبر أو تنبيه</span>
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-10 text-center">
          <Megaphone className="w-8 h-8 text-[#1E5248] mx-auto mb-2 opacity-75" />
          <p className="text-sm font-bold text-[#1C2521]">لا توجد أخبار أو تنبيهات منشورة بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-[#FFFDF9] border border-[#E4DDD0] rounded-2xl p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className={a.priority === 'important' ? 'text-[#B34338]' : 'text-[#1E5248]'}>
                    {a.priority === 'important' ? 'تنبيه هام' : 'خبر محلي'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#5A655F]">{a.centerName || 'عموم محافظة قنا'}</span>
                  {!a.isActive && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#9A6324]">متوقف</span>
                    </>
                  )}
                </div>
                <h4 className="text-base font-bold text-[#1C2521]">{a.title}</h4>
                <p className="text-xs sm:text-sm text-[#49534E] whitespace-pre-line">{a.body}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => handleToggleActive(a)}
                  className="min-h-[38px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1E5248]" />
                  <span>{a.isActive ? 'إيقاف' : 'تفعيل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="min-h-[38px] px-3 rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] text-xs font-semibold"
                >
                  تعديل
                </button>
                {confirmDeleteId === a.id ? (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => handleDelete(a.id)}
                    className="min-h-[38px] px-3 rounded-xl bg-[#B34338] text-white text-xs font-bold"
                  >
                    تأكيد
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(a.id)}
                    className="min-h-[38px] px-3 rounded-xl border border-[#EBCAC3] bg-[#FBF1EE] text-xs font-semibold text-[#B34338]"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md bg-[#FFFDF9] border border-[#E4DDD0] rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? 'تعديل الخبر' : 'نشر خبر أو تنبيه جديد'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 text-[#5A655F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">عنوان الخبر أو التنبيه *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={BLUEPRINT_CONSTRAINTS.announcement.titleMaxLength}
                className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">الأهمية</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                >
                  <option value="normal">خبر عادي</option>
                  <option value="important">تنبيه هام</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">النطاق</label>
                <select
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] px-3 text-sm"
                >
                  <option value="عموم محافظة قنا">عموم محافظة قنا</option>
                  {centers.map((c) => (
                    <option key={c.id} value={`مركز ${c.name}`}>
                      مركز {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">التفاصيل *</label>
              <textarea
                rows={3}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={BLUEPRINT_CONSTRAINTS.announcement.bodyMaxLength}
                className="w-full rounded-xl border border-[#DDD4C5] bg-[#FAF6F0] p-3 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#1E5248]"
              />
              <span>نشر وإظهار للمستخدمين</span>
            </label>

            {err && <p className="text-xs font-semibold text-[#B34338]">{err}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="min-h-[44px] px-4 rounded-xl border border-[#DDD4C5] text-sm font-semibold">
                إلغاء
              </button>
              <button type="submit" disabled={busyId === 'save-news'} className="flex-1 min-h-[44px] rounded-xl bg-[#1E5248] text-white text-sm font-bold">
                حفظ ونشر
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

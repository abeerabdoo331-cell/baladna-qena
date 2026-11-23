import { Center, Village } from '../types';

export const DEFAULT_QENA_CENTERS: Center[] = [
  { id: 'qena', name: 'قنا', order: 1, isActive: true },
  { id: 'qus', name: 'قوص', order: 2, isActive: true },
  { id: 'nag-hammadi', name: 'نجع حمادي', order: 3, isActive: true },
  { id: 'deshna', name: 'دشنا', order: 4, isActive: true },
  { id: 'abu-tesht', name: 'أبوتشت', order: 5, isActive: true },
  { id: 'farshout', name: 'فرشوط', order: 6, isActive: true },
  { id: 'naqada', name: 'نقادة', order: 7, isActive: true },
  { id: 'al-waqf', name: 'الوقف', order: 8, isActive: true },
  { id: 'qift', name: 'قفط', order: 9, isActive: true },
];

export const DEFAULT_QENA_VILLAGES: Village[] = [
  // قنا
  { id: 'qena-city', centerId: 'qena', name: 'مدينة قنا', order: 1, isActive: true },
  { id: 'qena-dandara', centerId: 'qena', name: 'دندرة', order: 2, isActive: true },
  { id: 'qena-mahrousa', centerId: 'qena', name: 'المحروسة', order: 3, isActive: true },
  { id: 'qena-taramsa', centerId: 'qena', name: 'الترامسة', order: 4, isActive: true },
  { id: 'qena-qanawia', centerId: 'qena', name: 'القناوية', order: 5, isActive: true },
  { id: 'qena-abnoud', centerId: 'qena', name: 'أبنود', order: 6, isActive: true },
  { id: 'qena-kalahin-ashraf', centerId: 'qena', name: 'الأشراف البحرية والقبلية', order: 7, isActive: true },
  // قوص
  { id: 'qus-city', centerId: 'qus', name: 'مدينة قوص', order: 1, isActive: true },
  { id: 'qus-hegaza-bahri', centerId: 'qus', name: 'حجازة بحري', order: 2, isActive: true },
  { id: 'qus-hegaza-qebli', centerId: 'qus', name: 'حجازة قبلي', order: 3, isActive: true },
  { id: 'qus-khozam', centerId: 'qus', name: 'خزام', order: 4, isActive: true },
  { id: 'qus-alaiqat', centerId: 'qus', name: 'العليقات', order: 5, isActive: true },
  { id: 'qus-maara', centerId: 'qus', name: 'المعرى', order: 6, isActive: true },
  { id: 'qus-garagos', centerId: 'qus', name: 'جراجوس', order: 7, isActive: true },
  // نجع حمادي
  { id: 'nag-city', centerId: 'nag-hammadi', name: 'مدينة نجع حمادي', order: 1, isActive: true },
  { id: 'nag-bahgoura', centerId: 'nag-hammadi', name: 'بهجورة', order: 2, isActive: true },
  { id: 'nag-hou', centerId: 'nag-hammadi', name: 'هو', order: 3, isActive: true },
  { id: 'nag-salamiya', centerId: 'nag-hammadi', name: 'السلامية', order: 4, isActive: true },
  { id: 'nag-rahmanya', centerId: 'nag-hammadi', name: 'الرحمانية قبلي', order: 5, isActive: true },
  { id: 'nag-qasr', centerId: 'nag-hammadi', name: 'القصر', order: 6, isActive: true },
  // دشنا
  { id: 'deshna-city', centerId: 'deshna', name: 'مدينة دشنا', order: 1, isActive: true },
  { id: 'deshna-samata', centerId: 'deshna', name: 'السمطا', order: 2, isActive: true },
  { id: 'deshna-faw', centerId: 'deshna', name: 'فاو قبلي وبحري', order: 3, isActive: true },
  { id: 'deshna-abu-mannaa', centerId: 'deshna', name: 'أبو مناع', order: 4, isActive: true },
  { id: 'deshna-azazia', centerId: 'deshna', name: 'العزيزية', order: 5, isActive: true },
  // أبوتشت
  { id: 'abutesht-city', centerId: 'abu-tesht', name: 'مدينة أبوتشت', order: 1, isActive: true },
  { id: 'abutesht-belad-mal', centerId: 'abu-tesht', name: 'بلاد المال', order: 2, isActive: true },
  { id: 'abutesht-qara', centerId: 'abu-tesht', name: 'القارة', order: 3, isActive: true },
  { id: 'abutesht-kom-ahmar', centerId: 'abu-tesht', name: 'الكوم الأحمر', order: 4, isActive: true },
  { id: 'abutesht-qosair', centerId: 'abu-tesht', name: 'قصير بخانس', order: 5, isActive: true },
  // فرشوط
  { id: 'farshout-city', centerId: 'farshout', name: 'مدينة فرشوط', order: 1, isActive: true },
  { id: 'farshout-arki', centerId: 'farshout', name: 'العركي', order: 2, isActive: true },
  { id: 'farshout-dehsa', centerId: 'farshout', name: 'الدهسة', order: 3, isActive: true },
  { id: 'farshout-kom-bega', centerId: 'farshout', name: 'كوم البيجا', order: 4, isActive: true },
  // نقادة
  { id: 'naqada-city', centerId: 'naqada', name: 'مدينة نقادة', order: 1, isActive: true },
  { id: 'naqada-toukh', centerId: 'naqada', name: 'طوخ', order: 2, isActive: true },
  { id: 'naqada-zawaida', centerId: 'naqada', name: 'الزوايدة', order: 3, isActive: true },
  { id: 'naqada-khattara', centerId: 'naqada', name: 'الخطارة', order: 4, isActive: true },
  // الوقف
  { id: 'alwaqf-city', centerId: 'al-waqf', name: 'مدينة الوقف', order: 1, isActive: true },
  { id: 'alwaqf-marashda', centerId: 'al-waqf', name: 'المراشدة', order: 2, isActive: true },
  { id: 'alwaqf-qalamina', centerId: 'al-waqf', name: 'القلمينا', order: 3, isActive: true },
  // قفط
  { id: 'qift-city', centerId: 'qift', name: 'مدينة قفط', order: 1, isActive: true },
  { id: 'qift-barahma', centerId: 'qift', name: 'البراهمة', order: 2, isActive: true },
  { id: 'qift-qalaa', centerId: 'qift', name: 'القلعة', order: 3, isActive: true },
  { id: 'qift-kalahin', centerId: 'qift', name: 'الكلاحين', order: 4, isActive: true },
  { id: 'qift-laqeita', centerId: 'qift', name: 'اللقيطة', order: 5, isActive: true },
];

import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // 1. السوق
  {
    id: 'qena-market',
    parentId: '',
    name: 'السوق',
    description: 'بيع وشراء المنتجات الجديدة والمستعملة مع الصور والسعر والوصف ووسيلة التواصل',
    iconKey: 'market',
    accentColor: '#567B35',
    order: 1,
    isActive: true,
  },
  // 2. الصحة
  {
    id: 'qena-health',
    parentId: '',
    name: 'الصحة',
    description: 'دليل الأطباء والعيادات والصيدليات والمعامل ومراكز الأشعة في قنا',
    iconKey: 'health',
    accentColor: '#247A6B',
    order: 2,
    isActive: true,
  },
  // 3. الخدمات
  {
    id: 'qena-services',
    parentId: '',
    name: 'الخدمات',
    description: 'دليل أصحاب الحرف والمهن مثل السباكة والكهرباء والنجارة والصيانة والديلفري',
    iconKey: 'services',
    accentColor: '#B5732C',
    order: 3,
    isActive: true,
  },
  // 4. الوظائف
  {
    id: 'qena-jobs',
    parentId: '',
    name: 'الوظائف',
    description: 'عرض فرص العمل المتاحة وإعلانات الباحثين عن عمل لأبناء قنا',
    iconKey: 'jobs',
    accentColor: '#485A8C',
    order: 4,
    isActive: true,
  },
  // 5. المواصلات
  {
    id: 'qena-transport',
    parentId: '',
    name: 'المواصلات',
    description: 'دليل السائقين وخدمات النقل داخل المحافظة وبين مراكزها وقراها',
    iconKey: 'transport',
    accentColor: '#28647A',
    order: 5,
    isActive: true,
  },
  // 6. المساعدات
  {
    id: 'qena-aid',
    parentId: '',
    name: 'المساعدات',
    description: 'المبادرات الخيرية وطلبات المساعدة والتطوع مع الحفاظ على خصوصية أصحاب الطلبات',
    iconKey: 'aid',
    accentColor: '#1E5248',
    order: 6,
    isActive: true,
  },

  // Internal Subcategories inside الصحة
  {
    id: 'qena-health-doctors',
    parentId: 'qena-health',
    name: 'أطباء وعيادات',
    description: 'الأطباء والعيادات في جميع التخصصات',
    iconKey: 'medical',
    accentColor: '#247A6B',
    order: 1,
    isActive: true,
  },
  {
    id: 'qena-health-pharmacies',
    parentId: 'qena-health',
    name: 'صيدليات',
    description: 'الصيدليات وخدمات التوصيل الدوائي',
    iconKey: 'health',
    accentColor: '#247A6B',
    order: 2,
    isActive: true,
  },
  {
    id: 'qena-health-labs',
    parentId: 'qena-health',
    name: 'معامل ومراكز أشعة',
    description: 'معامل التحاليل الطبية ومراكز الأشعة',
    iconKey: 'medical',
    accentColor: '#247A6B',
    order: 3,
    isActive: true,
  },

  // Internal Subcategories inside الخدمات
  {
    id: 'qena-services-crafts',
    parentId: 'qena-services',
    name: 'حرف وصيانة',
    description: 'سباكة وكهرباء ونجارة وتكييف وصيانة عامة',
    iconKey: 'crafts',
    accentColor: '#B5732C',
    order: 1,
    isActive: true,
  },
  {
    id: 'qena-services-delivery',
    parentId: 'qena-services',
    name: 'ديلفري ومشتريات',
    description: 'توصيل المشتريات والطلبات حسب خيارات صاحب الخدمة',
    iconKey: 'delivery',
    accentColor: '#1F7A70',
    order: 2,
    isActive: true,
  },
  {
    id: 'qena-services-teachers',
    parentId: 'qena-services',
    name: 'تعليم ومدرسين',
    description: 'المدرسين والمدرسات والدورات التعليمية',
    iconKey: 'education',
    accentColor: '#366591',
    order: 3,
    isActive: true,
  },
  {
    id: 'qena-services-home',
    parentId: 'qena-services',
    name: 'مشروعات منزلية',
    description: 'المخبوزات والأكلات البيتية والمشغولات اليدوية',
    iconKey: 'home',
    accentColor: '#A3554B',
    order: 4,
    isActive: true,
  },
];

export const QENA_CORE_MAIN_CATEGORY_IDS = new Set([
  'qena-market',
  'qena-health',
  'qena-services',
  'qena-jobs',
  'qena-transport',
  'qena-aid',
]);

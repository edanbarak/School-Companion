
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface ClassTemplate {
  id: string;
  name: string;
  teacher: string;
  itemsToBring: string[];
}

export interface ClassSchedule {
  id: string;
  templateId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
}

export interface Kid {
  id: string;
  name: string;
  age: number;
  grade: string;
  schedule: ClassSchedule[];
}

export interface AppData {
  kids: Kid[];
  templates: ClassTemplate[];
  imageMap: Record<string, string>;
  language: string;
}

export type AppView = 'home' | 'admin' | 'kid-detail';

export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'he', name: 'עברית (Hebrew)', dir: 'rtl' },
  { code: 'ar', name: 'العربية (Arabic)', dir: 'rtl' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
];

export const TRANSLATIONS: Record<string, any> = {
  en: {
    appName: 'KidSchedule',
    parentAssistant: 'Parent Assistant',
    goodMorning: 'Good morning!',
    todayIs: "It's {day}. Here's what needs packing.",
    classesToday: '{count} classes today',
    nothingNeeded: 'Nothing special needed',
    requiredFor: 'Required for {day}',
    todaysBag: "Today's Bag",
    weeklyPlanner: 'Weekly Planner',
    today: 'Today',
    week: 'Week',
    addClass: '+ Slot Class',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    kids: 'Kids',
    templates: 'Classes',
    debug: 'DB',
    language: 'Language',
    new: '+ New',
    kidProfiles: 'Kid Profiles',
    classTemplates: 'Class Templates',
    name: 'Name',
    age: 'Age',
    grade: 'Grade',
    teacher: 'Teacher',
    items: 'Items (comma separated)',
    update: 'Update',
    chooseClass: '-- Choose Class --',
    startTime: 'Start',
    endTime: 'End',
    timeConflict: 'Time conflict with another class',
    timeOrderError: 'End time must be after start time'
  },
  he: {
    appName: 'לו״ז הילדים',
    parentAssistant: 'עוזר הורים',
    goodMorning: 'בוקר טוב!',
    todayIs: 'היום {day}. הנה מה שצריך לארוז.',
    classesToday: '{count} שיעורים היום',
    nothingNeeded: 'לא צריך כלום במיוחד',
    requiredFor: 'נדרש ליום {day}',
    todaysBag: 'התיק להיום',
    weeklyPlanner: 'תכנון שבועי',
    today: 'היום',
    week: 'שבוע',
    addClass: '+ שבוץ שיעור',
    edit: 'עריכה',
    save: 'שמירה',
    cancel: 'ביטול',
    kids: 'ילדים',
    templates: 'שיעורים',
    debug: 'מסד נתונים',
    language: 'שפה',
    new: '+ חדש',
    kidProfiles: 'פרופילי ילדים',
    classTemplates: 'תבניות שיעורים',
    name: 'שם',
    age: 'גיל',
    grade: 'כיתה',
    teacher: 'מורה',
    items: 'פריטים (מופרדים בפסיק)',
    update: 'עדכון',
    chooseClass: '-- בחר שיעור --',
    startTime: 'התחלה',
    endTime: 'סיום',
    timeConflict: 'ישנה כפילות בזמנים עם שיעור אחר',
    timeOrderError: 'זמן הסיום חייב להיות אחרי זמן ההתחלה'
  },
  ar: {
    appName: 'جدول الأطفال',
    parentAssistant: 'مساعد الوالدين',
    goodMorning: 'صباح الخير!',
    todayIs: 'اليوم هو {day}. إليك ما يجب تعبئته.',
    classesToday: '{count} حصص اليوم',
    nothingNeeded: 'لا شيء مطلوب خصيصاً',
    requiredFor: 'مطلوب ليوم {day}',
    todaysBag: 'حقيبة اليوم',
    weeklyPlanner: 'المخطط الأسبوعي',
    today: 'اليوم',
    week: 'الأسبوع',
    addClass: '+ إضافة حصة',
    edit: 'تعديل',
    save: 'حفظ',
    cancel: 'إلغاء',
    kids: 'أطفال',
    templates: 'حصص',
    debug: 'DB',
    language: 'اللغة',
    new: '+ جديد',
    kidProfiles: 'ملفات الأطفال',
    classTemplates: 'قوالب الحصص',
    name: 'الاسم',
    age: 'العمر',
    grade: 'الصف',
    teacher: 'المعلم',
    items: 'الأغراض (مفصولة بفواصل)',
    update: 'تحديث',
    chooseClass: '-- اختر الحصة --',
    startTime: 'البداية',
    endTime: 'النهاية',
    timeConflict: 'تعارض في الوقت مع حصة أخرى',
    timeOrderError: 'وقت الانتهاء يجب أن يكون بعد وقت البدء'
  }
};

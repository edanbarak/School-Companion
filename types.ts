
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface ClassTemplate {
  id: string;
  name: string;
  teacher: string;
  itemsToBring: string[];
}

export interface ClassSchedule {
  id: string;
  templateId: string; // Reference to the ClassTemplate
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
  imageMap: Record<string, string>; // Maps item name to base64 image data
}

export type AppView = 'home' | 'admin' | 'kid-detail';

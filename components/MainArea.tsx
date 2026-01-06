
import React from 'react';
import { Kid, DayOfWeek, ClassTemplate, TRANSLATIONS } from '../types';
import ItemImage from './ItemImage';

interface Props {
  kids: Kid[];
  templates: ClassTemplate[];
  imageMap: Record<string, string>;
  lang: string;
  onSelectKid: (id: string) => void;
  onImageGenerated: (itemName: string, base64: string) => void;
  onGoToSettings: () => void;
}

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const MainArea: React.FC<Props> = ({ kids, templates, imageMap, lang, onSelectKid, onImageGenerated, onGoToSettings }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRTL = lang === 'he' || lang === 'ar';
  
  const getToday = (): DayOfWeek => {
    const day = new Date().getDay();
    if (day === 6) return 'Sunday';
    return DAYS[day] || 'Sunday';
  };

  const today = getToday();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900">{t.goodMorning}</h2>
        <p className="text-slate-500 font-medium">
          {t.todayIs.replace('{day}', today)}
        </p>
      </div>

      <div className="space-y-5">
        {kids.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 border-4 border-white shadow-xl">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
             </div>
             <div className="space-y-2">
               <p className="text-slate-800 font-extrabold text-xl">Welcome to School Buddy</p>
               <p className="text-slate-400 font-medium text-sm px-8">Let's get started by adding your children and their class schedules.</p>
             </div>
             <button 
                onClick={onGoToSettings}
                className="premium-gradient text-white px-8 py-4 rounded-2xl font-extrabold shadow-2xl active:scale-95 transition-all flex items-center gap-3"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Your First Kid</span>
             </button>
          </div>
        ) : kids.map(kid => {
          const todaySchedule = kid.schedule.filter(s => s.dayOfWeek === today);
          const packingList = Array.from(new Set(
            todaySchedule.flatMap(s => {
              const template = templates.find(temp => temp.id === s.templateId);
              return template ? template.itemsToBring : [];
            })
          )).filter(Boolean);
          
          return (
            <button
              key={kid.id}
              onClick={() => onSelectKid(kid.id)}
              className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 ios-shadow-lg flex flex-col group active:scale-[0.98] transition-all text-start relative overflow-hidden"
            >
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors" />
              
              <div className="flex items-center mb-6 relative z-10">
                <div className="w-14 h-14 premium-gradient rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg group-hover:scale-110 transition-transform">
                  {kid.name.charAt(0)}
                </div>
                <div className={`${isRTL ? 'mr-5' : 'ml-5'} flex-1`}>
                  <h4 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{kid.name}</h4>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                    {t.classesToday.replace('{count}', todaySchedule.length.toString())}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <div className="flex flex-wrap gap-2.5 relative z-10">
                {packingList.length > 0 ? (
                  packingList.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm group-hover:bg-white transition-colors">
                      <ItemImage itemName={item} size="sm" cachedImage={imageMap[item]} onImageGenerated={onImageGenerated} />
                      <span className="text-[11px] font-bold">
                        {item.toLowerCase().startsWith('book:') ? item.substring(5).trim() : item}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-slate-300 py-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-xs font-medium italic">{t.nothingNeeded}</p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MainArea;

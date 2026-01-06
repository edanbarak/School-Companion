
import React from 'react';
import { Kid, DayOfWeek, ClassTemplate } from '../types';
import ItemImage from './ItemImage';

interface Props {
  kids: Kid[];
  templates: ClassTemplate[];
  imageMap: Record<string, string>;
  onSelectKid: (id: string) => void;
  onImageGenerated: (itemName: string, base64: string) => void;
}

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const MainArea: React.FC<Props> = ({ kids, templates, imageMap, onSelectKid, onImageGenerated }) => {
  const getToday = (): DayOfWeek => {
    const day = new Date().getDay();
    if (day === 6) return 'Sunday';
    return DAYS[day] || 'Sunday';
  };

  const today = getToday();

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Good morning!</h2>
        <p className="text-indigo-700">It's {today}. Here's what needs packing.</p>
      </div>

      <div className="space-y-4">
        {kids.map(kid => {
          const todaySchedule = kid.schedule.filter(s => s.dayOfWeek === today);
          const packingList = Array.from(new Set(
            todaySchedule.flatMap(s => {
              const t = templates.find(temp => temp.id === s.templateId);
              return t ? t.itemsToBring : [];
            })
          )).filter(Boolean);
          
          return (
            <button
              key={kid.id}
              onClick={() => onSelectKid(kid.id)}
              className="w-full bg-white p-6 rounded-3xl border border-slate-100 ios-shadow flex flex-col group active:scale-95 transition-all text-left"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-lg mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {kid.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800">{kid.name}</h4>
                  <p className="text-slate-500 text-sm">{todaySchedule.length} classes today</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {packingList.length > 0 ? (
                  packingList.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100">
                      <ItemImage itemName={item} size="sm" cachedImage={imageMap[item]} onImageGenerated={onImageGenerated} />
                      <span className="text-[10px] font-bold">
                        {item.toLowerCase().startsWith('book:') ? item.substring(5).trim() : item}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Nothing special needed</p>
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

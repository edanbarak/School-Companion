
import React, { useState } from 'react';
import { Kid, ClassSchedule, DayOfWeek, ClassTemplate, TRANSLATIONS } from '../types';
import ItemImage from './ItemImage';

interface Props {
  kid: Kid;
  templates: ClassTemplate[];
  imageMap: Record<string, string>;
  lang: string;
  onBack: () => void;
  onUpdateKid: (kid: Kid) => void;
  onImageNeeded: (itemName: string) => void;
}

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const KidDetail: React.FC<Props> = ({ kid, templates, imageMap, lang, onBack, onUpdateKid, onImageNeeded }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ClassSchedule | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRTL = lang === 'he' || lang === 'ar';

  const getToday = (): DayOfWeek => {
    const day = new Date().getDay();
    if (day === 6) return 'Sunday';
    return DAYS[day] || 'Sunday';
  };

  const today = getToday();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);
  const activeDay = viewMode === 'today' ? today : selectedDay;

  const currentSchedule = kid.schedule
    .filter(s => s.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todaySummary = Array.from(new Set(
    kid.schedule
      .filter(s => s.dayOfWeek === today)
      .flatMap(s => {
        const temp = templates.find(temp => temp.id === s.templateId);
        return temp ? temp.itemsToBring : [];
      })
  )).filter(Boolean);

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (startTime >= endTime) {
      setError(t.timeOrderError);
      return;
    }

    const newSlot: ClassSchedule = {
      id: editingSlot?.id || Date.now().toString(),
      templateId: formData.get('templateId') as string,
      dayOfWeek: formData.get('dayOfWeek') as DayOfWeek,
      startTime,
      endTime,
    };

    const updated = editingSlot 
      ? kid.schedule.map(s => s.id === editingSlot.id ? newSlot : s)
      : [...kid.schedule, newSlot];

    onUpdateKid({ ...kid, schedule: updated });
    setShowAddForm(false);
    setEditingSlot(null);
    setError(null);
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-all transform flip-rtl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{kid.name}</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">{viewMode === 'today' ? t.todaysBag : t.weeklyPlanner}</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[1.2rem] shadow-inner">
          <button onClick={() => setViewMode('today')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'today' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>{t.today}</button>
          <button onClick={() => setViewMode('week')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>{t.week}</button>
        </div>
      </div>

      <div className="premium-gradient p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
        
        <h3 className="font-bold text-sm uppercase mb-6 text-white/80 tracking-widest flex items-center gap-2">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 118 0m-4 8v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
           </svg>
           {t.requiredFor.replace('{day}', t.days[today] || today)}
        </h3>
        
        <div className="grid grid-cols-2 gap-5">
          {todaySummary.length > 0 ? todaySummary.map((item, idx) => (
            <div key={idx} className="bg-white/10 p-5 rounded-[1.8rem] flex flex-col items-center text-center gap-4 border border-white/20 backdrop-blur-xl shadow-lg hover:bg-white/15 transition-colors group/item">
              <div className="w-24 h-24 relative">
                <ItemImage itemName={item} size="md" cachedImage={imageMap[item]} onImageNeeded={onImageNeeded} />
                <div className="absolute -bottom-2 -right-2 bg-emerald-400 text-white rounded-full p-1.5 border-4 border-white shadow-lg group-hover/item:scale-110 transition-transform">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
              <span className={`text-white font-bold leading-tight ${isRTL ? 'text-lg' : 'text-xs uppercase tracking-tight'}`}>
                {item.toLowerCase().startsWith('book:') ? item.substring(5).trim() : item}
              </span>
            </div>
          )) : (
            <div className="col-span-2 py-10 text-center text-white/60 space-y-2">
              <div className="text-4xl">🎉</div>
              <p className="text-sm font-medium italic">{t.nothingNeeded}</p>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="flex overflow-x-auto gap-3 py-2 no-scrollbar px-1">
          {DAYS.map(day => (
            <button key={day} onClick={() => setSelectedDay(day)} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-bold transition-all border-2 ${selectedDay === day ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
              {(t.days[day] || day).substring(0, 3)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">{t.days[activeDay] || activeDay}</h3>
          </div>
          <button onClick={() => { setEditingSlot(null); setShowAddForm(true); setError(null); }} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl active:scale-95 transition-all">{t.addClass}</button>
        </div>

        <div className="space-y-4">
          {currentSchedule.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
              <p className="text-slate-400 text-sm font-medium">{t.noClasses}</p>
            </div>
          ) : currentSchedule.map(slot => {
            const temp = templates.find(tm => tm.id === slot.templateId);
            return (
              <div key={slot.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{temp?.name}</h4>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.teacher}: {temp?.teacher}</p>
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-extrabold text-slate-500 border border-slate-100" dir="ltr">
                    {slot.startTime} – {slot.endTime}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setEditingSlot(slot); setShowAddForm(true); setError(null); }} className="p-3 text-indigo-500 bg-indigo-50/50 rounded-2xl hover:bg-indigo-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onUpdateKid({...kid, schedule: kid.schedule.filter(s => s.id !== slot.id)})} className="p-3 text-rose-500 bg-rose-50/50 rounded-2xl hover:bg-rose-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(showAddForm || editingSlot) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-extrabold text-slate-900">{editingSlot ? t.edit : t.save}</h3>
              <button onClick={() => { setShowAddForm(false); setEditingSlot(null); setError(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 animate-bounce">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSaveSlot} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.classTemplates}</label>
                <select required name="templateId" defaultValue={editingSlot?.templateId} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-semibold">
                  <option value="">{t.chooseClass}</option>
                  {templates.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.week}</label>
                <select name="dayOfWeek" defaultValue={editingSlot?.dayOfWeek || activeDay} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-semibold">
                  {DAYS.map(d => <option key={d} value={d}>{t.days[d] || d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.startTime}</label>
                  <input required name="startTime" type="time" defaultValue={editingSlot?.startTime || '08:00'} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.endTime}</label>
                  <input required name="endTime" type="time" defaultValue={editingSlot?.endTime || '09:00'} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold" />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-[2] premium-gradient text-white py-4 rounded-2xl font-extrabold shadow-xl active:scale-95 transition-all">{t.save}</button>
                <button type="button" onClick={() => { setShowAddForm(false); setEditingSlot(null); setError(null); }} className="flex-1 bg-slate-100 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidDetail;

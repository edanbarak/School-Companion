
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
  onImageGenerated: (itemName: string, base64: string) => void;
}

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const KidDetail: React.FC<Props> = ({ kid, templates, imageMap, lang, onBack, onUpdateKid, onImageGenerated }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ClassSchedule | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

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

  const isOverlapping = (newSlot: ClassSchedule): boolean => {
    return kid.schedule.some(existing => {
      if (existing.dayOfWeek !== newSlot.dayOfWeek || existing.id === newSlot.id) return false;
      return newSlot.startTime < existing.endTime && newSlot.endTime > existing.startTime;
    });
  };

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

    if (isOverlapping(newSlot)) {
      setError(t.timeConflict);
      return;
    }

    const updated = editingSlot 
      ? kid.schedule.map(s => s.id === editingSlot.id ? newSlot : s)
      : [...kid.schedule, newSlot];

    onUpdateKid({ ...kid, schedule: updated });
    setShowAddForm(false);
    setEditingSlot(null);
    setError(null);
  };

  const isRTL = lang === 'he' || lang === 'ar';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -mx-2 text-indigo-600 transform flip-rtl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{kid.name}</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">{viewMode === 'today' ? t.todaysBag : t.weeklyPlanner}</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('today')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${viewMode === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{t.today}</button>
          <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{t.week}</button>
        </div>
      </div>

      <div className="bg-emerald-600 text-white p-6 rounded-3xl ios-shadow">
        <h3 className={`font-bold text-xs uppercase mb-5 text-emerald-100 tracking-wider ${isRTL ? 'text-sm tracking-normal uppercase-none' : ''}`}>
          {t.requiredFor.replace('{day}', today)}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {todaySummary.length > 0 ? todaySummary.map((item, idx) => (
            <div key={idx} className="bg-white/10 p-4 rounded-2xl flex flex-col items-center text-center gap-3 border border-white/20 backdrop-blur-md shadow-lg relative min-h-[160px]">
              <span className={`item-text-hebrew text-white line-clamp-2 w-full flex items-center justify-center h-12 ${isRTL ? 'text-lg' : 'text-xs uppercase tracking-tight font-extrabold'}`}>
                {item.toLowerCase().startsWith('book:') ? item.substring(5).trim() : item}
              </span>
              <div className="w-20 h-20 relative">
                <ItemImage itemName={item} size="md" cachedImage={imageMap[item]} onImageGenerated={onImageGenerated} />
              </div>
              <div className="absolute top-2 end-2 bg-emerald-400 text-emerald-900 rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold border-2 border-emerald-600 shadow-md">✓</div>
            </div>
          )) : <p className="text-emerald-50 text-sm italic col-span-2">{t.nothingNeeded}</p>}
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="flex overflow-x-auto gap-2 py-1 no-scrollbar">
          {DAYS.map(day => (
            <button key={day} onClick={() => setSelectedDay(day)} className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${selectedDay === day ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>{day.substring(0, 3)}</button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeDay}</h3>
          <button onClick={() => { setEditingSlot(null); setShowAddForm(true); setError(null); }} className="text-indigo-600 font-bold text-sm">{t.addClass}</button>
        </div>

        <div className="space-y-3">
          {currentSchedule.map(slot => {
            const temp = templates.find(tm => tm.id === slot.templateId);
            return (
              <div key={slot.id} className="bg-white border rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{temp?.name}</h4>
                    <p className="text-xs text-slate-500">{t.teacher}: {temp?.teacher}</p>
                  </div>
                  <div className="text-end text-xs font-bold text-slate-400" dir="ltr">{slot.startTime} - {slot.endTime}</div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                  <button onClick={() => { setEditingSlot(slot); setShowAddForm(true); setError(null); }} className="p-2 text-indigo-500 bg-indigo-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onUpdateKid({...kid, schedule: kid.schedule.filter(s => s.id !== slot.id)})} className="p-2 text-rose-500 bg-rose-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(showAddForm || editingSlot) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold">{editingSlot ? t.edit : t.save}</h3>
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100">
                {error}
              </div>
            )}
            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.templates}</label>
                <select required name="templateId" defaultValue={editingSlot?.templateId} className="w-full p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-sm">
                  <option value="">{t.chooseClass}</option>
                  {templates.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.week}</label>
                <select name="dayOfWeek" defaultValue={editingSlot?.dayOfWeek || activeDay} className="w-full p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-sm">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.startTime}</label>
                  <input required name="startTime" type="time" defaultValue={editingSlot?.startTime || '08:00'} className="w-full p-3 rounded-xl border border-slate-200 shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.endTime}</label>
                  <input required name="endTime" type="time" defaultValue={editingSlot?.endTime || '09:00'} className="w-full p-3 rounded-xl border border-slate-200 shadow-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all">{t.save}</button>
                <button type="button" onClick={() => { setShowAddForm(false); setEditingSlot(null); setError(null); }} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidDetail;

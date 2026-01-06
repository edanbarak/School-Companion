
import React, { useState } from 'react';
import { Kid, ClassSchedule, DayOfWeek, ClassTemplate } from '../types';
import ItemImage from './ItemImage';

interface Props {
  kid: Kid;
  templates: ClassTemplate[];
  imageMap: Record<string, string>;
  onBack: () => void;
  onUpdateKid: (kid: Kid) => void;
  onImageGenerated: (itemName: string, base64: string) => void;
}

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const KidDetail: React.FC<Props> = ({ kid, templates, imageMap, onBack, onUpdateKid, onImageGenerated }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ClassSchedule | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [error, setError] = useState<string | null>(null);

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
        const t = templates.find(temp => temp.id === s.templateId);
        return t ? t.itemsToBring : [];
      })
  )).filter(Boolean);

  const isOverlapping = (newSlot: ClassSchedule): boolean => {
    return kid.schedule.some(existing => {
      // Only check same day, and skip if we are editing the same slot
      if (existing.dayOfWeek !== newSlot.dayOfWeek || existing.id === newSlot.id) return false;

      const newStart = newSlot.startTime;
      const newEnd = newSlot.endTime;
      const existStart = existing.startTime;
      const existEnd = existing.endTime;

      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return newStart < existEnd && newEnd > existStart;
    });
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.target as HTMLFormElement);
    
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    const newSlot: ClassSchedule = {
      id: editingSlot?.id || Date.now().toString(),
      templateId: formData.get('templateId') as string,
      dayOfWeek: formData.get('dayOfWeek') as DayOfWeek,
      startTime: startTime,
      endTime: endTime,
    };

    if (isOverlapping(newSlot)) {
      const existing = kid.schedule.find(s => 
        s.dayOfWeek === newSlot.dayOfWeek && 
        s.id !== newSlot.id && 
        newSlot.startTime < s.endTime && 
        newSlot.endTime > s.startTime
      );
      const template = templates.find(t => t.id === existing?.templateId);
      setError(`Time conflict with ${template?.name || 'another class'} (${existing?.startTime}-${existing?.endTime})`);
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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{kid.name}</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{viewMode === 'today' ? `Today's Bag` : 'Weekly Planner'}</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('today')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${viewMode === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Today</button>
          <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Week</button>
        </div>
      </div>

      <div className="bg-emerald-600 text-white p-6 rounded-3xl ios-shadow">
        <h3 className="font-bold text-xs uppercase mb-5 text-emerald-100 tracking-wider">Required for {today}</h3>
        <div className="grid grid-cols-2 gap-4">
          {todaySummary.length > 0 ? todaySummary.map((item, idx) => (
            <div key={idx} className="bg-white/10 p-4 rounded-2xl flex flex-col items-center text-center gap-3 border border-white/20 backdrop-blur-md shadow-lg relative">
              <span className="text-[10px] font-extrabold uppercase tracking-tight text-white line-clamp-2 w-full leading-tight h-8 flex items-center justify-center">
                {item.toLowerCase().startsWith('book:') ? item.substring(5).trim() : item}
              </span>
              <div className="w-24 h-24 relative">
                <ItemImage itemName={item} size="md" cachedImage={imageMap[item]} onImageGenerated={onImageGenerated} />
              </div>
              <div className="absolute top-2 right-2 bg-emerald-400 text-emerald-900 rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold border-2 border-emerald-600 shadow-md">✓</div>
            </div>
          )) : <p className="text-emerald-50 text-sm italic col-span-2">Nothing needed today</p>}
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeDay} Schedule</h3>
          <button onClick={() => { setEditingSlot(null); setShowAddForm(true); setError(null); }} className="text-indigo-600 font-bold text-sm">+ Slot Class</button>
        </div>

        <div className="space-y-3">
          {currentSchedule.map(slot => {
            const t = templates.find(temp => temp.id === slot.templateId);
            return (
              <div key={slot.id} className="bg-white border rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{t?.name || 'Unknown Class'}</h4>
                    <p className="text-xs text-slate-500">with {t?.teacher}</p>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-400">{slot.startTime} - {slot.endTime}</div>
                </div>

                {t?.itemsToBring && t.itemsToBring.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {t.itemsToBring.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                        <ItemImage itemName={item} size="sm" cachedImage={imageMap[item]} onImageGenerated={onImageGenerated} />
                        <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[80px]">
                          {item.toLowerCase().startsWith('book:') ? item.substring(5).trim() : item}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

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
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">{editingSlot ? 'Edit' : 'Schedule'} Class</h3>
            
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Class from Master List</label>
                <select required name="templateId" defaultValue={editingSlot?.templateId} className="w-full p-3 bg-white rounded-xl border border-slate-200 ring-1 ring-slate-100 shadow-sm">
                  <option value="">-- Choose Class --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Day</label>
                <select name="dayOfWeek" defaultValue={editingSlot?.dayOfWeek || activeDay} className="w-full p-3 bg-white rounded-xl border border-slate-200 ring-1 ring-slate-100 shadow-sm">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Start</label>
                  <input required name="startTime" type="time" defaultValue={editingSlot?.startTime || '08:00'} className="w-full p-3 bg-white rounded-xl border border-slate-200 ring-1 ring-slate-100 shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">End</label>
                  <input required name="endTime" type="time" defaultValue={editingSlot?.endTime || '09:00'} className="w-full p-3 bg-white rounded-xl border border-slate-200 ring-1 ring-slate-100 shadow-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Slot</button>
                <button type="button" onClick={() => { setShowAddForm(false); setEditingSlot(null); setError(null); }} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidDetail;


import React, { useState } from 'react';
import { Kid, ClassTemplate, AppData, LANGUAGES, TRANSLATIONS } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  data: AppData;
  onUpdateData: (data: AppData) => void;
  onImageGenerated: (itemName: string, base64: string) => Promise<string>;
}

const AdminArea: React.FC<Props> = ({ data, onUpdateData, onImageGenerated }) => {
  const [activeTab, setActiveTab] = useState<'kids' | 'templates' | 'language' | 'debug'>('kids');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [importText, setImportText] = useState('');
  
  const t = TRANSLATIONS[data.language] || TRANSLATIONS.en;
  const isRTL = data.language === 'he' || data.language === 'ar';

  const [newKid, setNewKid] = useState({ name: '', age: '', grade: '' });
  const [newTemplate, setNewTemplate] = useState({ name: '', teacher: '', items: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingKidId, setEditingKidId] = useState<string | null>(null);

  // Use @google/genai to generate images for items
  const generateSingleImage = async (itemName: string): Promise<string | null> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return null;
      const ai = new GoogleGenAI({ apiKey });
      const isBook = itemName.toLowerCase().startsWith('book:');
      const searchPrompt = isBook 
        ? `The front cover of the school book titled "${itemName.substring(5).trim()}". Vibrant colors, high resolution.`
        : `A high-quality minimalist icon of a ${itemName} for school. Solid white background.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: searchPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error(`Generation failed for ${itemName}`, e);
    }
    return null;
  };

  const handleAddKid = () => {
    if (!newKid.name || !newKid.age) return;
    if (editingKidId) {
      const updatedKids = data.kids.map(k => k.id === editingKidId ? {
        ...k,
        name: newKid.name,
        age: parseInt(newKid.age),
        grade: newKid.grade
      } : k);
      onUpdateData({ ...data, kids: updatedKids });
    } else {
      const kid: Kid = { id: Date.now().toString(), name: newKid.name, age: parseInt(newKid.age), grade: newKid.grade, schedule: [] };
      onUpdateData({ ...data, kids: [...data.kids, kid] });
    }
    setNewKid({ name: '', age: '', grade: '' });
    setEditingKidId(null);
    setShowAddForm(false);
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.name) return;
    setIsGeneratingImages(true);
    
    const items = newTemplate.items.split(',').map(i => i.trim()).filter(Boolean);
    const generatedMappings: Record<string, string> = {};
    
    for (const item of items) {
      if (!data.imageMap[item]) {
        const b64 = await generateSingleImage(item);
        if (b64) {
          const cachedUrl = await onImageGenerated(item, b64);
          generatedMappings[item] = cachedUrl;
        }
      }
    }

    const template: ClassTemplate = {
      id: editingTemplateId || Date.now().toString(),
      name: newTemplate.name,
      teacher: newTemplate.teacher,
      itemsToBring: items
    };

    const updatedTemplates = editingTemplateId 
      ? data.templates.map(t => t.id === editingTemplateId ? template : t)
      : [...data.templates, template];

    onUpdateData({
      ...data,
      templates: updatedTemplates,
      imageMap: { ...data.imageMap, ...generatedMappings }
    });
    
    setNewTemplate({ name: '', teacher: '', items: '' });
    setEditingTemplateId(null);
    setShowAddForm(false);
    setIsGeneratingImages(false);
  };

  // Fixed handleImport implementation
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (parsed && typeof parsed === 'object') {
        onUpdateData(parsed as AppData);
        setImportText('');
        alert('Data restored successfully');
      }
    } catch (e) {
      console.error("Restoration failed", e);
      alert('Invalid backup string');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Sliding Tab Navigator */}
      <div className="relative flex bg-slate-100 p-1.5 rounded-2xl mx-1 shadow-inner">
        {['kids', 'templates', 'language', 'debug'].map((tab) => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab as any); setShowAddForm(false); }}
            className={`flex-1 relative z-10 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t[tab] || tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'language' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-slate-900 px-1">{t.language}</h2>
          <div className="grid grid-cols-1 gap-3">
            {[...LANGUAGES].map(lang => (
              <button
                key={lang.code}
                onClick={() => onUpdateData({ ...data, language: lang.code })}
                className={`w-full p-5 rounded-[1.8rem] border-2 text-start flex justify-between items-center transition-all ${data.language === lang.code ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-4 ring-indigo-500/10' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                dir={lang.dir}
              >
                <span className="font-bold text-base">{lang.name}</span>
                {data.language === lang.code && (
                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab !== 'debug' && activeTab !== 'language' && (
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {activeTab === 'kids' ? t.kidProfiles : t.classTemplates}
            </h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">
              {activeTab === 'kids' ? `${data.kids.length} Managed` : `${data.templates.length} Saved`}
            </p>
          </div>
          <button 
            disabled={isGeneratingImages}
            onClick={() => setShowAddForm(!showAddForm)}
            className="premium-gradient text-white px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {showAddForm ? t.cancel : t.new}
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-8 rounded-[2.5rem] space-y-5 border-2 border-indigo-50 shadow-2xl animate-in zoom-in-95 duration-300">
          <h3 className="text-lg font-extrabold text-slate-800">
            {activeTab === 'kids' ? 'Create New Profile' : 'Configure Class'}
          </h3>
          
          {activeTab === 'kids' ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.name}</label>
                <input className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold" placeholder="e.g. Leo Smith" value={newKid.name} onChange={e => setNewKid({...newKid, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.age}</label>
                  <input className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold" placeholder="Years" type="number" value={newKid.age} onChange={e => setNewKid({...newKid, age: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.grade}</label>
                  <input className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold" placeholder="Level" value={newKid.grade} onChange={e => setNewKid({...newKid, grade: e.target.value})} />
                </div>
              </div>
              <button onClick={handleAddKid} className="w-full premium-gradient text-white py-4 rounded-2xl font-extrabold shadow-xl mt-2 active:scale-95 transition-all">
                {editingKidId ? t.update : t.save}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class {t.name}</label>
                <input className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold" placeholder="e.g. Biology, Art..." value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.teacher}</label>
                <input className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold" placeholder="Instructor name" value={newTemplate.teacher} onChange={e => setNewTemplate({...newTemplate, teacher: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.items}</label>
                <textarea className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-semibold h-24" placeholder="Notebook, Pen, Calculator..." value={newTemplate.items} onChange={e => setNewTemplate({...newTemplate, items: e.target.value})} />
              </div>
              <button onClick={handleAddTemplate} disabled={isGeneratingImages} className="w-full premium-gradient text-white py-4 rounded-2xl font-extrabold shadow-xl mt-2 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95 transition-all">
                {isGeneratingImages ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Visualizing items...</span>
                  </>
                ) : (editingTemplateId ? t.update : t.save)}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {activeTab === 'kids' && data.kids.map(kid => (
          <div key={kid.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {kid.name.charAt(0)}
               </div>
               <div>
                 <p className="font-extrabold text-slate-800 text-base">{kid.name}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kid.grade} • {kid.age} yrs</p>
               </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingKidId(kid.id); setNewKid({ name: kid.name, age: kid.age.toString(), grade: kid.grade }); setShowAddForm(true); }} className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => onUpdateData({...data, kids: data.kids.filter(k => k.id !== kid.id)})} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
        {activeTab === 'templates' && data.templates.map(temp => (
          <div key={temp.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </div>
               <div>
                 <p className="font-extrabold text-slate-800 text-base">{temp.name}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.teacher}: {temp.teacher}</p>
               </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingTemplateId(temp.id); setNewTemplate({ name: temp.name, teacher: temp.teacher, items: temp.itemsToBring.join(', ') }); setShowAddForm(true); }} className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => onUpdateData({...data, templates: data.templates.filter(t => t.id !== temp.id)})} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'debug' && (
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 space-y-6 shadow-sm">
             <div className="space-y-1">
               <h3 className="font-extrabold text-slate-800 text-lg">System Vault</h3>
               <p className="text-xs font-semibold text-slate-400">Export or restore your profile data here.</p>
             </div>
             <div className="space-y-3">
               <textarea 
                 readOnly 
                 className="w-full h-40 p-5 text-[10px] font-mono bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-600"
                 value={JSON.stringify(data, null, 2)}
                 onClick={(e) => (e.target as HTMLTextAreaElement).select()}
               />
               <div className="pt-2 space-y-4">
                 <textarea 
                   placeholder="Paste system backup string..."
                   className="w-full h-24 p-5 text-[10px] font-mono bg-white border border-slate-100 rounded-[1.5rem]"
                   value={importText}
                   onChange={(e) => setImportText(e.target.value)}
                 />
                 <button 
                   onClick={handleImport}
                   className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-extrabold shadow-xl active:scale-95 transition-all"
                 >
                   Perform Restoration
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminArea;

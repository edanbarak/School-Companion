
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

  const [newKid, setNewKid] = useState({ name: '', age: '', grade: '' });
  const [newTemplate, setNewTemplate] = useState({ name: '', teacher: '', items: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingKidId, setEditingKidId] = useState<string | null>(null);

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
    
    // Process items and generate images if missing
    for (const item of items) {
      if (!data.imageMap[item]) {
        console.log(`Generating missing image for: ${item}`);
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

    // Persist all data at once including the new image mappings
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

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (parsed.kids && Array.isArray(parsed.kids)) {
        onUpdateData(parsed);
        alert('Data imported successfully!');
        setImportText('');
      }
    } catch (e) {
      alert('Invalid JSON data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl mx-1 overflow-x-auto no-scrollbar">
        {['kids', 'templates', 'language', 'debug'].map((tab) => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab as any); setShowAddForm(false); }}
            className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            {t[tab] || tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'language' && (
        <div className="space-y-4 px-2">
          <h2 className="text-xl font-bold text-slate-800">{t.language}</h2>
          <div className="grid grid-cols-1 gap-2">
            {[...LANGUAGES].map(lang => (
              <button
                key={lang.code}
                onClick={() => onUpdateData({ ...data, language: lang.code })}
                className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${data.language === lang.code ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700' : 'bg-white text-slate-600 border-slate-200'}`}
                dir={lang.dir}
              >
                <span>{lang.name}</span>
                {data.language === lang.code && <span className="text-indigo-600">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab !== 'debug' && activeTab !== 'language' && (
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'kids' ? t.kidProfiles : t.classTemplates}
          </h2>
          <button 
            disabled={isGeneratingImages}
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {showAddForm ? t.cancel : t.new}
          </button>
        </div>
      )}

      {showAddForm && activeTab === 'kids' && (
        <div className="bg-indigo-50 p-6 rounded-2xl space-y-4 border border-indigo-100">
          <input className="w-full p-3 rounded-xl border border-slate-200 bg-white" placeholder={t.name} value={newKid.name} onChange={e => setNewKid({...newKid, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full p-3 rounded-xl border border-slate-200 bg-white" placeholder={t.age} type="number" value={newKid.age} onChange={e => setNewKid({...newKid, age: e.target.value})} />
            <input className="w-full p-3 rounded-xl border border-slate-200 bg-white" placeholder={t.grade} value={newKid.grade} onChange={e => setNewKid({...newKid, grade: e.target.value})} />
          </div>
          <button onClick={handleAddKid} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">
            {editingKidId ? t.update : t.save}
          </button>
        </div>
      )}

      {showAddForm && activeTab === 'templates' && (
        <div className="bg-indigo-50 p-6 rounded-2xl space-y-4 border border-indigo-100">
          <input className="w-full p-3 rounded-xl border border-slate-200 bg-white" placeholder={t.name} value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
          <input className="w-full p-3 rounded-xl border border-slate-200 bg-white" placeholder={t.teacher} value={newTemplate.teacher} onChange={e => setNewTemplate({...newTemplate, teacher: e.target.value})} />
          <textarea className="w-full p-3 rounded-xl border border-slate-200 h-24 bg-white" placeholder={t.items} value={newTemplate.items} onChange={e => setNewTemplate({...newTemplate, items: e.target.value})} />
          <button onClick={handleAddTemplate} disabled={isGeneratingImages} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            {isGeneratingImages ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingTemplateId ? t.update : t.save)}
          </button>
        </div>
      )}

      {activeTab === 'debug' && (
        <div className="space-y-4 px-2">
           <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
             <h3 className="font-bold text-slate-800 text-sm">Backup & Restore</h3>
             <textarea 
               readOnly 
               className="w-full h-32 p-3 text-[10px] font-mono bg-slate-50 border rounded-xl"
               value={JSON.stringify(data, null, 2)}
             />
             <div className="pt-2 space-y-2">
               <textarea 
                 placeholder="Paste backup JSON here..."
                 className="w-full h-24 p-3 text-[10px] font-mono bg-white border rounded-xl"
                 value={importText}
                 onChange={(e) => setImportText(e.target.value)}
               />
               <button 
                 onClick={handleImport}
                 className="w-full bg-indigo-100 text-indigo-700 py-2 rounded-xl text-xs font-bold"
               >
                 Restore from JSON
               </button>
             </div>
           </div>
        </div>
      )}

      <div className="space-y-3">
        {(activeTab === 'kids') && data.kids.map(kid => (
          <div key={kid.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-slate-800">{kid.name}</p>
              <p className="text-xs text-slate-500">{kid.grade} • {t.age} {kid.age}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingKidId(kid.id); setNewKid({ name: kid.name, age: kid.age.toString(), grade: kid.grade }); setShowAddForm(true); }} className="text-indigo-600 p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => onUpdateData({...data, kids: data.kids.filter(k => k.id !== kid.id)})} className="text-rose-500 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
        {(activeTab === 'templates') && data.templates.map(temp => (
          <div key={temp.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-slate-800">{temp.name}</p>
              <p className="text-xs text-slate-500">{t.teacher}: {temp.teacher}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingTemplateId(temp.id); setNewTemplate({ name: temp.name, teacher: temp.teacher, items: temp.itemsToBring.join(', ') }); setShowAddForm(true); }} className="text-indigo-600 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => onUpdateData({...data, templates: data.templates.filter(t => t.id !== temp.id)})} className="text-rose-500 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminArea;

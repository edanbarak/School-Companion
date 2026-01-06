
import React, { useState } from 'react';
import { Kid, ClassTemplate, AppData } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  data: AppData;
  onUpdateData: (data: AppData) => void;
}

const AdminArea: React.FC<Props> = ({ data, onUpdateData }) => {
  const [activeTab, setActiveTab] = useState<'kids' | 'templates' | 'debug'>('kids');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  
  // Forms
  const [newKid, setNewKid] = useState({ name: '', age: '', grade: '' });
  const [newTemplate, setNewTemplate] = useState({ name: '', teacher: '', items: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingKidId, setEditingKidId] = useState<string | null>(null);

  const generateAndCacheImage = async (itemName: string): Promise<string | null> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return null;
      
      const ai = new GoogleGenAI({ apiKey });
      const isBook = itemName.toLowerCase().startsWith('book:');
      const searchPrompt = isBook 
        ? `The front cover of the school book titled "${itemName.substring(5).trim()}". Vibrant colors, educational style, high quality illustration.`
        : `A high-quality 3D render of a ${itemName} for school. Clean white background, studio lighting, professional product photography.`;

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
      console.error(`Failed to pre-generate image for ${itemName}:`, e);
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
    const newImageMap = { ...data.imageMap };

    // Generate images for any item that doesn't already have one
    for (const item of items) {
      if (!newImageMap[item]) {
        const b64 = await generateAndCacheImage(item);
        if (b64) newImageMap[item] = b64;
      }
    }

    const template: ClassTemplate = {
      id: editingTemplateId || Date.now().toString(),
      name: newTemplate.name,
      teacher: newTemplate.teacher,
      itemsToBring: items
    };
    
    let updatedTemplates;
    if (editingTemplateId) {
      updatedTemplates = data.templates.map(t => t.id === editingTemplateId ? template : t);
    } else {
      updatedTemplates = [...data.templates, template];
    }
    
    onUpdateData({ ...data, templates: updatedTemplates, imageMap: newImageMap });
    setNewTemplate({ name: '', teacher: '', items: '' });
    setEditingTemplateId(null);
    setShowAddForm(false);
    setIsGeneratingImages(false);
  };

  const clearDatabase = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      indexedDB.deleteDatabase('KidScheduleDB');
      window.location.reload();
    }
  };

  const startEditTemplate = (t: ClassTemplate) => {
    setEditingTemplateId(t.id);
    setNewTemplate({ name: t.name, teacher: t.teacher, items: t.itemsToBring.join(', ') });
    setShowAddForm(true);
  };

  const startEditKid = (k: Kid) => {
    setEditingKidId(k.id);
    setNewKid({ name: k.name, age: k.age.toString(), grade: k.grade });
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl mx-1">
        <button 
          onClick={() => { setActiveTab('kids'); setShowAddForm(false); setEditingKidId(null); setEditingTemplateId(null); }}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'kids' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Kids
        </button>
        <button 
          onClick={() => { setActiveTab('templates'); setShowAddForm(false); setEditingKidId(null); setEditingTemplateId(null); }}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'templates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Classes
        </button>
        <button 
          onClick={() => { setActiveTab('debug'); setShowAddForm(false); }}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'debug' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          DB
        </button>
      </div>

      {activeTab !== 'debug' && (
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'kids' ? 'Kid Profiles' : 'Class Templates'}
          </h2>
          <button 
            disabled={isGeneratingImages}
            onClick={() => { 
              setShowAddForm(!showAddForm); 
              if (showAddForm) { setEditingKidId(null); setEditingTemplateId(null); }
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {showAddForm ? 'Cancel' : '+ New'}
          </button>
        </div>
      )}

      {showAddForm && activeTab === 'kids' && (
        <div className="bg-indigo-50 p-6 rounded-2xl space-y-4 border border-indigo-100">
          <input className="w-full p-3 rounded-xl border border-slate-200 shadow-sm bg-white" placeholder="Name" value={newKid.name} onChange={e => setNewKid({...newKid, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full p-3 rounded-xl border border-slate-200 shadow-sm bg-white" placeholder="Age" type="number" value={newKid.age} onChange={e => setNewKid({...newKid, age: e.target.value})} />
            <input className="w-full p-3 rounded-xl border border-slate-200 shadow-sm bg-white" placeholder="Grade" value={newKid.grade} onChange={e => setNewKid({...newKid, grade: e.target.value})} />
          </div>
          <button onClick={handleAddKid} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">
            {editingKidId ? 'Update Kid' : 'Save Kid'}
          </button>
        </div>
      )}

      {showAddForm && activeTab === 'templates' && (
        <div className="bg-indigo-50 p-6 rounded-2xl space-y-4 border border-indigo-100">
          <input className="w-full p-3 rounded-xl border border-slate-200 shadow-sm bg-white" placeholder="Class Name (e.g. Science)" value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
          <input className="w-full p-3 rounded-xl border border-slate-200 shadow-sm bg-white" placeholder="Teacher" value={newTemplate.teacher} onChange={e => setNewTemplate({...newTemplate, teacher: e.target.value})} />
          <textarea className="w-full p-3 rounded-xl border border-slate-200 shadow-sm h-24 bg-white" placeholder="Items needed (comma separated)" value={newTemplate.items} onChange={e => setNewTemplate({...newTemplate, items: e.target.value})} />
          <button 
            onClick={handleAddTemplate} 
            disabled={isGeneratingImages}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {isGeneratingImages ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating Magic Images...
              </>
            ) : (
              editingTemplateId ? 'Update Master Class' : 'Create Master Class'
            )}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {activeTab === 'kids' && data.kids.map(kid => (
          <div key={kid.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-slate-800">{kid.name}</p>
              <p className="text-xs text-slate-500">{kid.grade} Grade • Age {kid.age}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEditKid(kid)} className="text-indigo-600 p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => onUpdateData({...data, kids: data.kids.filter(k => k.id !== kid.id)})} className="text-rose-500 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'templates' && data.templates.map(t => (
          <div key={t.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-500">with {t.teacher || 'Unknown'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEditTemplate(t)} className="text-indigo-600 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => onUpdateData({...data, templates: data.templates.filter(temp => temp.id !== t.id)})} className="text-rose-500 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'debug' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl overflow-auto max-h-[400px] text-[10px] font-mono leading-relaxed ios-shadow">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
            <button 
              onClick={clearDatabase}
              className="w-full bg-rose-100 text-rose-600 py-3 rounded-xl font-bold border border-rose-200"
            >
              Nuke Database & Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArea;

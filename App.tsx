
import React, { useState, useEffect, useCallback } from 'react';
import { Kid, AppView, ClassTemplate, AppData, LANGUAGES } from './types';
import AdminArea from './components/AdminArea';
import MainArea from './components/MainArea';
import KidDetail from './components/KidDetail';
import { GoogleGenAI } from "@google/genai";

const DB_NAME = 'KidScheduleDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';
const DATA_KEY = 'main_data';
const IMAGE_CACHE_NAME = 'kid-schedule-images-v1';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const loadFromDB = async (): Promise<AppData | null> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(DATA_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
};

const saveToDB = async (data: AppData) => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const cleanedData = JSON.parse(JSON.stringify(data));
  store.put(cleanedData, DATA_KEY);
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ kids: [], templates: [], imageMap: {}, language: 'en' });
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      try {
        const saved = await loadFromDB();
        if (saved) {
          setData(saved);
        } else {
          const initialData: AppData = { kids: [], templates: [], imageMap: {}, language: 'en' };
          setData(initialData);
          await saveToDB(initialData);
        }
      } catch (err) {
        console.error("Database initialization failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, []);

  const persistData = async (newData: AppData) => {
    setData(newData);
    await saveToDB(newData);
  };

  const updateImageCache = useCallback(async (itemName: string, base64: string): Promise<string> => {
    const fileName = `${encodeURIComponent(itemName.replace(/\s+/g, '-').toLowerCase())}.jpg`;
    const imageUrl = `/images/assets/${fileName}`;
    try {
      const response = await fetch(base64);
      const blob = await response.blob();
      const cache = await caches.open(IMAGE_CACHE_NAME);
      await cache.put(imageUrl, new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } }));
      
      setData(prev => {
        const updated = { ...prev, imageMap: { ...prev.imageMap, [itemName]: imageUrl } };
        saveToDB(updated);
        return updated;
      });
      return imageUrl;
    } catch (e) {
      console.error("Failed to store image", e);
      return "";
    }
  }, []);

  const triggerImageGeneration = useCallback(async (itemName: string) => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return;
      const ai = new GoogleGenAI({ apiKey });
      const isBook = itemName.toLowerCase().startsWith('book:');
      const searchPrompt = isBook 
        ? `The front cover of a school book titled "${itemName.substring(5).trim()}". Professional, clear text.`
        : `A professional high-quality photo of a ${itemName} for a school bag. Isolated on a neutral light background.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: searchPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        const b64 = `data:image/png;base64,${part.inlineData.data}`;
        await updateImageCache(itemName, b64);
      }
    } catch (e) {
      console.error(`Dynamic generation failed for ${itemName}`, e);
    }
  }, [updateImageCache]);

  const selectedKid = data.kids.find(k => k.id === selectedKidId);
  const currentLang = LANGUAGES.find(l => l.code === data.language) || LANGUAGES[0];

  const toggleSettings = () => {
    setCurrentView(currentView === 'admin' ? 'home' : 'admin');
    setSelectedKidId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 premium-gradient rounded-3xl animate-pulse flex items-center justify-center shadow-xl mb-6">
          <svg className="w-8 h-8 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-slate-500 font-semibold text-sm tracking-widest uppercase">Initializing Pro Suite</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-slate-50 flex flex-col shadow-2xl overflow-hidden" dir={currentLang.dir}>
      <div className="premium-gradient pb-16 pt-12 px-8 rounded-b-[3.5rem] shadow-xl relative z-20">
        <header className="flex justify-between items-center text-white">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {data.language === 'he' ? 'לו״ז הילדים' : 'School Buddy'}
            </h1>
            <p className="text-white/70 text-sm font-medium">
              {data.language === 'he' ? 'העוזר האישי שלך' : 'Your smart school assistant'}
            </p>
          </div>
          <button 
            onClick={toggleSettings}
            className="flex flex-col items-center gap-1 group"
            aria-label="Settings"
          >
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 group-hover:bg-white/40 transition-all active:scale-90 shadow-lg">
              {currentView === 'admin' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-white/90">
              {currentView === 'admin' ? (data.language === 'he' ? 'בית' : 'Home') : (data.language === 'he' ? 'הגדרות' : 'Settings')}
            </span>
          </button>
        </header>
      </div>

      <main className="flex-1 px-6 -mt-10 relative z-30 pb-12 overflow-y-auto no-scrollbar">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 min-h-[70vh] border border-white/50 shadow-2xl">
          {currentView === 'home' && (
            <MainArea 
              kids={data.kids} 
              templates={data.templates} 
              imageMap={data.imageMap}
              lang={data.language}
              onSelectKid={(id) => { setSelectedKidId(id); setCurrentView('kid-detail'); }} 
              onImageNeeded={triggerImageGeneration}
              onGoToSettings={() => setCurrentView('admin')}
            />
          )}
          {currentView === 'admin' && (
            <AdminArea data={data} onUpdateData={persistData} onImageGenerated={updateImageCache} />
          )}
          {currentView === 'kid-detail' && selectedKid && (
            <KidDetail 
              kid={selectedKid} 
              templates={data.templates}
              imageMap={data.imageMap}
              lang={data.language}
              onBack={() => setCurrentView('home')} 
              onUpdateKid={(updatedKid) => {
                const updatedKids = data.kids.map(k => k.id === updatedKid.id ? updatedKid : k);
                persistData({ ...data, kids: updatedKids });
              }}
              onImageNeeded={triggerImageGeneration}
            />
          )}
        </div>
      </main>

      <footer className="h-6 safe-bottom bg-slate-50" />
    </div>
  );
};

export default App;

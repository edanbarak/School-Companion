
import React, { useState, useEffect } from 'react';
import { Kid, AppView, ClassTemplate, AppData, LANGUAGES } from './types';
import AdminArea from './components/AdminArea';
import MainArea from './components/MainArea';
import KidDetail from './components/KidDetail';

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
  // Keep the imageMap paths as virtual asset URLs in IDB
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

  const updateImageCache = async (itemName: string, base64: string): Promise<string> => {
    const fileName = `${encodeURIComponent(itemName.replace(/\s+/g, '-').toLowerCase())}.jpg`;
    const imageUrl = `/images/assets/${fileName}`;

    try {
      const response = await fetch(base64);
      const blob = await response.blob();
      const cache = await caches.open(IMAGE_CACHE_NAME);
      await cache.put(imageUrl, new Response(blob, {
        headers: { 'Content-Type': 'image/jpeg' }
      }));
      
      setData(prev => {
        const updated = {
          ...prev,
          imageMap: { ...prev.imageMap, [itemName]: imageUrl }
        };
        saveToDB(updated);
        return updated;
      });
      
      return imageUrl;
    } catch (e) {
      console.error("Failed to store image", e);
      return "";
    }
  };

  const selectedKid = data.kids.find(k => k.id === selectedKidId);
  const currentLang = LANGUAGES.find(l => l.code === data.language) || LANGUAGES[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-medium">Accessing Filesystem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen max-w-md mx-auto bg-white shadow-2xl relative flex flex-col`} dir={currentLang.dir}>
      <header className="px-6 pt-12 pb-6 bg-indigo-600 text-white rounded-b-3xl ios-shadow">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{data.language === 'he' ? 'לו״ז הילדים' : 'KidSchedule'}</h1>
            <p className="text-indigo-100 text-sm">{data.language === 'he' ? 'עוזר הורים' : 'Parent Assistant'}</p>
          </div>
          <button 
            onClick={() => {
              setCurrentView(currentView === 'admin' ? 'home' : 'admin');
              setSelectedKidId(null);
            }}
            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            {currentView === 'admin' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 mb-20">
        {currentView === 'home' && (
          <MainArea 
            kids={data.kids} 
            templates={data.templates} 
            imageMap={data.imageMap}
            lang={data.language}
            onSelectKid={(id) => { setSelectedKidId(id); setCurrentView('kid-detail'); }} 
            onImageGenerated={updateImageCache}
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
            onImageGenerated={updateImageCache}
          />
        )}
      </main>

      <div className="h-8 bg-white safe-bottom" />
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';

interface Props {
  itemName: string;
  size?: 'sm' | 'md';
  cachedImage?: string;
  onImageGenerated?: (itemName: string, base64: string) => void;
}

const IMAGE_CACHE_NAME = 'kid-schedule-images-v1';

const ItemImage: React.FC<Props> = ({ itemName, size = 'sm', cachedImage }) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const dimensions = size === 'sm' ? 'w-10 h-10' : 'w-24 h-24';
  const fontSize = size === 'sm' ? 'text-sm' : 'text-3xl';
  const radius = size === 'sm' ? 'rounded-xl' : 'rounded-3xl';

  useEffect(() => {
    let objectUrl: string | null = null;
    let isActive = true;

    const loadFromFileSystem = async () => {
      if (!cachedImage) {
        if (isActive) setDisplayUrl(null);
        return;
      }
      try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const response = await cache.match(cachedImage);
        if (response && isActive) {
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setDisplayUrl(objectUrl);
        } else if (isActive) {
          setDisplayUrl(null);
        }
      } catch (e) {
        if (isActive) setDisplayUrl(null);
      }
    };

    loadFromFileSystem();

    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cachedImage]);

  const Fallback = () => (
    <div className={`${dimensions} ${radius} bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-300 font-extrabold shadow-inner`}>
      <span className={fontSize}>
        {itemName.trim().charAt(0).toUpperCase()}
      </span>
    </div>
  );

  if (!displayUrl) return <Fallback />;

  return (
    <div className={`${dimensions} ${radius} overflow-hidden shadow-inner border border-slate-100 bg-slate-50 relative`}>
      {!isLoaded && <div className="absolute inset-0 shimmer" />}
      <img 
        src={displayUrl} 
        alt={itemName} 
        onLoad={() => setIsLoaded(true)}
        className={`${dimensions} ${radius} object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
      />
    </div>
  );
};

export default ItemImage;

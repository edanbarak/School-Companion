
import React, { useState, useEffect } from 'react';

interface Props {
  itemName: string;
  size?: 'sm' | 'md';
  cachedImage?: string; // This holds the virtual path like /images/assets/item.jpg
  onImageGenerated?: (itemName: string, base64: string) => void;
}

const IMAGE_CACHE_NAME = 'kid-schedule-images-v1';

const ItemImage: React.FC<Props> = ({ itemName, size = 'sm', cachedImage }) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  
  const dimensions = size === 'sm' ? 'w-8 h-8' : 'w-20 h-20';
  const fontSize = size === 'sm' ? 'text-sm' : 'text-3xl';

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
        console.error("Error retrieving image from cache storage", e);
        if (isActive) setDisplayUrl(null);
      }
    };

    loadFromFileSystem();

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cachedImage]);

  if (!displayUrl) {
    return (
      <div className={`${dimensions} bg-indigo-100 rounded-lg flex items-center justify-center font-bold text-indigo-600 border border-indigo-200 shadow-inner overflow-hidden`}>
        <span className={fontSize}>
          {itemName.trim().charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img 
      src={displayUrl} 
      alt={itemName} 
      className={`${dimensions} rounded-lg object-cover shadow-md border border-white/20 transition-transform active:scale-110`}
      loading="lazy"
    />
  );
};

export default ItemImage;

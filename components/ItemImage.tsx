
import React, { useState, useEffect } from 'react';

interface Props {
  itemName: string;
  size?: 'sm' | 'md';
  cachedImage?: string;
  onImageNeeded?: (itemName: string) => void;
}

const IMAGE_CACHE_NAME = 'kid-schedule-images-v1';

const ItemImage: React.FC<Props> = ({ itemName, size = 'sm', cachedImage, onImageNeeded }) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const dimensions = size === 'sm' ? 'w-10 h-10' : 'w-24 h-24';
  const fontSize = size === 'sm' ? 'text-sm' : 'text-3xl';
  const radius = size === 'sm' ? 'rounded-xl' : 'rounded-3xl';

  useEffect(() => {
    let objectUrl: string | null = null;
    let isActive = true;

    const loadFromFileSystem = async () => {
      if (!cachedImage) {
        if (isActive) {
          setDisplayUrl(null);
          // Only trigger generation if we have a callback and haven't tried recently
          if (onImageNeeded) {
            setIsGenerating(true);
            onImageNeeded(itemName);
          }
        }
        return;
      }
      try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const response = await cache.match(cachedImage);
        if (response && isActive) {
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setDisplayUrl(objectUrl);
          setIsGenerating(false);
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
  }, [cachedImage, itemName, onImageNeeded]);

  const Fallback = () => (
    <div className={`${dimensions} ${radius} bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-300 font-extrabold shadow-inner relative overflow-hidden`}>
      {isGenerating && <div className="absolute inset-0 shimmer opacity-50" />}
      <span className={`${fontSize} relative z-10`}>
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

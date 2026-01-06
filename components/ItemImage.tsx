
import React from 'react';

interface Props {
  itemName: string;
  size?: 'sm' | 'md';
  cachedImage?: string;
  onImageGenerated?: (itemName: string, base64: string) => void; // Kept for type compatibility but not used for generation here
}

const ItemImage: React.FC<Props> = ({ itemName, size = 'sm', cachedImage }) => {
  const dimensions = size === 'sm' ? 'w-8 h-8' : 'w-24 h-24';

  if (!cachedImage) {
    return (
      <div className={`${dimensions} bg-indigo-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-200`}>
        {itemName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={cachedImage} 
      alt={itemName} 
      className={`${dimensions} rounded-lg object-cover shadow-md border border-white/20 transition-transform active:scale-110`}
      loading="lazy"
    />
  );
};

export default ItemImage;

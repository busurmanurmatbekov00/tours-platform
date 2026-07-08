import { useState } from 'react';

export default function TourGallery({ photos }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
        Нет фото
      </div>
    );
  }

  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 mb-2">
        <img
          src={sorted[activeIndex].url}
          alt={sorted[activeIndex].alt_text || ''}
          className="w-full h-full object-cover"
        />
      </div>

      {sorted.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {sorted.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActiveIndex(i)}
              className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                i === activeIndex ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <img
                src={photo.url}
                alt={photo.alt_text || ''}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
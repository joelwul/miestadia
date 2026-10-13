"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  image_url: string;
  is_primary?: boolean;
}

interface Props {
  photos: Photo[];
  unitName?: string;
}

export default function PhotoCarousel({ photos, unitName }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="relative">
      {/* Foto principal */}
      <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
        <img
          src={photos[currentIndex].image_url}
          alt={unitName || "Unidad"}
          className="w-full h-full object-cover"
        />
        
        {/* Flechas de navegación */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Siguiente foto"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-green-600" : "bg-gray-300"
              }`}
              aria-label={`Ir a foto ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// `images` vient de la page serveur (lecture de public/images/gallery) : aucun appel réseau.
export default function ImageGallery({ images }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune photo pour le moment.</p>
      </div>
    );
  }

  const selectedImage = selectedIndex === null ? null : images[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full">
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            className="relative group overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <div className="relative w-full h-64 bg-gray-200">
              <Image
                src={image.path}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-colors flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Agrandir
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Fermer"
            >
              <X size={32} />
            </button>

            {/* Image */}
            <div className="relative w-full h-[70vh] bg-gray-900">
              <Image
                src={selectedImage.path}
                alt={selectedImage.alt}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 text-white hover:text-gray-300 transition-colors"
              aria-label="Photo précédente"
            >
              <ChevronLeft size={40} />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 text-white hover:text-gray-300 transition-colors"
              aria-label="Photo suivante"
            >
              <ChevronRight size={40} />
            </button>

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white">
              <p className="text-sm text-gray-300">
                {selectedIndex + 1} sur {images.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="text-center text-gray-600 mt-8">
        <p>{images.length} photos</p>
      </div>
    </div>
  );
}

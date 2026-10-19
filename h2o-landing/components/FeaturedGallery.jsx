'use client';

import Image from 'next/image';
import Link from 'next/link';

// `photos` vient de la page d'accueil, déjà dans l'ordre défini par le manager.
export default function FeaturedGallery({ photos }) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {photos.map((photo) => (
        <Link
          key={photo.id}
          href="/gallery"
          className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <div className="relative w-full h-64 bg-gray-200">
            <Image
              src={photo.path}
              alt={photo.alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-colors flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold">
              Voir Galerie
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

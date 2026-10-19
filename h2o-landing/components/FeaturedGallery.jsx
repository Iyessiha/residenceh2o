'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const featuredImages = [
  { id: 1, src: '/images/gallery/IMG_2868.jpg', alt: 'Les Résidences H₂O — vue 1' },
  { id: 2, src: '/images/gallery/IMG_2869.jpg', alt: 'Les Résidences H₂O — vue 2' },
  { id: 3, src: '/images/gallery/IMG_2870.jpg', alt: 'Les Résidences H₂O — vue 3' },
  { id: 4, src: '/images/gallery/IMG_2873.jpg', alt: 'Les Résidences H₂O — vue 4' },
  { id: 5, src: '/images/gallery/IMG_2875.jpg', alt: 'Les Résidences H₂O — vue 5' },
  { id: 6, src: '/images/gallery/IMG_2877.jpg', alt: 'Les Résidences H₂O — vue 6' },
];

export default function FeaturedGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {featuredImages.map((image) => (
        <Link
          key={image.id}
          href="/gallery"
          className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <div className="relative w-full h-64 bg-gray-200">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
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

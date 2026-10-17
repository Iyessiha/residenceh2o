import ImageGallery from '@/components/ImageGallery';

export const metadata = {
  title: 'Photo Gallery | Residence H2O',
  description: 'Explore our beautiful collection of residence photos and amenities',
};

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Photo Gallery
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the beauty of Residence H2O. Browse our collection of stunning
            photos showcasing our rooms, amenities, and distinctive features.
          </p>
        </div>

        {/* Category Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <a
            href="/gallery"
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            All Photos
          </a>
          <a
            href="/gallery?category=hero"
            className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
          >
            Exterior
          </a>
          <a
            href="/gallery?category=rooms"
            className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
          >
            Rooms
          </a>
          <a
            href="/gallery?category=amenities"
            className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
          >
            Amenities
          </a>
        </div>

        {/* Gallery Component */}
        <ImageGallery />

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">145+</div>
            <p className="text-gray-600">High-quality photos</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4K</div>
            <p className="text-gray-600">Professional imagery</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
            <p className="text-gray-600">Available to view</p>
          </div>
        </div>
      </div>
    </main>
  );
}

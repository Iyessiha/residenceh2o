'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Download, RotateCcw } from 'lucide-react';

export default function ImagesAdminPage() {
  const [stats, setStats] = useState(null);
  const [images, setImages] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImageStats();
  }, []);

  const fetchImageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/images');
      const data = await response.json();

      if (data.success) {
        setStats({
          total: data.total,
          categories: data.categories,
        });
        setImages(data.images);
      }
    } catch (error) {
      console.error('Failed to fetch image stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredImages = () => {
    if (filteredCategory === 'all') return images;
    return images.filter(img => img.category === filteredCategory);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredImages = getFilteredImages();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Image Management</h1>
            <p className="text-gray-600 mt-1">Manage and organize Residence H2O photos</p>
          </div>
          <button
            onClick={fetchImageStats}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw size={18} className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-gray-600 text-sm mt-1">Total Images</p>
            </div>
            {Object.entries(stats.categories).map(([category, count]) => (
              <div key={category} className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <p className="text-gray-600 text-sm mt-1 capitalize">{category}</p>
              </div>
            ))}
          </div>
        )}

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilteredCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filteredCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats?.total || 0})
            </button>
            {stats &&
              Object.entries(stats.categories).map(([category, count]) => (
                <button
                  key={category}
                  onClick={() => setFilteredCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    filteredCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category} ({count})
                </button>
              ))}
          </div>
        </div>

        {/* Images Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Dimensions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredImages.length > 0 ? (
                  filteredImages.map((image) => (
                    <tr key={image.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium truncate">
                        {image.filename}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {image.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {image.dimensions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {image.fileSize}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={image.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Download size={16} className="mr-1" />
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No images found in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
          <ul className="text-gray-700 space-y-2">
            <li>✓ Total images processed: {stats?.total || 0}</li>
            <li>✓ All images are optimized and ready for display</li>
            <li>✓ Images are automatically categorized</li>
            <li>✓ API endpoint available at <code className="bg-white px-2 py-1 rounded">/api/images</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

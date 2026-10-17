/**
 * Photo Categories Configuration
 * Defines how images are organized and displayed
 */

export const PHOTO_CATEGORIES = {
  hero: {
    name: 'Exterior & Hero Images',
    description: 'Building exterior, entrance, and hero shots',
    keywords: ['entrance', 'facade', 'outside', 'front', 'exterior', 'building', 'structure'],
    displayOrder: 1,
    icon: '🏢',
    color: 'blue'
  },
  rooms: {
    name: 'Rooms & Interior',
    description: 'Individual room views and interior spaces',
    keywords: ['room', 'bedroom', 'living', 'kitchen', 'bathroom', 'interior', 'space', 'bed', 'sofa'],
    displayOrder: 2,
    icon: '🛏️',
    color: 'purple'
  },
  amenities: {
    name: 'Amenities & Facilities',
    description: 'Common areas, pool, gym, garden, parking',
    keywords: ['pool', 'gym', 'garden', 'parking', 'lounge', 'facility', 'equipment', 'patio', 'terrace'],
    displayOrder: 3,
    icon: '🏊',
    color: 'green'
  },
  gallery: {
    name: 'General Gallery',
    description: 'Other photos and general views',
    keywords: [],
    displayOrder: 4,
    icon: '📸',
    color: 'gray'
  }
};

/**
 * Image Optimization Settings
 */
export const IMAGE_OPTIMIZATION = {
  thumbnail: {
    width: 300,
    height: 300,
    quality: 75
  },
  medium: {
    width: 800,
    height: 600,
    quality: 80
  },
  large: {
    width: 1920,
    height: 1440,
    quality: 85
  }
};

/**
 * Get category config by key
 */
export function getCategoryConfig(categoryKey) {
  return PHOTO_CATEGORIES[categoryKey] || PHOTO_CATEGORIES.gallery;
}

/**
 * Get all categories sorted by displayOrder
 */
export function getAllCategories() {
  return Object.entries(PHOTO_CATEGORIES)
    .map(([key, config]) => ({ key, ...config }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Classify image based on keywords
 */
export function classifyImage(filename) {
  const nameUpper = filename.toUpperCase();

  for (const [categoryKey, config] of Object.entries(PHOTO_CATEGORIES)) {
    for (const keyword of config.keywords) {
      if (nameUpper.includes(keyword.toUpperCase())) {
        return categoryKey;
      }
    }
  }

  return 'gallery';
}

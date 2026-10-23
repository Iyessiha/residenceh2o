import { getDuplexes } from '@/lib/data';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://residencesh2o.com';

  // Pages publiques réellement présentes dans le site
  const staticPages = [
    '',
    'residences',
    'services',
    'about',
    'gallery',
    'faq',
    'restaurant',
    'chambres',
  ].map(route => ({
    url: `${baseUrl}${route ? '/' + route : ''}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'hourly' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  const residences = await getDuplexes();
  const residencePages = residences.map(residence => ({
    url: `${baseUrl}/residences/${residence.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...residencePages];
}

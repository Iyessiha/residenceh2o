import { blogArticles } from '@/lib/blog/articles';
import { getAllResidences } from '@/lib/residences';

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://residencesh2o.com';

  // Pages publiques réellement présentes dans le site
  const staticPages = [
    '',
    'residences',
    'services',
    'about',
    'gallery',
    'faq',
    'blog',
  ].map(route => ({
    url: `${baseUrl}${route ? '/' + route : ''}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'hourly' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  const residencePages = getAllResidences().map(residence => ({
    url: `${baseUrl}/residences/${residence.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // Blog articles
  const blogPages = blogArticles.map(article => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.date).toISOString(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...residencePages, ...blogPages];
}

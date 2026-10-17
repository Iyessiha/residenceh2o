import { blogArticles } from '@/lib/blog/articles';

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://residenceh2o.com';

  // Static pages
  const staticPages = [
    '',
    'about',
    'rooms',
    'services',
    'faq',
    'gallery',
    'blog',
    'contact',
    'reservation',
  ].map(route => ({
    url: `${baseUrl}${route ? '/' + route : ''}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'hourly' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  // Blog articles
  const blogPages = blogArticles.map(article => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.date).toISOString(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}

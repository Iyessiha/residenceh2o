import Image from 'next/image';
import Link from 'next/link';
import { blogArticles } from '@/lib/blog/articles';

export const metadata = {
  title: 'Blog | Residence H2O - Conseils de Voyage & Guides',
  description: 'Découvrez notre blog avec des articles sur les voyages, les amenités, la gastronomie locale et bien plus encore.',
  keywords: 'blog voyage, conseils séjour, guides destination, tourisme',
  openGraph: {
    title: 'Blog Residence H2O',
    description: 'Guides et conseils de voyage pour votre séjour',
    type: 'website',
  }
};

export default function BlogPage() {
  const categories = [...new Set(blogArticles.map(a => a.category))];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 md:py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Residence H2O</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Découvrez nos guides, conseils de voyage et articles informatifs pour enrichir votre séjour
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <Link href="/blog" className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
            Tous les articles
          </Link>
          {categories.map(category => (
            <Link
              key={category}
              href={`/blog?category=${encodeURIComponent(category)}`}
              className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogArticles.map((article) => (
            <article key={article.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              {/* Image */}
              <div className="relative w-full h-48 bg-gray-200">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category Badge */}
                <div className="inline-block mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {article.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{new Date(article.date).toLocaleDateString('fr-FR')}</span>
                  <span>{article.readTime}</span>
                </div>

                {/* Read More Link */}
                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-block text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                >
                  Lire l'article →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Abonnez-vous à Notre Newsletter</h2>
          <p className="text-lg mb-6">Recevez nos derniers articles et conseils de voyage</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              S'abonner
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

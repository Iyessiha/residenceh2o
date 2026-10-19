import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { blogArticles } from '@/lib/blog/articles'

export const metadata = {
  title: 'Blog | Les Résidences H₂O - Conseils & Guides',
  description: 'Découvrez notre blog avec des articles sur les voyages, les amenités, la gastronomie locale et bien plus encore.',
  keywords: 'blog voyage, conseils séjour, guides destination, tourisme',
  openGraph: {
    title: 'Blog Les Résidences H₂O',
    description: 'Guides et conseils de voyage pour votre séjour',
    type: 'website',
  }
}

export default function BlogPage() {
  const categories = [...new Set(blogArticles.map(a => a.category))]

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <div
          className="py-16 sm:py-24 text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dk) 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Blog des Résidences H₂O</h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Découvrez nos guides, conseils de voyage et articles informatifs pour enrichir votre séjour
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            <Link
              href="/blog"
              className="px-4 py-2 rounded-full text-white font-medium transition-colors hover:bg-[var(--primary-dk)]"
              style={{ backgroundColor: 'var(--primary)' }}
            >
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
                  <span className="px-3 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: 'var(--primary)' }}>
                    {article.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-2 line-clamp-2" style={{ color: 'var(--text)' }}>
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--text-2)' }}>
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs mb-4" style={{ color: 'var(--text-3)' }}>
                  <span>{new Date(article.date).toLocaleDateString('fr-FR')}</span>
                  <span>{article.readTime}</span>
                </div>

                {/* Read More Link */}
                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-block font-semibold transition-colors hover:text-[var(--primary-dk)]"
                  style={{ color: 'var(--primary)' }}
                >
                  Lire l'article →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 text-white" style={{ backgroundColor: 'var(--primary)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Abonnez-vous à Notre Newsletter</h2>
            <p className="text-lg mb-8 text-white/90">Recevez nos derniers articles et conseils de voyage</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--primary)' }}
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white font-bold rounded-lg transition-all hover:bg-[#f0f0f0]"
                style={{ color: 'var(--primary)' }}
              >
                S'abonner
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

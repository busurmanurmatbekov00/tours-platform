import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useT } from '../hooks/useT';
import { mockTours } from '../mocks/tours';
import TourCard from '../components/TourCard';

export default function HomePage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const featured = mockTours.slice(0, 4);

  const onSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600')",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t.home.hero_title}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t.home.hero_subtitle}
          </p>
          <form onSubmit={onSearch} className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.home.search_placeholder}
              className="flex-1 px-4 py-3 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-md hover:bg-blue-50 transition-colors"
            >
              {t.home.search_btn}
            </button>
          </form>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t.home.featured}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>
    </>
  );
}
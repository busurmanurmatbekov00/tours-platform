import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useT } from '../hooks/useT';
import { getTours } from '../api/tours';
import TourCard from '../components/TourCard';

export default function HomePage() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  // подсказки
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    getTours({ ordering: '-published_at', page_size: 4 })
      .then((res) => setFeatured(res.data.results))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  // debounce для подсказок
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      setSuggestionsLoading(true);
      getTours({ q, page_size: 5 })
        .then((res) => setSuggestions(res.data.results))
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestionsLoading(false));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    setShowSuggestions(false);
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
  };

  const onSuggestionClick = (tour) => {
    setShowSuggestions(false);
    setSearch('');
    navigate(`/tours/${tour.slug}`);
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

          <div ref={wrapperRef} className="max-w-2xl mx-auto relative">
            <form onSubmit={onSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t.home.search_placeholder}
                autoComplete="off"
                className="flex-1 px-4 py-3 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-md hover:bg-blue-50 transition-colors"
              >
                {t.home.search_btn}
              </button>
            </form>

            {/* Выпадающие подсказки */}
            {showSuggestions && search.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg text-left overflow-hidden z-20">
                {suggestionsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">…</div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {t.catalog.no_results}
                  </div>
                ) : (
                  suggestions.map((tour) => (
                    <button
                      key={tour.id}
                      onClick={() => onSuggestionClick(tour)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                        {tour.cover_photo && (
                          <img
                            src={tour.cover_photo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {tour.title[lang]}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${tour.price} · {tour.duration_days} {t.catalog.days}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t.home.featured}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 h-72 animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t.catalog.no_results}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
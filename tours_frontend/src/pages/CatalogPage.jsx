import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { mockTours, tourTypes, difficultyLevels } from '../mocks/tours';
import TourCard from '../components/TourCard';

const PRICE_MAX = 3000;
const DURATION_MAX = 30;

export default function CatalogPage() {
  const { t, lang } = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  // состояние фильтров
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [typeId, setTypeId] = useState('');
  const [difficultyId, setDifficultyId] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [durMin, setDurMin] = useState('');
  const [durMax, setDurMax] = useState('');

  // если ?q пришёл из главной — поднимаем
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const filtered = useMemo(() => {
    return mockTours.filter((tour) => {
      // поиск по названию / описанию
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${tour.title.ru} ${tour.title.en} ${tour.summary.ru} ${tour.summary.en}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeId && String(tour.tour_type.id) !== typeId) return false;
      if (difficultyId && String(tour.difficulty_level.id) !== difficultyId) return false;
      if (priceMin && tour.price < Number(priceMin)) return false;
      if (priceMax && tour.price > Number(priceMax)) return false;
      if (durMin && tour.duration_days < Number(durMin)) return false;
      if (durMax && tour.duration_days > Number(durMax)) return false;
      return true;
    });
  }, [query, typeId, difficultyId, priceMin, priceMax, durMin, durMax]);

  const reset = () => {
    setQuery('');
    setTypeId('');
    setDifficultyId('');
    setPriceMin('');
    setPriceMax('');
    setDurMin('');
    setDurMax('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {t.catalog.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Сайдбар фильтров */}
        <aside className="bg-white rounded-lg border border-gray-200 p-5 h-fit lg:sticky lg:top-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t.catalog.filters}</h2>
            <button
              onClick={reset}
              className="text-xs text-blue-600 hover:underline"
            >
              {t.catalog.reset}
            </button>
          </div>

          {/* Поиск */}
          <div className="mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.home.search_placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Тип тура */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {t.catalog.tour_type}
            </label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="">{t.catalog.all}</option>
              {tourTypes.map((tt) => (
                <option key={tt.id} value={tt.id}>{tt.name[lang]}</option>
              ))}
            </select>
          </div>

          {/* Сложность */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {t.catalog.difficulty}
            </label>
            <select
              value={difficultyId}
              onChange={(e) => setDifficultyId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="">{t.catalog.all}</option>
              {difficultyLevels.map((dl) => (
                <option key={dl.id} value={dl.id}>{dl.name[lang]}</option>
              ))}
            </select>
          </div>

          {/* Цена */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {t.catalog.price_range}
            </label>
            <div className="flex gap-2">
              <input
                type="number" min="0" max={PRICE_MAX}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder={t.catalog.from}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <input
                type="number" min="0" max={PRICE_MAX}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder={t.catalog.to}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Длительность */}
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {t.catalog.duration}
            </label>
            <div className="flex gap-2">
              <input
                type="number" min="1" max={DURATION_MAX}
                value={durMin}
                onChange={(e) => setDurMin(e.target.value)}
                placeholder={t.catalog.from}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <input
                type="number" min="1" max={DURATION_MAX}
                value={durMax}
                onChange={(e) => setDurMax(e.target.value)}
                placeholder={t.catalog.to}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </aside>

        {/* Результаты */}
        <section>
          <p className="text-sm text-gray-600 mb-4">
            {t.catalog.found}: <strong>{filtered.length}</strong>
          </p>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
              {t.catalog.no_results}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
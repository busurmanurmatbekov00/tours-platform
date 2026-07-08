import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { getTours, getTourTypes, getDifficultyLevels } from '../api/tours';
import TourCard from '../components/TourCard';

const PRICE_MAX = 3000;
const DURATION_MAX = 30;

export default function CatalogPage() {
  const { t, lang } = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  // справочники (загружаются один раз)
  const [tourTypes, setTourTypes] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);

  // состояние фильтров
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [typeId, setTypeId] = useState('');
  const [difficultyId, setDifficultyId] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [durMin, setDurMin] = useState('');
  const [durMax, setDurMax] = useState('');

  // результаты
  const [tours, setTours] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // если ?q пришёл из главной — поднимаем
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // справочники — загружаем один раз при монтировании
  useEffect(() => {
    getTourTypes()
      .then((res) => setTourTypes(res.data))
      .catch((err) => console.error('Ошибка загрузки типов туров:', err));

    getDifficultyLevels()
      .then((res) => setDifficultyLevels(res.data))
      .catch((err) => console.error('Ошибка загрузки уровней сложности:', err));
  }, []);

  // сами туры — с debounce, чтобы не спамить сервер при вводе текста
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = {};
      if (query.trim()) params.q = query.trim();
      if (typeId) params.tour_type = typeId;
      if (difficultyId) params.difficulty = difficultyId;
      if (priceMin) params.price_min = priceMin;
      if (priceMax) params.price_max = priceMax;
      if (durMin) params.duration_min = durMin;
      if (durMax) params.duration_max = durMax;

      getTours(params)
        .then((res) => {
          setTours(res.data.results);
          setCount(res.data.count);
        })
        .catch((err) => {
          console.error('Ошибка загрузки туров:', err);
          setError(t.catalog.load_error || 'Не удалось загрузить туры');
        })
        .finally(() => setLoading(false));
    }, 350); // debounce 350мс

    return () => clearTimeout(timeoutId);
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
                <option key={tt.id} value={tt.id}>{tt[`name_${lang}`]}</option>
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
                <option key={dl.id} value={dl.id}>{dl[`name_${lang}`]}</option>
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
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
              {error}
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              {t.catalog.found}: <strong>{loading ? '…' : count}</strong>
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 h-72 animate-pulse" />
              ))}
            </div>
          ) : tours.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
              {t.catalog.no_results}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
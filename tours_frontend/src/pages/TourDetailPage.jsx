import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { getTourBySlug } from '../api/tours';
import TourGallery from '../components/TourGallery';
import TourMap from '../components/TourMap';
import VisaInsuranceBlock from '../components/VisaInsuranceBlock';

export default function TourDetailPage() {
  const { slug } = useParams();
  const { t, lang } = useT();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTourBySlug(slug)
      .then((res) => setTour(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError(t.tour_detail.not_found);
        } else {
          setError(t.tour_detail.load_error);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="aspect-video bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <Link to="/catalog" className="text-blue-600 hover:underline">
          {t.tour_detail.back_to_catalog}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Хлебные крошки */}
      <Link to="/catalog" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← {t.tour_detail.back_to_catalog}
      </Link>

      {/* Заголовок и теги */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
          {tour.tour_type.name[lang]}
        </span>
        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">
          {tour.difficulty_level.name[lang]}
        </span>
        {tour.is_custom && (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
            {t.tour_detail.custom_tour}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{tour.title[lang]}</h1>
      <p className="text-gray-600 mb-6">{tour.summary[lang]}</p>

      {/* Галерея */}
      <div className="mb-8">
        <TourGallery photos={tour.photos} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Основной контент */}
        <div className="space-y-8">
          {/* Описание */}
          {tour.description?.[lang] && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t.tour_detail.description}
              </h2>
              <p className="text-gray-700 whitespace-pre-line">{tour.description[lang]}</p>
            </section>
          )}

          {/* Обзор маршрута */}
          {tour.route_overview?.[lang] && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t.tour_detail.route_overview}
              </h2>
              <p className="text-gray-700 whitespace-pre-line">{tour.route_overview[lang]}</p>
            </section>
          )}

          {/* Карта */}
          {tour.route_points?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t.tour_detail.map_title}
              </h2>
              <TourMap routePoints={tour.route_points} />
            </section>
          )}

          {/* Виза и страховка */}
          <VisaInsuranceBlock
            visaDetails={tour.visa_details}
            insuranceDetails={tour.insurance_details}
          />
        </div>

        {/* Сайдбар — цена и исполнитель */}
        <aside className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 lg:sticky lg:top-20">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${tour.price}
              <span className="text-sm font-normal text-gray-500"> / {t.tour_detail.per_person}</span>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {tour.duration_days} {t.catalog.days}
              {tour.min_group_size && tour.max_group_size && (
                <> · {tour.min_group_size}–{tour.max_group_size} {t.tour_detail.people}</>
              )}
            </div>

            {tour.provider && (
              <Link
                to={`/executors/${tour.provider.slug}`}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm flex items-center gap-1">
                    {tour.provider.display_name}
                    {tour.provider.is_verified && (
                      <span className="text-blue-600" title={t.catalog.verified}>✓</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{t.tour_detail.view_provider}</div>
                </div>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
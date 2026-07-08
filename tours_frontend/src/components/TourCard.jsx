import { Link } from 'react-router-dom';
import { useT } from '../hooks/useT';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function TourCard({ tour }) {
  const { t, lang } = useT();

  return (
    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
      <Link to={`/tours/${tour.slug}`}>
        <div className="aspect-[16/10] overflow-hidden bg-gray-200">
          <img
            src={tour.cover_photo || FALLBACK_IMAGE}
            alt={tour.title[lang]}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
            {tour.tour_type.name[lang]}
          </span>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">
            {tour.difficulty_level.name[lang]}
          </span>
          {tour.is_custom && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
              ★
            </span>
          )}
        </div>

        <Link to={`/tours/${tour.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem] hover:text-blue-600 transition-colors">
            {tour.title[lang]}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[2.5rem]">
          {tour.summary[lang]}
        </p>

        {tour.provider && (
          <Link
            to={`/executors/${tour.provider.slug}`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mb-3 transition-colors"
          >
            <span>{tour.provider.display_name}</span>
            {tour.provider.is_verified && (
              <span className="text-blue-600" title={t.catalog.verified}>✓</span>
            )}
          </Link>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500">
              {tour.duration_days} {t.catalog.days}
            </div>
            <div className="text-lg font-bold text-gray-900">
              ${tour.price}
            </div>
          </div>
          <Link
            to={`/tours/${tour.slug}`}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t.catalog.view}
          </Link>
        </div>
      </div>
    </article>
  );
}
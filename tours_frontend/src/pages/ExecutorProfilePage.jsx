import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { getProviderBySlug, getProviderTours } from '../api/tours';
import TourCard from '../components/TourCard';
import CertificateCard from '../components/CertificateCard';

const ROLE_LABELS = {
  guide: 'role_guide',
  tour_operator: 'role_tour_operator',
  travel_agent: 'role_travel_agent',
};

export default function ExecutorProfilePage() {
  const { slug } = useParams();
  const { t, lang } = useT();

  const [provider, setProvider] = useState(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toursLoading, setToursLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProviderBySlug(slug)
      .then((res) => setProvider(res.data))
      .catch((err) => {
        setError(err.response?.status === 404 ? t.executor.not_found : t.executor.load_error);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setToursLoading(true);
    getProviderTours(slug)
      .then((res) => setTours(res.data.results))
      .catch(() => setTours([]))
      .finally(() => setToursLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <Link to="/catalog" className="text-blue-600 hover:underline">
          {t.tour_detail.back_to_catalog}
        </Link>
      </div>
    );
  }

  const roleKey = ROLE_LABELS[provider.role];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/catalog" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← {t.tour_detail.back_to_catalog}
      </Link>

      {/* Шапка профиля */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {provider.avatar_url ? (
              <img src={provider.avatar_url} alt={provider.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-gray-400">
                {provider.display_name?.[0]}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{provider.display_name}</h1>
              {provider.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  ✓ {t.catalog.verified}
                </span>
              )}
            </div>

            {roleKey && (
              <span className="inline-block text-sm text-gray-500 mt-1">
                {t.auth[roleKey]}
              </span>
            )}

            {provider.headline?.[lang] && (
              <p className="text-gray-700 mt-2">{provider.headline[lang]}</p>
            )}

            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>{provider.tours_count} {t.executor.tours_count}</span>
              <span>{provider.certificates_count} {t.executor.certificates_count}</span>
            </div>
          </div>
        </div>

        {/* Контакты */}
        {(provider.contact_email || provider.contact_phone || provider.website_url || provider.address) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
            {provider.contact_phone && (
              <a href={`tel:${provider.contact_phone}`} className="text-blue-600 hover:underline">
                📞 {provider.contact_phone}
              </a>
            )}
            {provider.contact_email && (
              <a href={`mailto:${provider.contact_email}`} className="text-blue-600 hover:underline">
                ✉ {provider.contact_email}
              </a>
            )}
            {provider.website_url && (
              <a href={provider.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                🌐 {t.executor.website}
              </a>
            )}
            {provider.address && (
              <span className="text-gray-500">📍 {provider.address}</span>
            )}
          </div>
        )}
      </div>

      {/* Био */}
      {provider.bio?.[lang] && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.executor.about}</h2>
          <p className="text-gray-700 whitespace-pre-line">{provider.bio[lang]}</p>
        </section>
      )}

      {/* Сертификаты */}
      {provider.certificates?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.executor.certificates}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {provider.certificates.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
          </div>
        </section>
      )}

      {/* Туры исполнителя */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.executor.tours_by}</h2>
        {toursLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 h-72 animate-pulse" />
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            {t.executor.no_tours}
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
  );
}
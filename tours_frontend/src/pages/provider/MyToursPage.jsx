import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Plus } from 'lucide-react';
import { useT } from '../../hooks/useT';
import PageHeader from '../../components/PageHeader';
import { getMyTours, mediaUrl } from '../../api/provider';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  hidden: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-400',
};

export default function MyToursPage() {
  const { t, lang } = useT();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTours()
      .then((res) => setTours(res.data))
      .catch(() => setTours([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.tours_title}
        subtitle={t.dashboard.tours_sub}
        action={
          <Link 
            to="/dashboard/tours/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            {t.dashboard.new_tour}
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600">
            <Map size={32} />
          </div>
          <p className="text-gray-500">{t.dashboard.no_tours}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tours.map((tour) => {
            const title = tour[`title_${lang}`] || tour.slug;
            return (
              <Link 
                key={tour.id} to={`/dashboard/tours/${tour.id}/edit`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-100">
                  {tour.cover_photo && (
                    <img src={mediaUrl(tour.cover_photo)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${STATUS_COLORS[tour.status] || 'bg-gray-100 text-gray-600'}`}>
                    {t.dashboard[`tour_status_${tour.status}`] || tour.status}
                  </span>
                  <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    ${tour.price} · {tour.duration_days} {t.catalog.days}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
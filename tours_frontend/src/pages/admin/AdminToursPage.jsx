import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { getAdminTours, approveTour, hideTour, unhideTour, deleteAdminTour } from '../../api/admin';
import { mediaUrl } from '../../api/provider';

export default function AdminToursPage() {
  const { t } = useT();
  const qc = useQueryClient();

  const { data: toursResponse, isLoading } = useQuery({
    queryKey: ['admin-tours'],
    queryFn: () => getAdminTours(),
  });

  const tours = toursResponse?.results || toursResponse || [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-tours'] });

  const approve = useMutation({ mutationFn: approveTour, onSuccess: invalidate });
  const hide = useMutation({ mutationFn: hideTour, onSuccess: invalidate });
  const unhide = useMutation({ mutationFn: unhideTour, onSuccess: invalidate });
  const del = useMutation({ mutationFn: deleteAdminTour, onSuccess: invalidate });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.admin_panel.tours_title}</h1>
        <p className="text-gray-500">{t.admin_panel.tours_sub}</p>
      </div>

      {isLoading ? (
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-500">
          {t.admin_panel.no_tours}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tours.map((tour) => (
            <div key={tour.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gray-100">
                {tour.cover_photo && (
                  <img src={mediaUrl(tour.cover_photo)} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <StatusPill status={tour.status} t={t} />
                <h3 className="font-semibold text-gray-900 truncate">{tour.title_ru || tour.slug}</h3>
                <div className="text-sm text-gray-500">${tour.price}</div>

                <div className="flex gap-2 pt-2 flex-wrap">
                  <Link
                    to={`/admin-panel/tours/${tour.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100"
                  >
                    <ExternalLink size={14} /> Подробнее
                  </Link>

                  {tour.status === 'pending_review' && (
                    <button
                      onClick={() => approve.mutate(tour.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                    >
                      <Check size={14} /> {t.admin_panel.approve}
                    </button>
                  )}
                  {tour.status === 'published' && (
                    <button
                      onClick={() => hide.mutate(tour.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-lg hover:bg-gray-700"
                    >
                      <EyeOff size={14} /> {t.admin_panel.hide}
                    </button>
                  )}
                  {tour.status === 'hidden' && (
                    <button
                      onClick={() => unhide.mutate(tour.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                    >
                      <Eye size={14} /> {t.admin_panel.unhide}
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(t.admin_panel.confirm_delete)) del.mutate(tour.id); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, t }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-600',
    pending_review: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    hidden: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {t.dashboard[`tour_status_${status}`] || status}
    </span>
  );
}
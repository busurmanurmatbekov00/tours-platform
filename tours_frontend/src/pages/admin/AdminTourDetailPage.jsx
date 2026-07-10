import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Clock, Users, DollarSign, Calendar,
  ShieldCheck, Heart, EyeOff, Eye, Trash2, CheckCircle2, X,
} from 'lucide-react';

import {
  getAdminTourDetail, hideAdminTour, unhideAdminTour, deleteAdminTour,
} from '../../api/admin';
import { useT } from '../../hooks/useT';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  hidden: 'bg-rose-50 text-rose-700 border-rose-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABEL = {
  draft: { ru: 'Черновик', en: 'Draft' },
  pending_review: { ru: 'На проверке', en: 'Under review' },
  published: { ru: 'Опубликован', en: 'Published' },
  hidden: { ru: 'Скрыт', en: 'Hidden' },
  archived: { ru: 'В архиве', en: 'Archived' },
};

export default function AdminTourDetailPage() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const { lang } = useT();
  const qc = useQueryClient();

  const { data: tour, isLoading, error } = useQuery({
    queryKey: ['admin-tour', tourId],
    queryFn: () => getAdminTourDetail(tourId),
  });

  const [reasonModal, setReasonModal] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState(null);

  const hideMutation = useMutation({
    mutationFn: (r) => hideAdminTour(tourId, r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tour', tourId] });
      qc.invalidateQueries({ queryKey: ['admin-tours'] });
      closeReasonModal();
    },
    onError: (e) => setActionError(e.response?.data?.detail || 'Ошибка'),
  });

  const unhideMutation = useMutation({
    mutationFn: () => unhideAdminTour(tourId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tour', tourId] });
      qc.invalidateQueries({ queryKey: ['admin-tours'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (r) => deleteAdminTour(tourId, r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tours'] });
      closeReasonModal();
      navigate('/admin-panel/tours');
    },
    onError: (e) => setActionError(e.response?.data?.detail || 'Ошибка'),
  });

  const openReasonModal = (action) => {
    setReasonModal({ action });
    setReason('');
    setActionError(null);
  };
  const closeReasonModal = () => {
    setReasonModal(null);
    setReason('');
    setActionError(null);
  };

  const submitReason = () => {
    if (!reason.trim()) {
      setActionError('Причина обязательна');
      return;
    }
    if (reasonModal.action === 'hide') hideMutation.mutate(reason.trim());
    if (reasonModal.action === 'delete') deleteMutation.mutate(reason.trim());
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700">
        Не удалось загрузить тур. {error.response?.data?.detail || error.message}
      </div>
    );
  }

  if (!tour) return null;

  const title = tour.title?.[lang] || tour.title?.ru || tour.slug;
  const summary = tour.summary?.[lang] || tour.summary?.ru;
  const description = tour.description?.[lang] || tour.description?.ru;
  const statusStyle = STATUS_STYLES[tour.status] || STATUS_STYLES.draft;
  const statusLabel = STATUS_LABEL[tour.status]?.[lang] || tour.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin-panel/tours"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          К списку туров
        </Link>
        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border ${statusStyle}`}>
          {statusLabel}
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {summary && <p className="text-gray-500 mt-2">{summary}</p>}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-wrap gap-3">
        {tour.status === 'published' && (
          <button
            onClick={() => openReasonModal('hide')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <EyeOff size={18} />
            Скрыть тур
          </button>
        )}
        {tour.status === 'hidden' && (
          <button
            onClick={() => unhideMutation.mutate()}
            disabled={unhideMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <Eye size={18} />
            {unhideMutation.isPending ? 'Возвращаем...' : 'Вернуть в каталог'}
          </button>
        )}
        {tour.status !== 'archived' && (
          <button
            onClick={() => openReasonModal('delete')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-semibold rounded-xl hover:bg-rose-100 transition-all"
          >
            <Trash2 size={18} />
            Удалить в архив
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          {tour.photos?.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="aspect-[16/9] bg-gray-100">
                <img
                  src={tour.photos.find(p => p.is_cover)?.url || tour.photos[0].url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              {tour.photos.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {tour.photos.map(p => (
                    <div key={p.id} className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {description && (
            <Section title="Описание">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {description}
              </p>
            </Section>
          )}

          {tour.route_points?.length > 0 && (
            <Section title="Маршрут" icon={MapPin}>
              <ol className="space-y-3">
                {tour.route_points.map((point) => (
                  <li key={point.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {point.sequence_order}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="font-semibold text-gray-900">
                        {point.location?.name?.[lang] || point.location?.name?.ru}
                      </div>
                      {point.day_number && (
                        <div className="text-xs text-gray-500">День {point.day_number}</div>
                      )}
                      {point.notes?.[lang] && (
                        <div className="text-sm text-gray-600 mt-1">{point.notes[lang]}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {tour.visa_details && (
            <Section title="Визовые требования" icon={ShieldCheck}>
              <div className="space-y-2 text-sm">
                {tour.visa_details.requires_border_permit && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 size={16} className="text-amber-500" />
                    Требуется пропуск в погранзону
                  </div>
                )}
                {tour.visa_details.requires_special_permit && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 size={16} className="text-amber-500" />
                    Требуется специальный пропуск
                  </div>
                )}
                {tour.visa_details.notes?.[lang] && (
                  <div className="mt-3 text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    {tour.visa_details.notes[lang]}
                  </div>
                )}
              </div>
            </Section>
          )}

          {tour.insurance_details && (
            <Section title="Требования к страхованию" icon={Heart}>
              <div className="space-y-2 text-sm">
                <div className="text-gray-700">
                  <strong>Обязательна:</strong>{' '}
                  {tour.insurance_details.is_insurance_required ? 'Да' : 'Нет'}
                </div>
                {tour.insurance_details.min_medical_coverage && (
                  <div className="text-gray-700">
                    <strong>Мин. медицинское покрытие:</strong>{' '}
                    {tour.insurance_details.min_medical_coverage} {tour.insurance_details.medical_currency}
                  </div>
                )}
                {tour.insurance_details.requires_evacuation && (
                  <div className="text-gray-700">
                    <strong>Медэвакуация:</strong> обязательна
                    {tour.insurance_details.min_evacuation_coverage &&
                      ` (мин. ${tour.insurance_details.min_evacuation_coverage} ${tour.insurance_details.evacuation_currency})`}
                  </div>
                )}
                {tour.insurance_details.notes?.[lang] && (
                  <div className="mt-3 text-gray-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
                    {tour.insurance_details.notes[lang]}
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Параметры</h3>
            <div className="space-y-3">
              <Stat icon={DollarSign} label="Цена" value={`${tour.price} ${tour.currency_code}`} />
              <Stat icon={Clock} label="Длительность"
                value={`${tour.duration_days} дн.${tour.duration_hours ? ` ${tour.duration_hours} ч.` : ''}`} />
              {(tour.min_group_size || tour.max_group_size) && (
                <Stat icon={Users} label="Размер группы"
                  value={`${tour.min_group_size || '?'} – ${tour.max_group_size || '?'}`} />
              )}
              <Stat icon={MapPin} label="Тип" value={tour.tour_type?.name?.[lang] || tour.tour_type?.code} />
              <Stat icon={ShieldCheck} label="Сложность"
                value={tour.difficulty_level?.name?.[lang] || tour.difficulty_level?.code} />
              {tour.is_custom && (
                <div className="inline-block px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
                  Авторский тур
                </div>
              )}
            </div>
          </div>

          {tour.provider && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Исполнитель</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center">
                  {tour.provider.display_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{tour.provider.display_name}</div>
                  {tour.provider.is_verified && (
                    <div className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Верифицирован
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tour.published_at && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Публикация</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} />
                {new Date(tour.published_at).toLocaleString('ru-RU')}
              </div>
            </div>
          )}
        </div>
      </div>

      {reasonModal && (
        <ReasonModal
          action={reasonModal.action}
          reason={reason}
          setReason={setReason}
          onClose={closeReasonModal}
          onSubmit={submitReason}
          error={actionError}
          isPending={hideMutation.isPending || deleteMutation.isPending}
        />
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
            <Icon size={18} />
          </div>
        )}
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={16} className="text-gray-400 shrink-0" />
      <div className="flex-1 flex justify-between items-center gap-2">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900 text-right">{value}</span>
      </div>
    </div>
  );
}

function ReasonModal({ action, reason, setReason, onClose, onSubmit, error, isPending }) {
  const title = action === 'hide' ? 'Скрыть тур' : 'Удалить тур в архив';
  const desc = action === 'hide'
    ? 'Тур пропадёт из публичного каталога, но данные сохранятся.'
    : 'Тур будет перемещён в архив.';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Причина <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Объясните, почему принято решение..."
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          autoFocus
        />

        {error && (
          <div className="mt-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 ${
              action === 'delete'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-md'
            }`}
          >
            {isPending ? 'Отправка...' : action === 'delete' ? 'Удалить' : 'Скрыть'}
          </button>
        </div>
      </div>
    </div>
  );
}
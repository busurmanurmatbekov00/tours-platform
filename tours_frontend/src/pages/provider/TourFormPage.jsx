import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link  } from 'react-router-dom';
import { Plus, Trash2, MapPin, Upload } from 'lucide-react';
import { useT } from '../../hooks/useT';
import PageHeader from '../../components/PageHeader';
import { getTourTypes, getDifficultyLevels, getLocations } from '../../api/tours';
import {
  getMyTour, createTour, updateTour,
  uploadTourPhoto, deleteTourPhoto,
  addRoutePoint, deleteRoutePoint,
  setVisaDetails, setInsuranceDetails,
  submitTour, mediaUrl, getMyProfile
} from '../../api/provider';

export default function TourFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t, lang } = useT();

  const [tourTypes, setTourTypes] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [locations, setLocations] = useState([]);

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [canCreate, setCanCreate] = useState(isEdit);
  const [checkingAccess, setCheckingAccess] = useState(!isEdit);

  const [basic, setBasic] = useState({
    tour_type: '', difficulty_level: '', is_custom: false,
    price: '', currency_code: 'USD', duration_days: 1, duration_hours: '',
    min_group_size: '', max_group_size: '',
    title_ru: '', summary_ru: '', description_ru: '', route_overview_ru: '',
  });

  const [newPoint, setNewPoint] = useState({ location: '', day_number: '', notes_ru: '' });

  const [visa, setVisa] = useState({
    requires_border_permit: false, requires_special_permit: false, notes_ru: '',
  });

  const [insurance, setInsurance] = useState({
    is_insurance_required: true, min_medical_coverage: '', medical_currency: 'USD',
    requires_evacuation: false, min_evacuation_coverage: '', evacuation_currency: 'EUR',
    notes_ru: '',
  });

  useEffect(() => {
    getTourTypes().then((res) => setTourTypes(res.data)).catch(() => {});
    getDifficultyLevels().then((res) => setDifficultyLevels(res.data)).catch(() => {});
    getLocations().then((res) => setLocations(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) return;
    getMyProfile()
      .then((profile) => setCanCreate(profile.verification_status_code === 'approved'))
      .catch(() => setCanCreate(false))
      .finally(() => setCheckingAccess(false));
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getMyTour(id)
      .then((res) => {
        const data = res.data;
        setTour(data);
        const trRu = data.translations?.find((tr) => tr.language_code === 'ru') || {};
        setBasic({
          tour_type: data.tour_type || '',
          difficulty_level: data.difficulty_level || '',
          is_custom: data.is_custom || false,
          price: data.price || '',
          currency_code: data.currency_code || 'USD',
          duration_days: data.duration_days || 1,
          duration_hours: data.duration_hours || '',
          min_group_size: data.min_group_size || '',
          max_group_size: data.max_group_size || '',
          title_ru: trRu.title || '',
          summary_ru: trRu.summary || '',
          description_ru: trRu.description || '',
          route_overview_ru: trRu.route_overview || '',
        });
        if (data.visa_details) setVisa(data.visa_details);
        if (data.insurance_details) setInsurance(data.insurance_details);
      })
      .catch(() => setError(t.provider_tour.load_error))
      .finally(() => setLoading(false));
  }, [id]);

  const changeBasic = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setBasic((b) => ({ ...b, [field]: value }));
  };

  const saveBasic = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
        const payload = { ...basic };
        // убираем пустые необязательные числовые поля, чтобы не ловить ошибку валидации
        ['duration_hours', 'min_group_size', 'max_group_size'].forEach((field) => {
        if (payload[field] === '' || payload[field] === null) {
            delete payload[field];
        }
        });

        if (!isEdit) {
        const { data } = await createTour(payload);
        navigate(`/dashboard/tours/${data.id}/edit`, { replace: true });
        } else {
        const { data } = await updateTour(id, payload);
        setTour(data);
        }
    } catch (err) {
        setError(JSON.stringify(err.response?.data) || t.provider_tour.save_error);
    } finally {
        setSaving(false);
    }
    };

  const onPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;
    setSaving(true);
    try {
      await uploadTourPhoto(tour.id, file);
      const { data } = await getMyTour(tour.id);
      setTour(data);
    } catch (err) {
      setError(t.provider_tour.photo_error);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const onDeletePhoto = async (photoId) => {
    if (!tour) return;
    await deleteTourPhoto(tour.id, photoId);
    const { data } = await getMyTour(tour.id);
    setTour(data);
  };

  const onAddPoint = async (e) => {
    e.preventDefault();
    if (!tour || !newPoint.location) return;
    setSaving(true);
    try {
      await addRoutePoint(tour.id, newPoint);
      const { data } = await getMyTour(tour.id);
      setTour(data);
      setNewPoint({ location: '', day_number: '', notes_ru: '' });
    } catch (err) {
      setError(t.provider_tour.route_error);
    } finally {
      setSaving(false);
    }
  };

  const onDeletePoint = async (pointId) => {
    if (!tour) return;
    await deleteRoutePoint(tour.id, pointId);
    const { data } = await getMyTour(tour.id);
    setTour(data);
  };

  const onSaveVisa = async (e) => {
    e.preventDefault();
    if (!tour) return;
    setSaving(true);
    try {
      await setVisaDetails(tour.id, visa);
    } catch (err) {
      setError(t.provider_tour.save_error);
    } finally {
      setSaving(false);
    }
  };

  const onSaveInsurance = async (e) => {
    e.preventDefault();
    if (!tour) return;
    setSaving(true);
    try {
      await setInsuranceDetails(tour.id, insurance);
    } catch (err) {
      setError(t.provider_tour.save_error);
    } finally {
      setSaving(false);
    }
  };

  const onSubmitForReview = async () => {
    if (!tour) return;
    setError(null);
    setSaving(true);
    try {
      const { data } = await submitTour(tour.id);
      setTour(data);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || t.provider_tour.submit_error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-white rounded-2xl border border-gray-100" />;
  }
  
  if (checkingAccess) {
    return <div className="animate-pulse h-64 bg-white rounded-2xl border border-gray-100" />;
  }

  if (!isEdit && !canCreate) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <h3 className="font-semibold text-amber-900 mb-2">{t.dashboard.verify_to_create_title}</h3>
        <p className="text-sm text-amber-700 mb-4">{t.dashboard.verify_to_create_sub}</p>
        <Link to="/dashboard/verification" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700">
          {t.dashboard.go_to_verification}
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? t.provider_tour.edit_title : t.provider_tour.new_title}
        subtitle={t.provider_tour.subtitle}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 break-words">
          {error}
        </div>
      )}

      {/* Основная информация */}
      <form onSubmit={saveBasic} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t.provider_tour.basic_info}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.catalog.tour_type}</label>
            <select required value={basic.tour_type} onChange={changeBasic('tour_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500">
              <option value="">{t.catalog.all}</option>
              {tourTypes.map((tt) => (
                <option key={tt.id} value={tt.id}>{tt[`name_${lang}`]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.catalog.difficulty}</label>
            <select required value={basic.difficulty_level} onChange={changeBasic('difficulty_level')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500">
              <option value="">{t.catalog.all}</option>
              {difficultyLevels.map((dl) => (
                <option key={dl.id} value={dl.id}>{dl[`name_${lang}`]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.title_ru}</label>
          <input required type="text" value={basic.title_ru} onChange={changeBasic('title_ru')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.summary_ru}</label>
          <input type="text" value={basic.summary_ru} onChange={changeBasic('summary_ru')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.description_ru}</label>
          <textarea rows={4} value={basic.description_ru} onChange={changeBasic('description_ru')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.route_overview_ru}</label>
          <textarea rows={2} value={basic.route_overview_ru} onChange={changeBasic('route_overview_ru')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.price}</label>
            <input required type="number" min="0" step="0.01" value={basic.price} onChange={changeBasic('price')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.currency}</label>
            <input type="text" maxLength={3} value={basic.currency_code} onChange={changeBasic('currency_code')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.duration_days}</label>
            <input required type="number" min="1" value={basic.duration_days} onChange={changeBasic('duration_days')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.provider_tour.group_size}</label>
            <div className="flex gap-1">
              <input type="number" min="1" placeholder={t.catalog.from} value={basic.min_group_size} onChange={changeBasic('min_group_size')}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
              <input type="number" min="1" placeholder={t.catalog.to} value={basic.max_group_size} onChange={changeBasic('max_group_size')}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={basic.is_custom} onChange={changeBasic('is_custom')} />
          {t.provider_tour.is_custom}
        </label>

        <button type="submit" disabled={saving}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? '...' : (isEdit ? t.dashboard.save : t.provider_tour.create_and_continue)}
        </button>
      </form>

      {tour && (
        <>
          {/* Фото */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">{t.provider_tour.photos}</h2>
            <div className="flex flex-wrap gap-3">
              {tour.photos?.map((photo) => (
                <div key={photo.id} className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={mediaUrl(photo.file_path)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  {photo.is_cover && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">
                      {t.provider_tour.cover}
                    </span>
                  )}
                </div>
              ))}
              <label className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 text-gray-400 hover:text-blue-500 transition-colors">
                <Upload size={20} />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhotoUpload} />
              </label>
            </div>
          </div>

          {/* Маршрут */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">{t.provider_tour.route}</h2>

            {tour.route_points?.length > 0 && (
              <div className="space-y-2">
                {tour.route_points.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      {p[`location_name_${lang}`]}
                      {p.day_number && <span className="text-gray-400">· {t.provider_tour.day} {p.day_number}</span>}
                    </span>
                    <button onClick={() => onDeletePoint(p.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={onAddPoint} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-gray-500 mb-1">{t.provider_tour.location}</label>
                <select required value={newPoint.location}
                  onChange={(e) => setNewPoint((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">{t.catalog.all}</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc[`name_${lang}`]}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">{t.provider_tour.day}</label>
                <input type="number" min="1" value={newPoint.day_number}
                  onChange={(e) => setNewPoint((p) => ({ ...p, day_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-gray-500 mb-1">{t.provider_tour.notes}</label>
                <input type="text" value={newPoint.notes_ru}
                  onChange={(e) => setNewPoint((p) => ({ ...p, notes_ru: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1">
                <Plus size={14} /> {t.provider_tour.add}
              </button>
            </form>
          </div>

          {/* Виза */}
          <form onSubmit={onSaveVisa} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">{t.tour_detail.visa_section}</h2>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={visa.requires_border_permit}
                onChange={(e) => setVisa((v) => ({ ...v, requires_border_permit: e.target.checked }))} />
              {t.tour_detail.requires_border_permit}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={visa.requires_special_permit}
                onChange={(e) => setVisa((v) => ({ ...v, requires_special_permit: e.target.checked }))} />
              {t.tour_detail.requires_special_permit}
            </label>
            <textarea rows={2} placeholder={t.provider_tour.notes} value={visa.notes_ru || ''}
              onChange={(e) => setVisa((v) => ({ ...v, notes_ru: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
              {t.dashboard.save}
            </button>
          </form>

          {/* Страховка */}
          <form onSubmit={onSaveInsurance} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">{t.tour_detail.insurance_section}</h2>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={insurance.is_insurance_required}
                onChange={(e) => setInsurance((v) => ({ ...v, is_insurance_required: e.target.checked }))} />
              {t.tour_detail.insurance_required}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t.tour_detail.min_medical_coverage}</label>
                <input type="number" value={insurance.min_medical_coverage || ''}
                  onChange={(e) => setInsurance((v) => ({ ...v, min_medical_coverage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t.provider_tour.currency}</label>
                <input type="text" maxLength={3} value={insurance.medical_currency || ''}
                  onChange={(e) => setInsurance((v) => ({ ...v, medical_currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={insurance.requires_evacuation}
                onChange={(e) => setInsurance((v) => ({ ...v, requires_evacuation: e.target.checked }))} />
              {t.provider_tour.requires_evacuation}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t.tour_detail.min_evacuation_coverage}</label>
                <input type="number" value={insurance.min_evacuation_coverage || ''}
                  onChange={(e) => setInsurance((v) => ({ ...v, min_evacuation_coverage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t.provider_tour.currency}</label>
                <input type="text" maxLength={3} value={insurance.evacuation_currency || ''}
                  onChange={(e) => setInsurance((v) => ({ ...v, evacuation_currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>
            <textarea rows={2} placeholder={t.provider_tour.notes} value={insurance.notes_ru || ''}
              onChange={(e) => setInsurance((v) => ({ ...v, notes_ru: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
              {t.dashboard.save}
            </button>
          </form>

          {/* Отправка на модерацию */}
          {tour.status === 'draft' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <button onClick={onSubmitForReview} disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50">
                {t.provider_tour.submit_for_review}
              </button>
            </div>
          )}
          {tour.status !== 'draft' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg p-4">
              {t.dashboard[`tour_status_${tour.status}`]}
            </div>
          )}
        </>
      )}
    </div>
  );
}
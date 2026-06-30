import { useState } from 'react';
import { Map, Plus } from 'lucide-react';
import { useT } from '../../hooks/useT';
import PageHeader from '../../components/PageHeader';

export default function MyToursPage() {
  const { t } = useT();
  const [tours] = useState([]);  // позже подключим к API

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.tours_title}
        subtitle={t.dashboard.tours_sub}
        action={
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Plus size={18} />
            {t.dashboard.new_tour}
          </button>
        }
      />

      {tours.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600">
            <Map size={32} />
          </div>
          <p className="text-gray-500">{t.dashboard.no_tours}</p>
        </div>
      ) : (
        <div>Туры будут здесь</div>
      )}
    </div>
  );
}
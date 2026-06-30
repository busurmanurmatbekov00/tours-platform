import { useState } from 'react';
import { Award, Plus, Trash2, X } from 'lucide-react';
import { useT } from '../../hooks/useT';
import PageHeader from '../../components/PageHeader';

export default function CertificatesPage() {
  const { t } = useT();
  const [certs, setCerts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const add = (cert) => {
    setCerts([...certs, { ...cert, id: Date.now() }]);
    setShowForm(false);
  };
  const remove = (id) => setCerts(certs.filter((c) => c.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.certs_title}
        subtitle={t.dashboard.certs_sub}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            {t.dashboard.add_cert}
          </button>
        }
      />

      {showForm && <CertForm onAdd={add} onClose={() => setShowForm(false)} t={t} />}

      {certs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600">
            <Award size={32} />
          </div>
          <p className="text-gray-500">{t.dashboard.no_certs}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map((c) => (
            <CertCard key={c.id} cert={c} onRemove={() => remove(c.id)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertCard({ cert, onRemove, t }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
          <Award size={22} />
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{cert.title}</h3>
      {cert.issuer && <div className="text-sm text-gray-500">{cert.issuer}</div>}
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
        {cert.issued_date && (
          <div>
            <div className="text-gray-400">{t.dashboard.cert_issued}</div>
            <div className="text-gray-700 font-medium">{cert.issued_date}</div>
          </div>
        )}
        {cert.expiry_date && (
          <div>
            <div className="text-gray-400">{t.dashboard.cert_expiry}</div>
            <div className="text-gray-700 font-medium">{cert.expiry_date}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CertForm({ onAdd, onClose, t }) {
  const [form, setForm] = useState({
    title: '', issuer: '', certificate_number: '',
    issued_date: '', expiry_date: '',
  });
  const change = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd(form);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{t.dashboard.add_cert}</h3>
        <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput label={t.dashboard.cert_title} value={form.title} onChange={change('title')} required />
        <FormInput label={t.dashboard.cert_issuer} value={form.issuer} onChange={change('issuer')} />
        <FormInput label={t.dashboard.cert_number} value={form.certificate_number} onChange={change('certificate_number')} />
        <FormInput label={t.dashboard.cert_issued} type="date" value={form.issued_date} onChange={change('issued_date')} />
        <FormInput label={t.dashboard.cert_expiry} type="date" value={form.expiry_date} onChange={change('expiry_date')} />
      </div>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-md transition-all"
      >
        <Plus size={18} /> {t.dashboard.add_cert}
      </button>
    </form>
  );
}

function FormInput({ label, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        {...rest}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-colors"
      />
    </div>
  );
}
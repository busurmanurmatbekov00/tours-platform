import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Upload, FileText, Send, AlertCircle } from 'lucide-react';
import {
  getMyVerificationRequests, submitVerificationRequest, uploadVerificationDocument,
} from '../../api/providers';
import { useT } from '../../hooks/useT';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';

const DOC_TYPES = [
  { id: 1, label_ru: 'Паспорт', label_en: 'Passport' },
  { id: 2, label_ru: 'Лицензия гида', label_en: 'Guide license' },
  { id: 3, label_ru: 'Регистрация бизнеса', label_en: 'Business registration' },
];

export default function VerificationPage() {
  const { t, lang } = useT();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-verification'],
    queryFn: getMyVerificationRequests,
  });

  const submit = useMutation({
    mutationFn: submitVerificationRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-verification'] }),
  });

  const pending = requests.find((r) => r.status_code === 'pending');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.verif_title}
        subtitle={t.dashboard.verif_sub}
        action={
          !pending && (
            <button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              <Send size={18} />
              {t.dashboard.submit_request}
            </button>
          )
        }
      />

      {isLoading ? (
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      ) : requests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} t={t} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-500">
        <ShieldCheck size={32} />
      </div>
      <p className="text-gray-500">{t.dashboard.no_requests}</p>
    </div>
  );
}

function RequestCard({ req, t, lang }) {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [docTypeId, setDocTypeId] = useState(DOC_TYPES[0].id);
  const [error, setError] = useState(null);

  const upload = useMutation({
    mutationFn: ({ file, typeId }) => uploadVerificationDocument(req.id, file, typeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-verification'] });
      setFile(null);
      setError(null);
    },
    onError: (err) => {
      const resp = err.response?.data;
      setError(typeof resp === 'object' ? JSON.stringify(resp) : 'Ошибка загрузки');
    },
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Заявка #{req.id}
          </div>
          <div className="text-sm text-gray-700 mt-0.5">
            {new Date(req.submitted_at).toLocaleString()}
          </div>
        </div>
        <StatusBadge status={req.status_code} />
      </div>

      {req.admin_comment && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-800">
          <strong className="block text-xs font-semibold uppercase tracking-wide mb-1">
            {t.dashboard.admin_comment}
          </strong>
          {req.admin_comment}
        </div>
      )}

      <div className="p-5">
        <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          {t.dashboard.documents_count} ({req.documents.length})
        </div>

        {req.documents.length === 0 ? (
          <div className="text-sm text-gray-400 italic mb-4">—</div>
        ) : (
          <ul className="space-y-2 mb-4">
            {req.documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <FileText size={18} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{doc.original_filename}</div>
                  <div className="text-xs text-gray-500">{doc.document_type_code}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {req.status_code === 'pending' && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Upload size={16} className="text-gray-400" />
              {t.dashboard.upload_document}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <select
                value={docTypeId}
                onChange={(e) => setDocTypeId(Number(e.target.value))}
                className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {lang === 'ru' ? dt.label_ru : dt.label_en}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium file:cursor-pointer hover:file:bg-blue-100"
              />
              <button
                disabled={!file || upload.isPending}
                onClick={() => upload.mutate({ file, typeId: docTypeId })}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:shadow-md disabled:opacity-50 transition-all"
              >
                <Upload size={16} />
                {upload.isPending ? '...' : t.dashboard.upload}
              </button>
            </div>
            {error && (
              <div className="mt-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
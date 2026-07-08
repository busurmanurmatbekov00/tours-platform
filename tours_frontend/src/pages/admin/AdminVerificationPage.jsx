import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, FileText } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { getAdminVerificationList, getAdminVerificationDetail, approveVerification, rejectVerification } from '../../api/admin';
import { mediaUrl } from '../../api/provider';

export default function AdminVerificationPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-verification'], queryFn: getAdminVerificationList,
  });

  const toggleExpand = async (req) => {
    if (expandedId === req.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(req.id);
    setComment('');
    const full = await getAdminVerificationDetail(req.id);
    setDetail(full);
  };

  const approve = useMutation({
    mutationFn: (id) => approveVerification(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-verification'] });
      setExpandedId(null);
    },
  });

  const reject = useMutation({
    mutationFn: (id) => rejectVerification(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-verification'] });
      setExpandedId(null);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.admin_panel.verification_title}</h1>
        <p className="text-gray-500">{t.admin_panel.verification_sub}</p>
      </div>

      {isLoading ? (
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-500">
          {t.admin_panel.no_requests}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleExpand(req)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <div className="font-semibold text-gray-900">{req.provider_display_name}</div>
                  <div className="text-sm text-gray-500">{req.provider_email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{req.documents_count} {t.admin_panel.docs}</span>
                  <StatusPill status={req.status_code} t={t} />
                </div>
              </button>

              {expandedId === req.id && detail && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  <div className="space-y-2">
                    {detail.documents?.map((doc) => (
                      <a
                        key={doc.id}
                        href={mediaUrl(doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <FileText size={18} className="text-blue-500" />
                        <div>
                          <div className="text-sm text-gray-900">{doc.original_filename}</div>
                          <div className="text-xs text-gray-500">{doc.document_type_name}</div>
                        </div>
                      </a>
                    ))}
                  </div>

                  {req.status_code === 'pending' && (
                    <div className="space-y-3">
                      <textarea
                        placeholder={t.admin_panel.comment_placeholder}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => approve.mutate(req.id)}
                          disabled={approve.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={16} /> {t.admin_panel.approve}
                        </button>
                        <button
                          onClick={() => reject.mutate(req.id)}
                          disabled={reject.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <X size={16} /> {t.admin_panel.reject}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, t }) {
  const colors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {t.dashboard[`status_${status}`] || status}
    </span>
  );
}
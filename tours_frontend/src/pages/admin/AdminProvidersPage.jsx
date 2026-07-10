import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { getAdminProviders, blockProvider, unblockProvider } from '../../api/admin';

export default function AdminProvidersPage() {
  const { t } = useT();
  const qc = useQueryClient();

  const { data: providersResponse, isLoading } = useQuery({
    queryKey: ['admin-providers'], queryFn: () => getAdminProviders(),
    });
    
  const providers = providersResponse?.results || providersResponse || [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-providers'] });
  const block = useMutation({ mutationFn: blockProvider, onSuccess: invalidate });
  const unblock = useMutation({ mutationFn: unblockProvider, onSuccess: invalidate });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.admin_panel.providers_title}</h1>
        <p className="text-gray-500">{t.admin_panel.providers_sub}</p>
      </div>

      {isLoading ? (
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">{t.dashboard.profile}</th>
                <th className="text-left px-4 py-3">{t.auth.role}</th>
                <th className="text-left px-4 py-3">{t.dashboard.status}</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.display_name}</div>
                    <div className="text-xs text-gray-500">{p.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.role_code}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.is_blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.is_blocked ? t.admin_panel.blocked : t.admin_panel.active}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_blocked ? (
                      <button
                        onClick={() => unblock.mutate(p.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                      >
                        <Unlock size={14} /> {t.admin_panel.unblock}
                      </button>
                    ) : (
                      <button
                        onClick={() => block.mutate(p.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                      >
                        <Lock size={14} /> {t.admin_panel.block}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
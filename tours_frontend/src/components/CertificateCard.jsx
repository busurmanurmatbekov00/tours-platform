import { useT } from '../hooks/useT';

export default function CertificateCard({ cert }) {
  const { t, lang } = useT();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-gray-900">{cert.title}</h4>
          {cert.certificate_type_name?.[lang] && (
            <span className="text-xs text-gray-500">{cert.certificate_type_name[lang]}</span>
          )}
        </div>
        {cert.file_url && (
          <a
            href={cert.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
          >
            {t.executor.view_file}
          </a>
        )}
      </div>

      {cert.issuer && (
        <p className="text-sm text-gray-600 mt-1">{cert.issuer}</p>
      )}

      <div className="text-xs text-gray-500 mt-2 flex gap-3">
        {cert.issued_date && <span>{t.executor.issued}: {cert.issued_date}</span>}
        {cert.expiry_date && <span>{t.executor.expires}: {cert.expiry_date}</span>}
      </div>
    </div>
  );
}
import { useT } from '../hooks/useT';

export default function VisaInsuranceBlock({ visaDetails, insuranceDetails }) {
  const { t, lang } = useT();

  if (!visaDetails && !insuranceDetails) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">
        {t.tour_detail.visa_insurance_title}
      </h3>

      {visaDetails && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            {t.tour_detail.visa_section}
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {visaDetails.requires_border_permit && (
              <li>• {t.tour_detail.requires_border_permit}</li>
            )}
            {visaDetails.requires_special_permit && (
              <li>• {t.tour_detail.requires_special_permit}</li>
            )}
          </ul>
          {visaDetails.notes?.[lang] && (
            <p className="text-sm text-gray-600 mt-2">{visaDetails.notes[lang]}</p>
          )}
        </div>
      )}

      {insuranceDetails && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            {t.tour_detail.insurance_section}
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {insuranceDetails.is_insurance_required && (
              <li>• {t.tour_detail.insurance_required}</li>
            )}
            {insuranceDetails.min_medical_coverage && (
              <li>
                • {t.tour_detail.min_medical_coverage}: {insuranceDetails.min_medical_coverage}{' '}
                {insuranceDetails.medical_currency}
              </li>
            )}
            {insuranceDetails.requires_evacuation && insuranceDetails.min_evacuation_coverage && (
              <li>
                • {t.tour_detail.min_evacuation_coverage}: {insuranceDetails.min_evacuation_coverage}{' '}
                {insuranceDetails.evacuation_currency}
              </li>
            )}
          </ul>
          {insuranceDetails.notes?.[lang] && (
            <p className="text-sm text-gray-600 mt-2">{insuranceDetails.notes[lang]}</p>
          )}
        </div>
      )}
    </div>
  );
}
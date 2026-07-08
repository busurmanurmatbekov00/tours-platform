import { useState, useEffect } from 'react';
import { useT } from '../hooks/useT';
import {
  getCountries, getInsuranceRequirements, getHelpArticles,
} from '../api/help';

export default function InfoPage() {
  const { t, lang } = useT();

  const [activeTab, setActiveTab] = useState('visa'); // visa | insurance | articles

  const [countries, setCountries] = useState([]);
  const [countryQuery, setCountryQuery] = useState('');
  const [insurance, setInsurance] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCountries(),
      getInsuranceRequirements(),
      getHelpArticles(),
    ])
      .then(([countriesRes, insuranceRes, articlesRes]) => {
        setCountries(countriesRes.data);
        setInsurance(insuranceRes.data);
        setArticles(articlesRes.data.results || articlesRes.data);
      })
      .catch((err) => console.error('Ошибка загрузки справочника:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCountries = countries.filter((c) => {
    if (!countryQuery.trim()) return true;
    const q = countryQuery.trim().toLowerCase();
    return (c.country_name?.ru || '').toLowerCase().includes(q) || (c.country_name?.en || '').toLowerCase().includes(q);
    });

  const tabs = [
    { key: 'visa', label: t.info.tab_visa },
    { key: 'insurance', label: t.info.tab_insurance },
    { key: 'articles', label: t.info.tab_articles },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.info.title}</h1>
      <p className="text-gray-600 mb-6">{t.info.subtitle}</p>

      {/* Табы */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Визы */}
        {activeTab === 'visa' && (
            <div>
            <input
                type="text"
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
                placeholder={t.info.search_country}
                className="w-full px-4 py-2.5 mb-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />

            {filteredCountries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.catalog.no_results}</p>
            ) : (
                <div className="space-y-2">
                {filteredCountries.map((country) => (
                    <div
                    key={country.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                        {country.country_name[lang]}
                        </span>
                        {country.visa_policy ? (
                        <span className="text-sm text-gray-600">
                            {country.visa_policy.title[lang]}
                        </span>
                        ) : (
                        <span className="text-sm text-gray-400">{t.info.no_policy}</span>
                        )}
                    </div>
                    {country.visa_policy?.description?.[lang] && (
                        <p className="text-xs text-gray-500 mt-2">
                        {country.visa_policy.description[lang]}
                        </p>
                    )}
                    {country.visa_policy?.requires_evisa && country.visa_policy?.evisa_portal_url && (
                        <a
                            href={country.visa_policy.evisa_portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                        {t.info.evisa_portal}
                        </a>
                    )}
                    </div>
                ))}
                </div>
            )}
            </div>
            )}

          {/* Страхование */}
          {activeTab === 'insurance' && (
            <div className="space-y-4">
                {insurance.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.catalog.no_results}</p>
                ) : (
                insurance.map((req) => (
                    <div key={req.id} className="bg-white border border-gray-200 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">{req.title[lang]}</h3>
                    {req.description?.[lang] && (
                        <p className="text-gray-600 text-sm mb-3">{req.description[lang]}</p>
                    )}
                    <div className="text-sm text-gray-500 space-y-1">
                        {req.min_medical_coverage && (
                        <div>{t.tour_detail.min_medical_coverage}: {req.min_medical_coverage} {req.medical_currency}</div>
                        )}
                        {req.requires_evacuation && req.min_evacuation_coverage && (
                        <div>{t.tour_detail.min_evacuation_coverage}: {req.min_evacuation_coverage} {req.evacuation_currency}</div>
                        )}
                    </div>
                    </div>
                ))
                )}
            </div>
            )}

          {/* Статьи */}
          {activeTab === 'articles' && (
            <div className="space-y-3">
                {articles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.catalog.no_results}</p>
                ) : (
                articles.map((article) => (
                    <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">{article.title[lang]}</h3>
                    {article.body?.[lang] && (
                        <p className="text-gray-600 text-sm whitespace-pre-line">{article.body[lang]}</p>
                    )}
                    </div>
                ))
                )}
            </div>
            )}
        </>
      )}
    </div>
  );
}
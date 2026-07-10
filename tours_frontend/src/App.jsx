import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProviderLayout from './components/ProviderLayout';
import AdminLayout from './components/AdminLayout';
import TourDetailPage from './pages/TourDetailPage';
import ExecutorProfilePage from './pages/ExecutorProfilePage';
import InfoPage from './pages/InfoPage';
import TourFormPage from './pages/provider/TourFormPage';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OverviewPage from './pages/provider/OverviewPage';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';
import VerificationPage from './pages/provider/VerificationPage';
import CertificatesPage from './pages/provider/CertificatesPage';
import MyToursPage from './pages/provider/MyToursPage';

import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminVerificationPage from './pages/admin/AdminVerificationPage';
import AdminToursPage from './pages/admin/AdminToursPage';
import AdminTourDetailPage from './pages/admin/AdminTourDetailPage';   // ← добавили
import AdminProvidersPage from './pages/admin/AdminProvidersPage';

const PROVIDER_ROLES = ['guide', 'tour_operator', 'travel_agent'];

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="/tours/:slug" element={<TourDetailPage />} />
        <Route path="/executors/:slug" element={<ExecutorProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="/info" element={<InfoPage />} />

        {/* Личный кабинет исполнителя */}
        <Route element={<ProtectedRoute roles={PROVIDER_ROLES} />}>
          <Route path="dashboard" element={<ProviderLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="profile" element={<ProviderProfilePage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="tours" element={<MyToursPage />} />
            <Route path="tours/new" element={<TourFormPage />} />
            <Route path="tours/:id/edit" element={<TourFormPage />} />
          </Route>
        </Route>

        {/* Панель администратора — отдельная ветка, не внутри dashboard */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin-panel" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="verification" element={<AdminVerificationPage />} />
            <Route path="tours" element={<AdminToursPage />} />
            <Route path="tours/:tourId" element={<AdminTourDetailPage />} />   {/* ← добавили */}
            <Route path="providers" element={<AdminProvidersPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
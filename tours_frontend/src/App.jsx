import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProviderLayout from './components/ProviderLayout';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OverviewPage from './pages/provider/OverviewPage';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';
import VerificationPage from './pages/provider/VerificationPage';
import CertificatesPage from './pages/provider/CertificatesPage';
import MyToursPage from './pages/provider/MyToursPage';

const PROVIDER_ROLES = ['guide', 'tour_operator', 'travel_agent'];

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute roles={PROVIDER_ROLES} />}>
          <Route path="dashboard" element={<ProviderLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="profile" element={<ProviderProfilePage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="tours" element={<MyToursPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
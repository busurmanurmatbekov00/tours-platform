import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          © 2026 Туры Кыргызской Республики
        </div>
      </footer>
    </div>
  );
}
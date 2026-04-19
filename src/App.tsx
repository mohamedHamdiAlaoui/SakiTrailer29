import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import './i18n';
import './App.css';
import StickyContactBar from '@/components/StickyContactBar';
import Header from '@/sections/Header';
import Footer from '@/sections/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Stock = lazy(() => import('@/pages/Stock'));
const StockNew = lazy(() => import('@/pages/StockNew'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Admin = lazy(() => import('@/pages/Admin'));
const AdminProductEdit = lazy(() => import('@/pages/AdminProductEdit'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const elementId = location.hash.replace('#', '');
    const scrollToElement = () => {
      const element = document.getElementById(elementId);
      if (!element) return;

      const headerOffset = 96;
      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(elementTop - headerOffset, 0),
        behavior: 'smooth',
      });
    };

    window.requestAnimationFrame(scrollToElement);
  }, [location.hash, location.pathname]);

  return null;
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  }, [i18n.language, i18n.resolvedLanguage]);

  return (
    <Router>
      <ScrollToHash />
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Suspense
            fallback={
              <section className="min-h-[60vh] bg-slate-50 pt-32">
                <div className="container mx-auto flex items-center justify-center px-4 pb-20">
                  <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-8 py-10 shadow-sm">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
                    <p className="text-sm font-medium text-slate-600">Loading page...</p>
                  </div>
                </div>
              </section>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/stock" element={<Navigate to="/stock/new" replace />} />
              <Route path="/stock/used" element={<Stock />} />
              <Route path="/stock/new" element={<StockNew />} />
              <Route
                path="/admin/products/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProductEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <StickyContactBar />
        <Footer />
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}

export default App;

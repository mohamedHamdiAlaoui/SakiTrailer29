import { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import './i18n';
import './App.css';
import StickyContactBar from '@/components/StickyContactBar';
import Header from '@/sections/Header';
import Footer from '@/sections/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import Stock from '@/pages/Stock';
import StockNew from '@/pages/StockNew';
import ProductDetail from '@/pages/ProductDetail';
import Admin from '@/pages/Admin';
import Dashboard from '@/pages/Dashboard';

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
        </main>
        <StickyContactBar />
        <Footer />
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}

export default App;

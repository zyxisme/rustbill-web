import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { brandName } from 'virtual:brand';
import PublicLayout from '@/layouts/PublicLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageLoader from '@/components/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/hooks/use-toast';

const HomeHero = React.lazy(() => import('@/components/HomeHero'));

const Home = React.lazy(() => import('@/pages/Home'));
const Catalog = React.lazy(() => import('@/pages/Catalog'));
const ProductDetail = React.lazy(() => import('@/pages/ProductDetail'));
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const Overview = React.lazy(() => import('@/pages/dashboard/Overview'));
const MyOrders = React.lazy(() => import('@/pages/dashboard/MyOrders'));
const OrderDetail = React.lazy(() => import('@/pages/dashboard/OrderDetail'));
const MyInstances = React.lazy(() => import('@/pages/dashboard/MyInstances'));
const InstanceDetail = React.lazy(() => import('@/pages/dashboard/InstanceDetail'));
const MyInvoices = React.lazy(() => import('@/pages/dashboard/MyInvoices'));
const MyTickets = React.lazy(() => import('@/pages/dashboard/MyTickets'));
const TicketDetail = React.lazy(() => import('@/pages/dashboard/TicketDetail'));
const MyBalance = React.lazy(() => import('@/pages/dashboard/MyBalance'));
const Settings = React.lazy(() => import('@/pages/dashboard/Settings'));
const Terms = React.lazy(() => import('@/pages/legal/Terms'));
const Privacy = React.lazy(() => import('@/pages/legal/Privacy'));

function AppInit({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return <>{children}</>;
}

function AppTitle() {
  useEffect(() => {
    document.title = brandName;
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppTitle />
      <AppInit>
        <ErrorBoundary>
        <Routes>
          {/* Public pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={
              <Suspense fallback={<PageLoader variant="public" />}>
                <HomeHero />
                <Home />
              </Suspense>
            } />
            <Route path="/catalog" element={<Suspense fallback={<PageLoader variant="public" />}><Catalog /></Suspense>} />
            <Route path="/catalog/:id" element={<Suspense fallback={<PageLoader variant="public" />}><ProductDetail /></Suspense>} />
            <Route path="/login" element={<Suspense fallback={<PageLoader variant="public" />}><Login /></Suspense>} />
            <Route path="/register" element={<Suspense fallback={<PageLoader variant="public" />}><Register /></Suspense>} />
            <Route path="/legal/terms" element={<Suspense fallback={<PageLoader variant="public" />}><Terms /></Suspense>} />
            <Route path="/legal/privacy" element={<Suspense fallback={<PageLoader variant="public" />}><Privacy /></Suspense>} />
          </Route>

          {/* Dashboard pages */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Suspense fallback={<PageLoader variant="dashboard" />}><Overview /></Suspense>} />
            <Route path="/dashboard/orders" element={<Suspense fallback={<PageLoader variant="dashboard" />}><MyOrders /></Suspense>} />
            <Route path="/dashboard/orders/:id" element={<Suspense fallback={<PageLoader variant="dashboard" />}><OrderDetail /></Suspense>} />
            <Route path="/dashboard/instances" element={<Suspense fallback={<PageLoader variant="dashboard" />}><MyInstances /></Suspense>} />
            <Route path="/dashboard/instances/:id" element={<Suspense fallback={<PageLoader variant="dashboard" />}><InstanceDetail /></Suspense>} />
            <Route path="/dashboard/invoices" element={<Suspense fallback={<PageLoader variant="dashboard" />}><MyInvoices /></Suspense>} />
            <Route path="/dashboard/tickets" element={<Suspense fallback={<PageLoader variant="dashboard" />}><MyTickets /></Suspense>} />
            <Route path="/dashboard/tickets/:id" element={<Suspense fallback={<PageLoader variant="dashboard" />}><TicketDetail /></Suspense>} />
            <Route path="/dashboard/balance" element={<Suspense fallback={<PageLoader variant="dashboard" />}><MyBalance /></Suspense>} />
            <Route path="/dashboard/settings" element={<Suspense fallback={<PageLoader variant="dashboard" />}><Settings /></Suspense>} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </AppInit>
      <Toaster />
    </BrowserRouter>
  );
}

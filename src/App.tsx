import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { brandName } from 'virtual:brand';
import PublicLayout from '@/layouts/PublicLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ProductDetail from '@/pages/ProductDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Overview from '@/pages/dashboard/Overview';
import MyOrders from '@/pages/dashboard/MyOrders';
import OrderDetail from '@/pages/dashboard/OrderDetail';
import MyInstances from '@/pages/dashboard/MyInstances';
import InstanceDetail from '@/pages/dashboard/InstanceDetail';
import MyInvoices from '@/pages/dashboard/MyInvoices';
import MyTickets from '@/pages/dashboard/MyTickets';
import TicketDetail from '@/pages/dashboard/TicketDetail';
import MyBalance from '@/pages/dashboard/MyBalance';
import Settings from '@/pages/dashboard/Settings';
import { Toaster } from '@/hooks/use-toast';

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
        <Routes>
          {/* Public pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Dashboard pages */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/dashboard/orders" element={<MyOrders />} />
            <Route path="/dashboard/orders/:id" element={<OrderDetail />} />
            <Route path="/dashboard/instances" element={<MyInstances />} />
            <Route path="/dashboard/instances/:id" element={<InstanceDetail />} />
            <Route path="/dashboard/invoices" element={<MyInvoices />} />
            <Route path="/dashboard/tickets" element={<MyTickets />} />
            <Route path="/dashboard/tickets/:id" element={<TicketDetail />} />
            <Route path="/dashboard/balance" element={<MyBalance />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AppInit>
      <Toaster />
    </BrowserRouter>
  );
}

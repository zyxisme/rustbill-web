import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { Suspense } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageLoader from '@/components/PageLoader';

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
const ApiKeys = React.lazy(() => import('@/pages/dashboard/ApiKeys'));

export default function DashboardApp() {
  return (
    <BrowserRouter basename="/dashboard">
      <DashboardLayout>
        <Suspense fallback={<PageLoader variant="dashboard" />}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="instances" element={<MyInstances />} />
            <Route path="instances/:id" element={<InstanceDetail />} />
            <Route path="invoices" element={<MyInvoices />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="balance" element={<MyBalance />} />
            <Route path="api-keys" element={<ApiKeys />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </DashboardLayout>
    </BrowserRouter>
  );
}

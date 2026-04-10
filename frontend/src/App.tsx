import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import SalesPage from '@/pages/sales/SalesPage'
import SalesHistoryPage from '@/pages/sales/SalesHistoryPage'
import ExpensesPage from '@/pages/expenses/ExpensesPage'
import CashRegisterPage from '@/pages/cashRegister/CashRegisterPage'
import CashRegisterHistoryPage from '@/pages/cashRegister/CashRegisterHistoryPage'
import ProductsPage from '@/pages/products/ProductsPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import UsersPage from '@/pages/users/UsersPage'
import TablesPage from '@/pages/tables/TablesPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import KitchenPage from '@/pages/kitchen/KitchenPage'
import MenuPage from '@/pages/menu/MenuPage'
import OrderStatusPage from '@/pages/menu/OrderStatusPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public menu — no auth */}
        <Route path="/menu/:slug/:qrToken" element={<MenuPage />} />
        <Route path="/menu/:slug/order/:orderId/:result" element={<OrderStatusPage />} />
        <Route path="/menu/:slug/order/:orderId" element={<OrderStatusPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Kitchen — protected but no sidebar */}
        <Route path="/kitchen" element={<ProtectedRoute><KitchenPage /></ProtectedRoute>} />

        {/* Admin app */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="tables" element={<AdminRoute><TablesPage /></AdminRoute>} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/history" element={<SalesHistoryPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="cash-register" element={<CashRegisterPage />} />
          <Route path="cash-register/history" element={<CashRegisterHistoryPage />} />
          <Route path="products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
          <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

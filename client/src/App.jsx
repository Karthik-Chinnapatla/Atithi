import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import {
  Edit3,
  LayoutDashboard,
  MessageSquare,
  Store,
  User,
  UserCog,
  Users,
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { CustomerLayout } from './layouts/CustomerLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { getDefaultRouteForRole } from './utils/formatters';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { HomePage } from './pages/customer/HomePage';
import { RestaurantDetailsPage } from './pages/customer/RestaurantDetailsPage';
import { MyReviewsPage } from './pages/customer/MyReviewsPage';
import { EditReviewPage } from './pages/customer/EditReviewPage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerRestaurantPage } from './pages/owner/OwnerRestaurantPage';
import { OwnerEditRestaurantPage } from './pages/owner/OwnerEditRestaurantPage';
import { OwnerReviewsPage } from './pages/owner/OwnerReviewsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { ManageRestaurantsPage } from './pages/admin/ManageRestaurantsPage';
import { ManageOwnersPage } from './pages/admin/ManageOwnersPage';
import { ManageReviewsPage } from './pages/admin/ManageReviewsPage';
import { ProfilePage } from './pages/ProfilePage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

const OWNER_NAV_ITEMS = [
  { to: '/owner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/owner/restaurant', label: 'My Restaurant', icon: Store, end: true },
  { to: '/owner/restaurant/edit', label: 'Edit Restaurant', icon: Edit3 },
  { to: '/owner/reviews', label: 'Restaurant Reviews', icon: MessageSquare },
  { to: '/owner/profile', label: 'Profile', icon: User },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/restaurants', label: 'Manage Restaurants', icon: Store },
  { to: '/admin/owners', label: 'Manage Restaurant Owners', icon: UserCog },
  { to: '/admin/reviews', label: 'Manage Reviews', icon: MessageSquare },
];

function GuestRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-brand-600 dark:border-stone-700 dark:border-t-brand-500" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }
  return children;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Customer & Public Routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailsPage />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <GuestRoute>
                <VerifyOtpPage />
              </GuestRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/my-reviews" element={<MyReviewsPage />} />
            <Route path="/reviews/:id/edit" element={<EditReviewPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Restaurant Owner Portal */}
        <Route element={<ProtectedRoute allowedRoles={['RESTAURANT_OWNER']} />}>
          <Route
            element={
              <DashboardLayout
                portalTitle="Owner Studio"
                navItems={OWNER_NAV_ITEMS}
              />
            }
          >
            <Route path="/owner" element={<OwnerDashboardPage />} />
            <Route path="/owner/restaurant" element={<OwnerRestaurantPage />} />
            <Route
              path="/owner/restaurant/edit"
              element={<OwnerEditRestaurantPage />}
            />
            <Route path="/owner/reviews" element={<OwnerReviewsPage />} />
            <Route path="/owner/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Administrator Portal */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route
            element={
              <DashboardLayout
                portalTitle="Admin Console"
                navItems={ADMIN_NAV_ITEMS}
              />
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<ManageUsersPage />} />
            <Route path="/admin/restaurants" element={<ManageRestaurantsPage />} />
            <Route path="/admin/owners" element={<ManageOwnersPage />} />
            <Route path="/admin/reviews" element={<ManageReviewsPage />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const { theme } = useTheme();
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        theme={theme}
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: '14px',
          },
        }}
      />
    </AuthProvider>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </MotionConfig>
  );
}

export default App;

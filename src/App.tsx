import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import BottomNav from './components/layout/BottomNav';

// Pages
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
// SignupPage is now embedded in LoginPage
import DashboardPage from './pages/DashboardPage';
import SchedulePickupPage from './pages/SchedulePickupPage';
import ScanPage from './pages/ScanPage';
import RewardsPage from './pages/RewardsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FAQPage from './pages/FAQPage';
import ChatbotPage from './pages/ChatbotPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
// ForgotPasswordPage is now embedded in LoginPage

// Require Authentication Guard
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Layout wrapper that conditionally shows BottomNav
function AppLayout() {
  const location = useLocation();
  const mainNavPaths = ['/dashboard', '/schedule', '/scan', '/rewards', '/profile'];
  const showNav = mainNavPaths.includes(location.pathname);
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root Route */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <OnboardingPage />
        }
      />

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

      {/* Protected Routes Wrapper */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedule" element={<SchedulePickupPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/tickets" element={<SupportTicketsPage />} />
      </Route>

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

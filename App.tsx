// ============================================
// FINAL APP.TSX – COMPLETE ADMIN ROUTING
// File: App.tsx
// ============================================

import React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';

import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import PendingApproval from './pages/PendingApproval';
import Debug from './pages/Debug';

// Main App Pages
import Home from './pages/Home';
import Members from './pages/Members';
import MembersPage from './pages/MembersPage';
import MemberProfile from './pages/MemberProfile';
import Businesses from './pages/Businesses';
import BusinessProfile from './pages/BusinessProfile';
import Explore from './pages/Explore';
import PioneersPage from './pages/PioneersPage';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Market from './pages/Market';
import MarketDetails from './pages/MarketDetails';
import Media from './pages/Media';
import MediaDetails from './pages/MediaDetails';
import Messages from './pages/Messages';
import ChatSession from './pages/ChatSession';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMembers from './pages/admin/Members';
import AdminPioneers from './pages/admin/Pioneers';
import Activities from './pages/admin/Activities';
import PlaceholderPage from './pages/admin/PlaceholderPage';

const AppContent = () => {
  const location = useLocation();

  // Hide BottomNav on auth pages, chat pages, and ALL admin routes
  const hideBottomNav =
    location.pathname === '/' ||
    location.pathname === '/signup' ||
    location.pathname.startsWith('/messages/chat/') ||
    location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/debug" element={<Debug />} />

        {/* ================= MAIN APP ================= */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route path="/members" element={<Members />} />
        <Route path="/members-page" element={<MembersPage />} />
        <Route path="/member/:id" element={<MemberProfile />} />

        <Route path="/businesses" element={<Businesses />} />
        <Route path="/business/:id" element={<BusinessProfile />} />

        <Route path="/explore" element={<Explore />} />
        <Route path="/pioneers" element={<PioneersPage />} />

        <Route path="/events" element={<Events />} />
        <Route path="/event/:id" element={<EventDetails />} />

        <Route path="/market" element={<Market />} />
        <Route path="/market/:id" element={<MarketDetails />} />

        <Route path="/media" element={<Media />} />
        <Route path="/media/:id" element={<MediaDetails />} />

        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/chat/:Id" element={<ChatSession />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />

        <Route path="/notifications" element={<Notifications />} />

        {/* ================= ADMIN ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin routes with AdminLayout wrapper */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="pioneers" element={<AdminPioneers />} />
          <Route path="activities" element={<Activities />} />
          
          {/* Keep other routes as PlaceholderPage for now */}
          <Route path="businesses" element={<PlaceholderPage />} />
          <Route path="announcements" element={<PlaceholderPage />} />
          <Route path="analytics" element={<PlaceholderPage />} />
          <Route path="security" element={<PlaceholderPage />} />
          <Route path="settings" element={<PlaceholderPage />} />
          <Route path="support" element={<PlaceholderPage />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
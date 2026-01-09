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
import Notifications from './components/Notifications';
import { useHeartbeat } from './hooks/useHeartbeat'; // Added heartbeat hook

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
import Profile from './pages/Profile';
import MessagesChat from './pages/MessagesChat';

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
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ================= MAIN APP (PROTECTED) ================= */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members-page"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/:id"
          element={
            <ProtectedRoute>
              <MemberProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/businesses"
          element={
            <ProtectedRoute>
              <Businesses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/:id"
          element={
            <ProtectedRoute>
              <BusinessProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pioneers"
          element={
            <ProtectedRoute>
              <PioneersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event/:id"
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <Market />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market/:id"
          element={
            <ProtectedRoute>
              <MarketDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/media"
          element={
            <ProtectedRoute>
              <Media />
            </ProtectedRoute>
          }
        />
        <Route
          path="/media/:id"
          element={
            <ProtectedRoute>
              <MediaDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/chat/:conversationId"
          element={
            <ProtectedRoute>
              <MessagesChat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ================= */}
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
          <Route path="events" element={<PlaceholderPage />} />
          <Route path="market" element={<PlaceholderPage />} />
          <Route path="media" element={<PlaceholderPage />} />
          
          {/* Catch-all for admin sub-routes */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

function App() {
  // Initialize heartbeat system for online status tracking
  useHeartbeat();
  
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MobileAppWrapper from './components/MobileAppWrapper';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Import pages
import Home from './pages/Home';
import Members from './pages/Members';
import Marketplace from './pages/Marketplace';
import Businesses from './pages/Businesses';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ListingDetails from './pages/ListingDetails';
import Conversation from './pages/Conversation';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected Routes with Layout */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={
              <Layout>
                <Home />
              </Layout>
            } />
            <Route path="/home" element={
              <Layout>
                <Home />
              </Layout>
            } />
            <Route path="/members" element={
              <Layout>
                <Members />
              </Layout>
            } />
            <Route path="/marketplace" element={
              <Layout>
                <Marketplace />
              </Layout>
            } />
            <Route path="/listing/:id" element={
              <Layout>
                <ListingDetails />
              </Layout>
            } />
            <Route path="/businesses" element={
              <Layout>
                <Businesses />
              </Layout>
            } />
            <Route path="/explore" element={
              <Layout>
                <Explore />
              </Layout>
            } />
            <Route path="/profile" element={
              <Layout>
                <Profile />
              </Layout>
            } />
            <Route path="/messages" element={
              <Layout>
                <Messages />
              </Layout>
            } />
<Route path="/messages/:listingId/:userId" element={
  <Layout>
    <Conversation />
  </Layout>
} />

            <Route path="/notifications" element={
              <Layout>
                <Notifications />
              </Layout>
            } />
            <Route path="/settings" element={
              <Layout>
                <Settings />
              </Layout>
            } />
          </Route>
          
          {/* Redirect to home if route not found */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Layout component that includes Header, MobileAppWrapper, and BottomNav
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Full width (outside wrapper) */}
      <Header />
      
      {/* Page Content - Inside wrapper (640px max) */}
      <MobileAppWrapper>
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
      </MobileAppWrapper>
      
      {/* BottomNav - Full width (outside wrapper) */}
      <BottomNav />
    </div>
  );
};

export default App;
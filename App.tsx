import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MobileAppWrapper from './components/MobileAppWrapper';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Import pages
import Home from './pages/Home';
import Members from './pages/Members';
import Marketplace from './pages/Marketplace';
import Businesses from './pages/Businesses';
import BusinessDetails from './pages/BusinessDetails';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ListingDetails from './pages/ListingDetails';
import Conversations from './pages/Conversations';
import ChatWindow from './pages/ChatWindow';
import NewConversation from './pages/NewConversation';
import HelpSupport from './pages/HelpSupport';
import PendingApproval from './pages/PendingApproval';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route element={<PrivateRoute />}>
            {/* Chat pages - NO Layout wrapper (ChatWindow has its own UI) */}
            <Route path="/messages/:conversationId" element={<ChatWindow />} />
            
            {/* All other pages - WITH Layout wrapper */}
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
            <Route path="/marketplace/:id" element={
              <Layout>
                <ListingDetails />
              </Layout>
            } />
            <Route path="/businesses" element={
              <Layout>
                <Businesses />
              </Layout>
            } />
            <Route path="/business/:id" element={
              <Layout>
                <BusinessDetails />
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
            <Route path="/profile/:userId" element={
              <Layout>
                <Profile />
              </Layout>
            } />
            <Route path="/messages" element={
              <Layout>
                <Conversations />
              </Layout>
            } />
            <Route path="/messages/new" element={
              <Layout>
                <NewConversation />
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
            <Route path="/help-support" element={
              <Layout>
                <HelpSupport />
              </Layout>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MobileAppWrapper>
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
      </MobileAppWrapper>
      <BottomNav />
    </div>
  );
};

export default App;
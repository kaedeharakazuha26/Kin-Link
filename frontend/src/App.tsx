import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import Discover from './pages/Discover';
import ChatBox from './pages/ChatBox';
import Layout from './pages/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#18182f',
            color: '#fff',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        {/* Public Login & Register */}
        <Route path="/login" element={<Login />} />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="friends" element={<Friends />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;

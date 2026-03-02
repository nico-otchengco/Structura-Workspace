import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../context/authContext';
import { LoginPage } from './components/auth/loginPage';
import { SignupPage } from './components/auth/signupPage';
import { Dashboard } from './components/dashboard/dashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showSignup) {
      return <SignupPage onSwitchToLogin={() => setShowSignup(false)} />;
    }
    return <LoginPage onSwitchToSignup={() => setShowSignup(true)} />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

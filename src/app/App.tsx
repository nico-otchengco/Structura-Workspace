import { useState } from 'react';
import { AuthProvider, useAuth } from '../context/authContext';
import { LoginPage } from './components/auth/loginPage';
import { SignupPage } from './components/auth/signupPage';
import { Dashboard } from './components/dashboard/dashboard';
import { WorkspaceProvider } from '../context/workspaceContext';
import { LandingPage } from './components/landingPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

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

  if (user) {
    return (
      <WorkspaceProvider user={user}>
        <Dashboard />
      </WorkspaceProvider>
    );
  }

  if (!showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  if (showSignup) {
    return <SignupPage onSwitchToLogin={() => setShowSignup(false)} onGoHome={() => setShowAuth(false)} />;
  }

  return <LoginPage onSwitchToSignup={() => setShowSignup(true)} onGoHome={() => setShowAuth(false)}/>;
    
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
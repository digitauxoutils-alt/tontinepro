import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import AuthForm from './components/Auth/AuthForm';
import InitiatriceDashboard from './components/Dashboard/InitiatriceDashboard';
import ParticipantDashboard from './components/Dashboard/ParticipantDashboard';
import CreateTontine from './components/Tontines/CreateTontine';
import LoadingSpinner from './components/Common/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return userProfile.role === 'initiatrice' ? 
    <InitiatriceDashboard /> : 
    <ParticipantDashboard />;
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser && <Navbar />}
      
      <Routes>
        <Route 
          path="/auth" 
          element={
            currentUser ? <Navigate to="/dashboard" replace /> : <AuthForm />
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tontines/create" 
          element={
            <ProtectedRoute>
              <CreateTontine />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tontines" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Tontines</h2>
                  <p className="text-gray-600">Cette page sera développée prochainement</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/paiements" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Paiements</h2>
                  <p className="text-gray-600">Cette page sera développée prochainement</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profil" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Profil</h2>
                  <p className="text-gray-600">Cette page sera développée prochainement</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Page non trouvée</h2>
                <p className="text-gray-600">La page que vous cherchez n'existe pas</p>
              </div>
            </div>
          } 
        />
      </Routes>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
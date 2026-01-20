/**
 * Main App Component
 * 
 * Root component that handles routing and authentication.
 * Shows login page if not authenticated, dashboard if authenticated.
 */

import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Dashboard />
    </div>
  );
}

export default App;

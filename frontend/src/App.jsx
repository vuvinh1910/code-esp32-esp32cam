import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Layout/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WateringConfig } from './pages/WateringConfig';
import { Devices } from './pages/Devices';
import { UserManagement } from './pages/UserManagement';
import { FirmwareUpdates } from './pages/FirmwareUpdates';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Protected route wrapper - check auth inside component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 bg-background overflow-auto">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watering-config"
          element={
            <ProtectedRoute>
              <WateringConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <Devices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/firmware"
          element={
            <ProtectedRoute>
              <FirmwareUpdates />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

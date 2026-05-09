// ============================================
// src/App.jsx
// ============================================
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import { ROLES } from './constants/roles';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Login from './components/auth/Login';
import WizardRegistration from './components/auth/WizardRegistration';
import CustomerDashboard from './components/customer/Dashboard';
import SalonList from './components/customer/SalonList';
import BookingFlow from './components/customer/BookingFlow';
import BookingDetails from './components/customer/BookingDetails';
import SalonDashboard from './components/salon/Dashboard';
import Appointments from './components/salon/Appointments';
import StylistManagement from './components/salon/StylistManagement';
import AdminDashboard from './components/admin/Dashboard';
import Reports from './components/admin/Reports';
import Users from './components/admin/Users';
import ComingSoon from './components/common/ComingSoon';
import Sidebar from './components/common/Sidebar';
import ClaimSalon from './components/claim/ClaimSalon';


function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<WizardRegistration />} />
              <Route path="/salons" element={<SalonList />} />
              <Route path="/comingsoon" element={<ComingSoon />} />
              <Route path="/claim/:salonId" element={<ClaimSalon />} />

              {/* Customer Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
                    <BookingFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
                    <BookingDetails />
                  </ProtectedRoute>
                }
              />

              {/* Salon Routes */}
              <Route
                path="/salon/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SALON]}>
                    <Sidebar/>
                    <SalonDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/salon/appointments"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SALON]}>
                    <Sidebar/>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/salon/Stylists"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SALON]}>
                    <Sidebar/>
                    <StylistManagement/>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/Reports"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/Users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Users />
                  </ProtectedRoute>
                }
              />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/salons" />} />
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
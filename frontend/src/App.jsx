// ============================================
// src/App.jsx
// ============================================
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ProtectedRoute from './routes/ProtectedRoute';
import { ROLES } from './constants/roles';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ChangePassword from './components/auth/ChangePassword';
import WizardRegistration from './components/auth/WizardRegistration';
import CustomerDashboard from './components/customer/Dashboard';
import SalonList from './components/customer/SalonList';
import BookingFlow from './components/customer/BookingFlow';
import BookingDetails from './components/customer/BookingDetails';
import SalonDashboard from './components/salon/Dashboard';
import Appointments from './components/salon/Appointments';
import StylistManagement from './components/salon/StylistManagement';
import SalonServices from './components/salon/Services';
import BranchManagement from './components/salon/BranchManagement';
import SalonSettings from './components/salon/SalonSettings';
import { OwnerProvider } from './components/salon/OwnerContext';
import AdminDashboard from './components/admin/Dashboard';
import Reports from './components/admin/Reports';
import Users from './components/admin/Users';
import SalonApprovals from './components/admin/SalonApprovals';
import AdminBookings from './components/admin/Bookings';
import ComingSoon from './components/common/ComingSoon';
import Footer from './components/common/Footer.tsx';
import Home from './components/common/Home.jsx';
import Sidebar from './components/common/Sidebar';
import ClaimSalon from './components/claim/ClaimSalon';
import SalonDetail from './components/customer/SalonDetail';
import { HelmetProvider } from 'react-helmet-async';
import Profile from './components/customer/Profile.jsx';




function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <HelmetProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<WizardRegistration />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/salons" element={<SalonList />} />
              <Route path="/salons/:city/:slug" element={<SalonDetail />} />
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
                path="/account/password"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
                    <Profile />
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

              {/* Salon Routes: one layout route = sidebar + the owner's salon data on EVERY salon page */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SALON]}>
                    <OwnerProvider>
                      <Sidebar />
                      <Outlet />
                    </OwnerProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/salon/dashboard" element={<SalonDashboard />} />
                <Route path="/salon/appointments" element={<Appointments />} />
                <Route path="/salon/services" element={<SalonServices />} />
                <Route path="/salon/stylists" element={<StylistManagement />} />
                <Route path="/salon/branches" element={<BranchManagement />} />
                <Route path="/salon/settings" element={<SalonSettings />} />
              </Route>

              {/* Admin Routes: one layout route guarantees the sidebar on EVERY admin page */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Sidebar />
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/salons" element={<SalonApprovals />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/settings" element={<ComingSoon />} />
              </Route>

              {/* Default Route */}
              <Route path="/" element={<Home/>} />
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
      <Footer />
      </LanguageProvider>
    </BrowserRouter>
          </HelmetProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
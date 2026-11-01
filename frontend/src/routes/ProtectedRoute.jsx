import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../constants/roles';

const roleRedirectMap = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.SALON]: '/salon/dashboard',
  [ROLES.CUSTOMER]: '/dashboard'
};

const ProtectedRoute = ({ children, allowedRoles }) => { 
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = roleRedirectMap[user.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;

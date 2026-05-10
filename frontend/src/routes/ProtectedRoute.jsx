<<<<<<< HEAD
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../constants/roles';

const roleRedirectMap = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.SALON]: '/salon/dashboard',
  [ROLES.CUSTOMER]: '/dashboard'
};

const ProtectedRoute = ({ children, allowedRoles }) => { 
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = roleRedirectMap[user.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
=======
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../constants/roles';

const roleRedirectMap = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.SALON]: '/salon/dashboard',
  [ROLES.CUSTOMER]: '/dashboard'
};

const ProtectedRoute = ({ children, allowedRoles }) => { 
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = roleRedirectMap[user.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7

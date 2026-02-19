import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: Array<'developer' | 'admin' | 'manager' | 'assistant'>;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const { lang = 'pt' } = useParams<{ lang: string }>();

  if (!user || !allowedRoles.includes(user.role)) {
    const fallback = user?.role === 'developer' ? `/${lang}/dev-dashboard` : `/${lang}/dashboard`;
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

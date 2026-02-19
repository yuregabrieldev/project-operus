import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isDeveloper } from '@/lib/developer-access';

interface ProtectedRouteProps {
  allowedRoles: Array<'developer' | 'admin' | 'manager' | 'assistant'>;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const { lang = 'pt' } = useParams<{ lang: string }>();
  const dev = isDeveloper(user);

  if (!user || (!allowedRoles.includes(user.role) && !(dev && allowedRoles.includes('developer')))) {
    const fallback = dev ? `/${lang}/dev-dashboard` : `/${lang}/dashboard`;
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

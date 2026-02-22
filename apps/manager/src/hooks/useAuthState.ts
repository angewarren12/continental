import { useAuth } from '../contexts/AuthContext';

export const useAuthState = () => {
  const { user, loading } = useAuth();
  return {
    user: user && user.role === 'manager' ? user : null,
    loading,
  };
};

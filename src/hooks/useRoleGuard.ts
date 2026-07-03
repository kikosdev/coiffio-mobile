import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { mapBackendRoleToSurface } from '../features/auth/roleConfig';
import { Role } from '../theme/tokens';

/** Redirects to the role picker if there's no signed-in account, or its real role doesn't match this surface. */
export function useRoleGuard(surface: Role) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status !== 'ready') return; // still hydrating from SecureStore — don't redirect yet
    if (!user || mapBackendRoleToSurface(user.role) !== surface) {
      router.replace('/');
    }
  }, [status, user, surface]);
}

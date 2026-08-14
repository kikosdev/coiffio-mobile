import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { api, setAuthToken, setUnauthorizedCallback, ApiError } from '../api/client';
import { resetOwnerTenantCache } from '../api/owner/tenant';
import { disconnectNotificationsSocket } from '../hooks/useNotificationsRealtime';
import { useNotificationsStore } from './notifications';
import { BackendRole } from '../features/auth/roleConfig';

export const TOKEN_KEY = 'auth_token';

export interface AuthUser {
  id: string;
  salonId: string;
  name: string;
  email: string;
  phone: string;
  role: BackendRole;
  color?: string;
  isActive: boolean;
  registered: boolean;
  accountType: 'staff' | 'client';
  staffId?: string;
  clientId?: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthState {
  status: 'idle' | 'hydrating' | 'ready';
  user: AuthUser | null;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  registerClient: (dto: { name: string; identifier: string; phone: string; password: string; email?: string }) => Promise<AuthUser>;
  updateProfile: (dto: { name?: string; email?: string; phone?: string }) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateExpoPushToken: (expoPushToken?: string | null) => Promise<void>;
  deactivateAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,
  error: null,

  /**
   * Le `catch` distingue désormais EXACTEMENT ce que `setUnauthorizedCallback` (plus bas dans
   * ce fichier) distingue déjà pour un 401 mid-session — c'était le seul chemin qui ne le
   * faisait pas. Avant ce fix, un `catch` nu supprimait le token sur TOUTE erreur : un timeout
   * réseau, un cold start Render (~50s), ou un 500 transitoire pendant un déploiement se
   * traduisaient par une déconnexion silencieuse, alors que le token restait parfaitement
   * valide — l'utilisateur perdait sa session à chaque échec passager du réseau ou du backend,
   * pas seulement quand son compte était réellement invalidé.
   *
   * - 401 (`ApiError` avec ce status) = le token EST invalide → seul cas qui déconnecte.
   * - Tout le reste (timeout, 5xx, erreur réseau — jamais une `ApiError` avec un vrai status,
   *   voir `fetchWithTimeout`) = échec TRANSITOIRE → le token est conservé tel quel. `user`
   *   reste `null` pour ce cycle (rien à afficher tant que `/auth/me` n'a pas réussi), mais rien
   *   n'est effacé : un futur remount de ce layout, un pull-to-refresh, ou le prochain appel
   *   authentifié qui réussit peut restaurer la session sans nouvelle connexion.
   * - Dans les deux cas, `status` finit toujours à `'ready'` — jamais bloqué sur `'hydrating'`.
   */
  hydrate: async () => {
    set({ status: 'hydrating' });
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ status: 'ready', user: null });
      return;
    }
    setAuthToken(token);
    try {
      const user = await api.get<AuthUser>('/auth/me');
      set({ status: 'ready', user });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthToken(null);
      }
      set({ status: 'ready', user: null });
    }
  },

  login: async (identifier, password) => {
    set({ error: null });
    try {
      const res = await api.post<LoginResponse>('/auth/login', { identifier, password });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      setAuthToken(res.token);
      set({ user: res.user, status: 'ready' });
      return res.user;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to sign in.';
      set({ error: message });
      throw err;
    }
  },

  registerClient: async (dto) => {
    set({ error: null });
    try {
      const res = await api.post<LoginResponse>('/auth/register/client', dto);
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      setAuthToken(res.token);
      set({ user: res.user, status: 'ready' });
      return res.user;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create account.';
      set({ error: message });
      throw err;
    }
  },

  updateProfile: async (dto) => {
    const updated = await api.patch<AuthUser>('/auth/me', dto);
    set((s) => ({ user: s.user ? { ...s.user, ...updated } : updated }));
    return updated;
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.patch('/auth/me/password', { currentPassword, newPassword });
  },

  updateExpoPushToken: async (expoPushToken) => {
    await api.patch('/auth/me/push-token', { expoPushToken });
  },

  deactivateAccount: async () => {
    await api.patch('/auth/me/deactivate');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    resetOwnerTenantCache();
    // Le socket porte le token du compte sortant, et la liste de notifications appartient à
    // ce compte : les deux doivent disparaître avec la session, jamais survivre à un
    // changement d'utilisateur.
    disconnectNotificationsSocket();
    useNotificationsStore.getState().reset(); // termine aussi la session — même purge que logout()
    set({ user: null, status: 'ready' });
  },

  /**
   * `resetOwnerTenantCache()` est appelé ici, dans le store, et pas dans l'écran de settings
   * owner : le slug et le salon mémoïsés survivent à la session (variable de module + store
   * Zustand), donc TOUT chemin de déconnexion doit les purger — sinon une reconnexion sur un
   * autre compte owner enverrait les appels `/:salonSlug/...` vers le tenant précédent.
   * No-op pour un client ou un staff, qui n'alimentent jamais ce cache.
   */
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    resetOwnerTenantCache();
    // Le socket porte le token du compte sortant, et la liste de notifications appartient à
    // ce compte : les deux doivent disparaître avec la session, jamais survivre à un
    // changement d'utilisateur.
    disconnectNotificationsSocket();
    useNotificationsStore.getState().reset();
    set({ user: null, status: 'ready' });
  },
}));

// Registered once at module load — client.ts holds only this callback reference, never an
// import of this file, so a 401 mid-session can still purge the token and redirect without a
// circular import between api/client.ts and stores/auth.ts.
setUnauthorizedCallback(() => {
  const { status, user } = useAuthStore.getState();
  // status !== 'ready' (still 'hydrating') or no user yet means this 401 came from
  // hydrate()'s own startup check, not an active session — its existing catch block already
  // handles that case; nothing here to interrupt.
  if (status !== 'ready' || !user) return;

  SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  setAuthToken(null);
  useAuthStore.setState({ user: null, status: 'ready', error: null });
  router.replace('/(auth)/login' as never);
});

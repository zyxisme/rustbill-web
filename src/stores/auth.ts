import { create } from 'zustand';
import {
  api,
  loadConfig,
  setTokens,
  clearTokens,
  loadTokens,
  setCustomerId,
  tryRefreshToken,
} from '@/api/grpc-client';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  customerId: string;
  userType: string;
}

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function normalizeUser(u: Record<string, unknown>): UserInfo {
  return {
    id: String(u.id ?? ''),
    username: String(u.username ?? ''),
    email: String(u.email ?? ''),
    displayName: String(u.displayName ?? ''),
    role: String(u.role ?? 'customer'),
    customerId: String(u.customerId ?? ''),
    userType: String(u.userType ?? 'customer'),
  };
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unknown error occurred';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      await loadConfig();
      loadTokens();
      if (!localStorage.getItem('rustbill_customer_token')) {
        set({ loading: false });
        return;
      }
      try {
        const resp = (await api.getMe()) as Record<string, unknown>;
        const u = resp.user as Record<string, unknown> | undefined;
        if (u?.id) {
          set({ user: normalizeUser(u), loading: false });
          return;
        }
      } catch {
        // Token may be expired; try refresh
      }

      const refreshed = await tryRefreshToken();
      if (refreshed) {
        try {
          const resp2 = (await api.getMe()) as Record<string, unknown>;
          const u2 = resp2.user as Record<string, unknown> | undefined;
          if (u2?.id) {
            set({ user: normalizeUser(u2), loading: false });
            return;
          }
        } catch {
          // Still failed after refresh
        }
      }
      clearTokens();
      set({ user: null, loading: false });
    } catch (err) {
      set({ loading: false, error: extractMessage(err) });
    }
  },

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const resp = (await api.login({ username, password, userType: 'customer' })) as Record<string, unknown>;
      const accessToken = resp.accessToken as string;
      const refreshToken = resp.refreshToken as string | undefined;
      const expiresIn = resp.expiresIn as number | undefined;
      setTokens(accessToken, refreshToken, expiresIn);
      if (resp.user) {
        const u = resp.user as Record<string, unknown>;
        if (u.customerId) {
          setCustomerId(String(u.customerId));
        }
        set({ user: normalizeUser(u), loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ loading: false, error: extractMessage(err) });
      throw err;
    }
  },

  register: async (username: string, email: string, displayName: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const resp = (await api.register({ username, email, displayName, password })) as Record<string, unknown>;
      if (resp.accessToken) {
        const accessToken = resp.accessToken as string;
        const refreshTokenVal = resp.refreshToken as string | undefined;
        setTokens(accessToken, refreshTokenVal);
      }
      if (resp.user) {
        const u = resp.user as Record<string, unknown>;
        if (u.customerId) {
          setCustomerId(String(u.customerId));
        }
        set({ user: normalizeUser(u), loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ loading: false, error: extractMessage(err) });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await api.logout();
    } catch {
      // Best-effort server-side logout; clear local state regardless
    }
    clearTokens();
    set({ user: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));

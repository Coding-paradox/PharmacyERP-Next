import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import type { SetupPayload } from '../services/auth.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  pharmacyId: string;
}

/** Données envoyées lors de l'installation initiale (/setup). */
export type SetupData = SetupPayload;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setup: (data: SetupData) => Promise<void>;
}

const STORAGE_KEYS = ['accessToken', 'refreshToken', 'user'] as const;

/** Événement à déclencher (window.dispatchEvent) quand le refresh échoue. */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -----------------------------------------------------------------------------
// Utilitaires
// -----------------------------------------------------------------------------

function isValidUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const u = value as Record<string, unknown>;
  return (
    typeof u.id === 'string' &&
    u.id.length > 0 &&
    typeof u.email === 'string' &&
    typeof u.firstName === 'string' &&
    typeof u.lastName === 'string' &&
    typeof u.role === 'string' &&
    typeof u.pharmacyId === 'string'
  );
}

/** Accepte soit un User, soit une réponse { user, tokens }. */
function extractUser(response: unknown): User | null {
  if (isValidUser(response)) return response;
  if (response && typeof response === 'object' && 'user' in response) {
    const candidate = (response as { user: unknown }).user;
    if (isValidUser(candidate)) return candidate;
  }
  return null;
}

function clearLocalSession(): void {
  try {
    STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage indisponible (navigation privée stricte) : rien à faire
  }
}

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialisation depuis le stockage local
  useEffect(() => {
    let isMounted = true;

    try {
      const token = authService.getAccessToken();
      const storedUser: unknown = authService.getUser();

      if (token && isValidUser(storedUser)) {
        if (isMounted) setUser(storedUser);
      } else {
        clearLocalSession();
      }
    } catch (error) {
      console.error('Erreur à l’initialisation de l’authentification :', error);
      clearLocalSession();
    } finally {
      if (isMounted) setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Déconnexion forcée (refresh échoué) + synchronisation multi-onglets
  useEffect(() => {
    const handleForcedLogout = () => {
      clearLocalSession();
      setUser(null);
    };

    const handleStorage = (event: StorageEvent) => {
      // event.key === null : localStorage.clear() dans un autre onglet
      if (event.key === null || event.key === 'accessToken' || event.key === 'user') {
        const token = authService.getAccessToken();
        const storedUser: unknown = authService.getUser();
        setUser(token && isValidUser(storedUser) ? storedUser : null);
      }
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response: unknown = await authService.login(email.trim(), password);
    const loggedUser = extractUser(response);

    if (!loggedUser) {
      clearLocalSession();
      throw new Error('Réponse de connexion invalide.');
    }
    setUser(loggedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // L'échec côté serveur ne doit jamais bloquer la déconnexion locale
      console.warn('Échec de la déconnexion côté serveur :', error);
    } finally {
      clearLocalSession();
      setUser(null);
    }
  }, []);

  const setup = useCallback(async (data: SetupData) => {
    const response: unknown = await authService.setup(data);
    const createdUser = extractUser(response);

    if (!createdUser) {
      clearLocalSession();
      throw new Error('Réponse d’installation invalide.');
    }
    setUser(createdUser);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      setup,
    }),
    [user, isLoading, login, logout, setup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider');
  }
  return context;
}

import { api } from './api';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  pharmacyId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

interface SetupResponse {
  user: AuthUser;
  pharmacy: {
    id: string;
    name: string;
    tenantId: string;
  };
  tokens: AuthTokens;
}

/** Données envoyées à /setup/init, conformes au DTO imbriqué de l’API. */
export interface SetupPayload {
  pharmacy: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    timezone?: string;
    currency?: string;
  };
  admin: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

// -----------------------------------------------------------------------------
// Constantes
// -----------------------------------------------------------------------------

const KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
} as const;

/**
 * Doit rester identique à AUTH_LOGOUT_EVENT dans AuthContext.tsx.
 * (Défini ici pour éviter un import circulaire AuthContext <-> auth.service.)
 */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

/** Marge (secondes) pour considérer un access token comme expiré. */
const EXPIRY_LEEWAY_SECONDS = 10;

// -----------------------------------------------------------------------------
// Utilitaires
// -----------------------------------------------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isValidUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const u = value as Record<string, unknown>;
  return (
    isNonEmptyString(u.id) &&
    isNonEmptyString(u.email) &&
    typeof u.firstName === 'string' &&
    typeof u.lastName === 'string' &&
    isNonEmptyString(u.role) &&
    isNonEmptyString(u.pharmacyId)
  );
}

function isValidTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  return isNonEmptyString(t.accessToken) && isNonEmptyString(t.refreshToken);
}

/** Décode le payload d'un JWT, sans vérifier la signature (usage UI uniquement). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const payload: unknown = JSON.parse(json);
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

class AuthService {
  /** Refresh en cours, partagé par tous les appelants (single-flight). */
  private refreshPromise: Promise<string> | null = null;

  // --- Session locale --------------------------------------------------------

  private saveSession(user: AuthUser, tokens: AuthTokens): void {
    try {
      localStorage.setItem(KEYS.accessToken, tokens.accessToken);
      localStorage.setItem(KEYS.refreshToken, tokens.refreshToken);
      localStorage.setItem(KEYS.user, JSON.stringify(user));
    } catch (error) {
      this.clearSession();
      throw new Error(`Impossible d’enregistrer la session : ${errorMessage(error)}`);
    }
  }

  private saveTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(KEYS.accessToken, tokens.accessToken);
      localStorage.setItem(KEYS.refreshToken, tokens.refreshToken);
    } catch (error) {
      this.clearSession();
      throw new Error(`Impossible d’enregistrer les tokens : ${errorMessage(error)}`);
    }
  }

  clearSession(): void {
    try {
      Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    } catch {
      // localStorage indisponible : rien à faire
    }
  }

  /** Vide la session et prévient le AuthContext (refresh échoué, 401 définitif...). */
  forceLogout(): void {
    this.clearSession();
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }

  // --- Actions ---------------------------------------------------------------

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email: email.trim(),
      password,
    });

    const { user, tokens } = response.data ?? ({} as Partial<LoginResponse>);
    if (!isValidUser(user) || !isValidTokens(tokens)) {
      this.clearSession();
      throw new Error('Réponse de connexion invalide.');
    }

    this.saveSession(user, tokens);
    return user;
  }

  async logout(): Promise<void> {
    try {
      // Révoque les refresh tokens côté serveur (nécessite un access token valide)
      if (this.getAccessToken()) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Échec de la déconnexion côté serveur :', errorMessage(error));
    } finally {
      this.clearSession();
    }
  }

  async setup(data: SetupPayload): Promise<AuthUser> {
    const response = await api.post<SetupResponse>('/setup/init', data);

    const { user, tokens } = response.data ?? ({} as Partial<SetupResponse>);
    if (!isValidUser(user) || !isValidTokens(tokens)) {
      this.clearSession();
      throw new Error('Réponse d’installation invalide.');
    }

    this.saveSession(user, tokens);
    return user;
  }

  /**
   * Renouvelle les tokens. Un seul appel réseau à la fois : les appels
   * simultanés partagent la même promesse (indispensable avec la rotation
   * + détection de réutilisation côté backend).
   * Renvoie le nouvel access token. En cas d'échec : forceLogout() puis throw.
   *
   * ⚠️ Dans api.ts, l'appel à /auth/refresh ne doit PAS repasser par
   * l'intercepteur de refresh (sinon boucle infinie).
   */
  refreshTokens(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.forceLogout();
        throw new Error('Aucun refresh token disponible.');
      }

      try {
        const response = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
        const tokens: unknown = response.data;
        if (!isValidTokens(tokens)) {
          throw new Error('Réponse de refresh invalide.');
        }
        this.saveTokens(tokens);
        return tokens.accessToken;
      } catch (error) {
        this.forceLogout();
        throw error instanceof Error ? error : new Error('Échec du refresh.');
      }
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  // --- Lecture ---------------------------------------------------------------

  getUser(): AuthUser | null {
    const userStr = safeGet(KEYS.user);
    if (!userStr) return null;
    try {
      const parsed: unknown = JSON.parse(userStr);
      if (isValidUser(parsed)) return parsed;
    } catch {
      // JSON corrompu
    }
    try {
      localStorage.removeItem(KEYS.user);
    } catch {
      // ignore
    }
    return null;
  }

  /** Vrai si l'access token est présent et pas expiré (indication UI seulement). */
  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return false;
    return payload.exp - EXPIRY_LEEWAY_SECONDS > Date.now() / 1000;
  }

  /**
   * Vrai si une session existe localement (access token valide, ou refresh
   * token présent pour le renouveler). La vérification réelle est faite par l'API.
   */
  isAuthenticated(): boolean {
    return this.isAccessTokenValid() || !!this.getRefreshToken();
  }

  getAccessToken(): string | null {
    return safeGet(KEYS.accessToken);
  }

  getRefreshToken(): string | null {
    return safeGet(KEYS.refreshToken);
  }
}

export const authService = new AuthService();

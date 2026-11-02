import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

const API_URL = '/api/v1';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Routes pour lesquelles un 401 est une réponse normale (mauvais identifiants,
 * refresh refusé...) et ne doit JAMAIS déclencher un refresh automatique.
 */
const NO_REFRESH_ROUTES = ['/auth/login', '/auth/refresh', '/setup/init'];

/** Requête Axios marquée comme déjà rejouée après un refresh. */
type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

function isNoRefreshRoute(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REFRESH_ROUTES.some((route) => url.includes(route));
}

/**
 * Import paresseux : auth.service.ts importe `api` depuis ce fichier, un import
 * statique dans l'autre sens créerait une dépendance circulaire.
 */
async function getAuthService() {
  const { authService } = await import('./auth.service');
  return authService;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(this.handleRequest.bind(this));
    this.client.interceptors.response.use(
      (response) => response,
      this.handleResponseError.bind(this),
    );
  }

  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    let token: string | null = null;
    try {
      token = localStorage.getItem('accessToken');
    } catch {
      // localStorage indisponible : requête envoyée sans token
    }

    if (token && !isNoRefreshRoute(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  private async handleResponseError(error: AxiosError): Promise<unknown> {
    const originalRequest = error.config as RetryableRequest | undefined;

    // Erreur réseau / timeout / annulation : rien à rafraîchir
    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response.status === 401;
    const canRefresh =
      isUnauthorized &&
      !originalRequest._retry &&
      !isNoRefreshRoute(originalRequest.url);

    if (!canRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const authService = await getAuthService();

      // Single-flight : tous les 401 simultanés partagent le même refresh
      const newToken = await authService.refreshTokens();

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return this.client(originalRequest);
    } catch (refreshError) {
      // refreshTokens() a déjà appelé forceLogout() (session vidée + événement
      // 'auth:logout' reçu par AuthContext). On ne fait donc pas de rechargement
      // brutal de la page : la route protégée redirige vers /login.
      return Promise.reject(refreshError);
    }
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const api = new ApiClient().getClient();
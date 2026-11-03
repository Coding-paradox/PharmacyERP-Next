import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@pharmacy/database';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../email/email.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  pharmacyId: string;
}

const INVALID_CREDENTIALS = 'Identifiants invalides.';
const INVALID_REFRESH = 'Session invalide ou expirée. Veuillez vous reconnecter.';
const INVALID_RESET = 'Lien de réinitialisation invalide ou expiré.';
const FORGOT_MESSAGE = 'Si cet email existe, un lien de réinitialisation vous a été envoyé.';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure
const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours (secours)

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstAt: number;
  lockedUntil: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;
  private readonly refreshExpiry: string;
  private dummyHashPromise: Promise<string> | null = null;

  /** Verrouillage en mémoire (par instance). Pour du multi-instance, passer à Redis. */
  private readonly attempts = new Map<string, AttemptRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_REFRESH_SECRET manquant ou trop court (32 caractères minimum requis).',
      );
    }
    this.refreshSecret = secret;
    this.refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d');
  }

  // ---------------------------------------------------------------------------
  // Utilitaires privés
  // ---------------------------------------------------------------------------

  /** Hash SHA-256 d'un token : seul ce hash est stocké en base. */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Normalisation identique à LocalStrategy et à la création des utilisateurs. */
  private normalizeEmail(email: string): string {
    return (email ?? '').trim().toLowerCase();
  }

  /** Hash factice pour égaliser le temps de réponse quand l'utilisateur n'existe pas. */
  private getDummyHash(): Promise<string> {
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = argon2.hash(crypto.randomBytes(32).toString('hex'));
    }
    return this.dummyHashPromise;
  }

  private async safeVerify(hash: string, plain: unknown): Promise<boolean> {
    if (typeof plain !== 'string' || plain.length === 0 || plain.length > MAX_PASSWORD_LENGTH) {
      return false;
    }
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  private isLocked(key: string): boolean {
    const record = this.attempts.get(key);
    if (!record) return false;
    if (record.lockedUntil > Date.now()) return true;
    if (Date.now() - record.firstAt > ATTEMPT_WINDOW_MS) {
      this.attempts.delete(key);
    }
    return false;
  }

  private registerFailure(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now - record.firstAt > ATTEMPT_WINDOW_MS) {
      this.attempts.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
      return;
    }

    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + LOCK_DURATION_MS;
      this.logger.warn(`Compte temporairement verrouillé après ${record.count} échecs.`);
    }
  }

  private clearFailures(key: string): void {
    this.attempts.delete(key);
  }

  private assertPasswordPolicy(password: unknown): asserts password is string {
    if (
      typeof password !== 'string' ||
      password.length < MIN_PASSWORD_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      throw new BadRequestException(
        `Le mot de passe doit contenir entre ${MIN_PASSWORD_LENGTH} et ${MAX_PASSWORD_LENGTH} caractères.`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Inscription (route publique désactivée dans le contrôleur)
  // ---------------------------------------------------------------------------

  async register(registerDto: RegisterDto) {
    const { password, firstName, lastName, pharmacyId } = registerDto;
    const email = this.normalizeEmail(registerDto.email);

    this.assertPasswordPolicy(password);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email déjà utilisé.');
    }

    const hashedPassword = await argon2.hash(password);

    // Aucun token émis : la connexion passe obligatoirement par /auth/login
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        pharmacyId,
        role: 'VIEWER', // jamais de rôle fourni par le client
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        pharmacyId: true,
        isActive: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Validation des identifiants (utilisée par LocalStrategy uniquement)
  // ---------------------------------------------------------------------------

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const normalizedEmail = this.normalizeEmail(email);

    // Compte verrouillé : même réponse qu'un échec classique
    if (this.isLocked(normalizedEmail)) {
      await this.safeVerify(await this.getDummyHash(), password);
      return null;
    }

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Temps constant : on vérifie quand même contre un hash factice
      await this.safeVerify(await this.getDummyHash(), password);
      this.registerFailure(normalizedEmail);
      return null;
    }

    const isValid = await this.safeVerify(user.password, password);

    // Même résultat pour mot de passe faux et compte inactif (anti-énumération)
    if (!isValid || !user.isActive) {
      if (isValid && !user.isActive) {
        this.logger.warn(`Connexion refusée : compte inactif (userId ${user.id})`);
      }
      this.registerFailure(normalizedEmail);
      return null;
    }

    this.clearFailures(normalizedEmail);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      pharmacyId: user.pharmacyId,
    };
  }

  // ---------------------------------------------------------------------------
  // Connexion (l'utilisateur a déjà été validé par AuthGuard('local'))
  // ---------------------------------------------------------------------------

  async login(user: AuthUser) {
    if (!user?.id) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.pharmacyId,
      user.role ?? 'VIEWER',
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        pharmacyId: user.pharmacyId,
      },
      tokens,
    };
  }

  // ---------------------------------------------------------------------------
  // Rafraîchissement (rotation + détection de réutilisation)
  // La signature JWT a déjà été vérifiée par AuthGuard('jwt-refresh').
  // ---------------------------------------------------------------------------

  async refreshToken(userId: string, refreshToken: string) {
    if (!userId || !refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: this.hashToken(refreshToken) },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.userId !== userId) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    // Détection de réutilisation : token déjà utilisé = vol probable
    if (tokenRecord.isRevoked) {
      this.logger.warn(
        `Réutilisation d'un refresh token révoqué détectée (userId ${tokenRecord.userId}) : toutes les sessions sont révoquées.`,
      );
      await this.revokeAllUserTokens(tokenRecord.userId);
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    const user = tokenRecord.user;
    if (!user || !user.isActive) {
      await this.revokeAllUserTokens(tokenRecord.userId);
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    // Révocation atomique (protège contre deux refresh simultanés)
    const revoked = await this.prisma.refreshToken.updateMany({
      where: { id: tokenRecord.id, isRevoked: false },
      data: { isRevoked: true },
    });

    if (revoked.count !== 1) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    return this.generateTokens(user.id, user.email, user.pharmacyId, user.role);
  }

  // ---------------------------------------------------------------------------
  // Déconnexion
  // ---------------------------------------------------------------------------

  async logout(userId: string) {
    await this.revokeAllUserTokens(userId);
    return { success: true };
  }

  async hashPassword(password: string): Promise<string> {
    this.assertPasswordPolicy(password);
    return argon2.hash(password);
  }

  // ---------------------------------------------------------------------------
  // Génération des tokens (public : utilisée aussi par SetupService)
  // ---------------------------------------------------------------------------

  async generateTokens(
    userId: string,
    email: string,
    pharmacyId: string,
    role: string,
  ) {
    const accessToken = this.jwtService.sign({
      sub: userId,
      email,
      pharmacyId,
      role,
      type: 'access',
    });

    // jti aléatoire : garantit l'unicité même pour deux tokens émis dans la même seconde
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti: crypto.randomUUID(), type: 'refresh' },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiry,
      },
    );

    // Expiration en base alignée sur l'expiration réelle du JWT
    const decoded = this.jwtService.decode(refreshToken) as RefreshTokenPayload | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + DEFAULT_REFRESH_TTL_MS);

    try {
      await this.prisma.refreshToken.create({
        data: {
          token: this.hashToken(refreshToken),
          userId,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `Échec d'enregistrement du refresh token (userId ${userId}) : ${
          error instanceof Error ? error.message : 'erreur inconnue'
        }`,
      );
      throw new InternalServerErrorException('Impossible de créer la session.');
    }

    return { accessToken, refreshToken };
  }

  // ---------------------------------------------------------------------------
  // Mot de passe oublié
  // ---------------------------------------------------------------------------

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Réponse identique dans tous les cas (anti-énumération)
    if (!user || !user.isActive) {
      return { message: FORGOT_MESSAGE };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.$transaction([
      // Invalide les anciens liens encore valides
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          token: this.hashToken(rawToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    // Envoi sans await : le temps de réponse ne révèle pas l'existence du compte.
    // Le token brut part uniquement par email, jamais stocké.
    void this.emailService
      .sendPasswordResetEmail(user.email, rawToken)
      .then(() => this.logger.log(`Email de réinitialisation envoyé (userId ${user.id})`))
      .catch((error: unknown) =>
        this.logger.error(
          `Échec d'envoi de l'email de réinitialisation (userId ${user.id}) : ${
            error instanceof Error ? error.message : 'erreur inconnue'
          }`,
        ),
      );

    return { message: FORGOT_MESSAGE };
  }

  // ---------------------------------------------------------------------------
  // Réinitialisation du mot de passe
  // ---------------------------------------------------------------------------

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException(INVALID_RESET);
    }
    this.assertPasswordPolicy(newPassword);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: this.hashToken(token) },
      include: { user: true },
    });

    if (!resetToken) {
      this.logger.warn('Reset échoué : token introuvable');
      throw new BadRequestException(INVALID_RESET);
    }
    if (resetToken.usedAt) {
      this.logger.warn(`Reset échoué : token déjà utilisé (id ${resetToken.id})`);
      throw new BadRequestException(INVALID_RESET);
    }
    if (resetToken.expiresAt < new Date()) {
      this.logger.warn(`Reset échoué : token expiré (id ${resetToken.id})`);
      throw new BadRequestException(INVALID_RESET);
    }
    if (!resetToken.user?.isActive) {
      this.logger.warn(`Reset échoué : compte inactif (userId ${resetToken.userId})`);
      throw new BadRequestException(INVALID_RESET);
    }

    const hashedPassword = await argon2.hash(newPassword);

    await this.prisma.$transaction(async (tx) => {
      // Consommation atomique : un seul usage possible, même en concurrence
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException(INVALID_RESET);
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      // Déconnecte toutes les sessions existantes
      await tx.refreshToken.updateMany({
        where: { userId: resetToken.userId, isRevoked: false },
        data: { isRevoked: true },
      });
    });

    // Un reset réussi lève un éventuel verrouillage
    this.clearFailures(this.normalizeEmail(resetToken.user.email));

    this.logger.log(`Mot de passe réinitialisé (userId ${resetToken.userId})`);
    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  // ---------------------------------------------------------------------------
  // Maintenance : à appeler depuis un cron (ex. @Cron quotidien)
  // ---------------------------------------------------------------------------

  async purgeExpiredTokens(): Promise<{ refreshTokens: number; resetTokens: number }> {
    const now = new Date();

    const [refresh, reset] = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { isRevoked: true, expiresAt: { lt: now } }] },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
      }),
    ]);

    return { refreshTokens: refresh.count, resetTokens: reset.count };
  }
}
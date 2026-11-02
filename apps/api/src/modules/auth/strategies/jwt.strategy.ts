import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@pharmacy/database';

/** Contenu attendu du JWT d'accès (voir AuthService.generateTokens). */
export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  pharmacyId?: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

/** Utilisateur attaché à `request.user` après validation (valeurs issues de la base). */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  pharmacyId: string;
  isActive: boolean;
}

const MIN_SECRET_LENGTH = 32;
const MAX_SUBJECT_LENGTH = 128;
const GENERIC_UNAUTHORIZED = 'Unauthorized';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');

    // Échec explicite au démarrage plutôt qu'un comportement incohérent
    if (!secret || secret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_ACCESS_SECRET est manquant ou trop court (minimum ${MIN_SECRET_LENGTH} caractères)`,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Structure du payload
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      payload.sub.length === 0 ||
      payload.sub.length > MAX_SUBJECT_LENGTH
    ) {
      throw new UnauthorizedException(GENERIC_UNAUTHORIZED);
    }

    // Un refresh token ne doit jamais être accepté comme access token.
    // Le type doit être exactement 'access' : pas de tolérance pour l'absence du champ.
    if (payload.type !== 'access') {
      throw new UnauthorizedException(GENERIC_UNAUTHORIZED);
    }

    // Rôle, pharmacie et statut sont relus en base : un changement prend effet immédiatement
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    // Message générique : ne révèle pas si le compte existe ou est désactivé
    if (!user || !user.isActive) {
      throw new UnauthorizedException(GENERIC_UNAUTHORIZED);
    }

    return user;
  }
}
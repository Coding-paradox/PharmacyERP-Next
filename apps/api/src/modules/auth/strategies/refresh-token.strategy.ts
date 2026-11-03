import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '@pharmacy/database';
import type { JwtPayload } from './jwt.strategy';

const MIN_SECRET_LENGTH = 32;

/** Corps attendu pour la route /auth/refresh. */
interface RefreshRequestBody {
  refreshToken?: unknown;
}

/** Extrait le refresh token du body JSON, uniquement s'il s'agit d'une chaîne non vide. */
const extractRefreshTokenFromBody = (req: Request): string | null => {
  const body = req?.body as RefreshRequestBody | undefined;
  const token = body?.refreshToken;
  return typeof token === 'string' && token.length > 0 ? token : null;
};

/** Valeur attachée à `request.user` pour les routes protégées par 'jwt-refresh'. */
export interface RefreshTokenUser extends JwtPayload {
  /** Token brut, nécessaire pour la comparaison avec le hash stocké. Ne jamais le logger. */
  refreshToken: string;
}

/** Valide les secrets avant l'initialisation de la stratégie et retourne le secret de refresh. */
const resolveRefreshSecret = (config: ConfigService): string => {
  const secret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  const accessSecret = config.get<string>('JWT_ACCESS_SECRET');

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_REFRESH_SECRET trop court (minimum ${MIN_SECRET_LENGTH} caractères)`,
    );
  }
  if (accessSecret && secret === accessSecret) {
    throw new Error('JWT_REFRESH_SECRET doit être différent de JWT_ACCESS_SECRET');
  }
  return secret;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: extractRefreshTokenFromBody,
      ignoreExpiration: false,
      secretOrKey: resolveRefreshSecret(config),
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<RefreshTokenUser> {
    const body = req.body as RefreshRequestBody | undefined;
    const refreshToken = body?.refreshToken;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Seul un token explicitement de type 'refresh' est accepté (un access token est refusé).
    // Variable typée en string pour éviter la réduction de type TS2367.
    const tokenType: string | undefined = payload.type;
    if (tokenType !== 'refresh') {
      throw new UnauthorizedException('Unauthorized');
    }

    // Un compte désactivé ou supprimé ne peut plus renouveler ses tokens
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized');
    }

    return { ...payload, refreshToken };
  }
}
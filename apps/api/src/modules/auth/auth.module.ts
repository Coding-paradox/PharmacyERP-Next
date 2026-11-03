import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaModule } from '@pharmacy/database';
import { EmailModule } from '../email/email.module';

const MIN_SECRET_LENGTH = 32;
// Formats acceptés : 900 (secondes), 15m, 1h, 7d, 30s
const EXPIRY_PATTERN = /^\d+(s|m|h|d)?$/;

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Échec explicite au démarrage si le secret est absent
        const secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
        if (secret.length < MIN_SECRET_LENGTH) {
          throw new Error(
            `JWT_ACCESS_SECRET trop court (minimum ${MIN_SECRET_LENGTH} caractères)`,
          );
        }

        const expiresIn = config.get<string>('JWT_ACCESS_EXPIRY', '15m');
        if (!EXPIRY_PATTERN.test(expiresIn)) {
          throw new Error(
            `JWT_ACCESS_EXPIRY invalide : "${expiresIn}" (exemples valides : 15m, 1h, 900)`,
          );
        }

        return {
          secret,
          signOptions: {
            // Un nombre pur dans le .env arrive en string : on le convertit en secondes
            expiresIn: /^\d+$/.test(expiresIn) ? Number(expiresIn) : (expiresIn as any),
            algorithm: 'HS256',
          },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        };
      },
    }),
    // Limite par défaut du module : 10 requêtes par minute et par IP.
    // Les routes sensibles (login, refresh, forgot-password) se resserrent
    // dans le contrôleur avec @Throttle().
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
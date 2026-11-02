import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

/** Masque l'email dans les logs : jo***@pharma.com */
const maskEmail = (email: string): string => {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: unknown, password: unknown) {
    // Entrées invalides : même réponse que de mauvais identifiants
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.length === 0 ||
      password.length === 0 ||
      email.length > MAX_EMAIL_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Même normalisation que dans register()
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.authService.validateUser(normalizedEmail, password);

    if (!user) {
      this.logger.warn(`Échec de connexion pour ${maskEmail(normalizedEmail)}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
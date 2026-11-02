import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/** Utilisateur injecté par LocalStrategy (login) : retourné par validateUser(), sans mot de passe. */
interface LoggedInUser {
  id: string;
  email: string;
  role: string;
  pharmacyId: string;
  firstName?: string | null;
  lastName?: string | null;
}

/** Utilisateur injecté par JwtStrategy (routes protégées par access token). */
interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  pharmacyId?: string;
}

/** Utilisateur injecté par RefreshTokenStrategy (route /refresh). */
interface RefreshUser {
  sub: string;
  refreshToken: string;
}

interface LocalRequest {
  user?: LoggedInUser;
}

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

interface RefreshRequest {
  user?: RefreshUser;
}

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Public registration (disabled)',
    description:
      "L'inscription publique est désactivée. Utilisez l'installation initiale (/setup) ou la gestion des utilisateurs authentifiée.",
  })
  @ApiResponse({ status: 403, description: 'Public registration is disabled' })
  register(): never {
    throw new ForbiddenException(
      "Inscription publique désactivée. Utilisez l'installation initiale ou la gestion des utilisateurs authentifiée.",
    );
  }

  // 5 tentatives par minute et par IP
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async login(@Req() req: LocalRequest) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // L'identité a déjà été validée par LocalStrategy : on génère seulement les tokens
    return this.authService.login(user);
  }

  // 10 renouvellements par minute et par IP
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid, expired or revoked refresh token' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async refresh(@Req() req: RefreshRequest) {
    const user = req.user;

    if (!user?.sub || !user.refreshToken) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Signature et expiration déjà vérifiées par RefreshTokenStrategy ;
    // le service compare le token au hash stocké et effectue la rotation
    return this.authService.refreshToken(user.sub, user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Utilisateur non authentifié.');
    }

    return this.authService.logout(userId);
  }

  // 3 demandes par minute et par IP
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({
    status: 200,
    description: 'If the email exists, a reset link has been sent (same response in all cases)',
  })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  // 5 tentatives par minute et par IP
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
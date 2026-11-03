import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';

const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john@pharmacie.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail()
  email?: string;

  // Chaîne vide = pas de changement de mot de passe (cas du formulaire d'édition).
  @ApiPropertyOptional({ example: 'NewSecurePass123!', minLength: 8 })
  @Transform(trimOrUndefined)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ example: 'John' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  // Chaîne vide = effacer le téléphone : elle devient undefined, donc ignorée
  // par la mise à jour (le service doit gérer explicitement l'effacement si besoin).
  @ApiPropertyOptional({ example: '+243 81 234 5678' })
  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, { message: 'phone format invalide' })
  phone?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
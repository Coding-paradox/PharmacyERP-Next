import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsStrongPassword, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-uuid' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token!: string;

  @ApiProperty({ example: 'NewSecurePass123' })
  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    },
    {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule et un chiffre.',
    },
  )
  newPassword!: string;
}
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsStrongPassword,
  IsDefined,
  IsObject,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PharmacySetupDto {
  @ApiProperty({ example: 'Ma Pharmacie' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: '123 Rue Principale, Kinshasa', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ example: '+243 000 000 000', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'contact@pharmacie.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiProperty({ example: 'PH-2024-001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiProperty({ example: 'Africa/Kinshasa', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiProperty({ example: 'CDF', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}

export class AdminSetupDto {
  @ApiProperty({ example: 'admin@pharmacie.com' })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Pharmacy' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;
}

export class SetupInitialDto {
  @ApiProperty({ type: PharmacySetupDto })
  @IsDefined({ message: 'pharmacy est requis' })
  @IsObject()
  @ValidateNested()
  @Type(() => PharmacySetupDto)
  pharmacy!: PharmacySetupDto;

  @ApiProperty({ type: AdminSetupDto })
  @IsDefined({ message: 'admin est requis' })
  @IsObject()
  @ValidateNested()
  @Type(() => AdminSetupDto)
  admin!: AdminSetupDto;
}
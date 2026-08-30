import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsStrongPassword,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PharmacySetupDto {
  @ApiProperty({ example: 'Ma Pharmacie' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '123 Rue Principale, Kinshasa', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+243 000 000 000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'contact@pharmacie.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'PH-2024-001', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({ example: 'Africa/Kinshasa', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'CDF', required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class AdminSetupDto {
  @ApiProperty({ example: 'admin@pharmacie.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Pharmacy' })
  @IsString()
  lastName!: string;
}

export class SetupInitialDto {
  @ApiProperty({ type: PharmacySetupDto })
  @ValidateNested()
  @Type(() => PharmacySetupDto)
  pharmacy!: PharmacySetupDto;

  @ApiProperty({ type: AdminSetupDto })
  @ValidateNested()
  @Type(() => AdminSetupDto)
  admin!: AdminSetupDto;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum RegisterRole {
  ADMIN = 'ADMIN',
  PHARMACIST = 'PHARMACIST',
  CASHIER = 'CASHIER',
  VIEWER = 'VIEWER',
  MANAGER = 'MANAGER',
}

export class RegisterDto {
  @ApiProperty({ example: 'john@pharmacy.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  pharmacyId!: string;

  @ApiProperty({ enum: RegisterRole, default: RegisterRole.VIEWER })
  @IsEnum(RegisterRole)
  @IsOptional()
  role?: RegisterRole;
}
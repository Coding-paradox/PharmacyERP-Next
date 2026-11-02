import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

class PushKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class PushSubscriptionDto {
  @IsUrl({ require_tld: false })
  endpoint!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class RemovePushSubscriptionDto {
  @IsUrl({ require_tld: false })
  endpoint!: string;
}

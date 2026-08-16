import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AdminSettingValueType } from '@prisma/client';

export class SettingQueryDto {
  @IsOptional() @IsString() @MaxLength(60) group?: string;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
}

export class UpsertSettingDto {
  @IsString() @MinLength(1) @MaxLength(120) key!: string;
  @IsString() @MaxLength(5000) value!: string;
  @IsOptional() @IsEnum(AdminSettingValueType) valueType?: AdminSettingValueType;
  @IsString() @MinLength(1) @MaxLength(60) group!: string;
  @IsString() @MinLength(1) @MaxLength(120) label!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

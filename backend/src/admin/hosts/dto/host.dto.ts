import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { HostStatus, PropertyStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class HostQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(HostStatus)
  hostStatus?: HostStatus;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSuperhost?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isStarHost?: boolean;

  /** Restricts to hosts owning at least one property in this state. */
  @IsOptional()
  @IsEnum(PropertyStatus)
  propertyStatus?: PropertyStatus;
}

export class UpdateHostStatusDto {
  @IsEnum(HostStatus)
  hostStatus!: HostStatus;

  /** Required when suspending, so the action is explainable to the host. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reason?: string;
}

export class UpdateSuperhostDto {
  @IsBoolean()
  isSuperhost!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class UpdateStarhostDto {
  @IsOptional()
  @IsBoolean()
  isStarHost?: boolean;

  @IsOptional()
  @IsBoolean()
  isSuperhost?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

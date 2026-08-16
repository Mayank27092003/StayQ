import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BannerPlacement, FeaturedPlacementType } from '@prisma/client';

export class FeaturedQueryDto {
  @IsOptional()
  @IsEnum(FeaturedPlacementType)
  placement?: FeaturedPlacementType;

  /** Restricts to placements live right now. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  currentOnly?: boolean;
}

export class CreateFeaturedPlacementDto {
  @IsUUID()
  propertyId!: string;

  @IsEnum(FeaturedPlacementType)
  placement!: FeaturedPlacementType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsDateString()
  startsAt!: string;

  /** Omit for an open-ended placement. */
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateFeaturedPlacementDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ReorderEntryDto {
  @IsUUID()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder!: number;
}

export class ReorderFeaturedDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderEntryDto)
  entries!: ReorderEntryDto[];
}

export class BannerQueryDto {
  @IsOptional()
  @IsEnum(BannerPlacement)
  placement?: BannerPlacement;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  currentOnly?: boolean;
}

export class CreateBannerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  subtitle?: string;

  @IsUrl({ require_tld: false })
  imageUrl!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  linkUrl?: string;

  @IsEnum(BannerPlacement)
  placement!: BannerPlacement;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  subtitle?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  linkUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CouponType, PropertyCategory } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

/**
 * Lifecycle state derived from `active`, the validity window, and usage.
 * Not stored: computing it keeps the value consistent with the clock and the
 * redemption counter instead of relying on a column that can drift.
 */
export enum PromotionStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXHAUSTED = 'EXHAUSTED',
  EXPIRED = 'EXPIRED',
}

export class CreatePromotionDto {
  @IsString()
  @MaxLength(40)
  @Matches(/^[A-Z0-9][A-Z0-9_-]*$/, {
    message: 'code must contain only uppercase letters, digits, hyphens, and underscores',
  })
  code!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  /** Percentage (1-100) for PERCENTAGE coupons, or a flat currency amount. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  value!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minBookingAmount?: number;

  /** Caps the discount produced by a PERCENTAGE coupon. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  maxDiscount?: number;

  /** Total redemptions allowed across all users. Omit for unlimited. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsDateString()
  validFrom!: string;

  @IsDateString()
  validUntil!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(PropertyCategory, { each: true })
  applicableCategories?: PropertyCategory[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  applicableCities?: string[];
}

/** Every field optional; `code` is intentionally excluded because redeemed
 *  codes are referenced by `Booking.couponCode` and must stay stable. */
export class UpdatePromotionDto {
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minBookingAmount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  maxDiscount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(PropertyCategory, { each: true })
  applicableCategories?: PropertyCategory[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  applicableCities?: string[];
}

export class UpdatePromotionStatusDto {
  @IsBoolean()
  active!: boolean;
}

export class PromotionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;
}

/** Window used by the promotions summary endpoint. */
export class PromotionSummaryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

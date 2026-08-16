import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  ContentReportReason,
  ContentReportStatus,
  ContentReportTargetType,
  ReviewModerationStatus,
} from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class ReviewModerationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReviewModerationStatus)
  moderationStatus?: ReviewModerationStatus;

  /** Restricts to reviews that carry a report flag. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reported?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @IsOptional()
  @IsUUID()
  propertyId?: string;
}

export class ModerateReviewDto {
  @IsEnum(ReviewModerationStatus)
  moderationStatus!: ReviewModerationStatus;

  /** Required when hiding or rejecting, so the decision is explainable. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string;

  /** Clears the report flag alongside the decision. */
  @IsOptional()
  @IsBoolean()
  clearReport?: boolean;
}

export class ContentReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ContentReportStatus)
  status?: ContentReportStatus;

  @IsOptional()
  @IsEnum(ContentReportTargetType)
  targetType?: ContentReportTargetType;

  @IsOptional()
  @IsEnum(ContentReportReason)
  reason?: ContentReportReason;
}

export class CreateContentReportDto {
  @IsEnum(ContentReportTargetType)
  targetType!: ContentReportTargetType;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  targetId!: string;

  @IsEnum(ContentReportReason)
  reason!: ContentReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class ResolveContentReportDto {
  @IsEnum(ContentReportStatus)
  status!: ContentReportStatus;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  resolutionNote?: string;
}

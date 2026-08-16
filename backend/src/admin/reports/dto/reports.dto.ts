import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsJSON, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ReportFormat, ReportFrequency, ReportKind } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class ReportDefinitionQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(ReportKind) kind?: ReportKind;
  @IsOptional() @IsBoolean() @Type(() => Boolean) active?: boolean;
}

export class CreateReportDefinitionDto {
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsEnum(ReportKind) kind!: ReportKind;
  @IsEnum(ReportFormat) format!: ReportFormat;
  @IsEnum(ReportFrequency) frequency!: ReportFrequency;
  @IsOptional() @IsJSON() parameters?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20) recipients?: string[];
}

export class RunReportNowDto {
  @IsOptional() @IsString() @MaxLength(100) periodStart?: string;
  @IsOptional() @IsString() @MaxLength(100) periodEnd?: string;
}

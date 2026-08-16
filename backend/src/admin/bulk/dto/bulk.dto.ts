import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsJSON, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { BulkOperationType } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class BulkQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(BulkOperationType) type?: BulkOperationType;
  @IsOptional() @IsString() status?: string;
}

export class CreateBulkOperationDto {
  @IsEnum(BulkOperationType) type!: BulkOperationType;
  @IsOptional() @IsBoolean() dryRun?: boolean;
  @IsOptional() @IsString() @MaxLength(260) sourceFileName?: string;
  /** JSON parameters — filters, target status, etc. */
  @IsOptional() @IsJSON() parameters?: string;
  /** Prevents duplicate submissions. */
  @IsOptional() @IsString() @MaxLength(100) idempotencyKey?: string;
}

export class BulkItemQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number = 100;
}

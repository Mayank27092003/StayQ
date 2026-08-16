import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class ConversationQueryDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() userId?: string;
}

export class KnowledgeQueryDto extends PaginationQueryDto {
  @IsOptional() @IsBoolean() @Type(() => Boolean) activeOnly?: boolean;
}

export class CreateKnowledgeDto {
  @IsString() @MinLength(1) @MaxLength(120) topic!: string;
  @IsString() @MinLength(1) @MaxLength(20000) content!: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) tags?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priority?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateKnowledgeDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) topic?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(20000) content?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) tags?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priority?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

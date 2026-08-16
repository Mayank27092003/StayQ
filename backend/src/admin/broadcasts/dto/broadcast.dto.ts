import { IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BroadcastStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class BroadcastQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(BroadcastStatus) status?: BroadcastStatus;
  @IsOptional() @IsString() audience?: string;
}

export class CreateBroadcastDto {
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsString() @MinLength(1) @MaxLength(2000) body!: string;
  @IsIn(['all', 'guests', 'hosts']) targetAudience!: string;
}

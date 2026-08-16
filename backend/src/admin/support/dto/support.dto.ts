import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class SupportTicketQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  /** Filters to tickets assigned to a specific admin user id. */
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  /** Admin user id to own the ticket. Pass null to unassign. */
  @IsOptional()
  @IsUUID()
  assignedTo?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  resolution?: string;
}

export class CreateSupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;

  /** Internal notes stay admin-only and are never surfaced to the requester. */
  @IsOptional()
  @IsBoolean()
  internal?: boolean;

  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}

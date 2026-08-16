import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AdminRole, UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination.dto';

export class AdminUserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AdminRole)
  adminRole?: AdminRole;

  /** When false, lists non-admin accounts (useful when promoting someone). */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAdmin?: boolean;
}

export class GrantAdminAccessDto {
  @IsEnum(AdminRole)
  adminRole!: AdminRole;

  /** Recorded on the audit entry as the justification for the grant. */
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

export class UpdateAdminRoleDto {
  @IsEnum(AdminRole)
  adminRole!: AdminRole;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

export class RevokeAdminAccessDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminCatalogService } from './admin-catalog.service';
import {
  CatalogQueryDto,
  CreateAmenityDto,
  UpdateAmenityDto,
  UpdateCategoryDto,
  UpsertCategoryDto,
} from './dto/catalog.dto';

@ApiTags('Admin / Catalog')
@ApiBearerAuth()
@Controller('admin/catalog')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List categories with presentation metadata and listing counts' })
  listCategories(@Query() query: CatalogQueryDto) {
    return this.catalog.listCategories(query.activeOnly ?? false);
  }

  @Put('categories')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.MARKETING)
  @ApiOperation({ summary: 'Create or replace metadata for one category' })
  upsertCategory(@Body() dto: UpsertCategoryDto, @CurrentUser('id') adminId: string) {
    return this.catalog.upsertCategory(dto, adminId);
  }

  @Patch('categories/:id')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.MARKETING)
  @ApiOperation({ summary: 'Update category metadata' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.catalog.updateCategory(id, dto, adminId);
  }

  @Get('amenities')
  @ApiOperation({ summary: 'List amenity definitions with real listing usage counts' })
  listAmenities(@Query() query: CatalogQueryDto) {
    return this.catalog.listAmenities(query.activeOnly ?? false);
  }

  @Get('amenities/undefined-keys')
  @ApiOperation({ summary: 'Amenity keys used by listings that have no definition row' })
  undefinedKeys() {
    return this.catalog.listUndefinedAmenityKeys();
  }

  @Put('amenities')
  @AdminRoles(AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Create an amenity definition' })
  createAmenity(@Body() dto: CreateAmenityDto, @CurrentUser('id') adminId: string) {
    return this.catalog.createAmenity(dto, adminId);
  }

  @Patch('amenities/:id')
  @AdminRoles(AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Update an amenity definition' })
  updateAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAmenityDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.catalog.updateAmenity(id, dto, adminId);
  }

  @Delete('amenities/:id')
  @AdminRoles(AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Delete an unused amenity definition' })
  deleteAmenity(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    return this.catalog.deleteAmenity(id, adminId);
  }
}

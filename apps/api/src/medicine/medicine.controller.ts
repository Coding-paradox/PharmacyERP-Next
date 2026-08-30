import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MedicineService } from './medicine.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryParamsDto } from '@pharmacy/shared/dto/pagination.dto';
import { ApiResponseDto } from '@pharmacy/shared/dto/api-response.dto';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../modules/permissions/permissions.guard';
import { RequirePermissions } from '../modules/permissions/permissions.decorator';
import { Tenant } from '../modules/auth/tenant.decorator';

@ApiTags('Medicines')
@ApiBearerAuth()
@Controller('medicines')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @RequirePermissions('medicine:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new medicine' })
  @ApiResponse({ status: 201, description: 'Medicine created successfully' })
  async create(
    @Body() createMedicineDto: CreateMedicineDto,
    @Tenant() pharmacyId: string,
  ): Promise<ApiResponseDto> {
    const data = await this.medicineService.create(createMedicineDto, pharmacyId);
    return {
      success: true,
      message: 'Medicine created successfully',
      data,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get()
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Get all medicines with pagination' })
  @ApiResponse({ status: 200, description: 'Medicines retrieved successfully' })
  async findAll(
    @Query() queryParams: QueryParamsDto,
    @Tenant() pharmacyId: string,
  ): Promise<ApiResponseDto> {
    const result = await this.medicineService.findAll(queryParams, pharmacyId);
    return {
      success: true,
      message: 'Medicines retrieved successfully',
      data: result.data,
      meta: result.meta,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Get a medicine by ID' })
  @ApiResponse({ status: 200, description: 'Medicine retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  async findOne(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
  ): Promise<ApiResponseDto> {
    const data = await this.medicineService.findOne(id, pharmacyId);
    return {
      success: true,
      message: 'Medicine retrieved successfully',
      data,
      statusCode: HttpStatus.OK,
    };
  }

  @Patch(':id')
  @RequirePermissions('medicine:update')
  @ApiOperation({ summary: 'Update a medicine' })
  @ApiResponse({ status: 200, description: 'Medicine updated successfully' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMedicineDto: UpdateMedicineDto,
    @Tenant() pharmacyId: string,
  ): Promise<ApiResponseDto> {
    const data = await this.medicineService.update(id, updateMedicineDto, pharmacyId);
    return {
      success: true,
      message: 'Medicine updated successfully',
      data,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @RequirePermissions('medicine:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a medicine' })
  @ApiResponse({ status: 200, description: 'Medicine deleted successfully' })
  async remove(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
  ): Promise<ApiResponseDto> {
    await this.medicineService.remove(id, pharmacyId);
    return {
      success: true,
      message: 'Medicine deleted successfully',
      data: null,
      statusCode: HttpStatus.OK,
    };
  }

  @Get('barcode/:barcode')
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Get a medicine by barcode' })
  @ApiResponse({ status: 200, description: 'Medicine retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  async findByBarcode(
    @Param('barcode') barcode: string,
    @Tenant() pharmacyId: string,
  ): Promise<ApiResponseDto> {
    const data = await this.medicineService.findByBarcode(barcode, pharmacyId);
    return {
      success: true,
      message: 'Medicine retrieved successfully',
      data,
      statusCode: HttpStatus.OK,
    };
  }
}
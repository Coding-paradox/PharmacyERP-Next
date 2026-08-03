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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MedicineService } from './medicine.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryParamsDto } from '@pharmacy/shared/dto/pagination.dto';
import { ApiResponseDto } from '@pharmacy/shared/dto/api-response.dto';
import { Tenant } from '../modules/auth/tenant.decorator';

@ApiTags('Medicines')
@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new medicine' })
  @ApiResponse({ status: 201, description: 'Medicine created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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
  @ApiOperation({ summary: 'Get all medicines with pagination' })
  @ApiResponse({ status: 200, description: 'Medicines retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
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
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
import { MedicineService } from './medicine.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Medicines')
@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau médicament' })
  @ApiResponse({ status: 201, description: 'Médicament créé avec succès.' })
  async create(@Body() createMedicineDto: CreateMedicineDto): Promise<any> {
    const data = await this.medicineService.create(createMedicineDto);
    return {
      message: 'Médicament créé avec succès',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste de tous les médicaments' })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès.' })
  async findAll(@Query() queryParams: any): Promise<any> {
    const result = await this.medicineService.findAll(queryParams);
    return {
      message: 'Liste des médicaments récupérée avec succès',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer un médicament par son ID" })
  @ApiResponse({ status: 200, description: 'Médicament trouvé.' })
  @ApiResponse({ status: 404, description: 'Médicament introuvable.' })
  async findOne(@Param('id') id: string): Promise<any> {
    const data = await this.medicineService.findOne(id);
    return {
      message: 'Médicament récupéré avec succès',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un médicament' })
  @ApiResponse({ status: 200, description: 'Médicament mis à jour avec succès.' })
  async update(
    @Param('id') id: string,
    @Body() updateMedicineDto: UpdateMedicineDto,
  ): Promise<any> {
    const data = await this.medicineService.update(id, updateMedicineDto);
    return {
      message: 'Médicament mis à jour avec succès',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un médicament' })
  @ApiResponse({ status: 200, description: 'Médicament supprimé avec succès.' })
  async remove(@Param('id') id: string): Promise<any> {
    await this.medicineService.remove(id);
    return {
      message: 'Médicament supprimé avec succès',
      data: null,
    };
  }
}
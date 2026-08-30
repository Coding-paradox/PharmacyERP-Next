import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { SetupInitialDto } from './dto/setup-initial.dto';
import { SetupGuard } from './guards/setup.guard';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Post('init')
  @UseGuards(SetupGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initialize the system with first pharmacy and admin user',
    description: 'This endpoint can only be called once. After initialization, it will return 409 Conflict.',
  })
  @ApiResponse({ status: 201, description: 'System initialized successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'System already initialized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async initialize(@Body() setupDto: SetupInitialDto) {
    return this.setupService.initialize(setupDto);
  }
}
import { Module } from '@nestjs/common';
import { DosageFormsService } from './dosage-forms.service';
import { DosageFormsController } from './dosage-forms.controller';
import { PrismaModule } from '@pharmacy/database';

@Module({
  imports: [PrismaModule],
  controllers: [DosageFormsController],
  providers: [DosageFormsService],
  exports: [DosageFormsService],
})
export class DosageFormsModule {}
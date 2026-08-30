import { Module } from '@nestjs/common';
import { DosagesService } from './dosages.service';
import { DosagesController } from './dosages.controller';
import { PrismaModule } from '@pharmacy/database';

@Module({
  imports: [PrismaModule],
  controllers: [DosagesController],
  providers: [DosagesService],
  exports: [DosagesService],
})
export class DosagesModule {}
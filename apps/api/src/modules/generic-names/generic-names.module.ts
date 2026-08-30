import { Module } from '@nestjs/common';
import { GenericNamesService } from './generic-names.service';
import { GenericNamesController } from './generic-names.controller';
import { PrismaModule } from '@pharmacy/database';

@Module({
  imports: [PrismaModule],
  controllers: [GenericNamesController],
  providers: [GenericNamesService],
  exports: [GenericNamesService],
})
export class GenericNamesModule {}
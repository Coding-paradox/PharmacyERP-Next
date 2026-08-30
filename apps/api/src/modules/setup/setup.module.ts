import { Module } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { SetupGuard } from './guards/setup.guard';
import { PrismaModule } from '@pharmacy/database';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SetupController],
  providers: [SetupService, SetupGuard],
  exports: [SetupService],
})
export class SetupModule {}
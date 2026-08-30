import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'PharmacyERP API',
      status: 'ok',
      docs: '/api/docs',
      api: '/api/v1',
      health: '/api/v1/health',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

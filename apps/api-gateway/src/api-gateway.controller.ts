import { Controller, Get } from '@nestjs/common';

@Controller()
export class ApiGatewayController {
  @Get()
  isUp(): string {
    return 'API Gateway is up';
  }
}

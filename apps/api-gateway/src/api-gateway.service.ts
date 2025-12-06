import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
  isUp(): string {
    return 'API Gateway is up';
  }
}

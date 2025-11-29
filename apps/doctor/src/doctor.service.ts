import { Injectable } from '@nestjs/common';

@Injectable()
export class DoctorService {
  getHello(): string {
    return 'Hello World!';
  }
}

import { CloudStoragePatterns } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CloudStorageService } from './cloud-storage.service';
import { LabPhotoInternalDto, ScanPhotoInternalDto } from './dtos';

@Controller()
export class CloudStorageController {
  constructor(private readonly cloudStorageService: CloudStorageService) {}

  @MessagePattern({ cmd: CloudStoragePatterns.IS_UP })
  isUp(): string {
    return this.cloudStorageService.isUp();
  }

  @MessagePattern({ cmd: CloudStoragePatterns.UPLOAD_LAB_PHOTO })
  async uploadLabPhoto(
    @Payload() labPhotoInternalDto: LabPhotoInternalDto,
  ): Promise<string> {
    return this.cloudStorageService.uploadLabPhoto(labPhotoInternalDto);
  }

  @MessagePattern({ cmd: CloudStoragePatterns.UPLOAD_SCAN_PHOTO })
  async uploadScanPhoto(
    @Payload() scanPhotoInternalDto: ScanPhotoInternalDto,
  ): Promise<string> {
    return this.cloudStorageService.uploadScanPhoto(scanPhotoInternalDto);
  }
}

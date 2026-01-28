import { CloudStoragePatterns } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CloudStorageService } from './cloud-storage.service';
import {
  LabAudioInternalDto,
  LabPhotoInternalDto,
  MedicationAudioInternalDto,
  ScanAudioInternalDto,
  ScanPhotoInternalDto,
  VisitAudioInternalDto,
} from './dtos';

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

  @MessagePattern({ cmd: CloudStoragePatterns.UPLOAD_LAB_AUDIO })
  async uploadLabAudio(
    @Payload() labAudioInternalDto: LabAudioInternalDto,
  ): Promise<string> {
    return this.cloudStorageService.uploadLabAudio(labAudioInternalDto);
  }

  @MessagePattern({ cmd: CloudStoragePatterns.UPLOAD_SCAN_AUDIO })
  async uploadScanAudio(
    @Payload() scanAudioInternalDto: ScanAudioInternalDto,
  ): Promise<string> {
    return this.cloudStorageService.uploadScanAudio(scanAudioInternalDto);
  }

  @MessagePattern({ cmd: CloudStoragePatterns.UPLOAD_MEDICATION_AUDIO })
  async uploadMedicationAudio(
    @Payload() medicationAudioInternalDto: MedicationAudioInternalDto,
  ): Promise<string> {
    return this.cloudStorageService.uploadMedicationAudio(
      medicationAudioInternalDto,
    );
  }

  @MessagePattern({ cmd: CloudStoragePatterns.UPLOAD_VISIT_AUDIO })
  async uploadVisitAudio(
    @Payload() visitAudioInternalDto: VisitAudioInternalDto,
  ): Promise<string> {
    return this.cloudStorageService.uploadVisitAudio(visitAudioInternalDto);
  }
}

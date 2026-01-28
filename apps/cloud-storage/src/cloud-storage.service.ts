import {
  CommonServices,
  Environment,
  ErrorResponse,
  LoggingService,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { v2 as Cloudinary } from 'cloudinary';
import * as fs from 'fs';
import { CloudinaryFolders } from './constants';
import {
  LabAudioInternalDto,
  LabPhotoInternalDto,
  MedicationAudioInternalDto,
  ScanAudioInternalDto,
  ScanPhotoInternalDto,
  VisitAudioInternalDto,
} from './dtos';

@Injectable()
export class CloudStorageService {
  private readonly logger: LoggingService;
  private readonly cloudinary = Cloudinary;
  constructor(
    private readonly configService: ConfigService,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
  ) {
    this.cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
      secure:
        this.configService.getOrThrow<Environment>('ENVIRONMENT') ===
        Environment.PRODUCTION,
    });

    this.logger = logger;
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
      this.logger.log(`Successfully deleted temporary file: ${filePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete temporary file: ${filePath}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  isUp(): string {
    return 'Cloud-Storage service is up';
  }

  async uploadLabPhoto(
    labPhotoInternalDto: LabPhotoInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        labPhotoInternalDto.imageFilePath,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${labPhotoInternalDto.patientGlobalId}/${CloudinaryFolders.LABS}`,
          public_id: labPhotoInternalDto.labGlobalId,
          display_name: new Date(Date.now()),
        },
      );

      this.logger.log(
        `Uploaded patient lab image result: ${JSON.stringify(uploadResult)}`,
      );

      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(
        `Failed to upload lab of patient id: ${labPhotoInternalDto.patientGlobalId}:`,
        error instanceof Error ? error.message : String(error),
      );

      throw new RpcException(
        new ErrorResponse(
          'Internal server error during uploading lab photo',
          500,
        ),
      );
    } finally {
      await this.deleteFile(labPhotoInternalDto.imageFilePath);
    }
  }

  async uploadScanPhoto(
    scanPhotoInternalDto: ScanPhotoInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        scanPhotoInternalDto.imageFilePath,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${scanPhotoInternalDto.patientGlobalId}/${CloudinaryFolders.SCANS}`,
          public_id: `${scanPhotoInternalDto.scanGlobalId}-image`,
          display_name: new Date(Date.now()),
        },
      );

      this.logger.log(
        `Uploaded patient scan image result: ${JSON.stringify(uploadResult)}`,
      );

      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(
        `Failed to upload scan of patient id: ${scanPhotoInternalDto.patientGlobalId}:`,
        error instanceof Error ? error.message : String(error),
      );

      throw new RpcException(
        new ErrorResponse(
          'Internal server error during uploading scan photo',
          500,
        ),
      );
    } finally {
      await this.deleteFile(scanPhotoInternalDto.imageFilePath);
    }
  }

  async uploadLabAudio(
    labAudioInternalDto: LabAudioInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        labAudioInternalDto.audioFilePath,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${labAudioInternalDto.patientGlobalId}/${CloudinaryFolders.LABS}`,
          public_id: `${labAudioInternalDto.labGlobalId}-audio`,
          display_name: new Date(Date.now()),
          resource_type: 'video',
        },
      );

      this.logger.log(
        `Uploaded patient lab audio result: ${JSON.stringify(uploadResult)}`,
      );

      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(
        `Failed to upload lab audio of patient id: ${labAudioInternalDto.patientGlobalId}:`,
        error instanceof Error ? error.message : String(error),
      );

      throw new RpcException(
        new ErrorResponse(
          'Internal server error during uploading lab audio',
          500,
        ),
      );
    }
  }

  async uploadScanAudio(
    scanAudioInternalDto: ScanAudioInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        scanAudioInternalDto.audioFilePath,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${scanAudioInternalDto.patientGlobalId}/${CloudinaryFolders.SCANS}`,
          public_id: `${scanAudioInternalDto.scanGlobalId}-audio`,
          display_name: new Date(Date.now()),
          resource_type: 'video',
        },
      );

      this.logger.log(
        `Uploaded patient scan audio result: ${JSON.stringify(uploadResult)}`,
      );

      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(
        `Failed to upload scan audio of patient id: ${scanAudioInternalDto.patientGlobalId}:`,
        error instanceof Error ? error.message : String(error),
      );

      throw new RpcException(
        new ErrorResponse(
          'Internal server error during uploading scan audio',
          500,
        ),
      );
    }
  }

  async uploadMedicationAudio(
    medicationAudioInternalDto: MedicationAudioInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        medicationAudioInternalDto.audioFilePath,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${medicationAudioInternalDto.patientGlobalId}/${CloudinaryFolders.MEDICATIONS}`,
          public_id: `${medicationAudioInternalDto.medicationGlobalId}-audio`,
          display_name: new Date(Date.now()),
          resource_type: 'video',
        },
      );

      this.logger.log(
        `Uploaded patient medication audio result: ${JSON.stringify(uploadResult)}`,
      );

      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(
        `Failed to upload medication audio of patient id: ${medicationAudioInternalDto.patientGlobalId}:`,
        error instanceof Error ? error.message : String(error),
      );

      throw new RpcException(
        new ErrorResponse(
          'Internal server error during uploading medication audio',
          500,
        ),
      );
    }
  }

  async uploadVisitAudio(
    visitAudioInternalDto: VisitAudioInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        visitAudioInternalDto.audioFilePath,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${visitAudioInternalDto.patientGlobalId}/${CloudinaryFolders.VISITS}`,
          public_id: `${visitAudioInternalDto.visitGlobalId}-audio`,
          display_name: new Date(Date.now()),
          resource_type: 'video',
        },
      );

      this.logger.log(
        `Uploaded patient visit audio result: ${JSON.stringify(uploadResult)}`,
      );

      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(
        `Failed to upload visit audio of patient id: ${visitAudioInternalDto.patientGlobalId}:`,
        error instanceof Error ? error.message : String(error),
      );

      throw new RpcException(
        new ErrorResponse(
          'Internal server error during uploading visit audio',
          500,
        ),
      );
    }
  }
}

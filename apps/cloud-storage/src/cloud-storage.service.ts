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
import { CloudinaryFolders } from './constants';
import { LabPhotoInternalDto, ScanPhotoInternalDto } from './dtos';

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
  isUp(): string {
    return 'Cloud-Storage service is up';
  }

  async uploadLabPhoto(
    labPhotoInternalDto: LabPhotoInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        `data:${labPhotoInternalDto.mimetype};base64,${labPhotoInternalDto.imageBase64}`,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${labPhotoInternalDto.patientGlobalId}/${CloudinaryFolders.LABS}`,
          public_id: labPhotoInternalDto.labGlobalId,
          display_name: new Date(Date.now()),
        },
      );

      this.logger.log(
        `Uploaded patient lab result: ${JSON.stringify(uploadResult)}`,
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
    }
  }

  async uploadScanPhoto(
    scanPhotoInternalDto: ScanPhotoInternalDto,
  ): Promise<string> {
    try {
      const uploadResult = await this.cloudinary.uploader.upload(
        `data:${scanPhotoInternalDto.mimetype};base64,${scanPhotoInternalDto.imageBase64}`,
        {
          asset_folder: `${CloudinaryFolders.BASE_FOLDER}/${CloudinaryFolders.PATIENTS}/${scanPhotoInternalDto.patientGlobalId}/${CloudinaryFolders.SCANS}`,
          public_id: scanPhotoInternalDto.scanGlobalId,
          display_name: new Date(Date.now()),
        },
      );

      this.logger.log(
        `Uploaded patient scan result: ${JSON.stringify(uploadResult)}`,
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
    }
  }
}

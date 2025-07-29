import { Module } from '@nestjs/common';
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { UploadUtils } from "./upload.utils";

@Module({
  controllers: [UploadController],
  providers: [UploadService, UploadUtils],
  exports: [UploadService, UploadUtils],
})
export class UploadModule {}

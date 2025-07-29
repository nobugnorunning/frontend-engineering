import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import { UploadUtils } from "./upload.utils";


@Controller("upload")
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly uploadUtils: UploadUtils,
  ) {}

  @Post("chunk")
  @UseInterceptors(FileInterceptor("chunk"))
  async uploadChunk(
    @UploadedFile() file,
    @Body() body
  ) {
    if (!file) {
      throw new InternalServerErrorException("No file chunk received");
    }
    const {fileMd5, chunkMd5, chunkIndex} = body;

    await this.uploadService.saveChunk(file, fileMd5, chunkMd5, chunkIndex);

    return "ok";
  }

  /** 验证文件分片上没上传过 */
  @Get("check/:md5")
  async check(@Param() md5) {

  }
}
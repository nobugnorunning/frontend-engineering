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
import { UploadStatus } from "../../../configs.js";
import { UploadService } from "./upload.service";


@Controller("upload")
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
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
    const {fileMd5, chunkMd5, chunkIndex, chunkCount} = body;

    await this.uploadService.saveChunk(file, fileMd5, chunkMd5, chunkIndex, chunkCount);

    return "ok";
  }

  /** 验证文件分片上没上传过 */
  @Get("check/:md5")
  async check(@Param() query) {
    const { md5 } = query
    if (!md5) {
      return 'error: md5 not found'
    }
    const status = await this.uploadService.checkFileUploaded(md5)

    const o = {
      status,
      fileMd5: md5,
      uploaded: []
    }

    if (status === UploadStatus.uploading) {
      const map = await this.uploadService.readChunkMap()

      const item = map.get(md5)

      Object.assign(o, item);
    }
    return o
  }

  /** 合并分片文件 */
  @Post('merge')
  async merge(@Body() body) {
    /**
     * 这里因为没有做mysql存文件目录，所以不知道文件的类型是啥，合成完整文件需要补充文件后缀
     * */
    const { md5, filename } = body
    if (!md5) {
      return 'error: md5 not found'
    }

    return await this.uploadService.mergeFile(md5, filename)
  }
}
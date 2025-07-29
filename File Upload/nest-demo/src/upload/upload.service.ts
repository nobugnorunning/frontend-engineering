import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as fs from "node:fs/promises";
import { join } from "path";
import { UploadUtils } from './upload.utils'

@Injectable()
export class UploadService {

  constructor(readonly uploadUtils: UploadUtils) {
    this.ensureDirsExist()
  }

  private async ensureDirsExist() {
    await fs.mkdir(this.uploadUtils.CHUNKS_DIR, { recursive: true }).catch(console.error);
    await fs.mkdir(this.uploadUtils.FILES_DIR, {  recursive: true }).catch(console.error);
  }

  async saveChunk(
    file,
    fileMd5,
    chunkMd5,
    chunkIndex,
  ) {
    const chunkFileName = `${fileMd5}-${chunkMd5}-${chunkIndex}.chunk`
    const chunkFilePath = join(this.uploadUtils.CHUNKS_DIR, chunkFileName);

    try {
      // 将分片文件写入临时目录
      await fs.writeFile(chunkFilePath, file.buffer)
      return chunkFilePath;
    } catch (error) {
      throw new InternalServerErrorException('Failed to save file chunk')
    }
  }
}
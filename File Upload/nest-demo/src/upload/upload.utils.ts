import { Injectable } from "@nestjs/common";
import fs from 'fs/promises'
import { join } from "path";

@Injectable()
export class UploadUtils {
  readonly CHUNKS_DIR = join(process.cwd(), "uploads", "chunks");
  readonly FILES_DIR = join(process.cwd(), "uploads", "files");

  constructor() {}

  /** 读取chunks临时文件 */
  async readChunkList() {
    const files = await fs.readdir(this.CHUNKS_DIR)
    console.log(files)
  }
}
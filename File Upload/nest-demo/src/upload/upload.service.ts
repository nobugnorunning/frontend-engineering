import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as fsp from "node:fs/promises";
import * as fs from 'fs'
import { join } from "path";
import { UploadStatus } from "../../../configs.js";

/**
 * TODO 文件的存取都通过操作本地文件替代，正常逻辑应该是放到对象存储服务中
 * */

@Injectable()
export class UploadService {
  readonly CHUNKS_DIR = join(process.cwd(), "uploads", "chunks");
  readonly FILES_DIR = join(process.cwd(), "uploads", "files");

  constructor() {
    this.ensureDirsExist()
  }

  private async ensureDirsExist() {
    await fsp.mkdir(this.CHUNKS_DIR, { recursive: true }).catch(console.error);
    await fsp.mkdir(this.FILES_DIR, {  recursive: true }).catch(console.error);
  }

  async saveChunk(
    file,
    fileMd5,
    chunkMd5,
    chunkIndex,
    chunkCount
  ) {
    /**
     * TODO 这里可以换一种保存的方式 chunks/<chunkMd5>/chunkIndex
     * */
    // 使
    //   使用 fileMd5 创建文件夹
    const md5Path = join(this.CHUNKS_DIR, fileMd5)
    if (!fs.existsSync(md5Path)) {
      await fsp.mkdir(md5Path, { recursive: true }).catch(console.error);
    }

    // 将所有的分片保存到该目录下
    const chunkFileName = `${chunkMd5}-${chunkIndex}-${chunkCount}.chunk`
    const chunkFilePath = join(md5Path, chunkFileName);

    try {
      // 将分片文件写入临时目录
      await fsp.writeFile(chunkFilePath, file.buffer)
      return chunkFilePath;
    } catch (error) {
      throw new InternalServerErrorException('Failed to save file chunk')
    }
  }

  /** 查看文件是不是上传并且合并完成了（检查 /uploads/files 目录下有没有 ） */
  async checkFileUploaded(md5) {
    const files = await this.readFilesMap()

    // 没有查到已经上传的文件
    if (!files.has(md5)) {
      // 找找chunks目录有没有缓存的
      const chunks = await this.readChunkMap()

      if (!chunks.has(md5)) {
        // 啥都没找到
        return UploadStatus.unupload
      } else {
        // 找到分片了
        return UploadStatus.uploading
      }
    } else {
      return UploadStatus.uploaded
    }
  }

  /** 读取上传目录的文件列表 */
  async readDirFileList(dir) {
    if (dir === 'chunks') {
      return await this.readChunkMap()
    } else {
      return await this.readFilesMap()
    }
  }

  /** 读取已经上传的文件 files 目录 */
  async readFilesMap() {
    const files = await fsp.readdir(this.FILES_DIR)

    const map = new Map()

    for (const fileMd5 of files) {

      const filePath = join(this.FILES_DIR, fileMd5)
      const file = await fsp.readdir(filePath)
      if (file.length) {
        const originName = file[0].split('.')[0]

        map.set(fileMd5, {
          md5: fileMd5,
          originName
        })
      }
    }

    return map
  }

  /** 读取chunks临时文件 */
  async readChunkMap() {
    const files = await fsp.readdir(this.CHUNKS_DIR)
    // files 读取出来是个文件夹，名字是该文件对应的md5
    const map = new Map()
    for (const fileMd5 of files) {
      const fileChunkPath = join(this.CHUNKS_DIR, fileMd5)
      const chunkList = await fsp.readdir(fileChunkPath)
      for (const string of chunkList) {
        const [_chunkMd5, chunkIndex, chunkCount] = string.split('.')[0].split('-');
        let value = map.get(fileMd5);

        if (!value) {
          value = {
            chunkCount: +chunkCount, // 总分片个数
            uploaded: [], // 已上传的分片
            paths: []
          }
        }
        value.uploaded.push(+chunkIndex)
        value.paths.push(string)

        map.set(fileMd5, value)
      }
    }

    for (const [_, item] of map.entries()) {
      item.uploaded = item.uploaded.sort((a, b) => a - b)
    }
    return map
  }

  /** 合并分片文件为完整的文件 */
  async mergeFile(md5, filename) {
    const splitName = filename.split('.')
    
    const ext = splitName.slice(-1)

    splitName.splice(splitName.length - 1, 1)

    // 读文件
    const chunkMap = await this.readChunkMap()
    const { paths, uploaded } = chunkMap.get(md5)
    // 处理一下paths
    const o = {}
    for (const path of paths) {
      const [ _chunkMd5, chunkIndex] = path.split('.')[0].split('-');
      o[chunkIndex] = path
    }

    // 避免文件的名称带短横线，所以还是用文件夹的方式吧
    const md5Path = join(this.FILES_DIR, md5)
    if (!fs.existsSync(md5Path)) {
      await fsp.mkdir(md5Path, { recursive: true }).catch(console.error);
    }

    const filePath = join(md5Path, `${splitName.join('-')}.${ext}`)
    
    // 创建流
    const writeStream = fs.createWriteStream(filePath)
    for (const index of uploaded) {
      const chunkPath = join(this.CHUNKS_DIR, md5, o[index])
      const chunkData = await fsp.readFile(chunkPath)

      writeStream.write(chunkData)
    }

    // 关闭流
    writeStream.end()

    return paths
  }
}

export default class FileSystem {
  instance;
  files = [];
  hashedFiles = new Map()

  constructor(instance) {
    this.instance = instance;
  }

  sliceFileToChunk(file) {
    const { size, name: filename, type } = file
    // 计算总共有多少个分片
    const counts = Math.ceil(size / this.instance.chunkSize)
    // 计算每个线程执行多少个
    const countPerThread = Math.ceil(counts / this.instance.Thread_Count)
    // 整个文件的spark
    const fileSpark = new SparkMD5.ArrayBuffer()
    let md5 = '';

    let finished = 0;
    let slices = []
    // 循环线程执行任务
    // 因为上一步根据硬件线程计算了每个线程执行多少个，所以这里直接循环线程数而不是分片数
    return new Promise(resolve => {
      for (let i = 0; i < this.instance.Thread_Count; i++) {
        // 计算每个线程处理文件的起始字节
        const startIndex = i * countPerThread;
        let endIndex = (i + 1) * countPerThread
        if (endIndex > counts) {
          endIndex = counts
        }

        const worker = new Worker('./worker.js');

        worker.postMessage({
          file,
          startIndex,
          endIndex,
          chunkSize: this.instance.chunkSize,
        })

        worker.onmessage = (e) => {
          if (e.data?.length) {
            for (const datum of e.data) {
              // chunkIndex 从 1 开始
              slices[datum.index - 1] = datum
            }
          }

          finished++

          if (finished === counts) {
            // 将分割后的文件切片整合计算md5，避免重复计算
            slices.map(item => {
              const { buffer } = item
              fileSpark.append(buffer)
            })

            md5 = fileSpark.end()
            resolve({
              slices,
              md5,
              filename,
              type,
              size
            })
          }
        }

        if (endIndex >= counts) {
          break
        }
      }
    })
  }

  checkFileRepeat(md5) {
    return this.hashedFiles.get(md5)
  }

  async addFile(file) {
    // 切片并且计算分片md5
    const ret =  await this.sliceFileToChunk(file)

    // 没计算过md5的才继续
    if (!this.checkFileRepeat(ret.md5)) {
      this.hashedFiles.set(ret.md5, ret)
      this.files.push(file);

      this.instance.state.uploadList.push(ret)
    }
    // 找到了已经上传过的md5，说明文件已经被处理过，后续不重复添加
  }
}
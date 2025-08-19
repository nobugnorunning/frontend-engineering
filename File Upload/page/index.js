import FileSystem from "./file.js";
import Renderer from "./renderList.js";
import { ConcurrentTask } from "./utils.js";
import { port, UploadStatus } from "../configs.js";
import { reactive, watch } from "./reactive.js";

const getApi = (path = '/') => `http://127.0.0.1:${port}/api${path}`;

class FileUpload {
  fileSystem;
  inputNode;
  uploadBtn;
  /** 默认分片大小 5M， 单位 b， */
  chunkSize = 5 * 1024; // TODO 为了测试分片，改成了 5k 一个分片，记得改回去
  /** 当前硬件线程数量 */
  Thread_Count = navigator.hardwareConcurrency || 4;
  state = reactive({
    uploadList: [],
  });

  constructor() {
    this.inputNode = document.getElementById("ipt");
    this.uploadBtn = document.getElementById("upload-btn");
    this.tableBody = document.getElementById('table-list__body');
    this.bindDomEvents();

    // 渲染器
    this.renderer = new Renderer(this);
    this.fileSystem = new FileSystem(this);

    this.setupWatch()
  }

  /** 设置监听 */
  setupWatch() {
    // 监听当前页面的待上传表格的数据，发现有新的文件添加进来了，就重新渲染
    watch(
      () => this.state.uploadList.length,
      () => {
        console.log('length 改变 -- ')
        this.renderer.render()
      },
    )
  }

  bindDomEvents() {
    this.inputNode.addEventListener("change", this.fileChange);
    this.uploadBtn.addEventListener("click", this.triggerUpload)
  }

  fileChange = (event) => {
    const {target: {files}} = event;
    if (files.length) {
      this.fileSystem.addFile(files[0]);
    }
  }

  /** 检查远程服务器上有没有上传过文件 */
  checkMd5(md5) {
    return fetch(getApi(`/upload/check/${md5}`)).then(response => response.json())
  }

  /** 筛选出需要上传的分片 */
  filterNeedUploadSlices(fileMd5, slices, checkData) {
    let ret = []
    // uploaded是已经上传过的分片
    const { uploaded } = checkData
    if (uploaded.length !== slices.length) {
      // 已上传的和本地的分片数相等，说明全部分片都上传了
      // 不相等就筛出来没上传的
      for (const slice of slices) {
        if (!(uploaded.includes(slice.index))) {
          ret.push(slice);
        }
      }
    }

    return ret
  }

  mergeFn(md5, filename) {
    return fetch(getApi('/upload/merge'), {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        md5,
        filename
      }),
    })
  }

  triggerUpload = async () => {
    for (const [fileMd5, item] of this.fileSystem.hashedFiles.entries()) {
      // 创建并行控制队列
      // 每个待上传文件单独创建了并行任务池，所以同时触发的并行请求会有 待上传文件个数 * 并行上限 这么多个
      // 如果要实现整个任务并行控制，可以把创建并行任务放到 for 外面
      const tasks = new ConcurrentTask()
      const checkData = await this.checkMd5(fileMd5);

      const chunkCount = item.slices.length // 这里要记录总分片数，所以不用处理过的数据
      let needUploadSlices = item.slices

      /** 判断一下上传状态 */
      if (checkData.status !== UploadStatus.uploaded) {
        // 非上传完成有两种状态，找到分片缓存和没找到分片就缓存
        if (checkData.status === UploadStatus.unupload) {
          // 没上传过，重新上传
        } else if (checkData.status === UploadStatus.uploading) {
          // 上传过分片
          // 再判断下已经上传的分片和总数是不是一样，如果一样的话直接合并
          if (checkData.chunkCount === checkData.uploaded) {
            // merge
            const filenameSplit = item.filename.split(".");
            this.mergeFn(fileMd5, item.filename);
            continue
          }
          needUploadSlices = this.filterNeedUploadSlices(fileMd5, item.slices, checkData);
        }
      } else {
        // 已经上传过并且合并成文件了
        continue
      }

      for (const slice of needUploadSlices) {
        const task = () => new Promise(resolve => {
          const fd = new FormData()
          fd.append('chunk', slice.blob)
          fd.append('fileMd5', fileMd5)
          fd.append('chunkMd5', slice.md5)
          fd.append('chunkIndex', slice.index)
          fd.append('chunkCount', chunkCount)

          fetch(getApi('/upload/chunk'), {
            method: 'POST',
            body: fd,
          }).then(() => {
            resolve()
          })
        })

        tasks.push(task)
      }

      tasks.run().then(({errors}) => {
        if (JSON.stringify(errors) === '{}') {
          // 没有错误，说明全部分片都上传成功了，合并文件
          this.mergeFn(fileMd5, item.filename);
        }
      })
    }
  }
}

window.addEventListener("load", () => {
  const instance = new FileUpload();

  console.log("instance", instance);
});
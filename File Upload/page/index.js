import FileSystem from "./file.js";
import { ConcurrentTask } from "./utils.js";
import { port } from "../configs.js";

const getApi = (path = '/') => `http://127.0.0.1:${port}/api${path}`;

class FileUpload {
  fileSystem;
  inputNode;
  uploadBtn;
  /** 默认分片大小 */
  chunkSize = 5 * 1024;
  /** 当前硬件线程数量 */
  Thread_Count = navigator.hardwareConcurrency || 4;

  constructor() {
    this.fileSystem = new FileSystem(this);
    this.inputNode = document.getElementById("ipt");
    this.uploadBtn = document.getElementById("upload-btn");
    this.bindFileEvents();
  }

  bindFileEvents() {
    this.inputNode.addEventListener("change", this.fileChange);
    this.uploadBtn.addEventListener("click", this.triggerUpload)
  }

  fileChange = (event) => {
    const {target: {files}} = event;
    if (files.length) {
      this.fileSystem.addFile(files[0]);
    }
  }

  triggerUpload = () => {
    // 创建并行控制队列
    const tasks = new ConcurrentTask()
    for (const [fileMd5, item] of this.fileSystem.hashedFiles.entries()) {
      for (const slice of item.slices) {
        const task = () => new Promise(resolve => {
          const fd = new FormData()
          fd.append('chunk', slice.blob)
          fd.append('fileMd5', fileMd5)
          fd.append('chunkMd5', slice.md5)
          fd.append('chunkIndex', slice.index)

          fetch(getApi('/upload/chunk'), {
            method: 'POST',
            body: fd,
          }).then(response => {
            resolve()
          })
        })

        tasks.push(task)
      }
    }

    tasks.run()
  }
}

window.addEventListener("load", () => {
  const instance = new FileUpload();

  console.log("instance", instance);
});
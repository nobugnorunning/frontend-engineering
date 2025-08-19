export const port = 3000

export const UploadStatus = {
  unupload: 0, // 未上传
  uploading: 1, // 上传中（上传了一半，可能在chunks找到了部分分片，但不完整）
  uploaded: 2 // 上传完成，合并分片完成，完整的文件生成到了files目录
}
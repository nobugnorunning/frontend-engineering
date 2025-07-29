/** web worker 有独立的全局对象，读不到 window 里的那个 spark-md5，
 * 所以这里用 npm 重复下载并加载了一下，
 * 在真正的使用场景中，会使用打包工具，不会出现这样临时导入的情况
 * */
importScripts('../node_modules/spark-md5/spark-md5.js');

onmessage = async (e) => {
  const { file, startIndex, endIndex, chunkSize } = e.data;

  const ps = []

  for(let i = startIndex; i < endIndex; i++) {
    const p = new Promise(resolve => {
      // 在这里把文件切片，并计算每个部分的 md5
      const start = i * chunkSize;
      let end = start + chunkSize;

      // 切片
      const blob = file.slice(start, end);

      if (blob.size <= chunkSize) {
        end = start + blob.size
      }

      const spark = new SparkMD5.ArrayBuffer()

      const fileReader = new FileReader()

      fileReader.onload = (e) => {
        const chunkResult = e.target.result;
        spark.append(chunkResult);

        resolve({
          start,
          end,
          index: i + 1,
          chunkSize: blob.size,
          blob,
          buffer: chunkResult,
          md5: spark.end()
        })
      }

      fileReader.readAsArrayBuffer(blob)
    })

    ps.push(p)
  }

  const chunkSliced = await Promise.all(ps);

  postMessage(chunkSliced)
}
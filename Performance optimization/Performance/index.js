async function calculate() {
  const resource = window.performance.getEntriesByType("resource");

  const result = {};

  result.resource = resource;

  /** TTFB: 客户端发起请求到客户端相应的第一个字节 */
  function getTTFB() {
    const firstResource = resource[0];
    if (firstResource) {
      return firstResource.responseStart - firstResource.requestStart;
    }
  }

  /** 计算所有资源的加载时间和大小 */
  function getResourceMetrics() {
    const ret = [];
    for (const performanceEntry of resource) {
      const retItem = {};
      retItem.name = performanceEntry.name;
      retItem.duration = performanceEntry.duration || performanceEntry.responseEnd - performanceEntry.startTime;
      /** transferSize: 传输大小；encodeedBodySize：压缩大小；decodedBodySize：解压大小 */
      retItem.size = performanceEntry.transferSize || performanceEntry.encodedBodySize || performanceEntry.decodedBodySize;
      ret.push(retItem);
    }

    return ret;
  }

  /** 白屏时间 */
  function getFP() {
    return new Promise(resolve => {
      // 白屏时间指的是用户输入url开始加载的那一刻起，到页面有内容展示出来的时间
      const observer = new PerformanceObserver((list) => {
        console.log(list.getEntries());

        for (const entry of list.getEntries()) {
          if (entry.name === "first-paint") {
            observer.disconnect();

            resolve(entry.startTime);
          }
        }
      });

      observer.observe({type: "paint", buffered: true});
    });
  }

  /** FCP: 首次内容渲染完成时间 */
  function getFCP() {
    return new Promise(resolve => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            observer.disconnect();
            resolve(entry.startTime);
          }
        }
      });

      observer.observe({type: "paint", buffered: true});
    });
  }

  /** LCP: 最大内容绘制时间 */
  function getLCP() {
    return new Promise(resolve => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "largest-contentful-paint") {
            observer.disconnect();
            resolve(entry.startTime);
          }
        }
      });

      observer.observe({type: "largest-contentful-paint", buffered: true});
    });
  }

  /** FID： 用户首次输入延迟 */
  function getFID() {
    return new Promise(resolve => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          resolve(entry.processingEnd - entry.startTime);
        }
      });

      observer.observe({type: "first-input", buffered: true});
    });
  }

  /** 首屏加载时间 */
  function getFirstScreenLoadTime() {
    /**
     * 首屏是指当前屏幕内的内容加载的时间（仅在屏幕可视区域内的），首页是指当前页面的一整个页面加载时间（包含不在屏幕内的）
     * */

    const ignoreDOMList = ['SCRIPT', 'STYLE', 'LINK']
    let time = 0
    window.addEventListener("DOMContentLoaded", () => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1 && !ignoreDOMList.includes(node.nodeName)) {
                // 如果是元素节点，并且不是忽略的节点类型
                const rect = node.getBoundingClientRect();
                // 判断节点是不是在屏幕内
                if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                  if (time < performance.now()) {
                    time = performance.now()
                  }
                }
              }
            }
          }
        }
        
        console.log('首屏加载时间:', time);
      });

      observer.observe(document, {
        childList: true, // 观察子节点的变化
        subtree: true, // 观察整个子树
        attributes: true, // 观察属性的变化
        characterData: true // 观察文本内容的变化
      });
    });
  }

  getFirstScreenLoadTime()

  /** 缓存命中率 */
  function cacheShoot() {
    let cacheCount = 0
    for (const entry of resource) {
      console.log(entry)
      if (entry.transferSize === 0 || (entry.transferSize !== 0 && entry.encodedBodySize === 0)) {
        cacheCount++
      }
    }
    
    console.log('缓存命中率:', (cacheCount / resource.length) * 100 + '%');
  }

  cacheShoot()

  result.TTFB = {value: getTTFB(), name: "客户端发起请求到客户端相应的第一个字节"};
  result.resourceMetrics = {value: getResourceMetrics(), name: "资源加载时间和大小"};

  const FP = await getFP();
  result.FP = {value: FP, name: "白屏时间"};

  const FCP = await getFCP();
  result.FCP = {value: FCP, name: "首次内容渲染完成时间"};

  // const LCP = await getLCP()
  // result.LCP = {value: LCP, name: "最大内容绘制时间"};

  // 首页加载时间
  result.firstPageLoadTime = {
    value: performance.timing.domComplete - performance.timing.navigationStart,
    name: "首页加载事件"
  };

  // 首屏加载时间
  // const firstScreenLoadTime = getFirstScreenLoadTime();
  // result.firstScreenLoadTime = {value: firstScreenLoadTime, name: "首屏加载时间"};

  const FID = await getFID();
  result.FID = {value: FID, name: "用户首次输入延迟"};

  return result;
}

calculate().then((result) => {
  console.log(result);

  /** 监控数据上报 */
  /** 使用 requestIdleCallback，利用闲置时间上报，避免影响性能 */
  if (window.requestIdleCallback) {
    requestIdleCallback(() => {
      console.log('report data', result)

      // 如果 1000 内没有执行，则下次空闲会强制执行
    }, { timeout: 1000 });
  } else {
    setTimeout(() => {
      console.log('report data', result)
    }, 0);
  }
});
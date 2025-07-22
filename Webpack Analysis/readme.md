#### 打包流程

1. 读取入口文件，转换成 AST 树（@babel/parse或arcon）
2. 构建依赖图

    > - 遍历 AST 树，搜索引用（import、require、url、异步import、src等）并记录下来
    > - 将找到的依赖转换成 AST 树，如果不是标准的 js 模块，使用 loader 将所有类型的文件都转成 js 类型
    > - 重复步骤，读取文件（依赖） - 转换 AST - 搜索引用

3. 代码生成与打包

    > - 给每个模块添加一个包装函数（IIFE），模拟 ES Modules 或 CommonJS 的运行环境，独立作用域
    > - 添加运行时
    >   - 模块加载器：根据模块id加载对应模块
    >   - 模块缓存机制：
    >   - HMR
    >   - ......
    > - 组合所有模块的代码，生成一个或多个打包后的文件
    > - 使用 Plugins 对代码进行各种高级优化和操作

#### 模块缓存机制

> 本质上就是基于一个 JS对象，将所有已经加载的模块保存起来
> 
> 对象的键是模块ID，是在生成模块代码的时候生成的ID，一般为自增数字

```js
// 已经生成的模块
var __webpack_modules__ = {
  // 模块ID: 模块函数
  0: function(module, exports, __webpack_require__) {
    // 模块代码
  },
  1: function(module, exports, __webpack_require__) {
    // 模块代码
  },
  // ...
}

// 已加载的模块缓存
var installedModules = {}

// 模块加载函数
// 这里一般是文件内使用了 import、require等语句后，通过AST解析后生成的请求模块的函数
// 所以不会是请求自身用的，都是在模块内请求另一个模块的函数
function __webpack_require__(moduleId) {
  // 检查缓存
  if (installedModules[moduleId]) {
    return installedModules[moduleId].exports;
  }
  
  // 不在缓存中就加载模块并写入缓存
  var module = {
    ID: moduleId,
    loaded: false,
    exports: {}
  }
  
  installedModules[moduleId] = module;

  // 从已经打包的模块中获取对应模块的函数并执行
  __webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__)
 
  // 标记模块为已加载
  module.loaded = true
 
  // 返回模块导出
  return module.exports
}

// 从入口开始执行
// 0 假设是入口文件的 moduleId
__webpack_require__(0)
```


#### Loader

> 就是把 非js 文件转成 js 文件
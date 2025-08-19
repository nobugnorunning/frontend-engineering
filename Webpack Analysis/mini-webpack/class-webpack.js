const { resolve, dirname, extname, join } = require('path')
const outerConfigs = require('./demo-webpack.config')
const fs = require('fs-extra')
const babylon = require('babylon') // 这个实际上就是 @babel/parser
const traverse = require('babel-traverse').default // 遍历 ast
const { transformFromAst } = require("babel-core")
const { SyncHook } = require('tapable') // 用来定义钩子的包

class ClassWebpack {
  configs = {}

  constructor (configs) {
    this.configs = configs

    this.modules = {}
    this.ID = 0

    this.entry = configs.entry
    this.outputDir =  configs.output.dirName
    this.bundleName = configs.output.filename
    this.clean = configs.output.clean
    this.publicDir = configs.publicDir
    this.plugins = configs.plugins || []
    this.rules = configs.rules || []

    // 定义钩子
    this.hooks = {
      done: new SyncHook()
    }

    // 应用插件
    // webpack的插件其实就是一个对象，包含 apply 函数
    this.applyPlugins()
  }

  applyPlugins() {
    this.plugins.forEach(plugin => {
      plugin.apply(this)
    })
  }

  run() {
    // 从入口文件开始构建依赖图
    this.createGraph(this.entry)

    // 输出打包文件
    this.bundle()
  }

  // 单文件构建
  createGraph(path) {
    // 获取绝对路径
    const fullPath = resolve(process.cwd(), path)
    // 获取文件内容
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // 处理loader
    let ext = extname(fullPath)
    let matched = null // 匹配到的rule
    let transformed = content // 转换后的代码
    if (this.rules.length) {
      for (const rule of this.rules) {
        if (rule.test.test(ext)) {
          // 该文件匹配到了loader
          matched = rule
          break;
        }
      }
    }

    // 用匹配到的loader处理一下文件
    if (matched) {
      const loader = matched.use
      if (typeof loader === 'function') {
        transformed = loader(content)
      }
    }

    const ID = this.ID++
    // 新建一个模块
    this.modules[ID] = {
      filePath: fullPath,
      dependencies: [],
      code: ''
    }

    // webpack只识别 js 文件，在转换之前已经用loader转换了所有资源成 js 文件
    if (ext === '.js') {
      // 转 AST 树
      const ast = babylon.parse(transformed, { sourceType: 'module' })

      // 遍历 AST 树
      // 真正的导入不止import这种情况，例如异步import
      const deps = []
      traverse(ast, {
        ImportDeclaration: ({node}) => {
          // 收集依赖
          // 如果当前的文件有导入其他模块的，就算做是依赖项，会在这里被监控到
          const depPath = resolve(dirname(fullPath), node.source.value)

          // 这个依赖可以看一下在 modules 里面有没有，如果没有的话，说明没有构建过
          // 正常来说第一次构建是没有的，但是webpack有缓存机制，所以检查一下
          let depLoaded = false;
          for (const id in this.modules) {
            if (this.modules[id].filePath === depPath) {
              // 加载过
              depLoaded = true;
              break;
            }
          }
          if (!depLoaded) {
            this.createGraph(depPath)
          }
          const relativePath = node.source.value;
          const depAbsolutePath = resolve(dirname(fullPath), relativePath);

          const depId = this.findModuleIdByPath(depAbsolutePath) || this.ID;

          deps.push({
            originalPath: relativePath,
            moduleId: depId,
            absolutePath: depAbsolutePath
          })
        }
      })
      
      this.modules[ID].dependencies = deps;

      // 转 es5
      const { code } = transformFromAst(ast, null, {
        presets: ['env']
      })

      this.modules[ID].code = code
    } else {
      // 非 js 文件，就是loader处理的那些，都处理成 js 代码了
      this.modules[ID].code = transformed
    }
  }

  findModuleIdByPath(targetPath) {
    for (const id in this.modules) {
      if (this.modules[id].filePath === targetPath) {
        return id;
      }
    }
    return null;
  }

  bundle() {
    // 创建打包输出文件夹
    this.genOutputDir()

    // 创建最终的文件
    /*
      template 实际上是一个立执函数（IIFE），入参是一个对象，键为 模块id，值为 模块加载函数
      所以要先创建一个Map对象
    * */
    let modules = ''
    const moduleMap = {};
    for (const id in this.modules) {
      const module = this.modules[id]
      moduleMap[module.filePath] = id;

      // 当前这个模块下有哪些依赖，要建立一个相对路径对应模块id的map，供require内部使用
      // 后面的都是要打包输出到 bundle 文件里的，所以一切都用字符串来操作
      let depMap = ''
      module.dependencies.forEach(dep => {
        depMap += `"${dep.originalPath}": ${this.findModuleIdByPath(dep.absolutePath)},`
      })
      depMap = `{${depMap}}`

      // 这里面需要实现一下require方法，es6转es5之后使用require加载模块，参数是相对路径，要利用加载器加载模块内容，参数为模块id
      // 所以还需要建立一个key为路径，值为模块id的map对象
      modules += `
        "${id}": function(module, exports, __webpack_require__) {
          function require(relativePath) {
            return __webpack_require__(${depMap}[relativePath]);
          }
          ${module.code}
        },
      `;
    }

    const template = `(function(modules) {
  var installedModules = {} 
  
  function __webpack_require__(moduleId) {
  
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    
    var module = {
      ID: moduleId,
      loaded: false,
      exports: {}
    }
    
    installedModules[moduleId] = module;
  
    // 从已经打包的模块中获取对应模块的函数并执行
    modules[moduleId](module, module.exports, __webpack_require__)
   
    // 标记模块为已加载
    module.loaded = true
   
    // 返回模块导出
    return module.exports
  }
  
  __webpack_require__(0)
})({
  ${modules}
})
    `

    fs.writeFileSync(join(this.outputDir, this.bundleName), template, 'utf-8')

    this.hooks.done.call()
  }

  genOutputDir() {
    // 创建文件夹
    if (fs.existsSync(this.outputDir) && this.clean) {
      fs.removeSync(this.outputDir)
    }

    fs.mkdirSync(this.outputDir)
  }
}

const task = new ClassWebpack(outerConfigs)

task.run()

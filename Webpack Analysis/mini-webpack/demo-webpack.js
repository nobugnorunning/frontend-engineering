const fs = require('fs');
const path = require('path');
// babylon 解析 js 语法，生成 AST（抽象语法树）
const babylon = require('babylon')
// babel-traverse 用于遍历 AST
const traverse = require('babel-traverse').default;
// 将 es6 es7 转为 es5 的语法
const { transformFromAst } = require("babel-core")

const configs = require('./demo-webpack.config');

let ID = 0;

// filename 参数为文件路径，读取内容并提取它的依赖关系

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')

  // 获取 AST
  const ast = babylon.parse(content, {
    sourceType: 'module',
  })

  // dependencies 用于存储依赖关系
  const dependencies = [];

  // 通过查找 import 节点，找到该文件的依赖关系
  // 示例项目中都是使用了 import 方式导入其他依赖

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      console.log(node)
      dependencies.push(node.source.value);
    }
  })

  // 分配唯一标识符
  const id = ID++;
  const { code } = transformFromAst(ast, null, {
    presets: ['env']
  })

  // 返回此模块的信息
  return {
    id,
    filename,
    dependencies,
    code
  }
}

function createGraph(entry) {
  // 得到入口文件的依赖关系
  const mainAsset = createAsset(entry);

  const queue = [mainAsset];

  for (const asset of queue) {
    asset.mapping = {}

    console.log(asset)

    // 获取该模块所在目录
    const dirname = path.dirname(asset.filename);

    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);

      const child = createAsset(absolutePath);

      asset.mapping[relativePath] = child.id;

      queue.push(child)
    })
  }

  return queue;
}

function bundle(graph) {
  let modules = '';

  // TODO 待改造，希望生成一个缓存对象，创建模块加载器加载对应内容
  graph.forEach((mod) => {
    modules += `${mod.id}: [
      function (require, module, exports) { ${mod.code} },
      ${JSON.stringify(mod.mapping)},
    ],`
  })

  const result = `
(function (modules) {
  function require(id){
    const [fn, mapping] = modules[id]
    function localRequire(name){
      return require(mapping[name])
    }
    const module = { exports: {} }
    fn(localRequire, module, module.exports)
    return module.exports
  }
  require(0);
})({${modules}})`

  const assets = {}
  assets[configs.output.filename] = {
    source: () => result,
    size: () => result.length
  }

  const compiler = {
    options: configs,
    hooks: {
      done: {
        tap: (pluginName, handler) => {
          compiler._doneHandler = handler;
        }
      }
    }
  }

  const compilation = {
    assets: assets,
    entrypoints: new Map(Object.entries({
      [path.basename(configs.entry, path.extname(configs.entry))]: {}
    }))
  }

  // 调用插件
  configs.plugins.forEach(plugin => {
    plugin.apply(compiler)
  })

  return new Promise((resolve, reject) => {
    // 如果这里有其他生命周期做的事情，在这里调用 对应的 处理函数，把处理结果返回

    if ('_emitHandler' in compiler) {
      compiler._emitHandler(compilation, err => {
        if (err) {
          return reject(err);
        } else {
          resolve(compilation.assets);
        }
      })
    } else {
      resolve(compilation.assets);
    }
  }).then((assets) => {

    // 写入本地磁盘，生成打包后的文件
    const isExist = fs.existsSync(configs.output.dirName)

    if (isExist && configs.output.clean) {
      // 如果存在，则清空 dist 目录
      fs.rmSync(configs.output.dirName, { recursive: true });
    }

    if (!fs.existsSync(configs.output.dirName)) {
      fs.mkdirSync(configs.output.dirName, { recursive: true });
    }

    const ps = Object.entries(assets).map(([assetName, { source }]) => {
      const filePath = path.resolve(configs.output.dirName, assetName);
      const content = source()

      return new Promise((res, rej) => {
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            rej(err)
          } else {
            res()
          }
        })
      })
    })

    return Promise.all(ps).then(() => {
      // 打包结束后，调用 done 钩子
      if ('_doneHandler' in compiler) {
        compiler._doneHandler(compilation);
      }
      console.log('package success')
    });
  })
}

// 构建依赖图
const graph = createGraph(configs.entry);

// 打包
bundle(graph)



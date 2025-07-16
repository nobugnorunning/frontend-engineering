const fs = require('fs');
const path = require('path');
// babylon 解析 js 语法，生成 AST（抽象语法树）
const babylon = require('babylon')
// babel-traverse 用于遍历 AST
const traverse = require('babel-traverse').default;
// 将 es6 es7 转为 es5 的语法
const { transformFromAst } = require("babel-core")

const configs = require('./demo-webpack.config');

const defaultConfigs = {
  output: {
    dirName: "dist",
    clean: true,
  },
  plugins: []
}

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

  return result
}

const graph = createGraph('./examples/entry.js');

const result = bundle(graph);

const isExist = fs.existsSync('dist')

if (isExist) {
  // 如果存在，则清空 dist 目录
  fs.rmSync('dist', { recursive: true });
}

fs.mkdir('dist', (err) => {
  if (!err) {
    fs.writeFile('dist/main.js', result, (subErr) => {
      if (!subErr) {
        console.log('package success');
      }
    })
  }
})

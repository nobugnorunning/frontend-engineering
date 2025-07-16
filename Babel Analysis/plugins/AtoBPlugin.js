/**
 * 开发 babel 插件， 将所有的变量 b 改成 a
 * */

module.exports = function (babel) {
  let t = babel.types;
  return {
    visitor: {
      VariableDeclarator(path, state) {
        if (path.node.id.name === "b") {
          path.node.id.name = "a";
        }
      },
      CallExpression(path, state) {
        const callee = path.node.callee;
        
        if (t.isMemberExpression(callee)
          && t.isIdentifier(callee.object, {name: "b"})
        ) {
          callee.object = t.identifier("a");
        }
      }
    }
  };
};
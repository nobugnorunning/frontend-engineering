class TestPlugin {
  constructor() {
    console.log('TestPlugin initialized');
  }

  apply(compiler) {
    // 注册一个生命周期
    compiler.hooks.done.tap('TestPlugin', () => {
      console.log('TestPlugin: ', '在 done 的生命周期中做了一些事情')
    })
  }
}

module.exports = TestPlugin;
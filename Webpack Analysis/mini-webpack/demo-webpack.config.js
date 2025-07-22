const TestPlugin = require('./plugins/TestPlugin.js')

module.exports = {
  entry: "./examples/entry.js",
  output: {
    dirName: "dist",
    filename: "main.js",
    clean: true,
  },
  plugins: [
    new TestPlugin()
  ],
  rules: [
    {
      test: /\.css/,
      use: "my-css-loader",
    }
  ]
}
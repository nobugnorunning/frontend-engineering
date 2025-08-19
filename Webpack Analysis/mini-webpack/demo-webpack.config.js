const path = require('path');
const TestPlugin = require('./plugins/TestPlugin.js')
const MyStyleLoader = require('./loaders/my-css-loader.js');

function resolve(url) {
  return path.resolve(__dirname, url)
}

module.exports = {
  entry: "./examples/entry.js",
  output: {
    dirName: "dist",
    filename: "main.js",
    clean: true,
  },
  publicDir: resolve('./public'),
  plugins: [
    new TestPlugin(),
  ],
  rules: [
    {
      test: /\.css/,
      use: MyStyleLoader
    }
  ]
}
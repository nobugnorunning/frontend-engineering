const AtoBPlugin = require('./plugins/AtoBPlugin')

module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    edge: "17",
                    firefox: "60",
                    chrome: "67",
                    safari: "11.1",
                    ie: "11"
                },
                useBuiltIns: "usage",
                corejs: "3"
            }
        ]
    ],
    plugins: [AtoBPlugin]
}
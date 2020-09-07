module.exports = {
  entry: {
    main: './main.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              // 新增配置以支持JSX语法
              ['@babel/plugin-transform-react-jsx', {
                pragma: 'createElement', // pragma 参数可以指定最后翻译出来的函数名字
              }],
            ],
          }
        }
      }
    ],
  },
  mode: "development",
  optimization: {
    minimize: false,
  }
};